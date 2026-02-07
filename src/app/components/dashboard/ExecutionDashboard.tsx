import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { OutflowData, ProjectConfig } from '../../../types';

interface ExecutionDashboardProps {
    planned: OutflowData;
    projected: OutflowData;
    actual: OutflowData;
    config: ProjectConfig;
    months: string[];
}

export const ExecutionDashboard: React.FC<ExecutionDashboardProps> = ({
    planned, projected, actual, config, months
}) => {
    const chartData = months.map(m => {
        const p = sumOutflows(planned[m], config);
        const proj = sumOutflows(projected[m], config);
        const act = sumOutflows(actual[m], config);
        return { month: m, planned: p, projected: proj, actual: act };
    });

    return (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 shadow-2xl">
            <div className="mb-8 border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Engineering Execution Variance</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Comparing planned, projected and actual outflows (Deterministic)</p>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickFormatter={t => new Date(t).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: '₹ Cr', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10, fontWeight: 900 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                            cursor={{ fill: '#ffffff05' }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            iconType="circle"
                        />
                        <Bar dataKey="planned" name="Eng. Demand (Monthly)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="projected" name="Projected (Forecast)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="actual" name="Actual (Recorded)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

function sumOutflows(data: Record<string, any> | undefined, config: ProjectConfig) {
    if (!data) return 0;
    let total = 0;
    // Only sum entities and activities that are in the current config
    config.entities.forEach(entity => {
        const entityData = data[entity];
        if (!entityData) return;
        config.activities.forEach(activity => {
            const activityData = entityData[activity];
            if (!activityData) return;
            Object.values(activityData).forEach(val => {
                total += (val as number) || 0;
            });
        });
    });
    return total;
}
