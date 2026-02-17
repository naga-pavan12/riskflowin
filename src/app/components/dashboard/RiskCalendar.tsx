import React from 'react';
import { clsx } from 'clsx';

interface RiskCalendarProps {
    stats: any[];
}

export const RiskCalendar: React.FC<RiskCalendarProps> = ({ stats }) => {
    // Show the next 12 months from asOfMonth
    const calendarStats = stats.filter(s => !s.isHistorical).slice(0, 12);

    const getHeatColor = (prob: number) => {
        if (prob > 0.5) return 'bg-red-500 border-red-600';
        if (prob > 0.25) return 'bg-amber-400 border-amber-500';
        if (prob > 0.05) return 'bg-emerald-500 border-emerald-600';
        return 'bg-zinc-100 border-zinc-200';
    };

    return (
        <div className="flex gap-1 h-12 pt-0 w-full">
            {calendarStats.map(s => (
                <div
                    key={s.month}
                    className="flex-1 group relative flex flex-col items-center gap-1.5"
                >
                    <div className={clsx(
                        "w-full flex-1 transition-all duration-200 border-b-4",
                        getHeatColor(s.shortfallProb)
                    )} />

                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {new Date(s.month).toLocaleDateString(undefined, { month: 'narrow' })}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 text-center font-bold shadow-xl">
                        <div className="mb-1 opacity-75 text-[10px] uppercase tracking-wider">
                            {new Date(s.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                        </div>
                        <div className="text-sm">
                            {(s.shortfallProb * 100).toFixed(0)}% Risk
                        </div>
                        {/* Triangle */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
                    </div>
                </div>
            ))}
        </div>
    );
};
