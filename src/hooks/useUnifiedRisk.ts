import { useState, useEffect, useRef, useMemo } from 'react';
import { usePulseContext } from '../store/PulseContext';
import { useProjectStore } from '../store/useProjectStore';
import { predictRisk, RiskClassificationResult } from '../api/mlService';
import { extractVitalSignals } from '../api/extractVitalSignals';
import { PulseState } from '../types';

// Default Risk State (Neutral)
const DEFAULT_RISK: RiskClassificationResult = {
    risk_probability: 0.5,
    risk_label: 'MEDIUM',
    feature_importance: {},
    top_risk_driver: 'PENDING',
    stress_breakdown: { liquidity: 0.33, quality: 0.33, execution: 0.34 },
    method: 'heuristic'
};

/**
 * Optimistic Heuristic Calculator
 * Provides immediate feedback while the ML model crunches numbers.
 */
function calculateHeuristicRisk(pulse: PulseState): RiskClassificationResult {
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
        feature_importance: {}, // Empty for heuristic
        top_risk_driver: driver,
        stress_breakdown: {
            liquidity: 0.2, // Dummy split
            quality: 0.4,
            execution: 0.4
        },
        method: 'heuristic'
    };
}

export function useUnifiedRisk() {
    const { state: pulseState } = usePulseContext();
    const { currentMonthActuals } = useProjectStore();

    // The blended risk state (starts optimistic, settles on ML)
    const [riskProfile, setRiskProfile] = useState<RiskClassificationResult>(DEFAULT_RISK);
    const [isRefining, setIsRefining] = useState(false);

    // Step 1: Extract Vectors from Project Context
    const vectors = useMemo(() => {
        if (!currentMonthActuals) return null;
        const signals = extractVitalSignals(currentMonthActuals);

        // Convert SignalData[] to Dictionary for ML Service
        const vectorDict: Record<string, number> = {};

        // Map: extractVitalSignals keys -> mlService keys
        // Note: mlService.ts expects snake_case keys like 'velocity_pct'
        // extractVitalSignals uses UPPER_CASE keys like 'VELOCITY'

        const keyMap: Record<string, string> = {
            'VELOCITY': 'velocity_pct',
            'RESOURCE_DENSITY': 'resource_density',
            'REWORK_BURDEN': 'rework_count',
            'VENDOR_AGING': 'vendor_aging',
            'UNBILLED_ASSET': 'unbilled_asset',
            'ADVANCE_BURN': 'advance_burn',
            'BURN_RATE': 'burn_rate',
            'LEAD_TIME_VAR': 'lead_time_var',
            'INDENT_LATENCY': 'indent_latency',
            'DRAWING_GAP': 'drawing_gap',
            'METHODOLOGY_GAP': 'methodology_gap',
            'WORK_FRONT_GAP': 'work_front_gap'
        };

        signals.forEach(s => {
            const mlKey = keyMap[s.vector];
            if (mlKey) {
                vectorDict[mlKey] = s.value;
            }
        });

        // Ensure all required keys exist (fallback to 0)
        Object.values(keyMap).forEach(k => {
            if (vectorDict[k] === undefined) vectorDict[k] = 0;
        });

        return vectorDict as any; // Cast to specific type if needed
    }, [currentMonthActuals]);


    // Step 2: Immediate Heuristic Update (Optimistic UI)
    // Run whenever pulseState changes
    useEffect(() => {
        const heuristic = calculateHeuristicRisk(pulseState);
        setRiskProfile(prev => ({
            ...heuristic,
            method: 'heuristic' // Mark as heuristic
        }));
        setIsRefining(true); // Signal that we are refining with ML
    }, [pulseState]);


    // Step 3: Debounced "Snap-to-Truth" (ML Call)
    useEffect(() => {
        if (!vectors) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const pulsePayload = {
            labor_stability: pulseState.laborStability,
            material_availability: pulseState.materialAvailability,
            design_gaps: pulseState.designGaps
        };

        const timer = setTimeout(async () => {
            try {
                // Call ML Service
                const response = await predictRisk(vectors, pulsePayload);

                if (!signal.aborted && !response.error) {
                    setRiskProfile({
                        ...response.data,
                        method: 'xgboost' // Mark as ML verified
                    });
                    setIsRefining(false);
                } else if (!signal.aborted && response.error) {
                    console.warn('[useUnifiedRisk] ML Service failed, keeping heuristic.', response.error_message);
                    setIsRefining(false); // Stop spinning, keep heuristic
                }
            } catch (e) {
                if (!signal.aborted) {
                    console.error('[useUnifiedRisk] API Error', e);
                    setIsRefining(false);
                }
            }
        }, 600); // 600ms debounce

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [pulseState, vectors]); // Re-run when inputs change

    return {
        riskProfile,
        isRefining,
        pulseState // Explicitly return input state for convenience
    };
}
