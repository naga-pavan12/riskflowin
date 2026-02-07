import { z } from 'zod';

export const ComponentType = z.enum(['SERVICE', 'MATERIAL', 'INFRA']);
export type ComponentType = z.infer<typeof ComponentType>;

export const DeptType = z.enum(['ENGINEERING', 'MARKETING', 'OTHERS']);
export type DeptType = z.infer<typeof DeptType>;

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
        type: 'VOLATILITY_REDUCTION' | 'REPHASE' | 'CAP_DEPT' | 'EFFICIENCY_GAIN';
        value: number; // e.g., 0.8 for 20% reduction
        targetMonth?: string;
    };
    impact?: {
        deltaStoppageRisk: number;
        deltaP80Shortfall: number;
        deltaGapTotal: number;
    };
}

export interface RiskParams {
    invoiceLag?: {
        service?: { p0: number; p1: number };
        material?: { p1: number; p2: number };
        infra?: { p0: number; p1: number; p2: number };
    };
    materialVol?: { sigmaMarket: number; sigmaIdio: number; marketWeight: number; dist: "lognormal" | "student-t" };
    overrun?: { mean: number; sigma: number };
    scopeDrift?: { mean: number; sigma: number; cap?: number };
    reserve?: { enabled: boolean; total: number; monthlyCap: number };
    breachPolicy?: { mode: "defer" | "shortfall"; deferFriction: number };
}

export interface SimulationResults {
    monthlyStats: Array<{
        month: string;
        isHistorical: boolean;
        plannedAllocation: number;
        // Inflows
        realizableInflowP10: number;
        realizableInflowP20: number; // For SafeSpendLimit (benchmarked on Eng Inflow + CarryForward)
        realizableInflowP50: number;
        realizableInflowP80: number;
        realizableInflowP90: number;
        // Outflows (Cash)
        plannedOutflowTotal: number;
        cashOutflowP50: number; // New: Cash outflow after lag
        cashOutflowP80: number;
        // Demand (Incurred)
        demandP50: number; // Incurred cost (work done)
        demandP80: number;
        // Liquidity & Breach
        shortfallP50: number;
        shortfallP80: number;
        shortfallExpected: number;
        shortfallProb: number;
        coverageProb: number;
        safeSpendLimit: number; // P20 of Realizable Eng Inflow
        gapToFix: number;
        // New: Schedule Debt / Deferral
        scheduleDebtP50: number;
        deferredCostExpected: number;
    }>;
    kpis: {
        totalRealizableInflowP10: number;
        totalRealizableInflowP50: number;
        totalRealizableInflowP90: number;
        probShortfallAnyMonth: number;
        probMeetPlan: number; // PR(Total Realizable >= Total Planned)
        worstMonth: {
            month: string;
            prob: number;
            amount: number;
        };
        // New Horizon Metrics
        peakScheduleDebt: number;
        totalDeferredCost: number;
        redMonthsCount: number;

        primaryDriver: {
            key: string;
            contribution: number;
        };
        // New decision-driven metrics
        monthlyCoverageProb: Record<string, number>;
        monthlyShortfallP80: Record<string, number>;
        monthlyShortfallProb: Record<string, number>;
        topDrivers: { name: string; contribution: number; lever: string }[]; // Updated labels (Invoice Lag, Volatility, etc.)
        topCauses?: { name: string; contribution: number }[];
        diagnostics?: {
            horizonMonths: number;
            plannedTotalEngInflow: number;
            plannedTotalEngOutflow: number;
            simTotalEngInflowP50: number;
            sumMonthlyP50: number;
            choleskySuccess: boolean;
            seed: number;
        };
    };
}
