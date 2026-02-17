import React, { useState } from 'react';
import type { DeptAllocation, DeptType } from '../../../types';
import { Copy, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../../store/useProjectStore';

export const AllocationsTab: React.FC = () => {
    const { allocations, months, updateAllocation, copyRange, applyFactor } = useProjectStore();
    const data = allocations;

    const [showBulkModal, setShowBulkModal] = useState<'COPY' | 'FACTOR' | null>(null);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [activeMonth, setActiveMonth] = useState(months[0]);
    const [factor, setFactor] = useState(1.1);

    const depts: DeptType[] = ['ENGINEERING'];

    const getMonthTotal = (m: string) =>
        depts.reduce((sum, d) => sum + (data[m]?.[d] || 0), 0);

    const toggleMonth = (m: string) => {
        setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-xl overflow-hidden border border-white/5 relative">
            <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-950 z-10 border-r border-white/5">Month</th>
                                {depts.map(d => (
                                    <th key={d} className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{d} INFLOW PLAN</th>
                                ))}
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right bg-white/5">Monthly Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {months.map(m => (
                                <tr
                                    key={m}
                                    className={clsx(
                                        "hover:bg-white/[0.02] transition-colors group cursor-pointer",
                                        activeMonth === m ? "bg-blue-500/5" : ""
                                    )}
                                    onClick={() => setActiveMonth(m)}
                                >
                                    <td className="p-4 text-xs font-black text-slate-400 sticky left-0 bg-slate-900 group-hover:bg-slate-800 transition-colors border-r border-white/5">
                                        <div className="flex items-center gap-2">
                                            {activeMonth === m && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                                            {new Date(m + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                        </div>
                                    </td>
                                    {depts.map(d => (
                                        <td key={d} className="p-2">
                                            <div className="relative group/input">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">₹</span>
                                                <input
                                                    type="number"
                                                    value={data[m]?.[d] || ''}
                                                    onChange={(e) => updateAllocation(m, d, parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl pl-6 pr-3 py-3 text-sm text-right text-white focus:border-blue-500 outline-none transition-all tabular-nums"
                                                    placeholder="0.0"
                                                />
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-4 text-sm font-black text-right text-slate-300 bg-white/5 tabular-nums tracking-tighter">
                                        ₹{getMonthTotal(m).toFixed(1)} <span className="text-[10px] font-bold text-slate-600 ml-1">CR</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Modals */}
            {showBulkModal && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                                {showBulkModal === 'COPY' ? 'Copy Range' : 'Apply Factor'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {showBulkModal === 'COPY'
                                    ? `Copying all department inflows from ${activeMonth} to selected months.`
                                    : 'Multiplying existing allocations by this factor.'}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {showBulkModal === 'FACTOR' && (
                                <label className="block">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Multiplier (e.g. 1.05 = +5%)</span>
                                    <input
                                        type="number" value={factor} step="0.01"
                                        onChange={e => setFactor(parseFloat(e.target.value) || 1)}
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    />
                                </label>
                            )}

                            <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Months</span>
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto custom-scrollbar p-1">
                                    {months.map(m => (
                                        <button
                                            key={m}
                                            onClick={(e) => { e.stopPropagation(); toggleMonth(m); }}
                                            className={clsx(
                                                "px-2 py-2 rounded-lg text-[10px] font-black border transition-all",
                                                selectedMonths.includes(m)
                                                    ? "bg-blue-600 border-blue-500 text-white"
                                                    : "bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800/50 flex gap-3">
                            <button
                                onClick={() => setShowBulkModal(null)}
                                className="flex-1 px-4 py-2 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-colors uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (showBulkModal === 'COPY') copyRange('ALLOC', 'planned', activeMonth, selectedMonths);
                                    else applyFactor('ALLOC', 'planned', selectedMonths, factor);
                                    setShowBulkModal(null);
                                    setSelectedMonths([]);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 rounded-xl text-xs font-black text-white hover:bg-blue-500 transition-colors uppercase"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-slate-950 border-t border-white/10 p-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inflow Plan BULK TOOLS</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBulkModal('FACTOR')}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 hover:bg-white/5 transition-colors"
                    >
                        <Zap size={14} className="text-amber-500" /> Apply Factor...
                    </button>
                    <button
                        onClick={() => setShowBulkModal('COPY')}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 hover:bg-white/5 transition-colors"
                    >
                        <Copy size={14} className="text-blue-500" /> Copy Range...
                    </button>
                </div>
            </div>
        </div>
    );
};
