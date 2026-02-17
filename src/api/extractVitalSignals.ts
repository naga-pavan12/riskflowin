/**
 * Extract Vital Signals — Bridge Layer
 * 
 * Converts CurrentMonthActuals + VitalSignsInput from ProjectContext
 * into SignalData[] that the God Mode worker can consume directly.
 * 
 * This is the "LIVE" mode data source — no mock generator involved.
 */

import type { CurrentMonthActuals, VitalSignsInput } from '../types';
import type { SignalData, RiskVector, SignalTrend } from '../types/godMode';

// ============================================================================
// DEFAULTS (when user hasn't filled the Pulse Check form yet)
// ============================================================================

const DEFAULT_VITAL_SIGNS: VitalSignsInput = {
    activeWorkerCount: 200,
    openDefectCount: 3,
    avgVendorPaymentDelay: 15,
    unbilledWorkValue: 5,
    advanceRemainingPct: 70,
    criticalMaterialStockDays: 30,
    materialLeadTimeDelay: 2,
    indentApprovalDays: 1,
    drawingsPendingPct: 5,
    methodStatementsPendingPct: 3,
    idleFrontsPct: 5,
};

// ============================================================================
// VECTOR MAPPING
// ============================================================================

interface VectorMapping {
    vector: RiskVector;
    unit: string;
    getValue: (vs: VitalSignsInput, actuals: CurrentMonthActuals) => number;
    /** Threshold above which the trend is DEGRADING (for bad-is-high vectors) */
    degradeThreshold?: number;
    /** Threshold below which the trend is DEGRADING (for bad-is-low vectors) */
    degradeBelowThreshold?: number;
    meta?: SignalData['meta'];
}

const VECTOR_MAP: VectorMapping[] = [
    {
        vector: 'VELOCITY',
        unit: '%',
        getValue: (_vs, actuals) => (actuals.physicalProgressPct || 0) * 100,
        degradeBelowThreshold: 50,
    },
    {
        vector: 'RESOURCE_DENSITY',
        unit: 'workers',
        getValue: (vs) => vs.activeWorkerCount,
        degradeBelowThreshold: 100,
    },
    {
        vector: 'REWORK_BURDEN',
        unit: 'DQNs',
        getValue: (vs) => vs.openDefectCount,
        degradeThreshold: 10,
    },
    {
        vector: 'VENDOR_AGING',
        unit: 'days',
        getValue: (vs) => vs.avgVendorPaymentDelay,
        degradeThreshold: 30,
        meta: { vendor: 'All Vendors' },
    },
    {
        vector: 'UNBILLED_ASSET',
        unit: '₹Cr',
        getValue: (vs) => vs.unbilledWorkValue,
        degradeThreshold: 20,
    },
    {
        vector: 'ADVANCE_BURN',
        unit: '%',
        getValue: (vs) => vs.advanceRemainingPct,
        degradeBelowThreshold: 30,
    },
    {
        vector: 'BURN_RATE',
        unit: 'days stock',
        getValue: (vs) => vs.criticalMaterialStockDays > 0
            ? Math.round(100 / vs.criticalMaterialStockDays)  // Derive burn rate from stock days
            : 0,
        degradeThreshold: 10,
        meta: { material: 'Critical Materials' },
    },
    {
        vector: 'LEAD_TIME_VAR',
        unit: 'days',
        getValue: (vs) => vs.materialLeadTimeDelay,
        degradeThreshold: 5,
    },
    {
        vector: 'INDENT_LATENCY',
        unit: 'days',
        getValue: (vs) => vs.indentApprovalDays,
        degradeThreshold: 4,
    },
    {
        vector: 'DRAWING_GAP',
        unit: '%',
        getValue: (vs) => vs.drawingsPendingPct,
        degradeThreshold: 15,
    },
    {
        vector: 'METHODOLOGY_GAP',
        unit: '%',
        getValue: (vs) => vs.methodStatementsPendingPct,
        degradeThreshold: 15,
    },
    {
        vector: 'WORK_FRONT_GAP',
        unit: '%',
        getValue: (vs) => vs.idleFrontsPct,
        degradeThreshold: 20,
    },
];

// ============================================================================
// TREND DETECTION
// ============================================================================

function detectTrend(value: number, mapping: VectorMapping): SignalTrend {
    if (mapping.degradeThreshold !== undefined) {
        // Bad-is-high vectors (aging, defects, gaps)
        return value >= mapping.degradeThreshold ? 'DEGRADING' : 'STABLE';
    }
    if (mapping.degradeBelowThreshold !== undefined) {
        // Bad-is-low vectors (velocity, density, advance)
        return value <= mapping.degradeBelowThreshold ? 'DEGRADING' : 'STABLE';
    }
    return 'STABLE';
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Extracts a SignalData[] snapshot from manual CurrentMonthActuals inputs.
 * 
 * Returns 12 SignalData entries (one per vector) dated "today".
 * The God Mode worker consumes this identically to mock-generated data.
 */
export function extractVitalSignals(actuals: CurrentMonthActuals): SignalData[] {
    const vs = actuals.vitalSigns || DEFAULT_VITAL_SIGNS;
    const today = new Date().toISOString().split('T')[0];

    return VECTOR_MAP.map(mapping => {
        const value = mapping.getValue(vs, actuals);
        const trend = detectTrend(value, mapping);

        return {
            date: today,
            vector: mapping.vector,
            value,
            trend,
            unit: mapping.unit,
            meta: mapping.meta || {},
        };
    });
}

/**
 * Check if the user has filled out at least some vital signs.
 */
export function hasVitalSigns(actuals?: CurrentMonthActuals): boolean {
    if (!actuals?.vitalSigns) return false;
    const vs = actuals.vitalSigns;
    // Check if at least one field has a non-zero value
    return vs.activeWorkerCount > 0
        || vs.openDefectCount > 0
        || vs.avgVendorPaymentDelay > 0;
}
