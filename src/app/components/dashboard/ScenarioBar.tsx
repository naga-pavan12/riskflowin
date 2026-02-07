import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { X, RotateCcw, Zap } from 'lucide-react';

export const ScenarioBar: React.FC = () => {
    const { activeScenarios, toggleScenario, resetScenarios } = useProjectStore();

    if (activeScenarios.length === 0) return null;

    return (
        <div className="bg-blue-600/10 border-b border-blue-500/20 px-8 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={10} /> Active Scenarios:
                </span>
                <div className="flex flex-wrap gap-2">
                    {activeScenarios.map((id: string) => (
                        <div
                            key={id}
                            className="bg-blue-600 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg shadow-blue-900/40"
                        >
                            <span className="text-[10px] font-black text-white uppercase tracking-tight">{id}</span>
                            <button
                                onClick={() => toggleScenario(id)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={resetScenarios}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
            >
                <RotateCcw size={12} /> Reset to Baseline
            </button>
        </div>
    );
};
