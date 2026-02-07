import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Terminal, Database, Activity } from 'lucide-react';

export const DiagnosticsPanel: React.FC = () => {
    const { results } = useProjectStore();

    if (!results || !results.kpis.diagnostics) return null;

    const d = results.kpis.diagnostics;

    return (
        <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Terminal size={16} className="text-slate-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engine Diagnostics</h4>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Horizon</span>
                    <span className="text-xs font-black text-slate-400">{d.horizonMonths} Months</span>
                </div>
                <div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">PRNG Seed</span>
                    <span className="text-xs font-black text-slate-400 font-mono tracking-tighter">#0x{d.seed.toString(16).toUpperCase()}</span>
                </div>
                <div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Simulation Iters</span>
                    <span className="text-xs font-black text-slate-400">5,000</span>
                </div>
                <div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Cholesky Decomposition</span>
                    <span className={`text-xs font-black ${d.choleskySuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {d.choleskySuccess ? 'VALID' : 'FAILED (Jitter Applied)'}
                    </span>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Input Grounding (Eng)</span>
                    <span className="text-[10px] font-black text-white">₹{d.plannedTotalEngInflow.toFixed(1)} Cr</span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(100, (d.simTotalEngInflowP50 / d.plannedTotalEngInflow) * 100)}%` }}
                    />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-[8px] font-bold text-slate-700 uppercase leading-none">Sim P50 Realizable</span>
                    <span className="text-[9px] font-black text-blue-400 leading-none">₹{d.simTotalEngInflowP50.toFixed(1)} Cr</span>
                </div>
            </div>
        </div>
    );
};
