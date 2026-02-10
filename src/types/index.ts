import { z } from 'zod';

// ============================================================================
// CORE ENUMS
// ============================================================================

export const ComponentType = z.enum(['SERVICE', 'MATERIAL', 'INFRA']);
export type ComponentType = z.infer<typeof ComponentType>;

export const DeptType = z.enum(['ENGINEERING', 'MARKETING', 'OTHERS']);
export type DeptType = z.infer<typeof DeptType>;

export const BreachModeSchema = z.enum(['payablesBacklogThrottle', 'deferUncommittedOnly']);
export type BreachMode = z.infer<typeof BreachModeSchema>;

// ============================================================================
// PROJECT CONFIGURATION
// ============================================================================

export const ProjectConfigSchema = z.object({
    name: z.string(),
    startMonth: z.string(), // YYYY-MM
    asOfMonth: z.string(),   // Current grounding month (YYYY-MM)
    durationMonths: z.number().min(1).max(120),
    capTotalCr: z.number().min(0),
    protectEngineering: z.boolean().default(false),
    underspendPolicy: z.enum(['ROLLOVER_NEXT_MONTH', 'LAPSE']).default('ROLLOVER_NEXT_MONTH'),
    entities: z.array(z.string()),
    activities: z.array(z.string()),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// ============================================================================
// POLICY & CONTROLS (NEW)
// ============================================================================

export const PolicyConfigSchema = z.object({
    breachMode: BreachModeSchema.default('payablesBacklogThrottle'),
    maxThrottlePctPerMonth: z.number().min(0).max(1).default(0.40),
    commitmentRatioDefaults: z.object({
        SERVICE: z.number().min(0).max(1).default(0.50),
        MATERIAL: z.number().min(0).max(1).default(0.80),
        INFRA: z.number().min(0).max(1).default(0.60),
    }).default({
        SERVICE: 0.50,
        MATERIAL: 0.80,
        INFRA: 0.60,
    }),
    frictionMultiplier: z.number().min(1).max(2).default(1.10), // 10% penalty on deferred work
});

export type PolicyConfig = z.infer<typeof PolicyConfigSchema>;

// ============================================================================
// RISK CONFIGURATION (High-Fidelity Control Panel)
// ============================================================================

export type VolatilityClass = 'low' | 'med' | 'high' | 'critical';
export type ContractorRisk = 'reliable' | 'shaky' | 'high-risk';

export interface ManualThreat {
    id: string;
    name: string;
    month: string; // YYYY-MM
    amount: number; // In Cr
    probability: number; // 0.0 to 1.0
}

export interface RiskConfig {
    market: {
        volatilityClass: VolatilityClass;
        inflationExpectation: number; // e.g., 0.08 for 8% annual
        fxExposurePct: number; // e.g., 0.15 for 15% of costs
    };
    execution: {
        scheduleConfidence: number; // 0.0 to 1.0
        contractorRisk: ContractorRisk;
        rainSeasonMonths: number[]; // 1-12 calendar months
    };
    funding: {
        collectionEfficiency: number; // e.g., 0.85
        covenantHardStop: boolean;
        minProgressCovenant: number; // e.g., 0.20
    };
    threats: ManualThreat[];
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
    market: {
        volatilityClass: 'med',
        inflationExpectation: 0.06,
        fxExposurePct: 0.0,
    },
    execution: {
        scheduleConfidence: 0.7,
        contractorRisk: 'reliable',
        rainSeasonMonths: [6, 7, 8, 9], // Jun-Sep
    },
    funding: {
        collectionEfficiency: 0.90,
        covenantHardStop: false,
        minProgressCovenant: 0.20,
    },
    threats: [],
};

// ============================================================================
// EARLY WARNING SYSTEM
// ============================================================================

export type WarningLevel = 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';

export interface EarlyWarning {
    id: string;
    level: WarningLevel;
    title: string;
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
}

// ============================================================================
// CURRENT MONTH ACTUALS (NOW-CAST INPUT)
// ============================================================================

export const CurrentMonthActualsSchema = z.object({
    currentMonth: z.string(), // YYYY-MM (auto-filled from asOfMonth, editable)
    actualPaidToDate: z.object({
        SERVICE: z.number().min(0).default(0),
        MATERIAL: z.number().min(0).default(0),
        INFRA: z.number().min(0).default(0),
    }),
    elapsedProgress: z.number().min(0).max(1).default(0), // 0.0 to 1.0
    commitmentsToDate: z.object({
        SERVICE: z.number().min(0).optional(),
        MATERIAL: z.number().min(0).optional(),
        INFRA: z.number().min(0).optional(),
    }).optional(),

    // EVM Fields for 3-Month Warning
    committedPOValue: z.number().min(0).default(0), // Total value of signed POs
    physicalProgressPct: z.number().min(0).max(1).default(0), // Verified site progress
    plannedProgressPct: z.number().min(0).max(1).default(0), // Planned schedule progress
    estimateToComplete: z.number().min(0).default(0), // Remaining cash needed
});

export type CurrentMonthActuals = z.infer<typeof CurrentMonthActualsSchema>;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

export const OutflowEntrySchema = z.record(
    z.string(), // month (YYYY-MM)
    z.record(
        z.string(), // entity
        z.record(
            z.string(), // activity
            z.record(ComponentType, z.number())
        )
    )
);

export type OutflowData = z.infer<typeof OutflowEntrySchema>;

export const DeptAllocationSchema = z.record(
    z.string(), // month
    z.record(DeptType, z.number())
);

export type DeptAllocation = z.infer<typeof DeptAllocationSchema>;

// ============================================================================
// SIMULATION INPUT (WORKER CONTRACT)
// ============================================================================

export interface SimulationInput {
    config: ProjectConfig;
    policyConfig: PolicyConfig;
    allocations: DeptAllocation;
    actualAllocations: DeptAllocation;
    plannedOutflows: OutflowData;
    actualOutflows: OutflowData;
    currentMonthActuals?: CurrentMonthActuals;
    volatilityFactor: number;
    corrStrength: number;
    iterations: number;
    seed: number;
    activeScenarios?: string[];
}

// ============================================================================
// SCENARIO ACTIONS
// ============================================================================

export interface ScenarioAction {
    id: string;
    title: string;
    owner: 'Procurement' | 'Planning' | 'Governance' | 'Finance';
    leadTime: 'Immediate' | '2 Weeks' | '1 Month';
    effort: 'Low' | 'Medium' | 'High';
    target: {
        entities?: string[];
        activities?: string[];
        components?: ComponentType[];
        months?: string[];
    };
    lever: {
        type: 'VOLATILITY_REDUCTION' | 'REPHASE' | 'CAP_DEPT' | 'EFFICIENCY_GAIN' | 'LAG_REDUCTION' | 'SCOPE_CAP';
        value: number; // e.g., 0.8 for 20% reduction
        targetMonth?: string;
    };
    impact?: {
        deltaStoppageRisk: number;
        deltaP80Shortfall: number;
        deltaGapTotal: number;
    };
}

// ============================================================================
// RISK PARAMS (ENGINE CONFIG)
// ============================================================================

export interface RiskParams {
    invoiceLag?: {
        service?: { p0: number; p1: number };
        material?: { p1: number; p2: number };
        infra?: { p0: number; p1: number; p2: number };
    };
    materialVol?: {
        sigmaMarket: number;
        sigmaIdio: number;
        marketWeight: number;
        dist: "lognormal" | "student-t";
        clampMax?: number; // Max multiplier to prevent outliers
    };
    overrun?: {
        mean: number;
        sigma: number;
        clampMax?: number;
    };
    scopeDrift?: {
        mean: number;
        sigma: number;
        cap?: number;
    };
    reserve?: {
        enabled: boolean;
        total: number;
        monthlyCap: number;
    };
}

// ============================================================================
// SIMULATION RESULTS (OUTPUT CONTRACT)
// ============================================================================

export interface MonthlyStats {
    month: string;
    isHistorical: boolean;
    plannedAllocation: number;

    // Inflows
    realizableInflowP10: number;
    realizableInflowP20: number;
    realizableInflowP50: number;
    realizableInflowP80: number;
    realizableInflowP90: number;

    // Outflows (Cash)
    plannedOutflowTotal: number;
    cashOutflowP50: number;
    cashOutflowP80: number;

    // Demand (Incurred)
    demandP50: number;
    demandP80: number;

    // Liquidity & Breach
    shortfallP50: number;
    shortfallP80: number;
    shortfallExpected: number;
    shortfallProb: number;
    coverageProb: number;
    safeSpendLimit: number;
    gapToFix: number;

    // Payables Backlog (NEW)
    payablesBacklogP50: number;
    payablesBacklogP80: number;
    payablesBacklogExpected: number;

    // Schedule Debt
    scheduleDebtP50: number;
    scheduleDebtP80: number;
    scheduleDebtExpected: number;
    deferredCostExpected: number;

    // Throttle (NEW - for diagnostics)
    throttlePctExpected: number;
}

export interface NowCastResults {
    eomCashDueP50: number;
    eomCashDueP80: number;
    probExceedPlan: number;
    topDrivers: Array<{
        component: ComponentType;
        contribution: number;
        label: string;
    }>;
    recommendedActions: Array<{
        id: string;
        title: string;
        impact: string;
    }>;
    debugMetaData?: {
        plannedTotal: number;
        avgSimulatedMonthTotal: number;
    };
}

export interface BreachRadarResults {
    earliestBreachMonthP50: string | null;
    earliestBreachMonthP80: string | null;
    timeToBreachP50: number | null; // months from now
    timeToBreachP80: number | null;
    breachDistribution: Array<{ month: string; probability: number }>;
}

export interface ValidationFlags {
    lagConservation: boolean;
    carryForwardNonNegative: boolean;
    backlogNonNegative: boolean;
    scheduleDebtMonotonic: boolean;
    clampingOccurred: boolean;
    clampingDetails?: string[];
}

export interface Diagnostics {
    horizonMonths: number;
    plannedTotalEngInflow: number;
    plannedTotalEngOutflow: number;
    simTotalEngInflowP50: number;
    sumMonthlyP50: number;
    choleskySuccess: boolean;
    seed: number;
    validationFlags: ValidationFlags;
    monthlyThrottlePct: Record<string, number>; // month -> expected throttlePct
    monthlyBacklogCarried: Record<string, number>; // month -> expected backlog
}

export interface SimulationResults {
    monthlyStats: MonthlyStats[];

    kpis: {
        totalRealizableInflowP10: number;
        totalRealizableInflowP50: number;
        totalRealizableInflowP90: number;
        probShortfallAnyMonth: number;
        probMeetPlan: number;

        worstMonth: {
            month: string;
            prob: number;
            amount: number;
        };

        // Horizon Metrics
        peakScheduleDebt: number;
        peakScheduleDebtP80: number;
        peakPayablesBacklogP80: number;
        totalDeferredCost: number;
        redMonthsCount: number;

        primaryDriver: {
            key: string;
            contribution: number;
        };

        // Decision Metrics
        monthlyCoverageProb: Record<string, number>;
        monthlyShortfallP80: Record<string, number>;
        monthlyShortfallProb: Record<string, number>;

        // Driver Attribution
        topDrivers: Array<{
            name: string;
            contribution: number;
            lever: string;
            impactOnShortfall: number;
            impactOnBacklog: number;
            impactOnScheduleDebt: number;
        }>;
        topCauses?: Array<{ name: string; contribution: number }>;

        diagnostics: Diagnostics;
    };

    // Control Room Extensions
    nowCast?: NowCastResults;
    breachRadar?: BreachRadarResults;

    // Early Warning System
    earlyWarnings?: EarlyWarning[];
}

// ============================================================================
// ACTION PORTFOLIOS (NEW)
// ============================================================================

export interface PortfolioStep {
    id: string;
    title: string;
    description: string;
    lever: ScenarioAction['lever'];
    appliedToMonths?: string[];
}

export interface ActionPortfolio {
    id: string;
    name: 'Min Disruption' | 'Cash Smoothing' | 'Risk Elimination';
    description: string;
    steps: PortfolioStep[];
    deltas?: {
        deltaRedMonths: number;
        deltaWorstShortfallP80: number;
        deltaTimeToBreachP80: number | null;
        deltaPeakScheduleDebtP80: number;
        deltaPeakPayablesBacklogP80: number;
    };
}

export interface TriggerSuggestion {
    id: string;
    condition: string;
    threshold: number;
    action: string;
    portfolioId: string;
    stepId: string;
}

