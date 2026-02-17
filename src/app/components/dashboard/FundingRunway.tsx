import React from 'react';
import { AlertTriangle, CheckCircle2, MinusCircle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/button';

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
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-200">Month</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-black uppercase tracking-wider text-right bg-blue-50/50">Safe Spend Limit<br />(P20)</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Cash<br />Demand (P50)</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-black uppercase tracking-wider text-right">Gap To Fix</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {futureStats.map((s, idx) => (
                        <tr key={s.month} className="hover:bg-zinc-50 transition-colors group">
                            <td className="px-5 py-4 border-r border-zinc-100">
                                <span className="text-sm font-bold text-black">
                                    {new Date(s.month + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                </span>
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-blue-600 text-right tabular-nums bg-blue-50/30">
                                ₹{s.safeSpendLimit.toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5 text-zinc-500">CR</span>
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-zinc-500 text-right tabular-nums">
                                ₹{s.cashOutflowP50.toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5">CR</span>
                            </td>
                            <td className={clsx(
                                "px-5 py-4 text-sm font-bold text-right tabular-nums",
                                s.gapToFix > 0 ? "text-red-600" : "text-emerald-600"
                            )}>
                                {s.gapToFix > 0 ? `₹${s.gapToFix.toFixed(1)}` : 'Sufficient'}
                                {s.gapToFix > 0 && <span className="text-[10px] text-zinc-400 ml-0.5 uppercase">CR</span>}
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex justify-center">
                                    {s.gapToFix > 5 ? (
                                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                            <AlertTriangle size={12} />
                                            Active
                                        </div>
                                    ) : s.gapToFix > 0 ? (
                                        <MinusCircle size={18} className="text-amber-500" />
                                    ) : (
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}

                    {/* Recommendation Row */}
                    <tr className="bg-blue-50 border-t border-blue-100">
                        <td className="px-5 py-4 border-r border-blue-100">
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider leading-none">Recommended<br />Adjustment</span>
                        </td>
                        <td colSpan={2} className="px-5 py-4 text-[11px] font-medium text-blue-800">
                            Align engineering start-dates to match P20 inflow capacity to avoid stoppage risk.
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-right text-blue-700 tabular-nums">
                            -₹{futureStats.reduce((sum: number, s: any) => sum + (s.gapToFix || 0), 0).toFixed(1)} <span className="text-[10px] opacity-60 ml-0.5 uppercase">CR</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                            <button className="text-[10px] font-bold uppercase tracking-wide bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700 transition-colors inline-flex items-center gap-1 shadow-sm">
                                Apply <ArrowRight size={10} />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
