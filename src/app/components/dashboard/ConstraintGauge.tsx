import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Gauge } from 'lucide-react';

export function ConstraintGauge() {
    const { results } = useProjectStore();

    // Simplification: Use the MAX score across the horizon to show "Peak Constraint".
    const riskScores = results?.riskScores || [];
    const peakRisk = riskScores.reduce((prev, curr) => curr.score > prev.score ? curr : prev, riskScores[0] || { month: 0, score: 0, breakdown: { velocity: 0, capacity: 0, liquidity: 0 } });

    const velocity = peakRisk.breakdown?.velocity || 0;
    const capacity = peakRisk.breakdown?.capacity || 0;

    return (
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm h-full flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-zinc-400" />
                    Operational Constraints
                </h3>
                <p className="text-xs text-zinc-500">Peak Stress Factors (Month {peakRisk.month})</p>
            </div>

            <div className="space-y-6 mt-4">
                {/* Velocity Gauge */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-600 font-medium">Velocity (Ramp-up)</span>
                        <span className="font-mono text-zinc-500 font-bold">{velocity}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-100">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${velocity > 80 ? 'bg-red-600' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(100, velocity)}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wide">
                        {velocity > 80 ? 'DANGEROUS ACCELERATION' : 'Sustainable Pace'}
                    </p>
                </div>

                {/* Capacity Gauge */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-600 font-medium">Capacity (Burn Rate)</span>
                        <span className="font-mono text-zinc-500 font-bold">{capacity}%</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-100">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${capacity > 80 ? 'bg-red-600' : 'bg-emerald-600'}`}
                            style={{ width: `${Math.min(100, capacity)}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-wide">
                        {capacity > 100 ? 'EXCEEDS ORG LIMIT' : 'Within Limits'}
                    </p>
                </div>
            </div>
        </div>
    );
}
