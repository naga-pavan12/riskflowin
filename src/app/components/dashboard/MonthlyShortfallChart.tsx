import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

export const MonthlyShortfallChart: React.FC<{ data: any[] }> = ({ data }) => {
    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                    <XAxis
                        dataKey="month"
                        tickFormatter={t => new Date(t).toLocaleDateString(undefined, { month: 'short' })}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Shortfall (Cr)', angle: -90, position: 'insideLeft', fontSize: 10, dx: -10, fill: '#64748b' }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#white', fontSize: '12px' }}
                        cursor={{ fill: '#ffffff05' }}
                    />
                    <Bar dataKey="shortfallP50" name="P50 Shortfall" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line
                        type="monotone"
                        dataKey="shortfallProb"
                        name="Risk Prob %"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        yAxisId={0}
                        connectNulls
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
