/**
 * God Mode — Causal Inference Engine (Web Worker)
 * 
 * Runs 3 Causal Chains on the Deep Vector signals:
 * 1. "Slow Death" (Finance → Labor → Schedule)
 * 2. "Quality Trap" (Speed → Defect → Rework)
 * 3. "Supply Stop" (Inventory → Lead Time)
 * 
 * Also computes a System Health score (0-100).
 */

import type {
    SignalData,
    RiskVector,
    Intervention,
    SystemHealth,
    HealthGrade,
    GodModeWorkerInput,
    GodModeWorkerOutput
} from '../types/godMode';

// ============================================================================
// HELPERS
// ============================================================================

function latestValue(signals: SignalData[], vector: RiskVector): SignalData | null {
    const filtered = signals.filter(s => s.vector === vector);
    if (filtered.length === 0) return null;
    return filtered.reduce((latest, s) => s.date > latest.date ? s : latest, filtered[0]);
}

function makeId(): string {
    return `INT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

function now(): string {
    return new Date().toISOString();
}

// ============================================================================
// CAUSAL CHAIN 1: "SLOW DEATH" (Finance → Labor → Schedule)
// ============================================================================
// IF VENDOR_AGING > 45 days AND RESOURCE_DENSITY is dropping
// THEN "Walkout Imminent. Recommendation: Direct Payment to Labor."

function checkSlowDeath(signals: SignalData[]): Intervention | null {
    const aging = latestValue(signals, 'VENDOR_AGING');
    const density = latestValue(signals, 'RESOURCE_DENSITY');

    if (!aging || !density) return null;

    if (aging.value > 45 && density.trend === 'DEGRADING') {
        const isCritical = aging.value > 60 && density.value < 50;

        return {
            id: makeId(),
            timestamp: now(),
            severity: isCritical ? 'CRITICAL' : 'HIGH',
            type: 'BLOCKER',
            title: isCritical ? '🚨 WALKOUT IMMINENT' : '⚠️ Labor Attrition Risk',
            message: isCritical
                ? `Vendor payments overdue by ${aging.value} days. Labor density at ${density.value}%. Workers leaving site. Recommend: Direct Payment to Sub-Contractor Labor immediately.`
                : `Vendor aging at ${aging.value} days with declining staffing (${density.value}%). If aging crosses 60 days, expect walkout within 72 hours.`,
            rootCause: ['VENDOR_AGING', 'RESOURCE_DENSITY'],
            causalChain: 'SLOW_DEATH',
            autoAction: isCritical ? 'Draft Emergency Payment Order' : 'Flag for Finance Review',
            status: 'PENDING',
            confidence: isCritical ? 0.92 : 0.78,
        };
    }

    return null;
}

// ============================================================================
// CAUSAL CHAIN 2: "QUALITY TRAP" (Speed → Defect → Rework)
// ============================================================================
// IF VELOCITY > baseline (rushing) AND REWORK_BURDEN is increasing
// THEN "Quality Blockade. Lock 'Slab Pour' until DQN closure."

function checkQualityTrap(signals: SignalData[]): Intervention | null {
    const velocity = latestValue(signals, 'VELOCITY');
    const rework = latestValue(signals, 'REWORK_BURDEN');
    const methodology = latestValue(signals, 'METHODOLOGY_GAP');

    if (!velocity || !rework) return null;

    // Velocity > 80 (rushing) AND rework increasing
    const isRushing = velocity.value > 80;
    const highRework = rework.value > 15 && rework.trend === 'DEGRADING';
    const methodologyIssue = methodology && methodology.value > 25;

    if (isRushing && highRework) {
        const isCritical = rework.value > 25 && (methodologyIssue || false);

        return {
            id: makeId(),
            timestamp: now(),
            severity: isCritical ? 'CRITICAL' : 'HIGH',
            type: 'BLOCKER',
            title: isCritical ? '🛑 QUALITY BLOCKADE TRIGGERED' : '⚠️ Quality-Speed Mismatch',
            message: isCritical
                ? `${rework.value} open DQNs with velocity at ${velocity.value}%. Method statements ${methodology?.value}% incomplete. BLOCKING: Slab Pour, RCC Work until DQN closure rate improves.`
                : `Velocity pushing at ${velocity.value}% with ${rework.value} open defect notices. Rework cost compounding. Recommend: Slow execution, close DQNs first.`,
            rootCause: ['VELOCITY', 'REWORK_BURDEN', ...(methodologyIssue ? ['METHODOLOGY_GAP' as RiskVector] : [])],
            causalChain: 'QUALITY_TRAP',
            autoAction: isCritical ? 'Block Work Permit — Slab Pour' : 'Issue Quality Alert to Site Engineer',
            status: 'PENDING',
            confidence: isCritical ? 0.88 : 0.72,
        };
    }

    return null;
}

// ============================================================================
// CAUSAL CHAIN 3: "SUPPLY STOP" (Burn Rate × Lead Time > Inventory)
// ============================================================================
// IF BURN_RATE * LEAD_TIME_VAR > threshold
// THEN "Auto-Indent Generated. Stockout predicted in X days."

function checkSupplyStop(signals: SignalData[]): Intervention | null {
    const burnRate = latestValue(signals, 'BURN_RATE');
    const leadTime = latestValue(signals, 'LEAD_TIME_VAR');
    const indent = latestValue(signals, 'INDENT_LATENCY');

    if (!burnRate || !leadTime) return null;

    // Stockout risk = burn_rate * lead_time_variance
    // Higher = worse (more consumption during uncertain delivery)
    const stockoutRisk = burnRate.value * leadTime.value;
    const indentSlow = indent && indent.value > 3;

    if (stockoutRisk > 400) {
        const isCritical = stockoutRisk > 800;
        const daysToStockout = Math.max(1, Math.floor(500 / burnRate.value));

        return {
            id: makeId(),
            timestamp: now(),
            severity: isCritical ? 'CRITICAL' : 'HIGH',
            type: 'ACTION',
            title: isCritical ? '🔴 STOCKOUT IMMINENT' : '🟡 Supply Chain Alert',
            message: isCritical
                ? `Burn rate ${burnRate.value} ${burnRate.unit} with ${leadTime.value}-day delivery variance. Stockout predicted in ${daysToStockout} days. ${indentSlow ? `Indent approval taking ${indent?.value} days — bypassing.` : ''} Auto-Indent generated.`
                : `Material consumption at ${burnRate.value} ${burnRate.unit} with ${leadTime.value}-day lead time variance. Buffer shrinking. Recommend: Pre-order next batch.`,
            rootCause: ['BURN_RATE', 'LEAD_TIME_VAR', ...(indentSlow ? ['INDENT_LATENCY' as RiskVector] : [])],
            causalChain: 'SUPPLY_STOP',
            autoAction: isCritical ? `Auto-Indent: ${burnRate.meta?.material || 'Material'} — ${(burnRate.value * 7).toFixed(0)} units` : 'Generate Purchase Requisition',
            status: 'PENDING',
            confidence: isCritical ? 0.95 : 0.70,
        };
    }

    return null;
}

// ============================================================================
// ADDITIONAL CHECKS (Standalone alerts)
// ============================================================================

function checkStandaloneAlerts(signals: SignalData[]): Intervention[] {
    const interventions: Intervention[] = [];

    // Drawing Gap — Design bottleneck
    const drawingGap = latestValue(signals, 'DRAWING_GAP');
    if (drawingGap && drawingGap.value > 30) {
        interventions.push({
            id: makeId(),
            timestamp: now(),
            severity: 'MEDIUM',
            type: 'ALERT',
            title: '📐 Design Bottleneck',
            message: `${drawingGap.value}% GFC drawings pending for ${drawingGap.meta?.entity || 'site'}. Execution will stall in 2 weeks without design release.`,
            rootCause: ['DRAWING_GAP'],
            causalChain: 'STANDALONE',
            status: 'PENDING',
            confidence: 0.65,
        });
    }

    // Unbilled Asset — Cash trap
    const unbilled = latestValue(signals, 'UNBILLED_ASSET');
    if (unbilled && unbilled.value > 30) {
        interventions.push({
            id: makeId(),
            timestamp: now(),
            severity: 'HIGH',
            type: 'ACTION',
            title: '💰 Unbilled Asset Piling',
            message: `₹${unbilled.value} Cr of work done but not billed. Cash trap growing. Recommend: Fast-track RA Bill submission.`,
            rootCause: ['UNBILLED_ASSET'],
            causalChain: 'STANDALONE',
            autoAction: 'Draft RA Bill for QS Review',
            status: 'PENDING',
            confidence: 0.80,
        });
    }

    // Advance Burn — Running out of advance
    const advance = latestValue(signals, 'ADVANCE_BURN');
    if (advance && advance.value < 15) {
        interventions.push({
            id: makeId(),
            timestamp: now(),
            severity: advance.value < 5 ? 'CRITICAL' : 'MEDIUM',
            type: 'ALERT',
            title: '🏦 Advance Nearly Exhausted',
            message: `Only ${advance.value}% of advance remaining for ${advance.meta?.vendor || 'vendor'}. Next mobilization requires fresh advance release.`,
            rootCause: ['ADVANCE_BURN'],
            causalChain: 'STANDALONE',
            status: 'PENDING',
            confidence: 0.85,
        });
    }

    // Work Front Gap — Idle fronts
    const frontGap = latestValue(signals, 'WORK_FRONT_GAP');
    if (frontGap && frontGap.value > 40) {
        interventions.push({
            id: makeId(),
            timestamp: now(),
            severity: 'MEDIUM',
            type: 'ALERT',
            title: '🚧 Idle Work Fronts',
            message: `${frontGap.value}% of work fronts idle at ${frontGap.meta?.entity || 'site'}. Resources deployed but not producing. Check: Drawings, Material, or Approvals blocking.`,
            rootCause: ['WORK_FRONT_GAP'],
            causalChain: 'STANDALONE',
            status: 'PENDING',
            confidence: 0.60,
        });
    }

    return interventions;
}

// ============================================================================
// SYSTEM HEALTH SCORE
// ============================================================================

const HEALTH_WEIGHTS: Partial<Record<RiskVector, { weight: number; ideal: number; badIsHigh: boolean }>> = {
    'VELOCITY': { weight: 0.15, ideal: 95, badIsHigh: false },
    'RESOURCE_DENSITY': { weight: 0.12, ideal: 95, badIsHigh: false },
    'VENDOR_AGING': { weight: 0.15, ideal: 0, badIsHigh: true },
    'REWORK_BURDEN': { weight: 0.10, ideal: 0, badIsHigh: true },
    'BURN_RATE': { weight: 0.08, ideal: 40, badIsHigh: true },
    'LEAD_TIME_VAR': { weight: 0.08, ideal: 0, badIsHigh: true },
    'DRAWING_GAP': { weight: 0.08, ideal: 0, badIsHigh: true },
    'WORK_FRONT_GAP': { weight: 0.08, ideal: 0, badIsHigh: true },
    'UNBILLED_ASSET': { weight: 0.06, ideal: 0, badIsHigh: true },
    'ADVANCE_BURN': { weight: 0.05, ideal: 80, badIsHigh: false },
    'INDENT_LATENCY': { weight: 0.03, ideal: 1, badIsHigh: true },
    'METHODOLOGY_GAP': { weight: 0.02, ideal: 0, badIsHigh: true },
};

function computeSystemHealth(signals: SignalData[]): SystemHealth {
    const vectorScores: Partial<Record<RiskVector, number>> = {};
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [vec, config] of Object.entries(HEALTH_WEIGHTS)) {
        const vector = vec as RiskVector;
        const signal = latestValue(signals, vector);
        if (!signal) {
            vectorScores[vector] = 50; // Unknown = neutral
            continue;
        }

        let score: number;
        if (config!.badIsHigh) {
            // Lower is better: score = 100 when value=ideal, 0 when value is very high
            score = Math.max(0, Math.min(100, 100 - (signal.value - config!.ideal) * 1.5));
        } else {
            // Higher is better: score = 100 when value=ideal, 0 when value is very low
            score = Math.max(0, Math.min(100, (signal.value / config!.ideal) * 100));
        }

        vectorScores[vector] = Math.round(score);
        weightedSum += score * config!.weight;
        totalWeight += config!.weight;
    }

    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

    let grade: HealthGrade;
    if (overallScore >= 75) grade = 'GREEN';
    else if (overallScore >= 50) grade = 'AMBER';
    else if (overallScore >= 25) grade = 'RED';
    else grade = 'BLACK';

    return {
        overallScore,
        grade,
        vectorScores: vectorScores as Record<RiskVector, number>,
    };
}

// ============================================================================
// WORKER MESSAGE HANDLER
// ============================================================================

self.onmessage = (e: MessageEvent<GodModeWorkerInput>) => {
    const { signals } = e.data;

    // Run all causal chains
    const interventions: Intervention[] = [];

    const slowDeath = checkSlowDeath(signals);
    if (slowDeath) interventions.push(slowDeath);

    const qualityTrap = checkQualityTrap(signals);
    if (qualityTrap) interventions.push(qualityTrap);

    const supplyStop = checkSupplyStop(signals);
    if (supplyStop) interventions.push(supplyStop);

    // Standalone alerts
    interventions.push(...checkStandaloneAlerts(signals));

    // Sort: CRITICAL first, then HIGH, then MEDIUM
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    interventions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Compute system health
    const systemHealth = computeSystemHealth(signals);

    const output: GodModeWorkerOutput = { interventions, systemHealth };
    self.postMessage(output);
};
