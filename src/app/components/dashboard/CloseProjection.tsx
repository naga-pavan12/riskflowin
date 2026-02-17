import React from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { NowCastResults } from '../../../types';
import { Button } from '../ui/button';

interface CloseProjectionProps {
    nowCast?: NowCastResults;
    plannedTotal: number;
    currentMonth: string;
    onActionClick?: (actionId: string) => void;
}

export function CloseProjection({
    nowCast,
    plannedTotal,
    currentMonth,
    onActionClick
}: CloseProjectionProps) {
    const exceedProbPercent = nowCast ? (nowCast.probExceedPlan * 100) : 0;
    const status = exceedProbPercent > 60 ? 'severe' : exceedProbPercent > 30 ? 'watch' : 'low';

    const statusBadges = {
        severe: 'bg-red-50 text-red-700 border-red-200',
        watch: 'bg-amber-50 text-amber-700 border-amber-200',
        low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    return (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col min-h-[400px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                        <TrendingUp size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-black">Current Month Close</h3>
                        <p className="text-xs text-zinc-500 font-medium">{currentMonth} Projection</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-50 text-zinc-400 hover:text-black">
                        <Info size={16} />
                    </Button>
                    <Badge className={`ml-2 border ${statusBadges[status]}`}>
                        {status === 'severe' ? 'High Risk' : status === 'watch' ? 'Watch' : 'On Track'}
                    </Badge>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* EOM Cash Due */}
                    <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">EOM Cash Due</p>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-zinc-400 text-lg font-semibold">₹</span>
                            <span className="text-3xl font-bold text-black">
                                {(nowCast?.eomCashDueP50 ?? 0).toFixed(1)}
                            </span>
                            <span className="text-sm text-zinc-500 font-medium ml-0.5">Cr</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 font-mono tabular-nums">
                            P80: ₹{(nowCast?.eomCashDueP80 ?? 0).toFixed(1)} Cr
                        </p>
                    </div>

                    {/* Exceed Plan Probability */}
                    <div className="bg-zinc-50 rounded-lg p-5 border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Exceed Plan Risk</p>
                        <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className={`text-3xl font-bold ${status === 'severe' ? 'text-red-600' : status === 'watch' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {exceedProbPercent.toFixed(0)}%
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2">
                            Probability of overspending
                        </p>
                    </div>
                </div>

                {/* Variance Detail */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-600 font-medium">Planned Total</span>
                        <span className="font-bold text-black border-b border-dashed border-zinc-300">₹{plannedTotal.toFixed(1)} Cr</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-medium uppercase tracking-wide">Variance Drivers</span>
                            <span className="text-zinc-400">Impact</span>
                        </div>
                        {/* Variance Drivers from Simulation */}
                        {nowCast?.topDrivers?.map((driver, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-50">
                                <span className="text-sm text-black">{driver.label}</span>
                                <span className={`text-sm font-bold ${driver.contribution > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {driver.contribution > 0 ? '+' : ''}₹{Math.abs(driver.contribution).toFixed(1)} Cr
                                </span>
                            </div>
                        ))}
                        {(!nowCast?.topDrivers || nowCast.topDrivers.length === 0) && (
                            <div className="text-xs text-zinc-400 italic py-2">No significant drivers detected</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
