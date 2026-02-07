import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const TornadoChart: React.FC<{ drivers: any[] }> = ({ drivers }) => {
    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={drivers} margin={{ left: 60, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="key"
                        type="category"
                        tick={{ fontSize: 9, fill: '#94a3b8', width: 60 }}
                        width={80}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '12px' }}
                        cursor={{ fill: '#ffffff05' }}
                        formatter={(val: any) => [`₹${Number(val || 0).toFixed(2)} Cr Impact`, 'Variance contribution']}
                    />
                    <Bar dataKey="impactCr" radius={[0, 4, 4, 0]} barSize={12}>
                        {drivers.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f43f5e' : index < 3 ? '#fb7185' : '#3b82f6'} fillOpacity={1 - (index * 0.1)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
