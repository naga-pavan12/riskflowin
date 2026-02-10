import React from 'react';
import { Radar, AlertTriangle, Clock, Info, Maximize2, Pin, Play, FileText, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { BreachRadarResults } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface BreachRadarProps {
    breachRadar?: BreachRadarResults;
    currentMonth: string;
}

export function BreachRadar({ breachRadar, currentMonth }: BreachRadarProps) {
    const hasBreachRisk = breachRadar && (breachRadar.timeToBreachP50 !== null || breachRadar.timeToBreachP80 !== null);

    // Filter to show only months with non-zero probability
    const chartData = breachRadar?.breachDistribution?.filter(d => d.probability > 0.01) || [];

    const getUrgencyBadge = () => {
        if (!breachRadar || breachRadar.timeToBreachP50 === null) {
            return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Clear Horizon</Badge>;
        }
        if (breachRadar.timeToBreachP50 <= 2) {
            return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20">Imminent Risk</Badge>;
        }
        if (breachRadar.timeToBreachP50 <= 4) {
            return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20">Near-Term Risk</Badge>;
        }
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20">Distant Risk</Badge>;
    };

    return (
        <div className="relative bg-slate-900/55 rounded-xl border border-slate-700/50 ring-1 ring-white/5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] flex flex-col min-h-[400px] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/5 before:rounded-t-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
                        <Radar size={20} className="text-amber-300/80" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">Breach Radar</h3>
                        <p className="text-[11px] leading-4 text-slate-500">Time-to-Breach Distribution</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Panel Tools */}
                    <button className="w-9 h-9 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/40 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50" aria-label="Info">
                        <Info size={16} className="text-slate-400" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/40 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50" aria-label="Expand">
                        <Maximize2 size={16} className="text-slate-400" />
                    </button>
                    <button className="w-9 h-9 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/40 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50" aria-label="Pin">
                        <Pin size={16} className="text-slate-400" />
                    </button>
                    <div className="ml-2">{getUrgencyBadge()}</div>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/60" />

            {hasBreachRisk ? (
                <div className="p-6 pt-5">
                    {/* Time to Breach */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/40 rounded-xl p-4 ring-1 ring-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-slate-500" />
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Time-to-Breach (P50)</p>
                            </div>
                            <div className="flex items-baseline gap-1.5 tabular-nums">
                                <span className="text-2xl font-semibold text-amber-300">
                                    {breachRadar?.timeToBreachP50 ?? '—'}
                                </span>
                                <span className="text-sm text-slate-500 font-medium">months</span>
                            </div>
                            {breachRadar?.earliestBreachMonthP50 && (
                                <p className="text-[11px] leading-4 text-slate-500 mt-2 font-mono">
                                    {breachRadar.earliestBreachMonthP50}
                                </p>
                            )}
                        </div>

                        <div className="bg-slate-800/40 rounded-xl p-4 ring-1 ring-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={14} className="text-slate-500" />
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Time-to-Breach (P80)</p>
                            </div>
                            <div className="flex items-baseline gap-1.5 tabular-nums">
                                <span className="text-2xl font-semibold text-rose-300">
                                    {breachRadar?.timeToBreachP80 ?? '—'}
                                </span>
                                <span className="text-sm text-slate-500 font-medium">months</span>
                            </div>
                            {breachRadar?.earliestBreachMonthP80 && (
                                <p className="text-[11px] leading-4 text-slate-500 mt-2 font-mono">
                                    {breachRadar.earliestBreachMonthP80}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Distribution Chart */}
                    {chartData.length > 0 && (
                        <div>
                            <p className="text-[11px] font-semibold text-slate-500 mb-3 uppercase tracking-widest">Breach Month Distribution</p>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={{ stroke: '#334155' }}
                                            tickFormatter={(val) => val.slice(5)}
                                        />
                                        <YAxis
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px'
                                            }}
                                            labelStyle={{ color: '#f1f5f9' }}
                                            formatter={(value: number | undefined) => [`${((value ?? 0) * 100).toFixed(1)}%`, 'Probability']}
                                        />
                                        <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.probability > 0.3 ? '#f43f5e' : entry.probability > 0.15 ? '#f59e0b' : '#3b82f6'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center mb-4">
                        <ShieldCheck size={32} className="text-emerald-400" />
                    </div>
                    <p className="text-xl font-semibold text-white mb-1">No Breach Detected</p>
                    <p className="text-sm text-slate-400 mb-6">
                        All funding scenarios stay within limits
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/40 rounded-xl text-sm font-medium text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:scale-[0.99]">
                            <Play size={16} className="text-blue-400" />
                            Run Stress Scenario
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 text-[13px] text-slate-400 hover:text-slate-300 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
                            <FileText size={14} />
                            View Scenario Assumptions
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
