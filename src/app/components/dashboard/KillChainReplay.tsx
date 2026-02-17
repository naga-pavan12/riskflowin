import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Zap, TrendingDown } from 'lucide-react';

export function KillChainReplay() {
    const { results } = useProjectStore();
    const killChain = results?.killChain;

    if (!killChain || killChain.events.length === 0) {
        return (
            <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[250px]">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <TrendingDown className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-black">No Critical Events</h3>
                <p className="text-xs text-zinc-500 mt-1">The simulation found no major catastrophes in the worst-case scenario.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm h-full flex flex-col max-h-[400px] min-h-[250px]">
            <div className="mb-4 flex-shrink-0">
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Kill Chain Replay
                </h3>
                <p className="text-xs text-zinc-500">
                    Anatomy of the worst-case iteration (Total Shortfall: <span className="text-red-600 font-mono font-bold">₹{killChain.totalShortfall.toFixed(1)}Cr</span>)
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {killChain.events.map((event, idx) => (
                    <div key={idx} className="relative pl-6 pb-1 border-l border-zinc-200 last:border-l-0">
                        <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${event.severity === 'CRITICAL' ? 'bg-red-600 shadow-md' :
                            event.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />

                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{event.month}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${event.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                                event.severity === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>{event.impactType}</span>
                        </div>
                        <p className="text-sm text-zinc-800 leading-snug">{event.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
