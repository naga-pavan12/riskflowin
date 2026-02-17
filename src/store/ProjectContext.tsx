import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectConfig, DeptAllocation, OutflowData, SimulationResults, CurrentMonthActuals, RiskConfig } from '../types';
import { DEFAULT_RISK_CONFIG } from '../types';
import { addMonths, format, parse } from 'date-fns';

const STORAGE_KEY = 'riskinflow_pro_v2_store';

const DEFAULT_CONFIG: ProjectConfig = {
    name: 'Legacy Project',
    startMonth: '2025-01',
    asOfMonth: '2025-02', // Grounded to Feb
    durationMonths: 24,
    capTotalCr: 4000,
    protectEngineering: true,
    underspendPolicy: 'ROLLOVER_NEXT_MONTH',
    entities: ['Tower A', 'Tower B', 'Basement 1', 'Infrastructure'],
    activities: ['Shuttering', 'Barbending', 'Concrete', 'Finishing'],
};

// Seed initial data for POC
const SEED_MONTHS = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
const SEED_ALLOCATIONS: DeptAllocation = {};
const SEED_PLANNED: OutflowData = {};

SEED_MONTHS.forEach(m => {
    SEED_ALLOCATIONS[m] = { ENGINEERING: 100 };
    SEED_PLANNED[m] = {
        'Tower A': { 'Concrete': { MATERIAL: 40, SERVICE: 20, INFRA: 5 } },
        'Tower B': { 'Shuttering': { SERVICE: 30, MATERIAL: 10, INFRA: 2 } }
    };
});

// Synchronously load from localStorage before initial render
function loadFromStorage<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed[key] !== undefined) {
                const value = parsed[key];
                if (typeof value === 'object' && value !== null && typeof fallback === 'object' && fallback !== null) {
                    return { ...fallback, ...value };
                }
                return value;
            }
        }
    } catch (e) {
        console.error('Failed to load from storage', e);
    }
    return fallback;
}

function useProjectState() {
    const [config, setConfig] = useState<ProjectConfig>(() => loadFromStorage('config', DEFAULT_CONFIG));
    const [allocations, setAllocations] = useState<DeptAllocation>(() => loadFromStorage('allocations', SEED_ALLOCATIONS));
    const [plannedOutflows, setPlannedOutflows] = useState<OutflowData>(() => loadFromStorage('plannedOutflows', SEED_PLANNED));
    const [engineeringDemand, setEngineeringDemand] = useState<OutflowData>(() => loadFromStorage('engineeringDemand', SEED_PLANNED));
    const [projectedOutflows, setProjectedOutflows] = useState<OutflowData>(() => loadFromStorage('projectedOutflows', SEED_PLANNED));
    const [actualOutflows, setActualOutflows] = useState<OutflowData>(() => loadFromStorage('actualOutflows', SEED_PLANNED)); // Start with seed for demo
    const [actualAllocations, setActualAllocations] = useState<DeptAllocation>(() => loadFromStorage('actualAllocations', SEED_ALLOCATIONS));
    const [activeScenarios, setActiveScenarios] = useState<string[]>([]); // Action IDs
    const [currentMonthActuals, setCurrentMonthActuals] = useState<CurrentMonthActuals | undefined>(() => loadFromStorage('currentMonthActuals', undefined));
    const [results, setResults] = useState<SimulationResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [volatilityFactor, setVolatilityFactor] = useState(1.0);
    const [corrStrength, setCorrStrength] = useState(0.5);
    const [riskConfig, setRiskConfig] = useState<RiskConfig>(() => loadFromStorage('riskConfig', DEFAULT_RISK_CONFIG));
    const [isHydrated, setIsHydrated] = useState(false);

    const workerRef = useRef<Worker | null>(null);

    // Derived Month Keys
    const [months, setMonths] = useState<string[]>([]);

    useEffect(() => {
        const m = [];
        const start = parse(config.startMonth, 'yyyy-MM', new Date());
        for (let i = 0; i < config.durationMonths; i++) {
            m.push(format(addMonths(start, i), 'yyyy-MM'));
        }
        setMonths(m);
    }, [config.startMonth, config.durationMonths]);

    // Initialize Current Month Actuals when config changes
    useEffect(() => {
        setCurrentMonthActuals((prev: CurrentMonthActuals | undefined) => {
            const monthIdx = months.indexOf(config.asOfMonth) + 1;
            // If valid index found (index >= 1), use it. otherwise default to 1.
            const validIdx = monthIdx > 0 ? monthIdx : 1;

            if (prev && prev.currentMonth === validIdx) return prev;
            return {
                currentMonth: validIdx,
                actualPaidToDate: { SERVICE: 0, MATERIAL: 0, INFRA: 0 },
                elapsedProgress: 0.5,
                commitmentsToDate: undefined,
                committedPOValue: 0,
                physicalProgressPct: 0,
                plannedProgressPct: 0,
                estimateToComplete: 0,
            };
        });
    }, [config.asOfMonth, months]);

    // Mark hydration complete after first render
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // ONE-TIME MIGRATION: If engineeringDemand is empty but plannedOutflows has data, use plannedOutflows
    useEffect(() => {
        if (!isHydrated) return;

        const isSeed = (data: OutflowData) => JSON.stringify(data) === JSON.stringify(SEED_PLANNED);

        if (isSeed(engineeringDemand) && !isSeed(plannedOutflows)) {
            console.log('Migrating plannedOutflows to engineeringDemand...');
            setEngineeringDemand(JSON.parse(JSON.stringify(plannedOutflows)));
        }
    }, [isHydrated]); // Run once on hydration

    // Save to LocalStorage (debounced)
    useEffect(() => {
        if (!isHydrated) return;

        const handler = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                config, allocations, plannedOutflows, engineeringDemand, projectedOutflows, actualOutflows, currentMonthActuals, riskConfig
            }));
        }, 1000);

        return () => clearTimeout(handler);
    }, [config, allocations, plannedOutflows, engineeringDemand, projectedOutflows, actualOutflows, currentMonthActuals, riskConfig, isHydrated]);


    const triggerSimulation = useCallback(() => {
        // We now require engineeringDemand to be present for updated logic, 
        // but fallback to plannedOutflows if engineeringDemand is empty (backward compatibility)
        const activeDemand = (engineeringDemand && Object.keys(engineeringDemand).length > 0)
            ? engineeringDemand
            : plannedOutflows;

        if (!activeDemand || Object.keys(activeDemand).length === 0) return;

        setLoading(true);
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        workerRef.current = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (e) => {
            setResults(e.data);
            setLoading(false);
        };

        workerRef.current.postMessage({
            config,
            allocations,
            actualAllocations,
            plannedOutflows, // Still passed for baseline comparison
            engineeringDemand: activeDemand, // Passed for active simulation
            actualOutflows,
            currentMonthActuals, // Now passing this!
            riskConfig, // High-Fidelity Risk Config
            volatilityFactor,
            corrStrength,
            iterations: 5000,
            activeScenarios
        });
        console.log('[Store] Triggering simulation with riskConfig:', riskConfig);
    }, [config, allocations, plannedOutflows, engineeringDemand, actualOutflows, currentMonthActuals, riskConfig, volatilityFactor, corrStrength, activeScenarios]);

    // Auto-trigger simulation (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            triggerSimulation();
        }, 1000);
        return () => clearTimeout(timer);
    }, [triggerSimulation]);

    const updateConfig = (newConfig: Partial<ProjectConfig>) => {
        console.log('[ProjectContext] Updating config:', newConfig);
        setConfig(prev => ({ ...prev, ...newConfig }));
    };

    const updateAllocation = (month: string, dept: any, value: number) => {
        setAllocations(prev => ({
            ...prev,
            [month]: { ...prev[month], [dept]: value }
        }));
    };

    const updateOutflow = (dataset: 'planned' | 'engineering' | 'projected' | 'actual', month: string, entity: string, activity: string, component: string, value: number) => {
        const setters: Record<string, any> = {
            planned: setPlannedOutflows,
            engineering: setEngineeringDemand,
            projected: setProjectedOutflows,
            actual: setActualOutflows
        };
        setters[dataset]((prev: OutflowData) => ({
            ...prev,
            [month]: {
                ...prev[month],
                [entity]: {
                    ...prev[month]?.[entity],
                    [activity]: {
                        ...prev[month]?.[entity]?.[activity],
                        [component]: value
                    }
                }
            }
        }));
    };

    const copyRange = (type: 'ALLOC' | 'OUTFLOW', dataset: string, sourceMonth: string, targetMonths: string[]) => {
        if (type === 'ALLOC') {
            const sourceData = (allocations[sourceMonth] || {}) as any;
            setAllocations(prev => {
                const next = { ...prev };
                targetMonths.forEach(m => { next[m] = { ...sourceData }; });
                return next;
            });
        } else {
            const setters: Record<string, any> = {
                planned: setPlannedOutflows,
                engineering: setEngineeringDemand,
                projected: setProjectedOutflows,
                actual: setActualOutflows
            };
            // Default to engineering if dataset is 'engineering', otherwise match logic
            const sourceStore = (dataset === 'planned' ? plannedOutflows :
                dataset === 'engineering' ? engineeringDemand :
                    dataset === 'projected' ? projectedOutflows : actualOutflows);

            const sourceData = sourceStore[sourceMonth] || {};
            setters[dataset]((prev: OutflowData) => {
                const next = { ...prev };
                targetMonths.forEach(m => { next[m] = JSON.parse(JSON.stringify(sourceData)); });
                return next;
            });
        }
    };

    const applyFactor = (type: 'ALLOC' | 'OUTFLOW', dataset: string, targetMonths: string[], factor: number, filters?: { entity?: string, activity?: string, component?: string }) => {
        if (type === 'ALLOC') {
            setAllocations(prev => {
                const next = { ...prev };
                targetMonths.forEach(m => {
                    if (!next[m]) return;
                    next[m] = { ...next[m] };
                    Object.keys(next[m]).forEach(dept => {
                        (next[m] as any)[dept] *= factor;
                    });
                });
                return next;
            });
        } else {
            const setters: Record<string, any> = {
                planned: setPlannedOutflows,
                engineering: setEngineeringDemand,
                projected: setProjectedOutflows,
                actual: setActualOutflows
            };
            setters[dataset]((prev: OutflowData) => {
                const next = JSON.parse(JSON.stringify(prev));
                targetMonths.forEach(m => {
                    if (!next[m]) return;
                    Object.keys(next[m]).forEach(ent => {
                        if (filters?.entity && ent !== filters.entity) return;
                        Object.keys(next[m][ent]).forEach(act => {
                            if (filters?.activity && act !== filters.activity) return;
                            Object.keys(next[m][ent][act]).forEach(comp => {
                                if (filters?.component && comp !== filters.component) return;
                                next[m][ent][act][comp] *= factor;
                            });
                        });
                    });
                });
                return next;
            });
        }
    };

    const toggleScenario = (id: string) => {
        setActiveScenarios(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const resetScenarios = () => setActiveScenarios([]);

    return {
        config, updateConfig,
        allocations, updateAllocation,
        plannedOutflows, setPlannedOutflows,
        engineeringDemand, setEngineeringDemand,
        projectedOutflows, setProjectedOutflows,
        actualOutflows, setActualOutflows,
        actualAllocations, setActualAllocations,
        currentMonthActuals, setCurrentMonthActuals,
        activeScenarios, toggleScenario, resetScenarios,
        riskConfig, setRiskConfig,
        updateOutflow,
        copyRange, applyFactor,
        months,
        results, setResults,
        loading, setLoading,
        volatilityFactor, setVolatilityFactor,
        corrStrength, setCorrStrength,
        triggerSimulation
    };
}

const ProjectContext = createContext<ReturnType<typeof useProjectState> | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const state = useProjectState();
    return (
        <ProjectContext.Provider value={state}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectContext() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
}
