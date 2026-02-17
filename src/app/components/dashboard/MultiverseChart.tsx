import React from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area
} from 'recharts';
import { useProjectStore } from '../../../store/useProjectStore';

export function MultiverseChart() {
    const {
        months,
        allocations,
        engineeringDemand,
        results,
        config
    } = useProjectStore();

    const samplePaths = results?.samplePaths || [];

    let cumulativePlanned = 0;
    const cumulativeSims = new Array(50).fill(0);

    const data = months.map((month, idx) => {
        // 1. Calculate Monthly Planned
        const monthlyPlanned = config.entities.reduce((sum, entityName) => {
            const entityData = engineeringDemand[month]?.[entityName];
            if (!entityData) return sum;

            return sum + config.activities.reduce((s, activityName) => {
                const actData = entityData[activityName];
                if (!actData) return s;
                return s + (actData.SERVICE || 0) + (actData.MATERIAL || 0) + (actData.INFRA || 0);
            }, 0);
        }, 0);

        // 2. Update Cumulative Planned
        cumulativePlanned += monthlyPlanned;

        const dataPoint: any = {
            month,
            displayMonth: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
            'Planned Baseline': cumulativePlanned,
        };

        // 3. Update & Merge Cumulative Sample Paths
        samplePaths.slice(0, 50).forEach((path, i) => {
            const currentDemand = path.monthlyData[idx]?.cashOutflow ?? 0;
            const prevShortfall = idx > 0 ? (path.monthlyData[idx - 1]?.shortfall ?? 0) : 0;

            // Correction: Subtract previous backlog (shortfall) to get distinct monthly spend
            // Otherwise we double-count the debt carried forward
            const distinctMonthlySpend = Math.max(0, currentDemand - prevShortfall);

            cumulativeSims[i] += distinctMonthlySpend;
            dataPoint[`sim_${i}`] = cumulativeSims[i];
        });

        return dataPoint;
    });

    // Custom Tooltip to summarize the 50 paths instead of listing them
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            // Extract baseline
            const baseline = payload.find((p: any) => p.name === 'Planned Baseline');

            // Extract simulation values
            const simValues = payload
                .filter((p: any) => p.name.startsWith('sim_'))
                .map((p: any) => p.value)
                .sort((a: number, b: number) => a - b);

            if (!baseline || simValues.length === 0) return null;

            const min = simValues[0];
            const max = simValues[simValues.length - 1];
            const p50 = simValues[Math.floor(simValues.length * 0.5)];

            return (
                <div className="bg-white p-3 border border-zinc-200 shadow-xl rounded-lg min-w-[200px]">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wide mb-2">{label}</p>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-600">Planned Baseline</span>
                            <span className="text-xs font-mono font-bold text-black">₹{baseline.value.toFixed(2)}</span>
                        </div>

                        <div className="h-px bg-zinc-100 my-1" />

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">Uncertainty Range</span>
                                <span className="text-[10px] font-mono text-zinc-400">₹{min.toFixed(0)} - ₹{max.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">Median Outcome</span>
                                <span className="text-[10px] font-mono text-zinc-600 font-bold">₹{p50.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-black tracking-tight">The Multiverse</h3>
                    <p className="text-sm text-zinc-500 mt-1">Cumulative Spend: 50 Simulated Futures vs Planned Baseline</p>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F3F3" vertical={false} />
                        <XAxis
                            dataKey="displayMonth"
                            stroke="#757575"
                            tick={{ fill: '#757575', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#757575"
                            tick={{ fill: '#757575', fontSize: 11, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value}`}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E2E2', strokeWidth: 1 }} />

                        {/* Planned Baseline (Reference) */}
                        <Area
                            type="monotone"
                            dataKey="Planned Baseline"
                            stroke="#9333ea"
                            strokeWidth={2}
                            fill="url(#colorBaseline)"
                            fillOpacity={0}
                        />

                        {/* Render P10-P90 Simulation Lines (Middle 80%) */}
                        {Array.from({ length: 50 }).map((_, i) => {
                            // Filter logic: Only show paths that end up in the middle 80% range
                            // This removes the "wild" outliers that distract the user
                            const finalValue = data[data.length - 1][`sim_${i}`];
                            const allFinalValues = Array.from({ length: 50 }).map((_, idx) => data[data.length - 1][`sim_${idx}`]).sort((a, b) => a - b);
                            const p10 = allFinalValues[Math.floor(50 * 0.1)];
                            const p90 = allFinalValues[Math.floor(50 * 0.9)];

                            if (finalValue < p10 || finalValue > p90) return null;

                            return (
                                <Line
                                    key={`sim_${i}`}
                                    type="monotone"
                                    dataKey={`sim_${i}`}
                                    stroke="#276EF1" // Uber Blue
                                    strokeWidth={1}
                                    strokeOpacity={0.15} // Slightly increased opacity since fewer lines
                                    dot={false}
                                    activeDot={false}
                                    isAnimationActive={false} // Performance
                                />
                            );
                        })}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
