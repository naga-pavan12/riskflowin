import React from 'react';
import { TrendingDown, Clock, AlertCircle, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { MonthlyStats } from '../../../types';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Button } from '../ui/button';

interface DebtBacklogTrendProps {
    monthlyStats: MonthlyStats[];
}

export function DebtBacklogTrend({ monthlyStats }: DebtBacklogTrendProps) {
    // Filter to future months only (or all months for full view)
    const chartData = monthlyStats.map(m => ({
        month: m.month.slice(5), // Show only MM
        fullMonth: m.month,
        scheduleDebt: m.scheduleDebtP50,
        payablesBacklog: m.payablesBacklogP50,
    }));

    const peakScheduleDebt = Math.max(...monthlyStats.map(m => m.scheduleDebtP50), 0);
    const peakPayablesBacklog = Math.max(...monthlyStats.map(m => m.payablesBacklogP50), 0);

    const getStatusBadge = () => {
        if (peakPayablesBacklog > 10 || peakScheduleDebt > 10) {
            return <Badge className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
        }
        if (peakPayablesBacklog > 5 || peakScheduleDebt > 5) {
            return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Elevated</Badge>;
        }
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Healthy</Badge>;
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col min-h-[400px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                        <TrendingDown size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-black">Debt & Backlog</h3>
                        <p className="text-xs text-zinc-500 font-medium">P50 Trends Over Horizon</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-50 text-zinc-400 hover:text-black">
                        <Info size={16} />
                    </Button>
                    <div className="ml-2">{getStatusBadge()}</div>
                </div>
            </div>

            <div className="p-6">
                {/* Peak Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Schedule Debt - Purple accent */}
                    <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={14} className="text-purple-500" />
                            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Peak Schedule Debt</p>
                        </div>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-purple-400 text-lg font-semibold">₹</span>
                            <span className="text-2xl font-bold text-purple-700">
                                {peakScheduleDebt.toFixed(1)}
                            </span>
                            <span className="text-sm text-purple-500 font-medium ml-0.5">Cr</span>
                        </div>
                    </div>

                    {/* Payables Backlog - Rose accent */}
                    <div className="bg-rose-50 rounded-lg p-5 border border-rose-100">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={14} className="text-rose-500" />
                            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Peak Payables Backlog</p>
                        </div>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-rose-400 text-lg font-semibold">₹</span>
                            <span className="text-2xl font-bold text-rose-700">
                                {peakPayablesBacklog.toFixed(1)}
                            </span>
                            <span className="text-sm text-rose-500 font-medium ml-0.5">Cr</span>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 500 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    fontSize: '12px'
                                }}
                                cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="scheduleDebt"
                                stroke="#9333ea"
                                fillOpacity={1}
                                fill="url(#colorDebt)"
                                strokeWidth={2}
                                name="Schedule Debt"
                            />
                            <Area
                                type="monotone"
                                dataKey="payablesBacklog"
                                stroke="#e11d48"
                                fillOpacity={1}
                                fill="url(#colorBacklog)"
                                strokeWidth={2}
                                name="Payables Backlog"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
