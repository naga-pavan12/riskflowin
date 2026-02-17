/**
 * God Mode Store — React Context based
 * 
 * Manages: scenario, signals, interventions, system health, ML insights.
 * 
 * Data pipelines:
 * ┌────────────────────────────────────────────────────────────┐
 * │ SIMULATED mode: mockData → Web Worker → interventions     │
 * │ LIVE mode:      actuals  → Web Worker → interventions     │
 * │                 actuals  → ML Service → mlInsights         │
 * └────────────────────────────────────────────────────────────┘
 * 
 * In LIVE mode, both pipelines fire in parallel:
 * - The Web Worker still generates interventions (local, fast)
 * - The ML Service adds risk classification + solvency projection (remote, richer)
 */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import type {
    GodModeScenario,
    SignalData,
    Intervention,
    SystemHealth,
    GodModeWorkerOutput,
    MLInsights,
} from '../types/godMode';
import type { CurrentMonthActuals, VitalSignsInput } from '../types';
import { generateProjectVitalSigns } from '../api/mock/godModeData';
import { extractVitalSignals } from '../api/extractVitalSignals';
import {
    predictRisk,
    predictSolvency,
    checkMLServiceHealth,
} from '../api/mlService';

// ============================================================================
// TYPES
// ============================================================================

export type GodModeDataSource = 'LIVE' | 'SIMULATED';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface GodModeStore {
    scenario: GodModeScenario;
    dataSource: GodModeDataSource;
    signals: SignalData[];
    interventions: Intervention[];
    systemHealth: SystemHealth | null;
    mlInsights: MLInsights | null;
    isRunning: boolean;
    lastRunAt: string | null;

    // Actions
    setScenario: (s: GodModeScenario) => void;
    setDataSource: (ds: GodModeDataSource) => void;
    runAnalysis: (scenario?: GodModeScenario) => void;
    approveIntervention: (id: string) => void;
    rejectIntervention: (id: string) => void;
}

// ============================================================================
// VITAL SIGNS → ML VECTORS MAPPER
// ============================================================================

function vitalSignsToMLVectors(
    actuals: CurrentMonthActuals,
): Parameters<typeof predictRisk>[0] {
    const vs: VitalSignsInput = actuals.vitalSigns || {
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

    return {
        velocity_pct: (actuals.physicalProgressPct || 0) * 100,
        resource_density: Math.min(100, (vs.activeWorkerCount / 200) * 85),
        rework_count: vs.openDefectCount,
        vendor_aging: vs.avgVendorPaymentDelay,
        unbilled_asset: vs.unbilledWorkValue,
        advance_burn: vs.advanceRemainingPct,
        burn_rate: vs.criticalMaterialStockDays > 0
            ? Math.round(100 / vs.criticalMaterialStockDays)
            : 0,
        lead_time_var: vs.materialLeadTimeDelay,
        indent_latency: vs.indentApprovalDays,
        drawing_gap: vs.drawingsPendingPct,
        methodology_gap: vs.methodStatementsPendingPct,
        work_front_gap: vs.idleFrontsPct,
    };
}

// ============================================================================
// CONTEXT
// ============================================================================

const GodModeContext = createContext<GodModeStore | null>(null);

interface GodModeProviderProps {
    children: React.ReactNode;
    currentMonthActuals?: CurrentMonthActuals;
}

export function GodModeProvider({ children, currentMonthActuals }: GodModeProviderProps) {
    const [scenario, setScenarioState] = useState<GodModeScenario>('STRESSED');
    const [dataSource, setDataSourceState] = useState<GodModeDataSource>('SIMULATED');
    const [signals, setSignals] = useState<SignalData[]>([]);
    const [interventions, setInterventions] = useState<Intervention[]>([]);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [mlInsights, setMlInsights] = useState<MLInsights | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [lastRunAt, setLastRunAt] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const actualsRef = useRef(currentMonthActuals);
    actualsRef.current = currentMonthActuals;

    const runAnalysis = useCallback((overrideScenario?: GodModeScenario) => {
        setIsRunning(true);

        let signalsToProcess: SignalData[];

        if (dataSource === 'LIVE' && actualsRef.current) {
            // LIVE MODE: Extract from real manual inputs
            signalsToProcess = extractVitalSignals(actualsRef.current);
        } else {
            // SIMULATED MODE: Use mock generator
            const activeScenario = overrideScenario || scenario;
            signalsToProcess = generateProjectVitalSigns(activeScenario);
        }

        setSignals(signalsToProcess);

        // ---- Pipeline 1: Local Web Worker (fast, generates interventions) ----
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new Worker(
            new URL('../workers/godMode.worker.ts', import.meta.url),
            { type: 'module' }
        );

        worker.onmessage = (e: MessageEvent<GodModeWorkerOutput>) => {
            setInterventions(e.data.interventions);
            setSystemHealth(e.data.systemHealth);
            setIsRunning(false);
            setLastRunAt(new Date().toISOString());
        };

        worker.onerror = () => {
            setIsRunning(false);
        };

        worker.postMessage({ signals: signalsToProcess });
        workerRef.current = worker;

        // ---- Pipeline 2: Remote ML Service (richer, adds insights) ----
        // Only fires in LIVE mode with real data
        if (dataSource === 'LIVE' && actualsRef.current) {
            const vectors = vitalSignsToMLVectors(actualsRef.current);

            // Fire risk + solvency in parallel
            Promise.all([
                predictRisk(vectors),
                predictSolvency(
                    {
                        budget_cr: 1000, // TODO: read from project config
                        location_tier: 'tier1',
                        months_elapsed: actualsRef.current.currentMonth,
                        months_total: 24,
                    },
                    // Send current vectors as a single-row time series
                    [{ date: new Date().toISOString().split('T')[0], ...vectors }],
                ),
            ]).then(([riskRes, solvencyRes]) => {
                setMlInsights({
                    risk: riskRes.data,
                    solvency: solvencyRes.data,
                    serviceOnline: !riskRes.error && !solvencyRes.error,
                });
            }).catch(() => {
                setMlInsights({
                    risk: null,
                    solvency: null,
                    serviceOnline: false,
                });
            });
        } else {
            // Clear ML insights in SIMULATED mode
            setMlInsights(null);
        }
    }, [scenario, dataSource]);

    const setScenario = useCallback((s: GodModeScenario) => {
        setScenarioState(s);
        setTimeout(() => runAnalysis(s), 50);
    }, [runAnalysis]);

    const setDataSource = useCallback((ds: GodModeDataSource) => {
        setDataSourceState(ds);
        setTimeout(() => runAnalysis(), 50);
    }, [runAnalysis]);

    const approveIntervention = useCallback((id: string) => {
        setInterventions(prev =>
            prev.map(i => i.id === id ? { ...i, status: 'APPROVED' as const } : i)
        );
    }, []);

    const rejectIntervention = useCallback((id: string) => {
        setInterventions(prev =>
            prev.map(i => i.id === id ? { ...i, status: 'REJECTED' as const } : i)
        );
    }, []);

    const value: GodModeStore = {
        scenario, dataSource, signals, interventions, systemHealth,
        mlInsights, isRunning, lastRunAt,
        setScenario, setDataSource, runAnalysis, approveIntervention, rejectIntervention,
    };

    return (
        <GodModeContext.Provider value={value}>
            {children}
        </GodModeContext.Provider>
    );
}

export function useGodModeStore(): GodModeStore {
    const ctx = useContext(GodModeContext);
    if (!ctx) throw new Error('useGodModeStore must be used within GodModeProvider');
    return ctx;
}
