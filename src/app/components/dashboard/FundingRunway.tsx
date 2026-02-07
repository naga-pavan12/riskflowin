import React from 'react';
import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface FundingRunwayProps {
    stats: any[];
}

export const FundingRunway: React.FC<FundingRunwayProps> = ({ stats }) => {
    // Show only the first 6 future months
    const futureStats = stats.filter(s => !s.isHistorical).slice(0, 6);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-950/40">
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Month</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Planned (Eng)</th>
                        <th className="p-4 text-[10px] font-black text-blue-400 uppercase tracking-widest text-right bg-blue-500/5">Safe Spend Limit (P20)</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Planned Outflow</th>
                        <th className="p-4 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Gap To Fix</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {futureStats.map((s, idx) => (
                        <tr key={s.month} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-4 border-r border-white/5">
                                <span className="text-sm font-black text-slate-300">
                                    {new Date(s.month + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                </span>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-400 text-right tabular-nums">
                                ₹{s.plannedAllocation.toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5">CR</span>
                            </td>
                            <td className="p-4 text-sm font-black text-blue-400 text-right tabular-nums bg-blue-500/[0.02]">
                                ₹{s.safeSpendLimit.toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5">CR</span>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-400 text-right tabular-nums">
                                ₹{s.plannedOutflowTotal.toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5">CR</span>
                            </td>
                            <td className={clsx(
                                "p-4 text-sm font-black text-right tabular-nums",
                                s.gapToFix > 0 ? "text-rose-500" : "text-emerald-400"
                            )}>
                                {s.gapToFix > 0 ? `₹${s.gapToFix.toFixed(1)}` : 'Sufficient'}
                                {s.gapToFix > 0 && <span className="text-[10px] opacity-60 ml-0.5 uppercase">CR</span>}
                            </td>
                            <td className="p-4">
                                <div className="flex justify-center">
                                    {s.gapToFix > 5 ? (
                                        <AlertTriangle size={16} className="text-rose-500 shadow-lg shadow-rose-900/20" />
                                    ) : s.gapToFix > 0 ? (
                                        <MinusCircle size={16} className="text-amber-500" />
                                    ) : (
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}

                    {/* Recommendation Row */}
                    <tr className="bg-blue-600/5 border-t-2 border-blue-500/20">
                        <td className="p-4 border-r border-white/5">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Recommended<br />Adjustment</span>
                        </td>
                        <td colSpan={3} className="p-4 text-[10px] font-bold text-slate-500 italic">
                            Align engineering start-dates to match P20 inflow capacity to avoid stoppage risk.
                        </td>
                        <td className="p-4 text-sm font-black text-right text-blue-400 tabular-nums">
                            -₹{futureStats.reduce((sum: number, s: any) => sum + (s.gapToFix || 0), 0).toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5 uppercase">CR</span>
                        </td>
                        <td className="p-4">
                            <div className="flex justify-center px-2 py-1 bg-blue-600 rounded text-[9px] font-black text-white uppercase cursor-pointer hover:bg-blue-500 transition-colors">
                                Apply
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
