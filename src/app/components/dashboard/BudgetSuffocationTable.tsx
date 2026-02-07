import { useState } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface BudgetSuffocationTableProps {
    stats: any[];
    allocations: any[];
}

export const BudgetSuffocationTable: React.FC<BudgetSuffocationTableProps> = ({ stats, allocations }) => {
    const [sortField, setSortField] = useState<'month' | 'shortfallProb'>('month');

    const sortedStats = [...stats].sort((a, b) => {
        if (sortField === 'month') return a.month.localeCompare(b.month);
        return b.shortfallProb - a.shortfallProb;
    });

    return (
        <div className="overflow-x-auto">
            <div className="flex justify-end mb-4 gap-4">
                <button
                    onClick={() => setSortField('month')}
                    className={clsx("text-[10px] font-bold px-3 py-1 rounded transition-colors", sortField === 'month' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
                >
                    BY DATE
                </button>
                <button
                    onClick={() => setSortField('shortfallProb')}
                    className={clsx("text-[10px] font-bold px-3 py-1 rounded transition-colors", sortField === 'shortfallProb' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
                >
                    BY HIGHEST RISK
                </button>
            </div>

            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/50">
                    <tr>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Month</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Planned Inflow</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Realizable (P50)</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Demand (P50)</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Shortfall (P50)</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">Risk Prob.</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedStats.map((s, idx) => {
                        const planned = allocations.find(a => a.month === s.month && a.dept_id === 'ENGINEERING')?.planned_inflow_cr || 0;
                        const prob = s.shortfallProb * 100;

                        let statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                        let statusLabel = "On Track";
                        if (prob > 30) {
                            statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                            statusLabel = "At Risk";
                        }
                        if (prob > 60 || s.shortfallP50 > 5) {
                            statusColor = "bg-rose-500/10 text-rose-500 border-rose-500/20";
                            statusLabel = "Suffocated";
                        }

                        return (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 font-bold text-sm text-slate-300">
                                    {new Date(s.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                </td>
                                <td className="p-4 text-sm text-right text-slate-500 tabular-nums">₹{planned.toFixed(1)}</td>
                                <td className="p-4 text-sm text-right text-white font-medium tabular-nums group-hover:text-blue-400">
                                    ₹{s.engInflowP50.toFixed(1)}
                                    <span className="block text-[10px] text-slate-600 font-normal tracking-tighter">P10: {s.engInflowP10.toFixed(1)} / P90: {s.engInflowP90.toFixed(1)}</span>
                                </td>
                                <td className="p-4 text-sm text-right text-slate-400 tabular-nums">₹{s.engDemandP50.toFixed(1)}</td>
                                <td className="p-4 text-sm text-right text-rose-400 font-bold tabular-nums">₹{s.shortfallP50.toFixed(1)}</td>
                                <td className="p-4 text-center tabular-nums">
                                    <span className={clsx("text-xs font-black", prob > 30 ? "text-amber-500" : "text-slate-500")}>
                                        {prob.toFixed(0)}%
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className={clsx("mx-auto text-[10px] font-black px-2 py-0.5 rounded border inline-flex items-center gap-1 uppercase tracking-widest", statusColor)}>
                                        {statusLabel === 'Suffocated' && <AlertCircle size={10} />}
                                        {statusLabel === 'At Risk' && <AlertTriangle size={10} />}
                                        {statusLabel}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
