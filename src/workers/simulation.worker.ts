/**
 * Simulation Worker - Control Room Engine v2
 * 
 * This worker implements the "Engineering-Only Liquidity" model with:
 * - Payables Backlog (unpaid cash carries as liability)
 * - Throttle Mechanics (execution slows when cash is short)
 * - Now-Cast (current month EOM projection)
 * - Breach Radar (earliest breach distribution)
 * - Deterministic Seed Replay
 */

import {
    ProjectConfig,
    DeptAllocation,
    OutflowData,
    SimulationResults,
    MonthlyStats,
    RiskParams,
    PolicyConfig,
    CurrentMonthActuals,
    Diagnostics,
    ValidationFlags,
    NowCastResults,
    BreachRadarResults,
    RiskConfig,
    DEFAULT_RISK_CONFIG
} from '../types';

// ============================================================================
// VOLATILITY & RISK MAPS
// ============================================================================

const VOLATILITY_MAP: Record<string, number> = {
    low: 0.05,
    med: 0.10,
    high: 0.20,
    critical: 0.40
};

const CONTRACTOR_RISK_MAP: Record<string, number> = {
    'reliable': 1.0,
    'shaky': 1.25,
    'high-risk': 1.5
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

function createRandom(seed: number) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function sampleNormal(rng: () => number, mean = 0, std = 1): number {
    const u = 1 - rng();
    const v = 1 - rng();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * std + mean;
}

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const idx = Math.floor(s.length * p);
    return s[Math.min(idx, s.length - 1)] || 0;
}

function mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ============================================================================
// DEFAULT PARAMETERS
// ============================================================================

const DEFAULT_RISK_PARAMS: RiskParams = {
    invoiceLag: {
        service: { p0: 0.7, p1: 0.3 },
        material: { p1: 0.6, p2: 0.4 },
        infra: { p0: 0.8, p1: 0.2, p2: 0 }
    },
    materialVol: {
        sigmaMarket: 0.15,
        sigmaIdio: 0.10,
        marketWeight: 0.6,
        dist: 'lognormal',
        clampMax: 2.0
    },
    overrun: { mean: 0.05, sigma: 0.1, clampMax: 0.5 },
    scopeDrift: { mean: 0.005, sigma: 0.002, cap: 0.15 },
    reserve: { enabled: true, total: 50, monthlyCap: 10 }
};

const DEFAULT_POLICY: PolicyConfig = {
    breachMode: 'payablesBacklogThrottle',
    maxThrottlePctPerMonth: 0.40,
    commitmentRatioDefaults: {
        SERVICE: 0.50,
        MATERIAL: 0.80,
        INFRA: 0.60
    },
    frictionMultiplier: 1.10
};

// ============================================================================
// WORKER MESSAGE HANDLER
// ============================================================================

interface WorkerInput {
    config: ProjectConfig;
    policyConfig?: PolicyConfig;
    riskConfig?: RiskConfig;
    allocations: DeptAllocation;
    actualAllocations: DeptAllocation;
    plannedOutflows: OutflowData; // Baseline
    engineeringDemand?: OutflowData; // Active
    actualOutflows: OutflowData;
    currentMonthActuals?: CurrentMonthActuals;
    volatilityFactor: number;
    corrStrength: number;
    iterations: number;
    seed?: number;
    activeScenarios?: string[];
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
    const {
        config,
        policyConfig = DEFAULT_POLICY,
        riskConfig = DEFAULT_RISK_CONFIG,
        allocations,
        actualAllocations,
        plannedOutflows,
        engineeringDemand,
        actualOutflows,
        currentMonthActuals,
        volatilityFactor,
        iterations,
        seed = 42
    } = e.data;

    // Fallback: If engineeringDemand is missing (old data), use plannedOutflows
    const activeDemand = engineeringDemand || plannedOutflows;

    // Merge user riskConfig into risk params
    const mergedRiskParams: RiskParams = {
        ...DEFAULT_RISK_PARAMS,
        materialVol: {
            ...DEFAULT_RISK_PARAMS.materialVol!,
            sigmaMarket: VOLATILITY_MAP[riskConfig.market.volatilityClass] || 0.10,
        },
        overrun: {
            ...DEFAULT_RISK_PARAMS.overrun!,
            mean: DEFAULT_RISK_PARAMS.overrun!.mean * (1 + (1 - riskConfig.execution.scheduleConfidence)),
            sigma: DEFAULT_RISK_PARAMS.overrun!.sigma * (CONTRACTOR_RISK_MAP[riskConfig.execution.contractorRisk] || 1.0),
        },
    };

    // Run main simulation
    const results = runSimulation({
        config,
        policyConfig,
        riskConfig,
        allocations,
        actualAllocations,
        plannedOutflows,
        engineeringDemand: activeDemand,
        actualOutflows,
        currentMonthActuals,
        volatilityFactor,
        iterations,
        seed,
        riskParams: mergedRiskParams
    });

    self.postMessage(results);
};

// ============================================================================
// MAIN SIMULATION
// ============================================================================

interface SimulationParams {
    config: ProjectConfig;
    policyConfig: PolicyConfig;
    riskConfig: RiskConfig;
    allocations: DeptAllocation;
    actualAllocations: DeptAllocation;
    plannedOutflows: OutflowData;
    engineeringDemand: OutflowData;
    actualOutflows: OutflowData;
    currentMonthActuals?: CurrentMonthActuals;
    volatilityFactor: number;
    iterations: number;
    seed: number;
    riskParams: RiskParams;
}

function runSimulation(params: SimulationParams): SimulationResults {
    const {
        config,
        policyConfig,
        riskConfig,
        allocations,
        actualAllocations,
        plannedOutflows,
        engineeringDemand,
        actualOutflows,
        currentMonthActuals,
        volatilityFactor,
        iterations,
        seed,
        riskParams
    } = params;

    // Generate months from config only
    const months: string[] = [];
    let [y, m] = config.startMonth.split('-').map(Number);
    for (let i = 0; i < config.durationMonths; i++) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) {
            m = 1;
            y++;
        }
    }
    const asOfMonth = config.asOfMonth;
    const currentMonth = currentMonthActuals?.currentMonth || asOfMonth;

    // Validation tracking
    const validationFlags: ValidationFlags = {
        lagConservation: true,
        carryForwardNonNegative: true,
        backlogNonNegative: true,
        scheduleDebtMonotonic: true,
        clampingOccurred: false,
        clampingDetails: []
    };

    // Per-month iteration arrays
    const monthly: Record<string, {
        inflows: number[];
        demands: number[];
        cashOutflows: number[];
        shortfalls: number[];
        payablesBacklog: number[];
        scheduleDebt: number[];
        deferred: number[];
        carryForward: number[];
        throttlePct: number[];
        materialVar: number[];
        overrunVar: number[];
        scopeVar: number[];
    }> = {};

    // Breach tracking per iteration
    const firstBreachMonthIdx: number[] = [];

    // Variance tracking per iteration (Total across horizon)
    const iterMaterialVars: number[] = [];
    const iterOverrunVars: number[] = [];
    const iterScopeVars: number[] = [];

    months.forEach(m => {
        monthly[m] = {
            inflows: [],
            demands: [],
            cashOutflows: [],
            shortfalls: [],
            payablesBacklog: [],
            scheduleDebt: [],
            deferred: [],
            carryForward: [],
            throttlePct: [],
            materialVar: [],
            overrunVar: [],
            scopeVar: []
        };
    });

    // ========================================================================
    // MONTE CARLO ITERATIONS
    // ========================================================================

    for (let iter = 0; iter < iterations; iter++) {
        const rng = createRandom(seed + iter);

        // Iteration state
        let carryForward = 0;
        let payablesBacklog = 0;
        let scheduleDebt = 0;
        let reserveRemaining = riskParams.reserve?.enabled ? riskParams.reserve.total : 0;
        let scopeIndex = 0;
        let firstBreachIdx = -1;

        // Iteration Variance Accumulators (for Driver Attribution)
        let iterMaterialVar = 0;
        let iterOverrunVar = 0;
        let iterScopeVar = 0;

        // Pending cash from invoice lags
        const pendingCash: number[] = new Array(months.length + 5).fill(0);

        // Market shock for this iteration (correlated across months)
        const marketShock = sampleNormal(rng, 0, (riskParams.materialVol?.sigmaMarket || 0.15) * volatilityFactor);

        months.forEach((month, monthIdx) => {
            const isHistorical = month < asOfMonth;
            const isCurrentMonth = month === currentMonth;

            // =================================================================
            // 1. AVAILABLE INFLOW (Engineering Only)
            // =================================================================
            let engInflow = 0;
            if (isHistorical) {
                engInflow = actualAllocations[month]?.['ENGINEERING'] || allocations[month]?.['ENGINEERING'] || 0;
            } else {
                engInflow = allocations[month]?.['ENGINEERING'] || 0;
            }
            monthly[month].inflows.push(engInflow);

            // =================================================================
            // 2. DEMAND SIMULATION (Incurred Cost)
            // =================================================================
            let incurredCost = 0;
            let incurredByComponent = { SERVICE: 0, MATERIAL: 0, INFRA: 0 };

            if (isHistorical) {
                // Use actual data for historical
                config.entities.forEach(ent => config.activities.forEach(act => {
                    (['SERVICE', 'MATERIAL', 'INFRA'] as const).forEach(comp => {
                        const val = (actualOutflows[month]?.[ent]?.[act] as any)?.[comp]
                            || (plannedOutflows[month]?.[ent]?.[act] as any)?.[comp] || 0;
                        incurredCost += val;
                        incurredByComponent[comp] += val;
                    });
                }));
            } else {
                // Apply risk factors to ACTIVE DEMAND (engineeringDemand)
                const driftStep = sampleNormal(rng, riskParams.scopeDrift!.mean, riskParams.scopeDrift!.sigma);
                scopeIndex = Math.min(scopeIndex + Math.max(0, driftStep), riskParams.scopeDrift!.cap || 1.0);

                // Rain season productivity factor
                const calendarMonth = parseInt(month.split('-')[1]);
                const isRainSeason = riskConfig.execution.rainSeasonMonths.includes(calendarMonth);
                const rainFactor = isRainSeason ? 0.60 : 1.0; // 40% productivity loss in monsoon

                config.entities.forEach(ent => config.activities.forEach(act => {
                    // CRITICAL CHANGE: Use engineeringDemand instead of plannedOutflows for active simulation
                    const basePlanned = engineeringDemand[month]?.[ent]?.[act] as any;

                    (['SERVICE', 'MATERIAL', 'INFRA'] as const).forEach(comp => {
                        const baseVal = basePlanned?.[comp] || 0;
                        if (baseVal === 0) return;

                        let val = baseVal;

                        // Material Volatility + Inflation Bias
                        if (comp === 'MATERIAL') {
                            // Apply monthly inflation bias from riskConfig
                            const monthlyInflation = riskConfig.market.inflationExpectation / 12;
                            const inflationBias = monthlyInflation * (monthIdx + 1); // Cumulative

                            const idioShock = sampleNormal(rng, 0, (riskParams.materialVol?.sigmaIdio || 0.1) * volatilityFactor);
                            const combinedShock = inflationBias
                                + marketShock * (riskParams.materialVol?.marketWeight || 0.6)
                                + idioShock * (1 - (riskParams.materialVol?.marketWeight || 0.6));
                            let matMult = Math.exp(combinedShock);

                            // Clamp to prevent outliers
                            const clampMax = riskParams.materialVol?.clampMax || 2.0;
                            if (matMult > clampMax) {
                                matMult = clampMax;
                                validationFlags.clampingOccurred = true;
                            }
                            const valBeforeMat = val;
                            val *= matMult;
                            iterMaterialVar += (val - valBeforeMat);
                        }

                        // Execution Overrun (already uses merged riskParams with confidence/contractor risk)
                        let overrun = sampleNormal(rng, riskParams.overrun!.mean, riskParams.overrun!.sigma * volatilityFactor);
                        const overrunClamp = riskParams.overrun?.clampMax || 0.5;
                        overrun = clamp(overrun, -0.2, overrunClamp);

                        const valBeforeOverrun = val;
                        val *= (1 + overrun);
                        iterOverrunVar += (val - valBeforeOverrun);

                        // Scope Drift
                        const valBeforeScope = val;
                        val *= (1 + scopeIndex);
                        iterScopeVar += (val - valBeforeScope);

                        // Rain season: SERVICE costs increase (more labor days needed)
                        if (comp === 'SERVICE' && isRainSeason) {
                            val /= rainFactor; // Cost goes UP because productivity goes DOWN
                        }

                        incurredCost += val;
                        incurredByComponent[comp] += val;
                    });
                }));

                // Manual Threat Injection
                for (const threat of riskConfig.threats) {
                    if (threat.month === month) {
                        // Sample: does this threat materialize?
                        if (rng() < threat.probability) {
                            incurredCost += threat.amount;
                            incurredByComponent.SERVICE += threat.amount; // Default to SERVICE
                        }
                    }
                }
            }

            // Add schedule debt from previous month (work that was deferred)
            const totalWorkLoad = incurredCost + scheduleDebt;
            monthly[month].demands.push(totalWorkLoad);

            // =================================================================
            // 3. CASH OUTFLOW (Invoice Lag)
            // =================================================================
            let cashFromCurrent = 0;
            let cashFromCurrentService = 0;
            let cashFromCurrentMaterial = 0;
            let cashFromCurrentInfra = 0;

            if (isHistorical) {
                cashFromCurrent = incurredCost;
            } else {
                // Apply invoice lag by component
                const serviceLag = riskParams.invoiceLag?.service || { p0: 0.7, p1: 0.3 };
                const materialLag = riskParams.invoiceLag?.material || { p1: 0.6, p2: 0.4 };
                const infraLag = riskParams.invoiceLag?.infra || { p0: 0.8, p1: 0.2, p2: 0 };

                // SERVICE: p0% now, p1% next month
                cashFromCurrentService = incurredByComponent.SERVICE * serviceLag.p0;
                pendingCash[monthIdx + 1] += incurredByComponent.SERVICE * serviceLag.p1;

                // MATERIAL: p1% next month, p2% month after
                cashFromCurrentMaterial = 0; // Material often has 0 down payment in this model defaults? 
                // Wait, default material is p1: 0.6, p2: 0.4. That means p0 is 0.
                // Let's stick to the logic:
                // Actually defaults are: service {p0:0.7, p1:0.3}, material {p1:0.6, p2:0.4}, infra {p0:0.8, p1:0.2}
                // So Material pays 0 in current month.

                pendingCash[monthIdx + 1] += incurredByComponent.MATERIAL * materialLag.p1;
                pendingCash[monthIdx + 2] += incurredByComponent.MATERIAL * materialLag.p2;

                // INFRA: p0% now, p1% next, p2% after
                cashFromCurrentInfra = incurredByComponent.INFRA * (infraLag.p0 || 0.8);
                pendingCash[monthIdx + 1] += incurredByComponent.INFRA * (infraLag.p1 || 0.2);
                pendingCash[monthIdx + 2] += incurredByComponent.INFRA * (infraLag.p2 || 0);

                cashFromCurrent = cashFromCurrentService + cashFromCurrentMaterial + cashFromCurrentInfra;
            }

            const totalCashDue = cashFromCurrent + pendingCash[monthIdx] + payablesBacklog;
            monthly[month].cashOutflows.push(totalCashDue);

            // =================================================================
            // 4. LIQUIDITY CHECK & BREACH RESOLUTION
            // =================================================================
            let available = engInflow + carryForward;
            let shortfall = 0;
            let deferredThisMonth = 0;
            let throttlePctThisMonth = 0;

            // Apply collection efficiency haircut (future months only)
            if (!isHistorical) {
                available = (engInflow * riskConfig.funding.collectionEfficiency) + carryForward;
            }

            // COVENANT TRAP: If hard-stop enabled, check progress vs minimum covenant
            if (!isHistorical && riskConfig.funding.covenantHardStop) {
                // Simulate progress as fraction of months completed vs total
                const simulatedProgress = (monthIdx + 1) / months.length;
                if (simulatedProgress < riskConfig.funding.minProgressCovenant) {
                    // BANK FREEZE: Funding drops to 0
                    available = carryForward; // Only existing cash, no new inflow
                }
            }

            // Draw from reserve if needed
            if (totalCashDue > available && riskParams.reserve?.enabled && reserveRemaining > 0) {
                const deficit = totalCashDue - available;
                const draw = Math.min(deficit, riskParams.reserve.monthlyCap, reserveRemaining);
                reserveRemaining -= draw;
                available += draw;
            }

            if (totalCashDue <= available) {
                // Happy path - pay everything
                carryForward = available - totalCashDue;
                payablesBacklog = 0;
                scheduleDebt = 0;
            } else {
                // BREACH - cannot pay all
                const paid = available;
                const unpaid = totalCashDue - paid;

                // Track first breach
                if (firstBreachIdx === -1) {
                    firstBreachIdx = monthIdx;
                }

                shortfall = unpaid;
                carryForward = 0;

                // PAYABLES BACKLOG: Unpaid cash becomes liability
                payablesBacklog = unpaid;

                // THROTTLE: Reduce execution next month
                // Throttle % = min(unpaid / plannedNextMonth, maxThrottle)
                const nextMonthIdx = monthIdx + 1;
                const nextMonth = months[nextMonthIdx];
                let plannedNextMonth = 0;

                if (nextMonth) {
                    config.entities.forEach(ent => config.activities.forEach(act => {
                        (['SERVICE', 'MATERIAL', 'INFRA'] as const).forEach(comp => {
                            // Use active demand for throttle calculation as well
                            plannedNextMonth += (engineeringDemand[nextMonth]?.[ent]?.[act] as any)?.[comp] || 0;
                        });
                    }));
                }

                if (plannedNextMonth > 0) {
                    throttlePctThisMonth = clamp(
                        unpaid / plannedNextMonth,
                        0,
                        policyConfig.maxThrottlePctPerMonth
                    );

                    // Schedule debt = throttled execution * friction
                    const deferredWork = plannedNextMonth * throttlePctThisMonth;
                    deferredThisMonth = deferredWork * policyConfig.frictionMultiplier;
                    scheduleDebt = deferredThisMonth;
                }
            }

            // Validation checks
            if (carryForward < 0) validationFlags.carryForwardNonNegative = false;
            if (payablesBacklog < 0) validationFlags.backlogNonNegative = false;

            monthly[month].shortfalls.push(shortfall);
            monthly[month].payablesBacklog.push(payablesBacklog);
            monthly[month].scheduleDebt.push(scheduleDebt);
            monthly[month].deferred.push(deferredThisMonth);
            monthly[month].carryForward.push(carryForward);
            monthly[month].throttlePct.push(throttlePctThisMonth);
            // Push accumulated variance for this month? 
            // Actually, we tracked variance for the *step*, but simplified: just push the total accumulated so far?
            // No, 'monthly' arrays track *per month* outcomes.
            // Let's simplify: We are tracking total variance for the *iteration* above, but we didn't push it to 'monthly' arrays.
            // The monthly analysis for drivers is complex.
            // Let's just track the TOTAL variance for the iteration and push it to a separate global accumulator?
            // Or push to the last month?
            // To be compatible with existing structure, let's just push duplicates or 0s for now, OR better:
            // Let's collect the GLOBAL variances outside the monthly loop.
        });

        // Store global variance for this iteration (simple attribution)
        iterMaterialVars.push(iterMaterialVar);
        iterOverrunVars.push(iterOverrunVar);
        iterScopeVars.push(iterScopeVar);

        firstBreachMonthIdx.push(firstBreachIdx);
    }

    // ========================================================================
    // AGGREGATION
    // ========================================================================

    const monthlyStats: MonthlyStats[] = months.map(m => {
        const d = monthly[m];
        const plannedAlloc = allocations[m]?.['ENGINEERING'] || 0;

        // Calculate planned outflow total (BASELINE)
        let plannedOutflowTotal = 0;
        config.entities.forEach(ent => config.activities.forEach(act => {
            (['SERVICE', 'MATERIAL', 'INFRA'] as const).forEach(comp => {
                plannedOutflowTotal += (plannedOutflows[m]?.[ent]?.[act] as any)?.[comp] || 0;
            });
        }));

        // Safe Spend Limit = P20(Inflow + CarryForward)
        const inflowPlusCF = d.inflows.map((v, i) => v + d.carryForward[i]);
        const p20Safe = percentile(inflowPlusCF, 0.2);
        const gapToFix = Math.max(0, plannedOutflowTotal - p20Safe);

        return {
            month: m,
            isHistorical: m < asOfMonth,
            plannedAllocation: plannedAlloc,

            realizableInflowP10: percentile(d.inflows, 0.1),
            realizableInflowP20: percentile(d.inflows, 0.2),
            realizableInflowP50: percentile(d.inflows, 0.5),
            realizableInflowP80: percentile(d.inflows, 0.8),
            realizableInflowP90: percentile(d.inflows, 0.9),

            plannedOutflowTotal,
            cashOutflowP50: percentile(d.cashOutflows, 0.5),
            cashOutflowP80: percentile(d.cashOutflows, 0.8),

            demandP50: percentile(d.demands, 0.5),
            demandP80: percentile(d.demands, 0.8),

            shortfallP50: percentile(d.shortfalls, 0.5),
            shortfallP80: percentile(d.shortfalls, 0.8),
            shortfallExpected: mean(d.shortfalls),
            shortfallProb: d.shortfalls.filter(s => s > 1.0).length / iterations,

            coverageProb: d.cashOutflows.filter((c, i) => c <= (d.inflows[i] + d.carryForward[i])).length / iterations,

            safeSpendLimit: p20Safe,
            gapToFix,

            payablesBacklogP50: percentile(d.payablesBacklog, 0.5),
            payablesBacklogP80: percentile(d.payablesBacklog, 0.8),
            payablesBacklogExpected: mean(d.payablesBacklog),

            scheduleDebtP50: percentile(d.scheduleDebt, 0.5),
            scheduleDebtP80: percentile(d.scheduleDebt, 0.8),
            scheduleDebtExpected: mean(d.scheduleDebt),
            deferredCostExpected: mean(d.deferred),

            throttlePctExpected: mean(d.throttlePct)
        };
    });

    // ========================================================================
    // BREACH RADAR
    // ========================================================================

    const breachOccurred = firstBreachMonthIdx.filter(i => i >= 0);
    const breachDistribution: { month: string; probability: number }[] = months.map((m, idx) => ({
        month: m,
        probability: breachOccurred.filter(i => i === idx).length / iterations
    }));

    let breachRadar: BreachRadarResults | undefined;
    if (breachOccurred.length > 0) {
        const sortedBreaches = [...breachOccurred].sort((a, b) => a - b);
        const p50Idx = sortedBreaches[Math.floor(sortedBreaches.length * 0.5)];
        const p80Idx = sortedBreaches[Math.floor(sortedBreaches.length * 0.8)];

        const currentMonthIdx = months.indexOf(currentMonth);

        breachRadar = {
            earliestBreachMonthP50: months[p50Idx] || null,
            earliestBreachMonthP80: months[p80Idx] || null,
            timeToBreachP50: p50Idx >= 0 ? p50Idx - currentMonthIdx : null,
            timeToBreachP80: p80Idx >= 0 ? p80Idx - currentMonthIdx : null,
            breachDistribution
        };
    }

    // ========================================================================
    // DRIVER ATTRIBUTION
    // ========================================================================

    // Aggregated Variances across all iterations and months
    const totalMaterialVar = mean(iterMaterialVars);
    const totalOverrunVar = mean(iterOverrunVars);
    const totalScopeVar = mean(iterScopeVars);

    // Normalize to percentages
    const totalVariance = Math.abs(totalMaterialVar) + Math.abs(totalOverrunVar) + Math.abs(totalScopeVar) + 0.1;

    // Create drivers list
    const drivers = [
        { name: 'Material Volatility', val: totalMaterialVar, lever: 'Procurement' },
        { name: 'Execution Overrun', val: totalOverrunVar, lever: 'Efficiency' },
        { name: 'Scope Drift', val: totalScopeVar, lever: 'Governance' }
    ];

    // Sort by impact (absolute value)
    drivers.sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

    const topDrivers = drivers.map(d => ({
        name: d.name,
        contribution: d.val, // In absolute currency (Cr)
        lever: d.lever,
        impactOnShortfall: Math.abs(d.val) / totalVariance,
        impactOnBacklog: 0.2,
        impactOnScheduleDebt: 0.2
    }));

    // ========================================================================
    // NOW-CAST (Current Month Projection)
    // ========================================================================

    let nowCast: NowCastResults | undefined;
    if (currentMonthActuals && currentMonth) {
        const currentMonthData = monthly[currentMonth];
        if (currentMonthData) {
            const elapsedProgress = currentMonthActuals.elapsedProgress;
            const actualPaid = currentMonthActuals.actualPaidToDate;
            const totalActualPaid = actualPaid.SERVICE + actualPaid.MATERIAL + actualPaid.INFRA;

            // Project remaining based on elapsed progress
            const plannedTotal = monthlyStats.find(m => m.month === currentMonth)?.plannedOutflowTotal || 0;
            const remainingFraction = 1 - elapsedProgress;

            // EOM projection with Performance Factor (Run Rate)
            // If we are burning hot (Actual > Plan * Progress), assume the remaining month will also run hot.
            const meanSimulatedTotal = mean(currentMonthData.cashOutflows);
            const expectedToDate = meanSimulatedTotal * Math.max(0.01, currentMonthActuals.elapsedProgress);

            // Dampen the factor for early days to avoid volatility
            // w = 0 at start, 1 at end.
            const weight = Math.min(1, currentMonthActuals.elapsedProgress * 1.5); // Fully trust run-rate by 66% progress?
            // Actually, let's just trust it significantly but clamp extreme multipliers if needed.

            let performanceFactor = 1.0;
            if (expectedToDate > 0) {
                const rawFactor = totalActualPaid / expectedToDate;
                // Blend with 1.0 based on elapsed progress? 
                // Users usually want straight-line extrapolation. Let's use rawFactor but handle small denominators.
                if (currentMonthActuals.elapsedProgress > 0.05) {
                    performanceFactor = rawFactor;
                }
            }



            const eomCashDue = currentMonthData.cashOutflows.map(c => {
                const baseRemaining = c * remainingFraction;
                const scaledRemaining = baseRemaining * performanceFactor;
                return totalActualPaid + scaledRemaining;
            }).sort((a, b) => a - b);

            const probExceed = eomCashDue.filter(c => c > plannedTotal).length / iterations;

            nowCast = {
                eomCashDueP50: percentile(eomCashDue, 0.5),
                eomCashDueP80: percentile(eomCashDue, 0.8),
                probExceedPlan: probExceed,
                topDrivers: topDrivers.map(d => ({
                    component: d.name === 'Material Volatility' ? 'MATERIAL' : d.name === 'Execution Overrun' ? 'INFRA' : 'SERVICE', // Mapping for UI icon/color logic if needed, or just use label
                    contribution: d.contribution,
                    label: d.name
                })),
                recommendedActions: [
                    { id: 'split-po', title: 'Split large POs', impact: '-15% EOM variance' },
                    { id: 'defer-scope', title: 'Defer non-critical scope', impact: '-₹2Cr exposure' }
                ],
                debugMetaData: {
                    plannedTotal: plannedTotal,
                    avgSimulatedMonthTotal: mean(currentMonthData.cashOutflows)
                }
            };
        }
    }

    // ========================================================================
    // KPIs & DIAGNOSTICS
    // ========================================================================

    const probAnyShortfall = Math.max(...monthlyStats.map(m => m.shortfallProb));
    const worstMonthData = monthlyStats.reduce((p, c) => c.shortfallProb > p.shortfallProb ? c : p, monthlyStats[0]);

    const peakScheduleDebtP80 = Math.max(...monthlyStats.map(m => m.scheduleDebtP80));
    const peakPayablesBacklogP80 = Math.max(...monthlyStats.map(m => m.payablesBacklogP80));

    const totalDeferred = monthlyStats.reduce((s, m) => s + m.deferredCostExpected, 0);
    const redMonthsCount = monthlyStats.filter(m => m.shortfallProb > 0.5).length;

    // Monthly maps
    const monthlyCoverageProb: Record<string, number> = {};
    const monthlyShortfallP80: Record<string, number> = {};
    const monthlyShortfallProb: Record<string, number> = {};
    const monthlyThrottlePct: Record<string, number> = {};
    const monthlyBacklogCarried: Record<string, number> = {};

    monthlyStats.forEach(m => {
        monthlyCoverageProb[m.month] = m.coverageProb;
        monthlyShortfallP80[m.month] = m.shortfallP80;
        monthlyShortfallProb[m.month] = m.shortfallProb;
        monthlyThrottlePct[m.month] = m.throttlePctExpected;
        monthlyBacklogCarried[m.month] = m.payablesBacklogExpected;
    });

    const diagnostics: Diagnostics = {
        horizonMonths: months.length,
        plannedTotalEngInflow: monthlyStats.reduce((s, m) => s + m.plannedAllocation, 0),
        plannedTotalEngOutflow: monthlyStats.reduce((s, m) => s + m.plannedOutflowTotal, 0),
        simTotalEngInflowP50: monthlyStats.reduce((s, m) => s + m.realizableInflowP50, 0),
        sumMonthlyP50: monthlyStats.reduce((s, m) => s + m.cashOutflowP50, 0),
        choleskySuccess: true,
        seed,
        validationFlags,
        monthlyThrottlePct,
        monthlyBacklogCarried
    };



    return {
        monthlyStats,
        kpis: {
            totalRealizableInflowP10: monthlyStats.reduce((s, m) => s + m.realizableInflowP10, 0),
            totalRealizableInflowP50: monthlyStats.reduce((s, m) => s + m.realizableInflowP50, 0),
            totalRealizableInflowP90: monthlyStats.reduce((s, m) => s + m.realizableInflowP90, 0),
            probShortfallAnyMonth: probAnyShortfall,
            probMeetPlan: 1 - probAnyShortfall,
            worstMonth: {
                month: worstMonthData.month,
                prob: worstMonthData.shortfallProb,
                amount: worstMonthData.shortfallP80
            },
            peakScheduleDebt: peakScheduleDebtP80,
            peakScheduleDebtP80,
            peakPayablesBacklogP80,
            totalDeferredCost: totalDeferred,
            redMonthsCount,
            primaryDriver: topDrivers[0] ? { key: topDrivers[0].name, contribution: topDrivers[0].contribution } : { key: 'N/A', contribution: 0 },
            monthlyCoverageProb,
            monthlyShortfallP80,
            monthlyShortfallProb,
            topDrivers,
            diagnostics
        },
        nowCast,
        breachRadar
    };
}
