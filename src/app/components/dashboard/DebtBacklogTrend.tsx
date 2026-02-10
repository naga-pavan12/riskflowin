import React from 'react';
import { TrendingDown, Clock, AlertCircle, Info, Maximize2, Pin } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { MonthlyStats } from '../../../types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DebtBacklogTrendProps {
    monthlyStats: MonthlyStats[];
}

export function DebtBacklogTrend({ monthlyStats }: DebtBacklogTrendProps) {
    // Filter to future months only (or all months for full view)
    const chartData = monthlyStats.map(m => ({
        month: m.month.slice(5), // Show only MM
        fullMonth: m.month,
        scheduleDebt: m.scheduleDebtP80,
        payablesBacklog: m.payablesBacklogP80,
        scheduleDebtExpected: m.scheduleDebtExpected,
        payablesBacklogExpected: m.payablesBacklogExpected
    }));

    const peakScheduleDebt = Math.max(...monthlyStats.map(m => m.scheduleDebtP80), 0);
    const peakPayablesBacklog = Math.max(...monthlyStats.map(m => m.payablesBacklogP80), 0);

    const hasIssues = peakScheduleDebt > 0 || peakPayablesBacklog > 0;

    const getStatusBadge = () => {
        if (peakPayablesBacklog > 10 || peakScheduleDebt > 10) {
            return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20">Critical</Badge>;
        }
        if (peakPayablesBacklog > 5 || peakScheduleDebt > 5) {
            return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">Elevated</Badge>;
        }
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Healthy</Badge>;
    };

    return (
        <div className="glass-panel rounded-xl flex flex-col min-h-[400px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20">
                        <TrendingDown size={20} className="text-purple-300/80" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">Debt & Backlog</h3>
                        <p className="text-[11px] leading-4 text-slate-500">P80 Trends Over Horizon</p>
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
                    <div className="ml-2">{getStatusBadge()}</div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border-medium" />

            <div className="p-6 pt-5">
                {/* Peak Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Schedule Debt - Purple accent */}
                    <div className="bg-purple-500/5 rounded-xl p-4 ring-1 ring-purple-500/10 border border-purple-500/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={14} className="text-purple-400" />
                            <p className="text-[11px] font-semibold text-purple-300/80 uppercase tracking-widest">Peak Schedule Debt</p>
                        </div>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-purple-400 text-lg font-semibold">₹</span>
                            <span className="text-2xl font-semibold text-purple-300">
                                {peakScheduleDebt.toFixed(1)}
                            </span>
                            <span className="text-sm text-purple-400/70 font-medium ml-0.5">Cr</span>
                        </div>
                        <p className="text-[11px] leading-4 text-purple-400/60 mt-2">
                            Deferred work due to throttling
                        </p>
                    </div>

                    {/* Payables Backlog - Rose accent */}
                    <div className="bg-rose-500/5 rounded-xl p-4 ring-1 ring-rose-500/10 border border-rose-500/10">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={14} className="text-rose-400" />
                            <p className="text-[11px] font-semibold text-rose-300/80 uppercase tracking-widest">Peak Payables Backlog</p>
                        </div>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-rose-400 text-lg font-semibold">₹</span>
                            <span className="text-2xl font-semibold text-rose-300">
                                {peakPayablesBacklog.toFixed(1)}
                            </span>
                            <span className="text-sm text-rose-400/70 font-medium ml-0.5">Cr</span>
                        </div>
                        <p className="text-[11px] leading-4 text-rose-400/60 mt-2">
                            Unpaid invoices carried forward
                        </p>
                    </div>
                </div>

                {/* Trend Chart */}
                {hasIssues && (
                    <div className="mb-4">
                        <p className="text-[11px] font-semibold text-slate-500 mb-3 uppercase tracking-widest">P80 Trend</p>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#334155' }}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `₹${val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(24, 24, 27, 0.95)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ color: '#f4f4f5' }}
                                        formatter={((value: any, name: any) => [
                                            `₹${(value ?? 0).toFixed(1)} Cr`,
                                            name === 'scheduleDebt' ? 'Schedule Debt' : 'Payables Backlog'
                                        ]) as any}
                                        labelFormatter={(label) => chartData.find(d => d.month === label)?.fullMonth || label}
                                    />
                                    <Legend
                                        iconType="line"
                                        formatter={(value) => value === 'scheduleDebt' ? 'Schedule Debt' : 'Payables Backlog'}
                                        wrapperStyle={{ fontSize: '11px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="scheduleDebt"
                                        stroke="#a855f7"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="payablesBacklog"
                                        stroke="#f43f5e"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Interpretation - footer */}
            <div className="mt-auto p-6 pt-0">
                <div className="flex items-start gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 ring-1 ring-blue-500/5">
                    <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[11px] leading-4 text-slate-400">
                        <span className="text-blue-300 font-semibold">Payables Backlog:</span> Unpaid invoices creating vendor liability.
                        <span className="text-purple-300 font-semibold ml-2">Schedule Debt:</span> Work not executed due to cash throttling–recoverable but costly.
                    </div>
                </div>
            </div>
        </div>
    );
}

