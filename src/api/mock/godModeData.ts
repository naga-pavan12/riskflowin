/**
 * God Mode — Mock Data Generator
 * 
 * Simulates the "Deep Vector Signals" from ERP modules.
 * 3 Scenarios: HEALTHY, STRESSED, CRITICAL
 * 
 * Each scenario generates all 12 vectors with realistic correlations:
 * - Liquidity-Morale Spiral (Aging → Resource Drop)
 * - Quality Trap (Speed → Rework)
 * - Supply Chain Stop (Burn Rate × Lead Time > Inventory)
 */

import type { SignalData, GodModeScenario, RiskVector, SignalTrend } from '../../types/godMode';

// ============================================================================
// VECTOR DEFINITIONS (baseline ranges)
// ============================================================================

interface VectorProfile {
    vector: RiskVector;
    unit: string;
    healthy: { value: number; trend: SignalTrend };
    stressed: { value: number; trend: SignalTrend };
    critical: { value: number; trend: SignalTrend };
    meta?: SignalData['meta'];
}

const VECTOR_PROFILES: VectorProfile[] = [
    {
        vector: 'VELOCITY',
        unit: 'units/day',
        healthy: { value: 95, trend: 'STABLE' },
        stressed: { value: 72, trend: 'DEGRADING' },
        critical: { value: 38, trend: 'DEGRADING' },
        meta: { entity: 'Tower A' }
    },
    {
        vector: 'RESOURCE_DENSITY',
        unit: '%',
        healthy: { value: 92, trend: 'STABLE' },
        stressed: { value: 65, trend: 'DEGRADING' },
        critical: { value: 40, trend: 'DEGRADING' },
        meta: { entity: 'Tower A' }
    },
    {
        vector: 'REWORK_BURDEN',
        unit: 'DQNs',
        healthy: { value: 2, trend: 'STABLE' },
        stressed: { value: 12, trend: 'DEGRADING' },
        critical: { value: 35, trend: 'DEGRADING' },
        meta: { entity: 'Block C' }
    },
    {
        vector: 'VENDOR_AGING',
        unit: 'days',
        healthy: { value: 18, trend: 'IMPROVING' },
        stressed: { value: 48, trend: 'DEGRADING' },
        critical: { value: 72, trend: 'DEGRADING' },
        meta: { vendor: 'Civil_Contractor_X' }
    },
    {
        vector: 'UNBILLED_ASSET',
        unit: '₹Cr',
        healthy: { value: 8, trend: 'STABLE' },
        stressed: { value: 25, trend: 'DEGRADING' },
        critical: { value: 52, trend: 'DEGRADING' },
    },
    {
        vector: 'ADVANCE_BURN',
        unit: '%',
        healthy: { value: 65, trend: 'STABLE' },
        stressed: { value: 30, trend: 'DEGRADING' },
        critical: { value: 8, trend: 'DEGRADING' },
        meta: { vendor: 'Steel_Supplier_Y' }
    },
    {
        vector: 'BURN_RATE',
        unit: 'MT/day',
        healthy: { value: 45, trend: 'STABLE' },
        stressed: { value: 62, trend: 'DEGRADING' },
        critical: { value: 85, trend: 'DEGRADING' },
        meta: { material: 'Steel' }
    },
    {
        vector: 'LEAD_TIME_VAR',
        unit: 'days',
        healthy: { value: 2, trend: 'STABLE' },
        stressed: { value: 8, trend: 'DEGRADING' },
        critical: { value: 18, trend: 'DEGRADING' },
        meta: { material: 'Cement' }
    },
    {
        vector: 'INDENT_LATENCY',
        unit: 'days',
        healthy: { value: 1.5, trend: 'STABLE' },
        stressed: { value: 4, trend: 'DEGRADING' },
        critical: { value: 9, trend: 'DEGRADING' },
    },
    {
        vector: 'DRAWING_GAP',
        unit: '%',
        healthy: { value: 5, trend: 'IMPROVING' },
        stressed: { value: 22, trend: 'DEGRADING' },
        critical: { value: 45, trend: 'DEGRADING' },
        meta: { entity: 'Tower B' }
    },
    {
        vector: 'METHODOLOGY_GAP',
        unit: '%',
        healthy: { value: 3, trend: 'STABLE' },
        stressed: { value: 18, trend: 'DEGRADING' },
        critical: { value: 40, trend: 'DEGRADING' },
    },
    {
        vector: 'WORK_FRONT_GAP',
        unit: '%',
        healthy: { value: 8, trend: 'STABLE' },
        stressed: { value: 30, trend: 'DEGRADING' },
        critical: { value: 55, trend: 'DEGRADING' },
        meta: { entity: 'Site Zone 3' }
    },
];

// ============================================================================
// TIME-SERIES GENERATOR
// ============================================================================

function jitter(base: number, pct: number = 0.08): number {
    const noise = (Math.random() - 0.5) * 2 * pct * base;
    return Math.max(0, +(base + noise).toFixed(1));
}

/**
 * Generate 30-day time-series for a single vector.
 */
function generateTimeSeries(
    profile: VectorProfile,
    scenario: GodModeScenario,
    days: number = 30
): SignalData[] {
    const config = profile[scenario.toLowerCase() as 'healthy' | 'stressed' | 'critical'];
    const series: SignalData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Simulate a drift: values get worse towards end in STRESSED/CRITICAL
        let progression = 1;
        if (scenario === 'STRESSED') {
            progression = 0.85 + (i / days) * 0.3; // Gets 15% worse over 30 days
        } else if (scenario === 'CRITICAL') {
            progression = 0.7 + (i / days) * 0.6; // Gets 30% worse over 30 days
        }

        // For "bad-is-high" vectors (Aging, Rework, Gaps), invert the drift
        const badIsHigh = ['VENDOR_AGING', 'REWORK_BURDEN', 'LEAD_TIME_VAR', 'INDENT_LATENCY',
            'DRAWING_GAP', 'METHODOLOGY_GAP', 'WORK_FRONT_GAP', 'UNBILLED_ASSET', 'BURN_RATE'].includes(profile.vector);

        let value: number;
        if (badIsHigh) {
            value = jitter(config.value * (2 - progression), 0.1);
        } else {
            value = jitter(config.value * progression, 0.1);
        }

        series.push({
            date: date.toISOString().split('T')[0],
            vector: profile.vector,
            value,
            trend: config.trend,
            unit: profile.unit,
            meta: profile.meta || {},
        });
    }

    return series;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Generate all 12 Deep Vector signals for a given scenario.
 * Returns 12 × 30 = 360 signal data points.
 */
export function generateProjectVitalSigns(scenario: GodModeScenario): SignalData[] {
    const allSignals: SignalData[] = [];

    for (const profile of VECTOR_PROFILES) {
        allSignals.push(...generateTimeSeries(profile, scenario));
    }

    return allSignals;
}

/**
 * Get the latest snapshot (most recent value per vector).
 */
export function getLatestSnapshot(signals: SignalData[]): SignalData[] {
    const latest = new Map<RiskVector, SignalData>();

    for (const s of signals) {
        const existing = latest.get(s.vector);
        if (!existing || s.date > existing.date) {
            latest.set(s.vector, s);
        }
    }

    return Array.from(latest.values());
}
