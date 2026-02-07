import React from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceArea
} from 'recharts';

interface CoverageChartProps {
    data: Array<{
        month: string;
        realizableInflowP10: number;
        realizableInflowP50: number;
        realizableInflowP90: number;
        plannedOutflowTotal: number;
    }>;
}

export const CoverageChart: React.FC<CoverageChartProps> = ({ data }) => {
    // Transform formatting
    const chartData = data.map(d => ({
        ...d,
        displayMonth: new Date(d.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
        // For Area range, we stack? No, REcharts range area is tricky. 
        // We will fake it with stacked areas: 
        // Bottom (invisible) = P10
        // Middle (Range P10-P90) = P90 - P10 
        baseArea: d.realizableInflowP10,
        rangeArea: d.realizableInflowP90 - d.realizableInflowP10
    }));

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                            <rect width="2" height="4" transform="translate(0,0)" fill="white" fillOpacity={0.1} />
                        </pattern>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-soft)" vertical={false} />
                    <XAxis
                        dataKey="displayMonth"
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={15}
                    />
                    <YAxis
                        stroke="var(--color-text-muted)"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border-soft)',
                            borderRadius: '0.5rem',
                            fontSize: '12px'
                        }}
                        formatter={(val: number | undefined) => `₹${(val || 0).toFixed(1)} Cr`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                    {/* Inflow Range P10-P90 */}
                    <Area
                        type="monotone"
                        dataKey="baseArea"
                        stroke="none"
                        fill="transparent"
                        legendType="none"
                        stackId="1"
                    />
                    <Area
                        type="monotone"
                        dataKey="rangeArea"
                        name="Inflow Range (P10-P90)"
                        stroke="none"
                        fill="url(#splitColor)"
                        stackId="1"
                    />

                    {/* P50 Inflow Line */}
                    <Line
                        type="monotone"
                        dataKey="realizableInflowP50"
                        name="Likely Inflow (P50)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                    />

                    {/* Demand Line */}
                    <Line
                        type="monotone"
                        dataKey="plannedOutflowTotal"
                        name="Eng. Demand (P50)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#ef4444' }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
