import React from 'react';
import { TrendingUp, AlertTriangle, Activity, ArrowRight, Info, Maximize2, Pin } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { NowCastResults } from '../../../types';

interface CloseProjectionProps {
    nowCast?: NowCastResults;
    plannedTotal: number;
    currentMonth: string;
    onActionClick?: (actionId: string) => void;
}

export function CloseProjection({
    nowCast,
    plannedTotal,
    currentMonth,
    onActionClick
}: CloseProjectionProps) {
    const exceedProbPercent = nowCast ? (nowCast.probExceedPlan * 100) : 0;
    const status = exceedProbPercent > 60 ? 'severe' : exceedProbPercent > 30 ? 'watch' : 'low';

    const statusColors = {
        severe: 'text-rose-300',
        watch: 'text-amber-300',
        low: 'text-emerald-300'
    };

    const statusBadges = {
        severe: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
        watch: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    };

    // Driver chips
    const drivers = [
        { label: 'Material Vol', active: true },
        { label: 'FX', active: false },
        { label: 'Labor', active: false },
        { label: 'Vendor Delays', active: false }
    ];

    return (
        <div className="glass-panel rounded-xl flex flex-col min-h-[400px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                        <TrendingUp size={20} className="text-blue-300/80" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">Current Month Close</h3>
                        <p className="text-[11px] leading-4 text-slate-500">{currentMonth} Projection</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Panel Tools */}
                    <button className="w-9 h-9 rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label="Info">
                        <Info size={16} className="text-text-secondary" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label="Expand">
                        <Maximize2 size={16} className="text-text-secondary" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-surface hover:bg-surface-hover border border-border-subtle flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label="Pin">
                        <Pin size={16} className="text-text-secondary" />
                    </button>
                    <Badge className={`ml-2 ${statusBadges[status]}`}>
                        {status === 'severe' ? 'High Risk' : status === 'watch' ? 'Watch' : 'On Track'}
                    </Badge>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border-medium" />

            {/* Main Metrics */}
            <div className="p-6 pt-5">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* EOM Cash Due */}
                    <div className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
                        <p className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-widest">EOM Cash Due</p>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-text-tertiary text-lg font-semibold">₹</span>
                            <span className="text-2xl font-semibold text-text-primary">
                                {(nowCast?.eomCashDueP50 ?? 0).toFixed(1)}
                            </span>
                            <span className="text-sm text-text-muted font-medium ml-0.5">Cr</span>
                        </div>
                        <p className="text-[11px] leading-4 text-text-muted mt-2 font-mono tabular-nums">
                            P80: ₹{(nowCast?.eomCashDueP80 ?? 0).toFixed(1)} Cr
                        </p>
                    </div>

                    {/* Exceed Plan Probability */}
                    <div className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
                        <p className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-widest">Exceed Plan Risk</p>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className={`text-2xl font-semibold ${statusColors[status]}`}>
                                {exceedProbPercent.toFixed(0)}%
                            </span>
                        </div>
                        <p className="text-[11px] leading-4 text-text-muted mt-2 font-mono tabular-nums">
                            Plan: ₹{plannedTotal.toFixed(1)} Cr
                        </p>
                    </div>

                    {/* Top Driver */}
                    <div className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
                        <p className="text-[11px] font-semibold text-text-secondary mb-2 uppercase tracking-widest">Primary Driver</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-text-primary">
                                {nowCast?.topDrivers?.[0]?.label || 'Material Vol'}
                            </span>
                        </div>
                        <p className="text-[11px] leading-4 text-text-muted mt-2 font-mono tabular-nums">
                            {((nowCast?.topDrivers?.[0]?.contribution ?? 0.4) * 100).toFixed(0)}% contribution
                        </p>
                    </div>
                </div>

                {/* Driver Chips */}
                <div className="mb-4">
                    <p className="text-[11px] font-semibold text-text-secondary mb-3 uppercase tracking-widest">Risk Factors</p>
                    <div className="flex flex-wrap gap-2">
                        {drivers.map((driver) => (
                            <button
                                key={driver.label}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50
                                    ${driver.active
                                        ? 'bg-brand/15 text-brand border border-brand/30 ring-1 ring-brand/20'
                                        : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle'
                                    }
                                `}
                            >
                                {driver.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommended Actions */}
            {nowCast?.recommendedActions && nowCast.recommendedActions.length > 0 && (
                <div className="p-6 pt-0 border-t border-border-medium mt-auto">
                    <p className="text-[11px] font-semibold text-text-secondary mb-3 uppercase tracking-widest">Immediate Actions</p>
                    <div className="flex gap-3">
                        {nowCast.recommendedActions.slice(0, 2).map(action => (
                            <button
                                key={action.id}
                                onClick={() => onActionClick?.(action.id)}
                                className="flex-1 p-3 bg-surface hover:bg-surface-hover rounded-xl border border-border-subtle hover:border-brand/40 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-text-primary">{action.title}</span>
                                    <ArrowRight size={14} className="text-text-secondary group-hover:text-brand transition-colors" />
                                </div>
                                <p className="text-xs text-accent-emerald mt-1">{action.impact}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
