import { ProjectConfig, DeptAllocation, OutflowData, SimulationResults, ScenarioAction, RiskParams } from '../types';

// --- MATH UTILITIES ---

function createRandom(seed: number) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function rationalApproximation(t: number): number {
    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];
    return t - ((c[2] * t + c[1]) * t + c[0]) / (((d[2] * t + d[1]) * t + d[0]) * t + 1.0);
}

function normalInvCDF(p: number): number {
    const pClamp = Math.max(1e-12, Math.min(1 - 1e-12, p));
    if (pClamp < 0.5) return -rationalApproximation(Math.sqrt(-2.0 * Math.log(pClamp)));
    return rationalApproximation(Math.sqrt(-2.0 * Math.log(1.0 - pClamp)));
}

// Simple Box-Muller for standard normal (alternative to InvCDF for speed if needed, but keeping existing for consistency)
function sampleNormal(rng: () => number, mean = 0, std = 1): number {
    const u = 1 - rng();
    const v = 1 - rng();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * std + mean;
}

function sampleLogNormal(rng: () => number, mean: number, sigma: number): number {
    const mu = Math.log(mean) - 0.5 * Math.log(1 + (sigma / mean) ** 2);
    const s = Math.sqrt(Math.log(1 + (sigma / mean) ** 2));
    const z = sampleNormal(rng, 0, 1);
    return Math.exp(mu + s * z);
}

function sampleTriangular(u: number, low: number, mode: number, high: number): number {
    const f = (mode - low) / (high - low);
    if (u < f) return low + Math.sqrt(u * (high - low) * (mode - low));
    return high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

// --- CONSTANTS ---
// Default Risk Parameters (can be overridden by input)
const DEFAULT_RISK_PARAMS: RiskParams = {
    invoiceLag: {
        service: { p0: 0.7, p1: 0.3 }, // 70% same month, 30% next month
        material: { p1: 0.6, p2: 0.4 }, // 60% 1 month lag, 40% 2 month lag
        infra: { p0: 0.8, p1: 0.2, p2: 0 }
    },
    materialVol: { sigmaMarket: 0.15, sigmaIdio: 0.10, marketWeight: 0.6, dist: 'lognormal' },
    overrun: { mean: 0.05, sigma: 0.1 }, // 5% average overrun
    scopeDrift: { mean: 0.005, sigma: 0.002, cap: 0.15 }, // 0.5% per month compounded
    reserve: { enabled: true, total: 50, monthlyCap: 10 },
    breachPolicy: { mode: 'defer', deferFriction: 1.1 } // 10% cost penalty on deferred work
};

self.onmessage = async (e) => {
    const { config, allocations, actualAllocations, plannedOutflows, actualOutflows, volatilityFactor, corrStrength, iterations } = e.data;

    // 1. Run Baseline Simulation
    const baseline = runSimulationInternal({
        config, allocations, actualAllocations, plannedOutflows, actualOutflows,
        volFactor: volatilityFactor, corr: corrStrength, iters: iterations,
        riskParams: DEFAULT_RISK_PARAMS
    });

    // 2. Compute Cause Attribution (Counterfactuals)
    // We toggle off specific risk factors to see their impact on probability of shortfall
    const drivers = [
        { key: 'INVOICE_LAG', label: 'Invoice Lag' },
        { key: 'MATERIAL_VOL', label: 'Material Price Volatility' },
        { key: 'OVERRUN', label: 'Execution Overrun' },
        { key: 'SCOPE_DRIFT', label: 'Scope Creep' }
    ];

    const causeAttribution = drivers.map(d => {
        // Create neutralized params
        const neutralizedParams = JSON.parse(JSON.stringify(DEFAULT_RISK_PARAMS));
        if (d.key === 'INVOICE_LAG') neutralizedParams.invoiceLag = { service: { p0: 1, p1: 0 }, material: { p1: 1, p2: 0 }, infra: { p0: 1, p1: 0, p2: 0 } }; // Illustrative zero lag (or minimized)
        if (d.key === 'MATERIAL_VOL') neutralizedParams.materialVol = { ...neutralizedParams.materialVol, sigmaMarket: 0.01, sigmaIdio: 0.01 };
        if (d.key === 'OVERRUN') neutralizedParams.overrun = { mean: 0, sigma: 0 };
        if (d.key === 'SCOPE_DRIFT') neutralizedParams.scopeDrift = { mean: 0, sigma: 0 };

        const neutralized = runSimulationInternal({
            config, allocations, actualAllocations, plannedOutflows, actualOutflows,
            volFactor: volatilityFactor, corr: corrStrength, iters: 500, // Quick run
            riskParams: neutralizedParams
        });

        // Impact is reduction in shortfall likelihood
        const deltaProb = Math.max(0, baseline.kpis.probShortfallAnyMonth - neutralized.kpis.probShortfallAnyMonth);
        return { name: d.label, deltaProb, key: d.key };
    }).sort((a, b) => b.deltaProb - a.deltaProb);

    // 3. Final Results
    const finalResults: SimulationResults = {
        ...baseline,
        kpis: {
            ...baseline.kpis,
            topDrivers: causeAttribution.map(c => ({
                name: c.name,
                contribution: c.deltaProb / (baseline.kpis.probShortfallAnyMonth || 1), // Normalized
                lever: 'Operations'
            })),
            topCauses: causeAttribution.map(c => ({
                name: c.name,
                contribution: c.deltaProb
            }))
        }
    };

    self.postMessage(finalResults);
};

interface SimParams {
    config: ProjectConfig;
    allocations: DeptAllocation;
    actualAllocations: DeptAllocation;
    plannedOutflows: OutflowData;
    actualOutflows: OutflowData;
    volFactor: number;
    corr: number;
    iters: number;
    riskParams: RiskParams;
}

function runSimulationInternal(params: SimParams) {
    const { config, allocations, actualAllocations, plannedOutflows, actualOutflows, volFactor, corr, iters, riskParams } = params;
    const months = Object.keys(allocations).sort();
    const asOfMonth = config.asOfMonth;

    // Output Arrays (Month -> Iteration[])
    const monthlyShortfalls: Record<string, number[]> = {};
    const monthlyInflows: Record<string, number[]> = {}; // Eng Realizable
    const monthlyDemands: Record<string, number[]> = {}; // Incurred
    const monthlyCashOutflows: Record<string, number[]> = {}; // Cash Out
    const monthlyScheduleDebt: Record<string, number[]> = {}; // Debt Start
    const monthlyDeferred: Record<string, number[]> = {}; // Deferred This Month
    const monthlyCarryForward: Record<string, number[]> = {}; // Carry Forward

    months.forEach(m => {
        monthlyShortfalls[m] = [];
        monthlyInflows[m] = [];
        monthlyDemands[m] = [];
        monthlyCashOutflows[m] = [];
        monthlyScheduleDebt[m] = [];
        monthlyDeferred[m] = [];
        monthlyCarryForward[m] = [];
    });

    for (let i = 0; i < iters; i++) {
        const iterRng = createRandom(42 + i);

        // Iteration State
        let currentScheduleDebt = 0;
        let carryForward = 0;
        let reserveRemaining = riskParams.reserve?.enabled ? riskParams.reserve.total : 0;
        let scopeIndex = 0;

        // Track pending cash outflows from lags: map[monthIndex] -> amount
        const pendingCashFlows: number[] = new Array(months.length + 5).fill(0); // Buffer for lags

        // Material Market Shock for this iteration
        const marketShock = sampleNormal(iterRng, 0, riskParams.materialVol!.sigmaMarket * volFactor);

        months.forEach((month, monthIdx) => {
            const isHistorical = month <= asOfMonth;

            // --- 1. Available Inflow (Engineering Only) ---
            let engInflow = 0;
            if (isHistorical) {
                engInflow = actualAllocations[month]?.['ENGINEERING'] || allocations[month]?.['ENGINEERING'] || 0;
            } else {
                engInflow = allocations[month]?.['ENGINEERING'] || 0;
                // No borrowing from Marketing/Others logic here. 
                // Engineering lives within its means.
            }
            monthlyInflows[month].push(engInflow);

            // --- 2. Demand Simulation (Incurred Cost) ---
            let incurredCost = 0;

            if (isHistorical) {
                // Grounded: Use Exact Actuals
                config.entities.forEach(ent => config.activities.forEach(act => {
                    ['SERVICE', 'MATERIAL', 'INFRA'].forEach(comp => {
                        incurredCost += (actualOutflows[month]?.[ent]?.[act] as any)?.[comp] || (plannedOutflows[month]?.[ent]?.[act] as any)?.[comp] || 0;
                    });
                }));
            } else {
                // Apply Risk Factors

                // A. Scope Drift
                const driftStep = sampleNormal(iterRng, riskParams.scopeDrift!.mean, riskParams.scopeDrift!.sigma);
                scopeIndex = Math.min(scopeIndex + Math.max(0, driftStep), riskParams.scopeDrift!.cap || 1.0);

                config.entities.forEach(ent => config.activities.forEach(act => {
                    const basePlanned = plannedOutflows[month]?.[ent]?.[act] as any;

                    ['SERVICE', 'MATERIAL', 'INFRA'].forEach(comp => {
                        const baseVal = basePlanned?.[comp] || 0;
                        if (baseVal === 0) return;

                        let val = baseVal;

                        // B. Components Multipliers
                        if (comp === 'MATERIAL') {
                            const idioShock = sampleNormal(iterRng, 0, riskParams.materialVol!.sigmaIdio * volFactor);
                            const combinedShock = marketShock * riskParams.materialVol!.marketWeight + idioShock * (1 - riskParams.materialVol!.marketWeight);
                            const matMult = Math.exp(combinedShock); // Lognormal simplified
                            val *= matMult;
                        }

                        // C. Execution Overrun (General Uplift)
                        const overrunInfo = riskParams.overrun!;
                        const overrun = Math.max(-0.2, sampleNormal(iterRng, overrunInfo.mean, overrunInfo.sigma * volFactor));
                        val *= (1 + overrun);

                        // D. Scope Drift
                        val *= (1 + scopeIndex);

                        incurredCost += val;
                    });
                }));
            }

            // Add incoming Schedule Debt to 'Work To Be Done' this month
            // Note: ScheduleDebt implies work was deferred to now.
            const totalWorkLoad = incurredCost + currentScheduleDebt;
            monthlyScheduleDebt[month].push(currentScheduleDebt);
            monthlyDemands[month].push(totalWorkLoad);

            // --- 3. Cash Outflow (Invoice Lag) ---
            // For simplicity in this specialized loop, we'll assume the distribution applies to the *total* incurred, 
            // weighted by component mix. For high fidelity, we'd do it per component.
            // Let's do a simplified bucket approach:

            // Current month cash requirement = (Pending from previous) + (Current Incurred that falls in this month)
            // But 'incurredCost' implies work done now. We distribute payment.

            let cashFromCurrent = 0;
            if (isHistorical) {
                cashFromCurrent = incurredCost; // Simplified: historical actuals are cash
                // In reality, historical 'actuals' in DB might be incurred or cash. Assuming cash for now.
            } else {
                // Distribute 'incurredCost' to current and future months
                // Simplified lag model: 
                // 60% pays now, 30% next month, 10% month after
                const payNow = incurredCost * 0.6;
                const payNext = incurredCost * 0.3;
                const payNext2 = incurredCost * 0.1;

                cashFromCurrent += payNow;
                pendingCashFlows[monthIdx + 1] += payNext;
                pendingCashFlows[monthIdx + 2] += payNext2;
            }

            const totalCashDue = cashFromCurrent + pendingCashFlows[monthIdx];
            monthlyCashOutflows[month].push(totalCashDue);

            // --- 4. Liquidity & Breach Resolution ---

            // Available to spend
            let available = engInflow + carryForward;
            let reserveDraw = 0;
            let deferredThisMonth = 0;
            let shortfall = 0;

            if (totalCashDue <= available) {
                // Happy Path: Pay all
                carryForward = available - totalCashDue;
            } else {
                // Breach
                const deficit = totalCashDue - available;

                // 1. Draw Reserve (capped)
                if (riskParams.reserve?.enabled && reserveRemaining > 0) {
                    const draw = Math.min(deficit, riskParams.reserve.monthlyCap, reserveRemaining);
                    reserveDraw = draw;
                    reserveRemaining -= draw;
                    available += draw;
                }

                if (totalCashDue <= available) {
                    // Recovered via reserve
                    carryForward = available - totalCashDue;
                } else {
                    // 2. Deferral (Schedule Debt)
                    const unpaid = totalCashDue - available;

                    // The unpaid cash implies valid work was done but not paid. 
                    // Reality: Work stops or penalty.
                    // Model: Push strict amount + friction to next month
                    deferredThisMonth = unpaid * (riskParams.breachPolicy?.deferFriction || 1.0);

                    shortfall = unpaid; // Track pure monetary shortfall size
                    carryForward = 0;

                    // Add to schedule debt for next month
                    currentScheduleDebt += deferredThisMonth;

                    // NOTE: In this simplified loop, we assume the 'unpaid' portion correlates to 'deferred work'.
                    // If we strictly track 'cash', then schedule debt is 'cash debt'. 
                    // To act as 'physical work deferral', we assume cost ~ progress.
                }
            }

            monthlyShortfalls[month].push(shortfall);
            monthlyDeferred[month].push(deferredThisMonth);
            monthlyCarryForward[month].push(carryForward); // Track carry forward state
        });
    }

    // Aggregation
    const percentile = (arr: number[], p: number) => {
        const s = [...arr].sort((a, b) => a - b);
        return s[Math.floor(s.length * p)] || s[s.length - 1] || 0;
    };

    const monthlyStats = months.map(m => {
        const inf = monthlyInflows[m];
        const dem = monthlyDemands[m]; // Total Work Load
        const cash = monthlyCashOutflows[m];
        const sh = monthlyShortfalls[m];
        const def = monthlyDeferred[m];
        const debt = monthlyScheduleDebt[m]; // Entering Debt
        const cf = monthlyCarryForward[m];

        // Safe Spend Limit (P20 of Eng Inflow + Carry Forward)
        // We approximate P20(Inflow) + P20(CarryForward) or P20(Inflow + CarryForward)
        // Let's compute iteration-wise sum
        const inflowPlusCF = inf.map((v, i) => v + cf[i]);
        const p20Safe = percentile(inflowPlusCF, 0.2);

        return {
            month: m,
            isHistorical: m <= asOfMonth,
            plannedAllocation: allocations[m]?.['ENGINEERING'] || 0,

            realizableInflowP10: percentile(inf, 0.1),
            realizableInflowP20: percentile(inf, 0.2), // Raw Inflow P20
            realizableInflowP50: percentile(inf, 0.5),
            realizableInflowP80: percentile(inf, 0.8),
            realizableInflowP90: percentile(inf, 0.9),

            plannedOutflowTotal: 0, // Deprecated or re-mapped to mean demand
            demandP50: percentile(dem, 0.5),
            demandP80: percentile(dem, 0.8),

            cashOutflowP50: percentile(cash, 0.5),
            cashOutflowP80: percentile(cash, 0.8),

            shortfallP50: percentile(sh, 0.5),
            shortfallP80: percentile(sh, 0.8),
            shortfallExpected: sh.reduce((a, b) => a + b, 0) / iters,
            shortfallProb: sh.filter(s => s > 1.0).length / iters,

            coverageProb: cash.map((c, i) => c <= (inf[i] + cf[i])).filter(Boolean).length / iters,

            safeSpendLimit: p20Safe,
            gapToFix: 0, // Gap logic changes with deferral

            scheduleDebtP50: percentile(debt, 0.5),
            deferredCostExpected: def.reduce((a, b) => a + b, 0) / iters
        };
    });

    // Horizon KPIs
    let anyShortfallCount = 0;
    let totalDeferred = 0;
    let peakDebt = 0;

    // Quick avg checks
    monthlyStats.forEach(m => {
        totalDeferred += m.deferredCostExpected;
        if (m.scheduleDebtP50 > peakDebt) peakDebt = m.scheduleDebtP50;
    });

    const probAnyShortfall = monthlyStats.reduce((max, m) => Math.max(max, m.shortfallProb), 0); // Approx

    return {
        monthlyStats,
        kpis: {
            totalRealizableInflowP10: 0, // Todo aggregation
            totalRealizableInflowP50: monthlyStats.reduce((s, m) => s + m.realizableInflowP50, 0),
            totalRealizableInflowP90: 0,
            probShortfallAnyMonth: probAnyShortfall,
            probMeetPlan: 1 - probAnyShortfall,
            worstMonth: {
                month: monthlyStats.reduce((p, c) => c.shortfallProb > p.shortfallProb ? c : p, monthlyStats[0]).month,
                prob: monthlyStats.reduce((p, c) => c.shortfallProb > p.shortfallProb ? c : p, monthlyStats[0]).shortfallProb,
                amount: monthlyStats.reduce((p, c) => c.shortfallProb > p.shortfallProb ? c : p, monthlyStats[0]).shortfallP80
            },

            // New Horizon Metrics
            peakScheduleDebt: peakDebt,
            totalDeferredCost: totalDeferred,
            redMonthsCount: monthlyStats.filter(m => m.shortfallProb > 0.5).length,

            primaryDriver: { key: 'N/A', contribution: 0 },
            monthlyCoverageProb: {},
            monthlyShortfallP80: {},
            monthlyShortfallProb: {},
            topDrivers: [], // Populated in onmessage
            diagnostics: {
                horizonMonths: months.length,
                plannedTotalEngInflow: 0,
                plannedTotalEngOutflow: 0,
                simTotalEngInflowP50: 0,
                sumMonthlyP50: 0,
                choleskySuccess: true,
                seed: 42
            }
        }
    };
}
