import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProjectStore } from '../../../store/useProjectStore';
import { Wind } from 'lucide-react';

export function SensitivityTornado() {
    const { results } = useProjectStore();
    const sensitivity = results?.sensitivityAnalysis || [];

    if (sensitivity.length === 0) return null;

    // Transform for Recharts
    const data = sensitivity.map(s => ({
        name: s.factor,
        impact: s.impactOnShortfall, // Value
        fill: '#E11900' // Uber Red for risk
    })).sort((a, b) => b.impact - a.impact);

    return (
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-black mb-1 flex items-center gap-2">
                <Wind className="w-5 h-5 text-zinc-400" />
                Risk Sensitivity
            </h3>
            <p className="text-xs text-zinc-500 mb-4">Impact of +20% shock on P80 Shortfall</p>
            <div className="flex-1 w-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E2E2" opacity={0.5} />
                        <XAxis type="number" stroke="#757575" fontSize={10} tickFormatter={(val) => `₹${val}Cr`} />
                        <YAxis dataKey="name" type="category" stroke="#545454" fontSize={10} width={80} tick={{ fill: '#000000', fontSize: 10, fontWeight: 500 }} />
                        <Tooltip
                            cursor={{ fill: '#F3F3F3' }}
                            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E2E2', color: '#000000', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`+₹${Number(value).toFixed(2)} Cr`, 'Shortfall Increase']}
                        />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
