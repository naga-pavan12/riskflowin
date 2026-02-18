import { PulseState } from '../types';
import { RiskClassificationResult } from '../types/risk';

// Default Risk State (Neutral)
export const DEFAULT_RISK: RiskClassificationResult = {
    risk_probability: 0.5,
    risk_label: 'MEDIUM',
    feature_importance: {},
    top_risk_driver: 'PENDING',
    stress_breakdown: { liquidity: 0.33, quality: 0.33, execution: 0.34 },
    method: 'heuristic'
};

/**
 * Optimistic Heuristic Calculator
 * Provides immediate feedback based on Pulse State.
 */
export function calculateHeuristicRisk(pulse: PulseState): RiskClassificationResult {
    let score = 0.5; // Base Baseline

    // Labor Penalties
    if (pulse.laborStability === 'Fluctuating') score += 0.15;
    if (pulse.laborStability === 'Critical') score += 0.3;

    // Material Penalties
    if (pulse.materialAvailability === 'Partial') score += 0.15;
    if (pulse.materialAvailability === 'Scarce') score += 0.3;

    // Design Penalties
    if (pulse.designGaps === 'Minor') score += 0.1;
    if (pulse.designGaps === 'Major') score += 0.25;

    // Clamp
    score = Math.min(Math.max(score, 0.1), 0.99);

    let label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (score >= 0.8) label = 'CRITICAL';
    else if (score >= 0.6) label = 'HIGH';
    else if (score >= 0.3) label = 'MEDIUM';

    // Identify Driver
    let driver = 'GENERAL_UNCERTAINTY';
    if (pulse.laborStability === 'Critical') driver = 'LABOR_INSTABILITY';
    else if (pulse.materialAvailability === 'Scarce') driver = 'SUPPLY_CHAIN_FAILURE';
    else if (pulse.designGaps === 'Major') driver = 'DESIGN_COORDINATION';

    return {
        risk_probability: score,
        risk_label: label,
        feature_importance: {}, // Empty for heurisitc
        top_risk_driver: driver,
        stress_breakdown: {
            liquidity: 0.2, // Dummy split
            quality: 0.4,
            execution: 0.4
        },
        method: 'heuristic'
    };
}
