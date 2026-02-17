import React, { useState } from 'react';
import { Calendar, DollarSign, Percent, Activity, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { ComponentType, VitalSignsInput } from '../../../types';

const COMPONENTS: ComponentType[] = ['SERVICE', 'MATERIAL', 'INFRA'];

// ============================================================================
// VITAL SIGNS FIELD DEFINITIONS
// ============================================================================

interface VitalField {
    key: keyof VitalSignsInput;
    label: string;
    unit: string;
    vector: string;
    min: number;
    max: number;
    step: number;
    defaultVal: number;
    category: 'EXECUTION' | 'FINANCE' | 'SUPPLY' | 'DESIGN & SITE';
}

const VITAL_FIELDS: VitalField[] = [
    // EXECUTION
    { key: 'activeWorkerCount', label: 'Active Workers on Site', unit: 'workers', vector: 'RESOURCE_DENSITY', min: 0, max: 2000, step: 10, defaultVal: 200, category: 'EXECUTION' },
    { key: 'openDefectCount', label: 'Open Defect Notices (DQNs)', unit: 'DQNs', vector: 'REWORK_BURDEN', min: 0, max: 200, step: 1, defaultVal: 3, category: 'EXECUTION' },
    // FINANCE
    { key: 'avgVendorPaymentDelay', label: 'Avg Vendor Payment Delay', unit: 'days', vector: 'VENDOR_AGING', min: 0, max: 120, step: 1, defaultVal: 15, category: 'FINANCE' },
    { key: 'unbilledWorkValue', label: 'Unbilled Work-in-Progress', unit: '₹ Cr', vector: 'UNBILLED_ASSET', min: 0, max: 500, step: 0.5, defaultVal: 5, category: 'FINANCE' },
    { key: 'advanceRemainingPct', label: 'Advance Remaining', unit: '%', vector: 'ADVANCE_BURN', min: 0, max: 100, step: 1, defaultVal: 70, category: 'FINANCE' },
    // SUPPLY
    { key: 'criticalMaterialStockDays', label: 'Critical Material Stock', unit: 'days', vector: 'BURN_RATE', min: 0, max: 120, step: 1, defaultVal: 30, category: 'SUPPLY' },
    { key: 'materialLeadTimeDelay', label: 'Material Lead Time Deviation', unit: 'days late', vector: 'LEAD_TIME_VAR', min: 0, max: 60, step: 1, defaultVal: 2, category: 'SUPPLY' },
    { key: 'indentApprovalDays', label: 'Indent Approval Time', unit: 'days', vector: 'INDENT_LATENCY', min: 0, max: 30, step: 0.5, defaultVal: 1, category: 'SUPPLY' },
    // DESIGN & SITE
    { key: 'drawingsPendingPct', label: 'GFC Drawings Pending', unit: '%', vector: 'DRAWING_GAP', min: 0, max: 100, step: 1, defaultVal: 5, category: 'DESIGN & SITE' },
    { key: 'methodStatementsPendingPct', label: 'Method Statements Pending', unit: '%', vector: 'METHODOLOGY_GAP', min: 0, max: 100, step: 1, defaultVal: 3, category: 'DESIGN & SITE' },
    { key: 'idleFrontsPct', label: 'Idle Work Fronts', unit: '%', vector: 'WORK_FRONT_GAP', min: 0, max: 100, step: 1, defaultVal: 5, category: 'DESIGN & SITE' },
];

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    'EXECUTION': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
    'FINANCE': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
    'SUPPLY': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
    'DESIGN & SITE': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CurrentMonthActuals() {
    const { results, currentMonthActuals, setCurrentMonthActuals, months } = useProjectStore();

    const [showCommitments, setShowCommitments] = useState(false);
    const [showPulseCheck, setShowPulseCheck] = useState(false);

    if (!currentMonthActuals) return null;

    const handleActualChange = (component: ComponentType, value: number) => {
        setCurrentMonthActuals(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                actualPaidToDate: { ...prev.actualPaidToDate, [component]: Math.max(0, value) }
            };
        });
    };

    const handleCommitmentChange = (component: ComponentType, value: number) => {
        setCurrentMonthActuals(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                commitmentsToDate: {
                    ...prev.commitmentsToDate,
                    [component]: Math.max(0, value)
                }
            };
        });
    };

    const handleElapsedChange = (value: number) => {
        setCurrentMonthActuals(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                elapsedProgress: Math.max(0, Math.min(1, value))
            };
        });
    };

    const handleVitalSignChange = (key: keyof VitalSignsInput, value: number) => {
        setCurrentMonthActuals(prev => {
            if (!prev) return undefined;
            const currentVitals: VitalSignsInput = prev.vitalSigns || {
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
                ...prev,
                vitalSigns: {
                    ...currentVitals,
                    [key]: Math.max(0, value),
                }
            };
        });
    };

    // Calculate totals
    const totalActualPaid = currentMonthActuals.actualPaidToDate.SERVICE + currentMonthActuals.actualPaidToDate.MATERIAL + currentMonthActuals.actualPaidToDate.INFRA;
    const totalCommitments = (currentMonthActuals.commitmentsToDate?.SERVICE || 0) + (currentMonthActuals.commitmentsToDate?.MATERIAL || 0) + (currentMonthActuals.commitmentsToDate?.INFRA || 0);

    // Get now-cast from results
    const nowCast = results?.nowCast;

    // Status calculation
    const exceedProbPercent = nowCast ? (nowCast.probExceedPlan * 100) : 0;
    const status = exceedProbPercent > 60 ? 'severe' : exceedProbPercent > 30 ? 'watch' : 'low';

    const getStatusBadge = () => {
        const styles = {
            severe: 'bg-red-50 text-red-700 border-red-200',
            watch: 'bg-amber-50 text-amber-700 border-amber-200',
            low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        const labels = {
            severe: 'High Risk',
            watch: 'Watch',
            low: 'On Track'
        };
        return <Badge className={`border ${styles[status]}`}>{labels[status]}</Badge>;
    };

    // Count how many vital signs are filled
    const filledVitals = currentMonthActuals.vitalSigns
        ? Object.values(currentMonthActuals.vitalSigns).filter(v => typeof v === 'number' && v > 0).length
        : 0;

    // Group fields by category
    const categories = ['EXECUTION', 'FINANCE', 'SUPPLY', 'DESIGN & SITE'] as const;

    return (
        <div className="max-w-4xl space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-black">Current Month Actuals</h2>
                    <p className="text-zinc-500 mt-1">
                        Enter actual payments to date for real-time EOM projection
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Current Month</p>
                        <p className="text-xl font-bold text-black tabular-nums">{currentMonthActuals.currentMonth}</p>
                    </div>
                    {getStatusBadge()}
                </div>
            </div>

            {/* Input Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Actual Paid to Date */}
                <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <DollarSign size={20} className="text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-black text-lg">Actual Paid</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                        Enter the total paid amounts by component type as of today.
                    </p>

                    <div className="space-y-4">
                        {COMPONENTS.map(comp => (
                            <div key={comp} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-zinc-600 w-24">{comp}</label>
                                <div className="flex items-center gap-2 flex-1 justify-end">
                                    <span className="text-zinc-400 font-medium">₹</span>
                                    <input
                                        type="number"
                                        value={currentMonthActuals.actualPaidToDate[comp]}
                                        onChange={e => handleActualChange(comp, parseFloat(e.target.value) || 0)}
                                        className="w-32 bg-zinc-50 border border-zinc-200 rounded min-w-0 px-3 py-2 text-right text-black font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                                        min="0"
                                        step="0.1"
                                    />
                                    <span className="text-zinc-400 text-xs font-bold uppercase w-6">Cr</span>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-zinc-100 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-black">Total Paid</span>
                                <span className="font-bold text-emerald-600 text-lg tabular-nums">₹{totalActualPaid.toFixed(1)} Cr</span>
                            </div>
                        </div>
                    </div>
                </div>


            </div>

            {/* Progress & Forecast */}
            <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm space-y-8">
                {/* Elapsed vs Physical Progress */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                            <Percent size={20} className="text-blue-600" />
                        </div>
                        <h3 className="font-bold text-black text-lg">Progress Tracking</h3>
                    </div>

                    {/* Elapsed (Time) */}
                    <div className="mb-6">
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-600">Elapsed Time (Month)</label>
                            <span className="text-sm font-bold text-black">{Math.round(currentMonthActuals.elapsedProgress * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={currentMonthActuals.elapsedProgress}
                            onChange={e => handleElapsedChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                        <div className="flex justify-between mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <span>Day 1</span>
                            <span>Day 30</span>
                        </div>
                    </div>

                    {/* Physical (Work) */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-600">Physical Work Completed</label>
                            <span className="text-sm font-bold text-blue-600">{Math.round((currentMonthActuals.physicalProgressPct || 0) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={currentMonthActuals.physicalProgressPct || 0}
                            onChange={e => setCurrentMonthActuals(prev => prev ? ({ ...prev, physicalProgressPct: parseFloat(e.target.value) }) : undefined)}
                            className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-xs text-zinc-400 mt-2">
                            Actual work done vs planned for this month. Also drives the <strong>VELOCITY</strong> vector in God Mode.
                        </p>
                    </div>
                </div>

                <div className="border-t border-zinc-100 pt-6"></div>

                {/* Estimate To Complete (ETC) */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                            <Activity size={20} className="text-amber-600" />
                        </div>
                        <h3 className="font-bold text-black text-lg">Forecast (ETC)</h3>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">
                        Estimate to Complete: How much more do we need to pay this month to finish the scope?
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-400 font-medium">₹</span>
                        <input
                            type="number"
                            value={currentMonthActuals.estimateToComplete || 0}
                            onChange={e => setCurrentMonthActuals(prev => prev ? ({ ...prev, estimateToComplete: parseFloat(e.target.value) || 0 }) : undefined)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-black font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                            min="0"
                            step="0.1"
                        />
                        <span className="text-zinc-400 text-xs font-bold uppercase w-6">Cr</span>
                    </div>
                </div>

            </div>


            {/* Optional Commitments */}
            <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                            <Activity size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-black text-lg flex items-center gap-3">
                                Commitments
                                <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200 font-normal">Optional</Badge>
                            </h3>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCommitments(!showCommitments)}
                    >
                        {showCommitments ? 'Hide Details' : 'Show Details'}
                    </Button>
                </div>

                {showCommitments && (
                    <div className="mt-6 pt-6 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm text-zinc-500 mb-6 max-w-2xl">
                            Enter committed (contracted but not yet paid) amounts if known.
                            These help refine the "Burn Rate" calculation by indicating obligated future spend.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {COMPONENTS.map(comp => (
                                <div key={comp} className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{comp}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-400 font-medium">₹</span>
                                        <input
                                            type="number"
                                            value={currentMonthActuals.commitmentsToDate?.[comp] || 0}
                                            onChange={e => handleCommitmentChange(comp, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-black font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                                            min="0"
                                            step="0.1"
                                        />
                                        <span className="text-zinc-400 text-xs font-bold uppercase">Cr</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 text-right">
                            <span className="text-sm text-zinc-500 mr-2">Total Commitments:</span>
                            <span className="text-lg font-bold text-purple-700">₹{totalCommitments.toFixed(1)} Cr</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ================================================================== */}
            {/* PULSE CHECK — God Mode Vital Signs */}
            {/* ================================================================== */}
            <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                {/* Header — always visible */}
                <button
                    onClick={() => setShowPulseCheck(!showPulseCheck)}
                    className="w-full flex items-center justify-between p-6 hover:bg-indigo-50/30 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200">
                            <Zap size={20} className="text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-black text-lg flex items-center gap-3">
                                Pulse Check
                                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold text-[10px]">GOD MODE</Badge>
                            </h3>
                            <p className="text-sm text-zinc-500 mt-0.5">
                                {filledVitals > 0
                                    ? `${filledVitals} of 11 signals active — feeds the causal risk engine`
                                    : 'Enter site signals to power the God Mode risk engine'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {filledVitals > 0 && (
                            <span className="text-xs font-bold text-indigo-500 tabular-nums">{filledVitals}/11</span>
                        )}
                        {showPulseCheck ? (
                            <ChevronUp size={18} className="text-zinc-400" />
                        ) : (
                            <ChevronDown size={18} className="text-zinc-400" />
                        )}
                    </div>
                </button>

                {/* Fields — collapsible */}
                {showPulseCheck && (
                    <div className="px-6 pb-6 pt-2 border-t border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-8">
                            {categories.map(cat => {
                                const fields = VITAL_FIELDS.filter(f => f.category === cat);
                                const style = CATEGORY_STYLES[cat];
                                return (
                                    <div key={cat}>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${style.bg} ${style.border} border mb-4`}>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{cat}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            {fields.map(field => {
                                                const currentVal = currentMonthActuals.vitalSigns?.[field.key] ?? field.defaultVal;
                                                return (
                                                    <div key={field.key} className="flex items-center justify-between group">
                                                        <div className="flex-1 min-w-0 mr-4">
                                                            <label className="text-sm font-medium text-zinc-700 block truncate">{field.label}</label>
                                                            <span className="text-[10px] font-mono text-zinc-400 uppercase">{field.vector}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <input
                                                                type="number"
                                                                value={currentVal}
                                                                onChange={e => handleVitalSignChange(field.key, parseFloat(e.target.value) || 0)}
                                                                className="w-24 bg-zinc-50 border border-zinc-200 rounded px-3 py-1.5 text-right text-sm text-black font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                                min={field.min}
                                                                max={field.max}
                                                                step={field.step}
                                                            />
                                                            <span className="text-zinc-400 text-xs font-bold uppercase w-12 text-right">{field.unit}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer hint */}
                        <div className="mt-6 pt-4 border-t border-dashed border-indigo-100">
                            <p className="text-xs text-zinc-400 flex items-center gap-2">
                                <Zap size={12} className="text-indigo-400" />
                                These values feed directly into <strong className="text-indigo-500">God Mode</strong> — switch to LIVE mode to run causal inference on real data.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
