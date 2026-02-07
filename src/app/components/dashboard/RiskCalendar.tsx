import React from 'react';
import { clsx } from 'clsx';

interface RiskCalendarProps {
    stats: any[];
}

export const RiskCalendar: React.FC<RiskCalendarProps> = ({ stats }) => {
    // Show the next 12 months from asOfMonth
    const calendarStats = stats.filter(s => !s.isHistorical).slice(0, 12);

    const getHeatColor = (prob: number) => {
        if (prob > 0.3) return 'bg-rose-500';
        if (prob > 0.15) return 'bg-amber-500';
        if (prob > 0.05) return 'bg-emerald-500/50';
        return 'bg-slate-800';
    };

    return (
        <div className="flex gap-1 h-12">
            {calendarStats.map(s => (
                <div
                    key={s.month}
                    className="flex-1 group relative flex flex-col gap-1"
                >
                    <div className={clsx(
                        "flex-1 rounded-sm transition-all group-hover:scale-110",
                        getHeatColor(s.shortfallProb)
                    )} />
                    <span className="text-[8px] font-black text-slate-700 uppercase self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(s.month).toLocaleDateString(undefined, { month: 'narrow' })}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-slate-950 border border-white/10 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20">
                        <div className="text-[9px] font-black text-slate-500 uppercase mb-1">{s.month}</div>
                        <div className="flex justify-between items-center text-xs font-black text-white">
                            <span>Risk:</span>
                            <span className={s.shortfallProb > 0.15 ? 'text-rose-500' : 'text-emerald-400'}>
                                {(s.shortfallProb * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
