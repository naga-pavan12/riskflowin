import React, { useState } from 'react';
import { Activity, RotateCcw, ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../../store/useProjectStore';
import { VPDashboard } from './VPDashboard';
import { ScenarioBar } from './ScenarioBar';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export const ExecutiveConsole: React.FC = () => {
    const store = useProjectStore();
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[var(--color-bg-base)]">
            <ScenarioBar />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Decision Control Header */}
                <header className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-brand mb-2">
                            <ArrowUpRight size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Executive Decision Console</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Risk<span className="text-blue-500">Inflow</span>
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest leading-none">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Real-Time Modeling
                            </span>
                            <span className="opacity-20">|</span>
                            <span className="font-bold">{store.config.name}</span>
                            <span className="opacity-20">|</span>
                            <span>{store.months[0]} – {store.months[store.months.length - 1]}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDiagnostics(!showDiagnostics)}
                            className={clsx(
                                "p-2 rounded-lg border transition-all",
                                showDiagnostics ? "bg-slate-800 border-white/20 text-white" : "border-white/5 text-slate-500 hover:text-slate-300"
                            )}
                            title="Toggle Diagnostics"
                        >
                            <Activity size={18} />
                        </button>
                        <button
                            onClick={store.triggerSimulation}
                            disabled={store.loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all flex items-center gap-2"
                        >
                            {store.loading ? <Activity size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Refresh Engine
                        </button>
                    </div>
                </header>

                {showDiagnostics && (
                    <div className="px-8 mt-6">
                        <DiagnosticsPanel />
                    </div>
                )}

                <VPDashboard />
            </div>
        </div>
    );
};
