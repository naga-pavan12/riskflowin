import React from 'react';
import { Radar, AlertTriangle, Clock, Info, Maximize2, Pin } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { BreachRadarResults } from '../../../types';

interface BreachRadarProps {
    breachRadar?: BreachRadarResults;
    currentMonth: string;
}

export function BreachRadar({ breachRadar, currentMonth }: BreachRadarProps) {
    const hasBreachRisk = breachRadar && (breachRadar.timeToBreachP50 !== null || breachRadar.timeToBreachP80 !== null);

    const getUrgencyBadge = () => {
        if (!breachRadar || breachRadar.timeToBreachP50 === null) {
            return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Clear Horizon</Badge>;
        }
        if (breachRadar.timeToBreachP50 <= 2) {
            return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Imminent Risk</Badge>;
        }
        if (breachRadar.timeToBreachP50 <= 4) {
            return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">Near-Term Risk</Badge>;
        }
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">Distant Risk</Badge>;
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col min-h-[400px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                        <Radar size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-black">Breach Radar</h3>
                        <p className="text-xs text-zinc-500 font-medium">Time-to-Breach Distribution</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Panel Tools */}
                    <button className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:border-zinc-300 transition-all" aria-label="Info">
                        <Info size={14} />
                    </button>
                    <div className="ml-2">{getUrgencyBadge()}</div>
                </div>
            </div>

            {hasBreachRisk ? (
                <div className="p-6">
                    {/* Time to Breach */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={14} className="text-zinc-400" />
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time-to-Breach (P50)</p>
                            </div>
                            <div className="flex items-baseline gap-1.5 tabular-nums">
                                <span className="text-3xl font-bold text-amber-600">
                                    {breachRadar?.timeToBreachP50 ?? '—'}
                                </span>
                                <span className="text-sm text-zinc-500 font-medium">months</span>
                            </div>
                            {breachRadar?.earliestBreachMonthP50 && (
                                <p className="text-xs text-zinc-400 mt-2 font-mono">
                                    {breachRadar.earliestBreachMonthP50}
                                </p>
                            )}
                        </div>

                        <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-100">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={14} className="text-zinc-400" />
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time-to-Breach (P80)</p>
                            </div>
                            <div className="flex items-baseline gap-1.5 tabular-nums">
                                <span className="text-3xl font-bold text-red-600">
                                    {breachRadar?.timeToBreachP80 ?? '—'}
                                </span>
                                <span className="text-sm text-zinc-500 font-medium">months</span>
                            </div>
                            {breachRadar?.earliestBreachMonthP80 && (
                                <p className="text-xs text-zinc-400 mt-2 font-mono">
                                    {breachRadar.earliestBreachMonthP80}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Placeholder for Chart - if needed later */}
                    <div className="flex items-center justify-center h-48 border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
                        <span className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Breach Distribution Source</span>
                    </div>

                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                    <ShieldCheck size={48} className="mb-4 text-zinc-200" />
                    <p className="text-sm font-medium text-black">No Breach Detected</p>
                    <p className="text-xs mt-1">Simulations show full solvent runway</p>
                </div>
            )}
        </div>
    );
}

// Simple icon component for empty state
function ShieldCheck({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
