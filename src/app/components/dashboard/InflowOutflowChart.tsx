import React from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area
} from 'recharts';
import { useProjectStore } from '../../../store/useProjectStore';

export function InflowOutflowChart() {
    const {
        months,
        allocations,
        actualAllocations,
        engineeringDemand,
        actualOutflows,
        config
    } = useProjectStore();

    const data = months.map(month => {
        // Inflows
        const plannedInflow = Object.values(allocations[month] || {}).reduce((a, b) => a + (b || 0), 0);
        const actualInflow = Object.values(actualAllocations[month] || {}).reduce((a, b) => a + (b || 0), 0);

        // Outflows
        const plannedOutflow = Object.values(engineeringDemand[month] || {}).reduce((sum, entity: any) => {
            return sum + Object.values(entity).reduce((s: number, act: any) => {
                return s + (act.SERVICE || 0) + (act.MATERIAL || 0) + (act.INFRA || 0);
            }, 0);
        }, 0);

        const actualOutflow = Object.values(actualOutflows[month] || {}).reduce((sum, entity: any) => {
            return sum + Object.values(entity).reduce((s: number, act: any) => {
                return s + (act.SERVICE || 0) + (act.MATERIAL || 0) + (act.INFRA || 0);
            }, 0);
        }, 0);

        return {
            month,
            displayMonth: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
            'Planned Inflow': plannedInflow,
            'Actual Inflow': actualInflow,
            'Planned Outflow': plannedOutflow,
            'Actual Outflow': actualOutflow,
            isHistorical: month <= config.asOfMonth
        };
    });

    return (
        <div className="glass-panel rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary tracking-wide">Financial Performance</h3>
                    <p className="text-sm text-text-muted">Planned vs Actuals (Inflow & Outflow)</p>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80"></span>
                        <span className="text-slate-300">Actual Inflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/50"></span>
                        <span className="text-slate-300">Planned Inflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80"></span>
                        <span className="text-slate-300">Actual Outflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/50"></span>
                        <span className="text-slate-300">Planned Outflow</span>
                    </div>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="displayMonth"
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                color: '#f4f4f5'
                            }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
                            cursor={{ fill: '#334155', opacity: 0.2 }}
                        />

                        {/* Outflows */}
                        <Area
                            type="monotone"
                            dataKey="Planned Outflow"
                            stroke="#a855f7"
                            fill="#a855f7"
                            fillOpacity={0.05}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                        />
                        <Bar
                            dataKey="Actual Outflow"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                            fillOpacity={0.9}
                        />

                        {/* Inflows */}
                        <Area
                            type="monotone"
                            dataKey="Planned Inflow"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.05}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                        />
                        <Bar
                            dataKey="Actual Inflow"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                            fillOpacity={0.9}
                        />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
