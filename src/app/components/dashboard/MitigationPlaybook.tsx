import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import type { MitigationAction } from '../../../sim/mitigation';

interface MitigationPlaybookProps {
    actions: MitigationAction[];
    onApply: (lever: string) => void;
}

export const MitigationPlaybook: React.FC<MitigationPlaybookProps> = ({ actions, onApply }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={20} />
                    Mitigation Playbook
                </h3>
                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded tracking-widest uppercase">
                    {actions.length} Strategy Recommendations
                </span>
            </div>

            <div className="space-y-4">
                {actions.map((action, idx) => (
                    <div
                        key={idx}
                        className="group bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all hover:bg-slate-800/80 cursor-default"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-500/20">
                                {action.owner}
                            </span>
                            <div className="flex gap-1">
                                {action.months.slice(0, 2).map(m => (
                                    <span key={m} className="text-[9px] font-bold text-slate-500 uppercase">
                                        {new Date(m).toLocaleDateString(undefined, { month: 'short' })}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{action.title}</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{action.description}</p>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Prob Flow Risk</span>
                                    <span className="text-[10px] font-black text-emerald-400">Δ {action.impactDeltas.probShortfall * 100}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Worst Shortfall</span>
                                    <span className="text-[10px] font-black text-emerald-400">Δ {action.impactDeltas.worstShortfallCr.toFixed(1)} Cr</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onApply(action.lever)}
                                className="bg-white/5 hover:bg-emerald-500 text-slate-400 hover:text-white p-2 rounded-lg transition-all"
                                title={action.lever}
                            >
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[10px] text-blue-400 leading-tight">
                    <Zap size={10} className="inline mr-1 mb-0.5" />
                    <b>AI Inference:</b> These actions prioritize variance reduction in high-sensitivity months. Applying a lever will re-run the forecast with optimized parameters.
                </p>
            </div>
        </div>
    );
};
