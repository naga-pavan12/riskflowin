import { z } from 'zod';

// ============================================================================
// CORE ENUMS
// ============================================================================

export const ComponentType = z.enum(['SERVICE', 'MATERIAL', 'INFRA']);
export type ComponentType = z.infer<typeof ComponentType>;

export const DeptType = z.enum(['ENGINEERING']);
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
// NAVIGATOR EDITION - RISK DOMAIN MODELS (PHASE 1)
// ============================================================================

// 1. CONFIGURATION (The Manual Knobs)
export interface ManualThreat {
    id: string;
    name: string;
    month: number; // 1-based index
    amount: number;
    probability: number; // 0.0 to 1.0
}

export type VolatilityClass = 'low' | 'med' | 'high' | 'critical';
export type ContractorRisk = 'reliable' | 'shaky' | 'high-risk';

export interface RiskConfig {
    market: {
        volatilityClass: VolatilityClass; // low=0.05, med=0.10, high=0.20, critical=0.40
        inflationExpectation: number; // e.g., 0.08
        fxExposurePct: number; // e.g., 0.15
    };
    execution: {
        scheduleConfidence: number; // 0.0 to 1.0
        contractorRisk: ContractorRisk;
        rainSeasonMonths: number[]; // e.g., [6, 7]
    };
    design: {
        completionPct: number; // 0.0 to 1.0
    };
    quality: {
        firstTimeRightPct: number; // 0.0 to 1.0 (rework rate = 1 - this)
    };
    supply: {
        vendorReliability: number; // 0.0 to 1.0
    };
    funding: {
        collectionEfficiency: number; // e.g., 0.85
        covenantHardStop: boolean;
        minProgressCovenant: number; // e.g., 0.20
    };
    limits: { // Operational Constraints
        maxMonthlyBurn: number;       // Max capacity (e.g. 10Cr)
        maxVelocityChange: number;    // Max ramp-up (e.g., 1.2x)
        minLiquidityBuffer: number;   // Panic floor (e.g. 50L)
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
    design: {
        completionPct: 0.85,
    },
    quality: {
        firstTimeRightPct: 0.90,
    },
    supply: {
        vendorReliability: 0.85,
    },
    funding: {
        collectionEfficiency: 0.90,
        covenantHardStop: false,
        minProgressCovenant: 0.20,
    },
    limits: {
        maxMonthlyBurn: 100.0,
        maxVelocityChange: 1.5,
        minLiquidityBuffer: 0.5,
    },
    threats: [],
};

// 1.b INTERNAL RISK PARAMS (For Simulation Engine)
export interface RiskParams {
    invoiceLag?: {
        service: { p0: number; p1: number; p2?: number };
        material: { p1: number; p2: number; p3?: number };
        infra: { p0: number; p1: number; p2?: number };
    };
    materialVol?: {
        sigmaMarket: number;
        sigmaIdio: number;
        marketWeight: number;
        dist: 'lognormal' | 'normal' | 'student-t';
        clampMax: number;
    };
    overrun?: {
        mean: number;
        sigma: number;
        clampMax: number;
    };
    scopeDrift?: {
        mean: number;
        sigma: number;
        cap: number;
    };
    reserve?: {
        enabled: boolean;
        total: number;
        monthlyCap: number;
    };
}

// 2. SIGNALS (The Big Company Inputs)
export interface CurrentMonthActuals {
    currentMonth: number;
    actualPaidToDate: { SERVICE: number; MATERIAL: number; INFRA: number };
    elapsedProgress: number;

    // NEW SIGNALS
    committedPOValue: number;       // Toyota Method (Iceberg Risk)
    physicalProgressPct: number;    // Lockheed Method (Earned Value)
    plannedProgressPct: number;     // Baseline for Covenant
    estimateToComplete: number;     // Unilever Method (Zero-Base Forecast)
    commitmentsToDate?: { SERVICE?: number; MATERIAL?: number; INFRA?: number }; // For input tracking

    // God Mode — Vital Signs ("Pulse Check")
    vitalSigns?: VitalSignsInput;
}

/**
 * Vital Signs input for God Mode vectors.
 * Each field maps to one of the 12 Deep Vector signals.
 * VELOCITY is derived from physicalProgressPct — not input separately.
 */
export interface VitalSignsInput {
    // EXECUTION
    activeWorkerCount: number;              // → RESOURCE_DENSITY
    openDefectCount: number;                // → REWORK_BURDEN

    // FINANCE
    avgVendorPaymentDelay: number;          // → VENDOR_AGING (days)
    unbilledWorkValue: number;              // → UNBILLED_ASSET (₹ Cr)
    advanceRemainingPct: number;            // → ADVANCE_BURN (%)

    // SUPPLY
    criticalMaterialStockDays: number;      // → BURN_RATE (derived)
    materialLeadTimeDelay: number;          // → LEAD_TIME_VAR (days)
    indentApprovalDays: number;             // → INDENT_LATENCY (days)

    // DESIGN & SITE
    drawingsPendingPct: number;             // → DRAWING_GAP (%)
    methodStatementsPendingPct: number;     // → METHODOLOGY_GAP (%)
    idleFrontsPct: number;                  // → WORK_FRONT_GAP (%)
}

// Zod Schema for React Hook Form (Legacy compatibility)
export const CurrentMonthActualsSchema = z.object({
    currentMonth: z.string(),
    actualPaidToDate: z.object({
        SERVICE: z.number().min(0).default(0),
        MATERIAL: z.number().min(0).default(0),
        INFRA: z.number().min(0).default(0),
    }),
    elapsedProgress: z.number().min(0).max(1).default(0),
    commitmentsToDate: z.object({
        SERVICE: z.number().min(0).optional(),
        MATERIAL: z.number().min(0).optional(),
        INFRA: z.number().min(0).optional(),
    }).optional(),
    committedPOValue: z.number().min(0).default(0),
    physicalProgressPct: z.number().min(0).max(1).default(0),
    plannedProgressPct: z.number().min(0).max(1).default(0),
    estimateToComplete: z.number().min(0).default(0),
});

// 3. OUTPUTS (The Intelligence)
export interface EarlyWarning {
    id: string; // Added for rendering lists
    level: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
    title: string; // Added for UI
    message: string;
    metric: string;
    threshold: string;
}

export interface RiskScore {
    month: number;
    score: number; // 0-100
    level: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
    primaryFactor: 'VELOCITY' | 'CAPACITY' | 'LIQUIDITY';
    breakdown: { velocity: number; capacity: number; liquidity: number };
}

export interface RCABreakdown {
    shortfallAmount: number;
    primaryDriver: string;
    drivers: { price: number; usage: number; time: number; funding: number };
}

// ============================================================================
// DATA STRUCTURES (Original)
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
    riskConfig: RiskConfig; // NEW: Passed to worker
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

    // Payables Backlog
    payablesBacklogP50: number;
    payablesBacklogP80: number;
    payablesBacklogExpected: number;

    // Schedule Debt
    scheduleDebtP50: number;
    scheduleDebtP80: number;
    scheduleDebtExpected: number;
    deferredCostExpected: number;

    // Throttle
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

// 4. FLIGHT SIMULATOR (The Visceral Experience)
export interface SamplePath {
    id: number;
    monthlyData: {
        month: string;
        cashOutflow: number;
        shortfall: number;
        scheduleDebt: number;
    }[];
}

export interface SensitivityFactor {
    factor: string;
    change: string;
    impactOnShortfall: number;
    impactOnScore: number;
}

export interface KillChainEvent {
    month: string;
    description: string;
    severity: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
    impactType: 'COST' | 'SCHEDULE' | 'LIQUIDITY';
}

export interface KillChain {
    iterationId: number;
    totalShortfall: number;
    events: KillChainEvent[];
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

    // Early Warning System - The Navigator Edition
    earlyWarnings: EarlyWarning[];
    riskScores: RiskScore[];
    rca?: RCABreakdown;
    narrative?: string;

    // Flight Simulator Extensions
    samplePaths?: SamplePath[];
    sensitivityAnalysis?: SensitivityFactor[];
    killChain?: KillChain;
}

// ============================================================================
// ACTION PORTFOLIOS
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

// ============================================================================
// PULSE RAIL (UNIFIED RISK ARCHITECTURE)
// ============================================================================

export type LaborStability = 'Stable' | 'Fluctuating' | 'Critical';
export type MaterialAvailability = 'Full' | 'Partial' | 'Scarce';
export type DesignGaps = 'None' | 'Minor' | 'Major';

export interface PulseFinancials {
    targetValue: number;    // Internal Plan
    achievedValue: number;  // Recorded Actuals
    heldAmount: number;     // Amount on Hold
    unbilledAmount: number; // WIP not yet billed
}

export interface PulseState {
    laborStability: LaborStability;
    materialAvailability: MaterialAvailability;
    designGaps: DesignGaps;
    financials: PulseFinancials;
}

export const DEFAULT_PULSE_STATE: PulseState = {
    laborStability: 'Stable',
    materialAvailability: 'Full',
    designGaps: 'None',
    financials: {
        targetValue: 0,
        achievedValue: 0,
        heldAmount: 0,
        unbilledAmount: 0
    }
};
