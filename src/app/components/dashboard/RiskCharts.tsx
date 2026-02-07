import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SimulationResults } from '../../../types';

// Executive color palette
const COLORS = {
    brand: '#4B8BFF',
    danger: '#E05A5A',
    dangerLight: '#E78585',
    warning: '#F2B84B',
    muted: '#7F8DA6',
    grid: '#1E2A44',
    bg: '#121F38',
    text: '#A9B6CC',
};

const tooltipStyle = {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.grid,
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

export const TornadoChart: React.FC<{ results: SimulationResults }> = ({ results }) => {
    // Map Top Drivers to Chart Data
    const drivers = results.kpis.topDrivers.map((d, i) => ({
        key: d.name,
        impactCr: d.contribution,
        lever: d.lever
    }));

    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={drivers} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: COLORS.text }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v => `₹${v.toFixed(0)}`}
                    />
                    <YAxis
                        dataKey="key"
                        type="category"
                        tick={{ fontSize: 10, fill: COLORS.text }}
                        width={140}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 20)}...` : val}
                    />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ fontSize: 12, fontWeight: 600 }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(1)} Cr`, 'Risk Contribution']}
                        labelFormatter={(label, payload) => {
                            const lever = payload?.[0]?.payload?.lever;
                            return (
                                <div>
                                    <div className="font-semibold">{label}</div>
                                    {lever && <div className="text-xs text-brand mt-1">Lever: {lever}</div>}
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey="impactCr" name="Impact" radius={[0, 4, 4, 0]} barSize={18}>
                        {drivers.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? COLORS.danger : index < 3 ? COLORS.warning : COLORS.brand}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
