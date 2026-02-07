import React from 'react';
import { clsx } from 'clsx';
import { ResponsiveContainer } from 'recharts';

interface RiskHeatmapProps {
    data: Array<{
        month: string;
        shortfallProb: number;
        shortfallP80: number;
    }>;
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
    return (
        <div className="h-full w-full flex flex-col justify-center">
            <div className="grid grid-cols-12 gap-2 auto-rows-max mx-auto max-w-lg">
                {data.map((d, i) => {
                    // Color scale based on probability
                    const prob = d.shortfallProb;
                    let bgColor = 'bg-bg-subtle';
                    let textColor = 'text-text-muted';

                    if (prob >= 0.5) { bgColor = 'bg-red-900/80'; textColor = 'text-white'; }
                    else if (prob >= 0.3) { bgColor = 'bg-red-900/40'; textColor = 'text-red-200'; }
                    else if (prob >= 0.1) { bgColor = 'bg-amber-900/40'; textColor = 'text-amber-200'; }
                    else if (prob > 0) { bgColor = 'bg-blue-900/20'; textColor = 'text-blue-200'; }

                    return (
                        <div
                            key={d.month}
                            className={clsx(
                                "aspect-square rounded flex flex-col items-center justify-center p-1 cursor-help group relative border border-white/5",
                                bgColor
                            )}
                        >
                            <span className={clsx("text-[10px] font-bold uppercase", textColor)}>
                                {new Date(d.month).toLocaleDateString(undefined, { month: 'narrow' })}
                            </span>
                            <span className={clsx("text-[9px]", textColor)}>
                                {new Date(d.month).getFullYear().toString().substr(2)}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 w-48 p-3 bg-bg-elevated rounded-lg text-xs hidden group-hover:block z-50 shadow-xl border border-border-soft">
                                <div className="font-bold text-text-primary mb-1">
                                    {new Date(d.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">Shortfall Prob:</span>
                                        <span className="font-mono">{(d.shortfallProb * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">P80 Severity:</span>
                                        <span className="font-mono text-danger">₹{d.shortfallP80.toFixed(1)} Cr</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-muted">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-bg-subtle border border-white/5"></span> Safe</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-900/20 border border-white/5"></span> Low Risk</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-900/40 border border-white/5"></span> Watch</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-900/80 border border-white/5"></span> Critical</div>
            </div>
        </div>
    );
};
