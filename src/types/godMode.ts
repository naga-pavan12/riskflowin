/**
 * God Mode — Deep Vector Risk Engine Types
 * 
 * 12 "Deep Vector" signals from ERP modules (mocked in Phase 1).
 * Causal Inference Engine consumes these to produce Interventions.
 */

// ============================================================================
// RISK VECTORS (12 Deep Signals)
// ============================================================================

export type RiskVector =
    | 'VELOCITY'           // Work Logs: Output/Day
    | 'RESOURCE_DENSITY'   // Manpower: Count/Front
    | 'REWORK_BURDEN'      // Quality: Open DQNs
    | 'VENDOR_AGING'       // Finance: Avg Days Overdue
    | 'UNBILLED_ASSET'     // Contract: Work Done vs Certified
    | 'ADVANCE_BURN'       // Finance: Remaining Advance %
    | 'BURN_RATE'          // Material: Consumption/Day
    | 'LEAD_TIME_VAR'      // Supply Chain: Promised vs Actual (days)
    | 'INDENT_LATENCY'     // Admin: Approval Time (days)
    | 'DRAWING_GAP'        // Design: GFC Status (% pending)
    | 'METHODOLOGY_GAP'    // Quality: Method Statement Status (% pending)
    | 'WORK_FRONT_GAP';    // Site: Idle Fronts (%)

export type SignalTrend = 'STABLE' | 'DEGRADING' | 'IMPROVING';

export interface SignalData {
    date: string;               // ISO date string
    vector: RiskVector;
    value: number;              // Normalized 0-100 or domain-specific unit
    trend: SignalTrend;
    unit: string;               // e.g., "days", "%", "units/day"
    meta: {
        entity?: string;          // e.g., "Tower A"
        vendor?: string;          // e.g., "L&T"
        material?: string;        // e.g., "Steel"
    };
}

// ============================================================================
// INTERVENTIONS (Causal Engine Output)
// ============================================================================

export type InterventionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type InterventionType = 'BLOCKER' | 'ACTION' | 'ALERT';
export type InterventionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Intervention {
    id: string;
    timestamp: string;
    severity: InterventionSeverity;
    type: InterventionType;
    title: string;
    message: string;
    rootCause: RiskVector[];
    causalChain: string;         // e.g., "SLOW_DEATH", "QUALITY_TRAP", "SUPPLY_STOP"
    autoAction?: string;         // e.g., "Draft PO", "Block Payment"
    status: InterventionStatus;
    confidence: number;          // 0-1, how confident the engine is
}

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

export type HealthGrade = 'GREEN' | 'AMBER' | 'RED' | 'BLACK';

export interface SystemHealth {
    overallScore: number;       // 0-100
    grade: HealthGrade;
    vectorScores: Record<RiskVector, number>; // Per-vector health 0-100
}

// ============================================================================
// SCENARIO
// ============================================================================

export type GodModeScenario = 'HEALTHY' | 'STRESSED' | 'CRITICAL';

// ============================================================================
// STORE STATE
// ============================================================================

export interface GodModeState {
    scenario: GodModeScenario;
    signals: SignalData[];
    interventions: Intervention[];
    systemHealth: SystemHealth | null;
    isRunning: boolean;
    lastRunAt: string | null;
}

// ============================================================================
// WORKER MESSAGES
// ============================================================================

export interface GodModeWorkerInput {
    signals: SignalData[];
}

export interface GodModeWorkerOutput {
    interventions: Intervention[];
    systemHealth: SystemHealth;
}

// ============================================================================
// ML SERVICE INSIGHTS (from risk-ml-service API)
// ============================================================================

export interface MLInsights {
    risk: {
        risk_probability: number;
        risk_label: string;
        feature_importance: Record<string, number>;
        top_risk_driver: string;
        stress_breakdown: { liquidity: number; quality: number; execution: number };
        method: string;
    } | null;
    solvency: {
        p10: number;
        p50: number;
        p90: number;
        dominant_attention: string;
        attention_weights: Record<string, number>;
        confidence: number;
        method: string;
    } | null;
    serviceOnline: boolean;
}

