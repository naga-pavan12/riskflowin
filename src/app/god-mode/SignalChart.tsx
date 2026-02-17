/**
 * Signal Chart — Mini sparkline for drill-down view
 * Shows 30-day time-series for a specific RiskVector
 */

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import type { SignalData, RiskVector } from '../../types/godMode';

interface SignalChartProps {
    signals: SignalData[];
    vector: RiskVector;
    color?: string;
    height?: number;
}

const VECTOR_LABELS: Record<RiskVector, string> = {
    VELOCITY: 'Work Velocity',
    RESOURCE_DENSITY: 'Labor Density',
    REWORK_BURDEN: 'Rework (DQNs)',
    VENDOR_AGING: 'Vendor Aging',
    UNBILLED_ASSET: 'Unbilled WIP',
    ADVANCE_BURN: 'Advance Remaining',
    BURN_RATE: 'Material Burn',
    LEAD_TIME_VAR: 'Lead Time Δ',
    INDENT_LATENCY: 'Indent Latency',
    DRAWING_GAP: 'Drawing Gap',
    METHODOLOGY_GAP: 'Method Gap',
    WORK_FRONT_GAP: 'Idle Fronts',
};

export function SignalChart({ signals, vector, color = '#6366f1', height = 120 }: SignalChartProps) {
    const filtered = signals
        .filter(s => s.vector === vector)
        .sort((a, b) => a.date.localeCompare(b.date));

    if (filtered.length === 0) {
        return <div className="text-xs text-zinc-400 italic py-4">No data for {VECTOR_LABELS[vector]}</div>;
    }

    const data = filtered.map(s => ({
        date: s.date.slice(5), // MM-DD
        value: s.value,
    }));

    const unit = filtered[0]?.unit || '';

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
                    {VECTOR_LABELS[vector]}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                    {filtered[filtered.length - 1]?.value.toFixed(1)} {unit}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`grad-${vector}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#a1a1aa', fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                        contentStyle={{
                            background: '#18181b',
                            border: 'none',
                            borderRadius: 6,
                            color: '#fff',
                            fontSize: 11,
                            padding: '6px 10px'
                        }}
                        formatter={(val: number | undefined) => [`${(val ?? 0).toFixed(1)} ${unit}`, VECTOR_LABELS[vector]]}
                        labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#grad-${vector})`}
                        dot={false}
                        animationDuration={600}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export { VECTOR_LABELS };
