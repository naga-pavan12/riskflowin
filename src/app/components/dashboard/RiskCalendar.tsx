import React from 'react';
import { clsx } from 'clsx';

interface RiskCalendarProps {
    stats: any[];
}

export const RiskCalendar: React.FC<RiskCalendarProps> = ({ stats }) => {
    // Show the next 12 months from asOfMonth
    const calendarStats = stats.filter(s => !s.isHistorical).slice(0, 12);

    const getHeatColor = (prob: number) => {
        if (prob > 0.5) return 'bg-rose-500 shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)]';
        if (prob > 0.25) return 'bg-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)]';
        if (prob > 0.05) return 'bg-emerald-500/80';
        return 'bg-slate-800/50';
    };

    return (
        <div className="flex gap-2 h-16 pt-2">
            {calendarStats.map(s => (
                <div
                    key={s.month}
                    className="flex-1 group relative flex flex-col items-center gap-2"
                >
                    <div className={clsx(
                        "w-full flex-1 rounded-md transition-all duration-300 group-hover:scale-105 border border-white/5",
                        getHeatColor(s.shortfallProb)
                    )} />

                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        {new Date(s.month).toLocaleDateString(undefined, { month: 'narrow' })}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-36 bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 translate-y-2 group-hover:translate-y-0">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                            {new Date(s.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-white">
                            <span className="text-slate-500">Risk Prob:</span>
                            <span className={clsx(
                                "tabular-nums",
                                s.shortfallProb > 0.25 ? 'text-rose-500' : 'text-emerald-400'
                            )}>
                                {(s.shortfallProb * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
