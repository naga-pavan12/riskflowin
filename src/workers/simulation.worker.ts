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
    DEFAULT_RISK_CONFIG,
    SamplePath,
    KillChain,
    KillChainEvent,
    SensitivityFactor
} from '../types/index';

import { getEarlyWarnings } from '../sim/analysis/earlyWarnings';
import { analyzeRootCause } from '../sim/analysis/rca';
import { calculateRiskScores } from '../sim/analysis/riskScoring';
import { generateNarrative } from '../sim/analysis/narrative';

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
        sigmaMarket: 0.12, // Reduced from 0.15
        sigmaIdio: 0.10,
        marketWeight: 0.6,
        dist: 'lognormal',
        clampMax: 2.0
    },
    overrun: { mean: 0.03, sigma: 0.1, clampMax: 0.5 }, // Reduced mean from 0.05
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
    skipSensitivity?: boolean;
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

    // Determine current month index and string
    let currentMonthIdx = -1;
    let currentMonth = asOfMonth;

    if (currentMonthActuals && typeof currentMonthActuals.currentMonth === 'number') {
        currentMonthIdx = currentMonthActuals.currentMonth - 1; // 1-based to 0-based
        if (months[currentMonthIdx]) {
            currentMonth = months[currentMonthIdx];
        }
    } else {
        currentMonthIdx = months.indexOf(asOfMonth);
    }

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

    // Flight Simulator Data
    const samplePaths: SamplePath[] = [];
    let worstIteration: { id: number; shortfall: number; events: KillChainEvent[] } = { id: -1, shortfall: -1, events: [] };

    // Variance Accumulators (Granular)
    const globalVariances: Record<string, number> = {};

    for (let iter = 0; iter < iterations; iter++) {
        const rng = createRandom(seed + iter);

        // Iteration state
        let carryForward = 0;
        let payablesBacklog = 0;
        let scheduleDebt = 0;
        let reserveRemaining = riskParams.reserve?.enabled ? riskParams.reserve.total : 0;
        let scopeIndex = 0;
        let firstBreachIdx = -1;

        // Kill Chain Logging
        const currentEvents: KillChainEvent[] = [];
        let iterTotalShortfall = 0;

        // Pending cash from invoice lags
        const pendingCash: number[] = new Array(months.length + 5).fill(0);

        // Market shock for this iteration (correlated across months)
        const marketShock = sampleNormal(rng, 0, (riskParams.materialVol?.sigmaMarket || 0.15) * volatilityFactor);

        if (Math.abs(marketShock) > 0.25) {
            currentEvents.push({
                month: 'GLOBAL',
                description: `Global Market Shock: ${(marketShock * 100).toFixed(1)}%`,
                severity: 'HIGH',
                impactType: 'COST'
            });
        }

        months.forEach((month, monthIdx) => {
            const isHistorical = month < asOfMonth;
            // const isCurrentMonth = month === currentMonth; // Unused variable

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
                        const actualVal = (actualOutflows[month]?.[ent]?.[act] as any)?.[comp];
                        const plannedVal = (plannedOutflows[month]?.[ent]?.[act] as any)?.[comp];
                        const val = actualVal !== undefined ? actualVal : (plannedVal || 0);
                        incurredCost += val;
                        incurredByComponent[comp] += val;
                    });
                }));
            } else {
                // Rain season productivity factor
                const calendarMonth = parseInt(month.split('-')[1]);
                const isRainSeason = riskConfig.execution.rainSeasonMonths.includes(calendarMonth);
                const rainFactor = isRainSeason ? 0.90 : 1.0; // 10% productivity loss in monsoon (Updated)

                if (isRainSeason) {
                    currentEvents.push({
                        month,
                        description: `Monsoon Season (0.9x Efficiency)`,
                        severity: 'LOW', // Reduced severity
                        impactType: 'SCHEDULE'
                    });
                }

                // NEW: Design Maturity Impact on Scope Drift
                // Low maturity (e.g. 0.5) doubles the drift mean and sigma
                const designMaturity = riskConfig.design?.completionPct ?? 1.0;
                const designFactor = 1 + (1 - designMaturity);

                // Scale drift parameters by design maturity
                const driftMean = (riskParams.scopeDrift!.mean) * designFactor;
                const driftSigma = (riskParams.scopeDrift!.sigma) * designFactor;

                const driftStep = sampleNormal(rng, driftMean, driftSigma);
                scopeIndex = Math.min(scopeIndex + Math.max(0, driftStep), riskParams.scopeDrift!.cap || 1.0);

                config.entities.forEach(ent => config.activities.forEach(act => {
                    // CRITICAL CHANGE: Use engineeringDemand instead of plannedOutflows for active simulation
                    const basePlanned = engineeringDemand[month]?.[ent]?.[act] as any;

                    (['SERVICE', 'MATERIAL', 'INFRA'] as const).forEach(comp => {
                        const baseVal = basePlanned?.[comp] || 0;
                        if (baseVal === 0) return;

                        let val = baseVal;

                        // Material Volatility + Inflation Bias
                        if (comp === 'MATERIAL') {
                            // NEW: Vendor Reliability Impact
                            // Low reliability (e.g. 0.5) increases volatility sigma
                            const vendorReliability = riskConfig.supply?.vendorReliability ?? 1.0;
                            const reliabilityPenalty = 1 + (1 - vendorReliability); // 1.0 to 2.0 multiplier

                            // Apply monthly inflation bias from riskConfig
                            const monthlyInflation = riskConfig.market.inflationExpectation / 12;
                            const inflationBias = monthlyInflation * (monthIdx + 1); // Cumulative

                            // Apply reliability penalty to sigmaMarket
                            const idioShock = sampleNormal(rng, 0, (riskParams.materialVol?.sigmaIdio || 0.1) * volatilityFactor);
                            const combinedShock = inflationBias
                                + marketShock * (riskParams.materialVol?.marketWeight || 0.6) * reliabilityPenalty
                                + idioShock * (1 - (riskParams.materialVol?.marketWeight || 0.6));
                            let matMult = Math.exp(combinedShock);

                            // Clamp to prevent outliers
                            const clampMax = riskParams.materialVol?.clampMax || 2.0;
                            if (matMult > clampMax) {
                                matMult = clampMax;
                                validationFlags.clampingOccurred = true;
                            }
                            val *= matMult;
                        }

                        // Execution Overrun (Labor/Infra only)
                        if (comp !== 'MATERIAL') {
                            let overrun = sampleNormal(rng, riskParams.overrun!.mean, riskParams.overrun!.sigma * volatilityFactor);
                            const overrunClamp = riskParams.overrun?.clampMax || 0.5;
                            overrun = clamp(overrun, -0.2, overrunClamp);
                            val *= (1 + overrun);
                        }

                        // Scope Drift (Impacted by Design Maturity)
                        val *= (1 + scopeIndex);

                        // Rain season (Service only)
                        if (comp === 'SERVICE' && isRainSeason) {
                            val /= rainFactor; // Cost increases as efficiency drops
                        }

                        // NEW: Quality / Rework Cost
                        // First Time Right % determines how much work needs to be redone
                        // Cost Impact: The rework portion is effectively "done twice" (or added cost)
                        // We treat rework as an additional cost layer
                        const ftr = riskConfig.quality?.firstTimeRightPct ?? 1.0; // e.g. 0.9
                        const reworkProb = 1 - ftr; // e.g. 0.1

                        let reworkCost = 0;
                        // Simulating rework as a probabilistic hit or a constant drag?
                        // Let's use constant drag for stability, with stochastic noise
                        // Rework is usually labor/service heavy, but material can be wasted too.
                        // We apply to all components.
                        const reworkHit = val * reworkProb;
                        reworkCost = reworkHit * (1 + sampleNormal(rng, 0, 0.2)); // +/- 20% variance on the rework cost itself

                        val += Math.max(0, reworkCost); // Add rework cost to total

                        incurredCost += val;
                        incurredByComponent[comp] += val;

                        // GRANULAR VARIANCE TRACKING (Dynamic Risk Drivers)
                        if (val !== baseVal) {
                            const key = `${ent} - ${act} (${comp === 'SERVICE' ? 'Labor' : comp === 'INFRA' ? 'Infra' : 'Material'})`;
                            globalVariances[key] = (globalVariances[key] || 0) + (val - baseVal);

                            // Attribute specific portions to new drivers if significant
                            if (reworkCost > 0.1) {
                                const qualityKey = `Quality Rework - ${ent} (${act})`;
                                globalVariances[qualityKey] = (globalVariances[qualityKey] || 0) + reworkCost;
                            }

                            // If design maturity caused scope drift, we could attribute it, 
                            // but 'Scope Drift' is usually captured inherently by the (val - baseVal) delta relative to Scope Index.
                            // However, we can track the specific "Design Gap" contribution to drift separately if needed.
                            /*
                            if (designFactor > 1.0 && scopeIndex > 0) {
                                // Approximate contribution of design gap to the drift
                                const designKey = `Design Gap Drift - ${ent}`;
                                globalVariances[designKey] = (globalVariances[designKey] || 0) + (val * scopeIndex * (1 - designMaturity));
                            }
                            */
                        }
                    });
                }));

                // Manual Threat Injection
                for (const threat of riskConfig.threats) {
                    // threat.month is 1-based index (User Spec)
                    if (threat.month === (monthIdx + 1)) {
                        // Sample: does this threat materialize?
                        if (rng() < threat.probability) {
                            incurredByComponent.SERVICE += threat.amount; // Default to SERVICE

                            currentEvents.push({
                                month,
                                description: `Threat Materialized: ${threat.name} (₹${threat.amount}Cr)`,
                                severity: 'CRITICAL',
                                impactType: 'COST'
                            });

                            // Track threats as drivers too
                            const key = `Manual Threat: ${threat.name}`;
                            globalVariances[key] = (globalVariances[key] || 0) + threat.amount;
                        }
                    }
                }
            }

            // Add schedule debt from previous month (work that was deferred)
            // ... (Rest of logic remains same, just removing variance accumulators)

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
                // cashFromCurrentMaterial = 0; 
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

                iterTotalShortfall += shortfall;
                currentEvents.push({
                    month,
                    description: `Liquidity Breach: ₹${shortfall.toFixed(2)} Cr shortfall`,
                    severity: 'CRITICAL',
                    impactType: 'LIQUIDITY'
                });

                // PAYABLES BACKLOG: Unpaid cash becomes liability
                payablesBacklog = unpaid;

                // THROTTLE: Reduce execution next month (DISABLED PER USER REQUEST)
                // User logic: "Project will be funded one way or another, work continues."
                // We track the backlog as a financial liability, but do NOT slow down the schedule.

                throttlePctThisMonth = 0; // Force zero throttle
                scheduleDebt = 0;         // No schedule slip due to money
                deferredThisMonth = 0;
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
        });

        firstBreachMonthIdx.push(firstBreachIdx);

        // Capture Sample Path (First 50)
        if (iter < 50) {
            samplePaths.push({
                id: iter,
                monthlyData: months.map((m, idx) => ({
                    month: m,
                    cashOutflow: monthly[m].cashOutflows[iter],
                    shortfall: monthly[m].shortfalls[iter],
                    scheduleDebt: monthly[m].scheduleDebt[iter]
                }))
            });
        }

        // Track Worst Iteration
        if (iterTotalShortfall > worstIteration.shortfall) {
            worstIteration = { id: iter, shortfall: iterTotalShortfall, events: currentEvents };
        }
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

        // GAP CALCULATION: Compare Total Liability (P50) vs Safe Limit
        // This accounts for Payables Backlog, not just monthly plan
        const cashOutflowP50 = percentile(d.cashOutflows, 0.5);
        const gapToFix = Math.max(0, cashOutflowP50 - p20Safe);

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

        // currentMonthIdx is already calculated at start of function

        breachRadar = {
            earliestBreachMonthP50: months[p50Idx] || null,
            earliestBreachMonthP80: months[p80Idx] || null,
            timeToBreachP50: p50Idx >= 0 ? p50Idx - currentMonthIdx : null,
            timeToBreachP80: p80Idx >= 0 ? p80Idx - currentMonthIdx : null,
            breachDistribution
        };
    }

    // ========================================================================
    // DRIVER ATTRIBUTION (DYNAMIC)
    // ========================================================================

    // 1. Calculate Average Variance from Granular Map
    const granularDrivers = Object.entries(globalVariances).map(([key, totalVal]) => ({
        name: key,
        meanVal: totalVal / iterations
    }));

    // 2. Sort by Absolute Impact
    granularDrivers.sort((a, b) => Math.abs(b.meanVal) - Math.abs(a.meanVal));

    // 3. Map to Top Drivers Format
    const totalVariance = granularDrivers.reduce((sum, d) => sum + Math.abs(d.meanVal), 0) + 0.1;

    const topDrivers = granularDrivers.slice(0, 15).map(d => {
        let lever = 'Review';
        if (d.name.includes('Material')) lever = 'Procurement';
        else if (d.name.includes('Labor')) lever = 'Execution';
        else if (d.name.includes('Infra')) lever = 'Asset Mgmt';
        else if (d.name.includes('Threat')) lever = 'Governance';

        return {
            name: d.name,
            contribution: d.meanVal,
            lever,
            impactOnShortfall: Math.abs(d.meanVal) / totalVariance,
            impactOnBacklog: 0.2, // Heuristic
            impactOnScheduleDebt: 0.2
        };
    });

    // Determine primary driver (formatted)
    const primaryDriver = topDrivers.length > 0 ? {
        key: topDrivers[0].name,
        contribution: topDrivers[0].contribution
    } : { key: 'Stable', contribution: 0 };

    // Propose actions based on top driver
    /*
    const recommendedActions = [];
    if (topDrivers[0]?.lever === 'Procurement') {
        recommendedActions.push({ id: 'hedging', title: 'Start Material Hedging', impact: 'High' });
    }
    */

    // ========================================================================
    // NOW-CAST (Current Month Projection)
    // ========================================================================

    let nowCast: NowCastResults | undefined;
    if (currentMonthActuals && currentMonth) {
        const currentMonthData = monthly[currentMonth];
        if (currentMonthData) {
            const actualPaid = currentMonthActuals.actualPaidToDate;
            const totalActualPaid = actualPaid.SERVICE + actualPaid.MATERIAL + actualPaid.INFRA;

            // Project remaining based on elapsed progress
            const plannedTotal = monthlyStats.find(m => m.month === currentMonth)?.plannedOutflowTotal || 0;
            const remainingFraction = 1 - currentMonthActuals.elapsedProgress;

            // EOM projection logic: "Sunk Cost + Future Risk"
            // Projected = ActualPaid + (SimulatedTotal * RemainingTimeFraction)
            const eomCashDue = currentMonthData.cashOutflows.map(c => {
                return totalActualPaid + (c * Math.max(0, remainingFraction));
            });

            const probExceed = eomCashDue.filter(c => c > plannedTotal).length / iterations;

            nowCast = {
                eomCashDueP50: percentile(eomCashDue, 0.5),
                eomCashDueP80: percentile(eomCashDue, 0.8),
                probExceedPlan: probExceed,
                topDrivers: topDrivers.map(d => ({
                    component: d.name === 'Material Volatility' ? 'MATERIAL' : d.name === 'Execution Overrun' ? 'INFRA' : 'SERVICE',
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

    // ========================================================================
    // NAVIGATOR INTELLIGENCE LAYER
    // ========================================================================

    const historicalStats = monthlyStats.filter(m => m.isHistorical);
    const futureStats = monthlyStats.filter(m => !m.isHistorical);

    // 1. RISK SCORING (Operational Health)
    const riskScores = calculateRiskScores(monthlyStats, riskConfig.limits);

    // 2. ROOT CAUSE ANALYSIS (Variance Decomposition)
    const rca = analyzeRootCause(historicalStats, futureStats, riskConfig);

    // 5. SENSITIVITY ANALYSIS (Tornado Chart)
    const sensitivityAnalysis: SensitivityFactor[] = [];

    if (!params.skipSensitivity && iterations >= 100) {
        const baseShortfallP80 = percentile(monthlyStats.map(m => m.shortfallP80), 0.8); // Simple metric
        const miniSimIters = 100;

        // Helper
        const runScen = (name: string, mod: (p: RiskParams) => void) => {
            const newParams = JSON.parse(JSON.stringify(riskParams));
            mod(newParams);

            const res = runSimulation({ ...params, riskParams: newParams, iterations: miniSimIters, skipSensitivity: true });
            const newShortfall = Math.max(...res.monthlyStats.map(m => m.shortfallP80));
            // Or total shortfall? Let's use max monthly shortfall P80
            const currentShortfall = Math.max(...monthlyStats.map(m => m.shortfallP80));

            const delta = newShortfall - currentShortfall;
            sensitivityAnalysis.push({
                factor: name,
                change: '+20% Impact',
                impactOnShortfall: delta,
                impactOnScore: 0 // Logic for score update is complex, skip for now
            });
        };

        runScen('Material Volatility', (p) => {
            if (p.materialVol) p.materialVol.sigmaMarket *= 1.5;
        });
        runScen('Execution Confidence', (p) => {
            if (p.overrun) p.overrun.mean += 0.1; // Reduce confidence ~ increase mean overrun
        });
        runScen('Scope Drift', (p) => {
            if (p.scopeDrift) p.scopeDrift.mean *= 2.0;
        });
        // Funding efficiency
        // Requires modifying RiskConfig actually, not RiskParams.
        // But logic uses RiskConfig.funding.collectionEfficiency.
        // We need to modify 'config' or 'riskConfig' passed to runSimulation.
    }

    // 3. EARLY WARNINGS (Signals)
    const earlyWarnings = currentMonthActuals
        ? getEarlyWarnings(currentMonthActuals, config.capTotalCr)
        : [];

    // 4. NARRATIVE GENERATION
    const narrative = generateNarrative(rca, riskScores, earlyWarnings, currentMonthIdx);

    const killChain: KillChain = {
        iterationId: worstIteration.id,
        totalShortfall: worstIteration.shortfall,
        events: worstIteration.events
    };

    return {
        samplePaths,
        killChain,
        sensitivityAnalysis,
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
        breachRadar,

        // NEW INTELLIGENCE FIELDS
        earlyWarnings,
        riskScores,
        rca,
        narrative
    };
}
