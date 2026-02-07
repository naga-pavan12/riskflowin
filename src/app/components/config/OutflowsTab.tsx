import React, { useState } from 'react';
import type { OutflowData, ProjectConfig, ComponentType } from '../../../types';
import { Download, Upload, Copy, Zap, Table as TableIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../../store/useProjectStore';

interface OutflowsTabProps {
    dataset: 'planned' | 'projected' | 'actual';
}

export const OutflowsTab: React.FC<OutflowsTabProps> = ({ dataset }) => {
    const { config, months, plannedOutflows, projectedOutflows, actualOutflows, updateOutflow, copyRange, applyFactor } = useProjectStore();

    const data = dataset === 'planned' ? plannedOutflows : dataset === 'projected' ? projectedOutflows : actualOutflows;

    const [activeMonth, setActiveMonth] = useState(months[0]);
    const [showBulkModal, setShowBulkModal] = useState<'COPY' | 'FACTOR' | null>(null);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [factor, setFactor] = useState(1.1);

    const components: ComponentType[] = ['SERVICE', 'MATERIAL', 'INFRA'];

    // Total Calculators
    const getComponentVal = (m: string, e: string, a: string, c: ComponentType) => data[m]?.[e]?.[a]?.[c] || 0;

    const getActivityTotal = (m: string, e: string, a: string) =>
        components.reduce((sum, c) => sum + getComponentVal(m, e, a, c), 0);

    const getEntityTotal = (m: string, e: string) =>
        config.activities.reduce((sum, a) => sum + getActivityTotal(m, e, a), 0);

    const getMonthTotal = (m: string) =>
        config.entities.reduce((sum, e) => sum + getEntityTotal(m, e), 0);

    const toggleMonth = (m: string) => {
        setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const rows = text.split('\n').map(row => row.split('\t'));
            // Logic to map tab-separated values to the grid (Prototype placeholder)
        } catch (e) {
            alert('Paste failed. Ensure data is tab-separated (from Excel).');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-xl overflow-hidden border border-white/5 relative">
            {/* Month Selector */}
            <div className="flex bg-slate-950 p-2 gap-2 overflow-x-auto border-b border-white/5 no-scrollbar">
                {months.map(m => (
                    <button
                        key={m}
                        onClick={() => setActiveMonth(m)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeMonth === m ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {new Date(m + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                        <span className="block text-[9px] opacity-60">₹{getMonthTotal(m).toFixed(1)}</span>
                    </button>
                ))}
            </div>

            {/* Main Grid */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="space-y-8">
                    {config.entities.map(entity => (
                        <div key={entity} className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden">
                            <div className="bg-slate-800/50 px-4 py-2 flex justify-between items-center">
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter">{entity}</h3>
                                <span className="text-xs font-bold text-blue-400">Total: ₹{getEntityTotal(activeMonth, entity).toFixed(2)} Cr</span>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="p-3 text-[10px] uppercase font-black text-slate-500">Activity</th>
                                        {components.map(c => (
                                            <th key={c} className="p-3 text-[10px] uppercase font-black text-slate-500 text-right">{c}</th>
                                        ))}
                                        <th className="p-3 text-[10px] uppercase font-black text-slate-400 text-right bg-white/5">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {config.activities.map(activity => (
                                        <tr key={activity} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="p-3 text-xs font-bold text-slate-300 ">{activity}</td>
                                            {components.map(c => (
                                                <td key={c} className="p-2">
                                                    <input
                                                        type="number"
                                                        value={getComponentVal(activeMonth, entity, activity, c) || ''}
                                                        onChange={(e) => updateOutflow(dataset, activeMonth, entity, activity, c, parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-950 border border-white/5 rounded px-2 py-1 text-xs text-right text-slate-100 focus:border-blue-500 outline-none transition-colors"
                                                        placeholder="0.0"
                                                    />
                                                </td>
                                            ))}
                                            <td className="p-3 text-xs font-bold text-right text-slate-400 bg-white/5 tabular-nums">
                                                {getActivityTotal(activeMonth, entity, activity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
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
                                    ? `Copying data from ${activeMonth} to selected months.`
                                    : 'Multiplying existing values by this factor.'}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {showBulkModal === 'FACTOR' && (
                                <label className="block">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Multiplier (e.g. 1.10 = +10%)</span>
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
                                            onClick={() => toggleMonth(m)}
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
                                    if (showBulkModal === 'COPY') copyRange('OUTFLOW', dataset, activeMonth, selectedMonths);
                                    else applyFactor('OUTFLOW', dataset, selectedMonths, factor);
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

            {/* Bulk Toolbar */}
            <div className="bg-slate-950 border-t border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dataset.toUpperCase()} CONFIGURATION</span>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <button onClick={handlePaste} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                        <TableIcon size={14} /> Paste from Excel
                    </button>
                </div>

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
