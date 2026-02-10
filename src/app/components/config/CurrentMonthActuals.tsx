import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Percent, AlertTriangle, TrendingUp, Activity, Info } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { CurrentMonthActuals as CurrentMonthActualsType, ComponentType } from '../../../types';

const COMPONENTS: ComponentType[] = ['SERVICE', 'MATERIAL', 'INFRA'];

export function CurrentMonthActuals() {
    const { config, results, currentMonthActuals, setCurrentMonthActuals } = useProjectStore();

    const [showCommitments, setShowCommitments] = useState(false);

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

    // Calculate totals
    const totalActualPaid = currentMonthActuals.actualPaidToDate.SERVICE + currentMonthActuals.actualPaidToDate.MATERIAL + currentMonthActuals.actualPaidToDate.INFRA;

    // Get now-cast from results
    const nowCast = results?.nowCast;
    const currentMonthStats = results?.monthlyStats?.find(m => m.month === currentMonthActuals.currentMonth);
    const plannedTotal = currentMonthStats?.plannedOutflowTotal || 0;

    // Status calculation
    const exceedProbPercent = nowCast ? (nowCast.probExceedPlan * 100) : 0;
    const status = exceedProbPercent > 60 ? 'severe' : exceedProbPercent > 30 ? 'watch' : 'low';

    const getStatusBadge = () => {
        const styles = {
            severe: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
            watch: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
        const labels = {
            severe: 'High Risk',
            watch: 'Watch',
            low: 'On Track'
        };
        return <Badge className={styles[status]}>{labels[status]}</Badge>;
    };

    return (
        <div className="max-w-4xl space-y-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Current Month Actuals</h2>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Enter actual payments to date for real-time EOM projection
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm text-[var(--text-muted)]">Current Month</p>
                        <p className="text-lg font-medium text-[var(--text-primary)]">{currentMonthActuals.currentMonth}</p>
                    </div>
                    {getStatusBadge()}
                </div>
            </div>

            {/* Input Cards */}
            <div className="grid grid-cols-2 gap-6">
                {/* Actual Paid to Date */}
                <div className="bg-[var(--graphite-800)] rounded-xl p-6 border border-[var(--divider)]">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign size={18} className="text-emerald-400" />
                        <h3 className="font-medium text-[var(--text-primary)]">Actual Paid to Date</h3>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        Enter the total paid amounts by component type as of today
                    </p>

                    <div className="space-y-4">
                        {COMPONENTS.map(comp => (
                            <div key={comp} className="flex items-center justify-between">
                                <label className="text-sm text-[var(--text-secondary)]">{comp}</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[var(--text-muted)]">₹</span>
                                    <input
                                        type="number"
                                        value={currentMonthActuals.actualPaidToDate[comp]}
                                        onChange={e => handleActualChange(comp, parseFloat(e.target.value) || 0)}
                                        className="w-24 bg-[var(--graphite-700)] border border-[var(--divider)] rounded-lg px-3 py-2 text-right text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        min="0"
                                        step="0.1"
                                    />
                                    <span className="text-[var(--text-muted)] text-sm">Cr</span>
                                </div>
                            </div>
                        ))}

                        <div className="pt-2 border-t border-[var(--divider)]">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-[var(--text-primary)]">Total Paid</span>
                                <span className="font-semibold text-emerald-400">₹{totalActualPaid.toFixed(1)} Cr</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Elapsed Progress */}
                <div className="bg-[var(--graphite-800)] rounded-xl p-6 border border-[var(--divider)]">
                    <div className="flex items-center gap-2 mb-4">
                        <Percent size={18} className="text-blue-400" />
                        <h3 className="font-medium text-[var(--text-primary)]">Elapsed Progress</h3>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                        How far through the month are we?
                    </p>

                    <div className="space-y-6">
                        <div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={currentMonthActuals.elapsedProgress}
                                onChange={e => handleElapsedChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-[var(--graphite-600)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between mt-2 text-sm text-[var(--text-muted)]">
                                <span>Start</span>
                                <span className="text-blue-400 font-medium">{Math.round(currentMonthActuals.elapsedProgress * 100)}%</span>
                                <span>End</span>
                            </div>
                        </div>

                        {/* Day of month approximation */}
                        <div className="p-3 bg-[var(--graphite-700)] rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar size={14} className="text-[var(--text-muted)]" />
                                <span className="text-[var(--text-secondary)]">
                                    Approximately Day {Math.round(currentMonthActuals.elapsedProgress * 30)} of 30
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Optional Commitments */}
            <div className="bg-[var(--graphite-800)] rounded-xl p-6 border border-[var(--divider)]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-purple-400" />
                        <h3 className="font-medium text-[var(--text-primary)]">Commitments to Date</h3>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Optional</Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCommitments(!showCommitments)}
                    >
                        {showCommitments ? 'Hide' : 'Show'}
                    </Button>
                </div>

                {showCommitments && (
                    <>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            If known, enter committed (contracted but not yet paid) amounts.
                            If left empty, default commitment ratios will be used.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {COMPONENTS.map(comp => (
                                <div key={comp}>
                                    <label className="block text-sm text-[var(--text-secondary)] mb-2">{comp}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--text-muted)]">₹</span>
                                        <input
                                            type="number"
                                            value={currentMonthActuals.commitmentsToDate?.[comp] || ''}
                                            onChange={e => handleCommitmentChange(comp, parseFloat(e.target.value) || 0)}
                                            placeholder="Auto"
                                            className="w-full bg-[var(--graphite-700)] border border-[var(--divider)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-[var(--text-muted)]"
                                            min="0"
                                            step="0.1"
                                        />
                                        <span className="text-[var(--text-muted)] text-sm">Cr</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* 3-Month Warning Inputs */}
            <div className="bg-[var(--graphite-800)] rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-5">
                    <AlertTriangle size={20} className="text-purple-400" />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Early Warning Data</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Committed PO Value (₹ Cr)</label>
                        <input
                            type="number"
                            value={currentMonthActuals.committedPOValue || ''}
                            onChange={e => setCurrentMonthActuals(prev => {
                                if (!prev) return undefined;
                                return { ...prev, committedPOValue: Math.max(0, parseFloat(e.target.value) || 0) };
                            })}
                            placeholder="Total signed POs"
                            className="w-full bg-[var(--graphite-700)] border border-[var(--divider)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            min="0" step="0.1"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Total value of POs signed but not paid</p>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Physical Progress (%)</label>
                        <input
                            type="number"
                            value={((currentMonthActuals.physicalProgressPct || 0) * 100).toFixed(0)}
                            onChange={e => setCurrentMonthActuals(prev => {
                                if (!prev) return undefined;
                                return { ...prev, physicalProgressPct: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100 };
                            })}
                            placeholder="e.g. 42"
                            className="w-full bg-[var(--graphite-700)] border border-[var(--divider)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            min="0" max="100" step="1"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Verified site progress (drives CPI)</p>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Planned Progress (%)</label>
                        <input
                            type="number"
                            value={((currentMonthActuals.plannedProgressPct || 0) * 100).toFixed(0)}
                            onChange={e => setCurrentMonthActuals(prev => {
                                if (!prev) return undefined;
                                return { ...prev, plannedProgressPct: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) / 100 };
                            })}
                            placeholder="e.g. 50"
                            className="w-full bg-[var(--graphite-700)] border border-[var(--divider)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            min="0" max="100" step="1"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">What the schedule says you should be at (drives SPI)</p>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Estimate to Complete (₹ Cr)</label>
                        <input
                            type="number"
                            value={currentMonthActuals.estimateToComplete || ''}
                            onChange={e => setCurrentMonthActuals(prev => {
                                if (!prev) return undefined;
                                return { ...prev, estimateToComplete: Math.max(0, parseFloat(e.target.value) || 0) };
                            })}
                            placeholder="Remaining cash needed"
                            className="w-full bg-[var(--graphite-700)] border border-[var(--divider)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            min="0" step="0.1"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">If Paid + ETC &gt; Cap → Hard Budget Breach</p>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-[var(--graphite-800)] to-[var(--graphite-900)] rounded-xl p-6 border border-[var(--divider)]">
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={20} className="text-blue-400" />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">EOM Close Projection</h3>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Live Preview</Badge>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* EOM Cash Due */}
                    <div className="bg-[var(--graphite-700)]/50 rounded-lg p-4">
                        <p className="text-sm text-[var(--text-muted)] mb-2">Projected EOM Cash Due</p>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-[var(--text-primary)]">
                                    ₹{(nowCast?.eomCashDueP50 ?? (totalActualPaid / Math.max(0.1, currentMonthActuals.elapsedProgress))).toFixed(1)}
                                </span>
                                <span className="text-sm text-[var(--text-muted)]">Cr (P50)</span>
                            </div>
                            <div className="text-sm text-[var(--text-secondary)]">
                                P80: ₹{(nowCast?.eomCashDueP80 ?? (totalActualPaid / Math.max(0.1, currentMonthActuals.elapsedProgress) * 1.15)).toFixed(1)} Cr
                            </div>
                        </div>
                    </div>

                    {/* Exceed Plan Probability */}
                    <div className="bg-[var(--graphite-700)]/50 rounded-lg p-4">
                        <p className="text-sm text-[var(--text-muted)] mb-2">Probability of Exceeding Plan</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${exceedProbPercent > 60 ? 'text-rose-400' :
                                exceedProbPercent > 30 ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                {exceedProbPercent.toFixed(0)}%
                            </span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">
                            Planned: ₹{plannedTotal.toFixed(1)} Cr
                        </div>
                    </div>

                    {/* Top Driver */}
                    <div className="bg-[var(--graphite-700)]/50 rounded-lg p-4">
                        <p className="text-sm text-[var(--text-muted)] mb-2">Top Driver</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-[var(--text-primary)]">
                                {nowCast?.topDrivers?.[0]?.label || 'Material Volatility'}
                            </span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">
                            {((nowCast?.topDrivers?.[0]?.contribution || 0.4) * 100).toFixed(0)}% contribution
                        </div>
                    </div>
                </div>

                {/* Recommended Actions */}
                {nowCast?.recommendedActions && nowCast.recommendedActions.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[var(--divider)]">
                        <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Recommended Actions</p>
                        <div className="flex gap-3">
                            {nowCast.recommendedActions.slice(0, 2).map(action => (
                                <div
                                    key={action.id}
                                    className="flex-1 p-3 bg-[var(--graphite-700)] rounded-lg border border-[var(--divider)] hover:border-blue-500/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">{action.title}</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                            {action.impact}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Note */}
                <div className="mt-6 flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-300">
                        This projection updates in real-time as you enter actuals.
                        The simulation uses your inputs to project end-of-month cash requirements.
                    </p>
                </div>

            </div>
        </div>
    );
}
