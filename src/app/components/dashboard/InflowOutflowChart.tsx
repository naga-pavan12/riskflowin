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
        config,
        results
    } = useProjectStore();

    const samplePaths = results?.samplePaths || [];

    const data = months.map((month, idx) => {
        // Inflows
        const plannedInflow = Object.values(allocations[month] || {}).reduce((a, b) => a + (b || 0), 0);
        const actualInflow = Object.values(actualAllocations[month] || {}).reduce((a, b) => a + (b || 0), 0);

        // Outflows
        // Outflows
        const plannedOutflow = config.entities.reduce((sum, entityName) => {
            const entityData = engineeringDemand[month]?.[entityName];
            if (!entityData) return sum;

            return sum + config.activities.reduce((s, activityName) => {
                const actData = entityData[activityName];
                if (!actData) return s;
                return s + (actData.SERVICE || 0) + (actData.MATERIAL || 0) + (actData.INFRA || 0);
            }, 0);
        }, 0);

        const actualOutflow = config.entities.reduce((sum, entityName) => {
            const entityData = actualOutflows[month]?.[entityName];
            if (!entityData) return sum;

            return sum + config.activities.reduce((s, activityName) => {
                const actData = entityData[activityName];
                if (!actData) return s;
                return s + (actData.SERVICE || 0) + (actData.MATERIAL || 0) + (actData.INFRA || 0);
            }, 0);
        }, 0);

        const isHistorical = month <= config.asOfMonth;

        const dataPoint: any = {
            month,
            displayMonth: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
            'Planned Inflow': plannedInflow,
            'Actual Inflow': isHistorical ? actualInflow : null,
            'Planned Outflow': plannedOutflow,
            'Actual Outflow': isHistorical ? actualOutflow : null,
            isHistorical
        };

        return dataPoint;
    });

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-black tracking-tight">Financial Performance</h3>
                    <p className="text-sm text-zinc-500 mt-1">Planned vs Actuals (Inflow & Outflow)</p>
                </div>
                <div className="flex gap-6 text-xs font-semibold uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-emerald-600"></span>
                        <span className="text-black">Actual Inflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-600 opacity-20 border border-blue-600"></span>
                        <span className="text-zinc-600">Planned Inflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-600"></span>
                        <span className="text-black">Actual Outflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-purple-600 opacity-20 border border-purple-600"></span>
                        <span className="text-zinc-600">Planned Outflow</span>
                    </div>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="displayMonth"
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#000000',
                                borderRadius: '0px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: '#ffffff',
                                padding: '12px'
                            }}
                            itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                            labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}
                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                            filterNull={true}
                            formatter={(value, name) => {
                                if (String(name).startsWith('sim_')) return [null, null];
                                return [`₹${Number(value).toFixed(2)}`, name];
                            }}
                        />

                        {/* Outflows */}
                        <Area
                            type="monotone"
                            dataKey="Planned Outflow"
                            stroke="#9333ea"
                            fill="#9333ea"
                            fillOpacity={0.1}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                        />
                        <Bar
                            dataKey="Actual Outflow"
                            fill="#dc2626"
                            barSize={16} // Thicker bars
                            fillOpacity={1}
                        />

                        {/* Inflows */}
                        <Area
                            type="monotone"
                            dataKey="Planned Inflow"
                            stroke="#2563eb"
                            fill="#2563eb"
                            fillOpacity={0.1}
                            strokeWidth={2}
                            strokeDasharray="4 4"
                        />
                        <Bar
                            dataKey="Actual Inflow"
                            fill="#059669"
                            barSize={16} // Thicker bars
                            fillOpacity={1}
                        />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
