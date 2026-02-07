import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Tag, Play, RotateCcw, Zap, Clock, Users } from 'lucide-react';
import { clsx } from 'clsx';

export const ActionPortfolio: React.FC = () => {
    const { activeScenarios, toggleScenario, results } = useProjectStore();

    const recommendedActions = [
        {
            id: 'PRO-001',
            title: 'Defer Tower B Civil Works',
            lever: 'Planning',
            owner: 'PMC Lead',
            leadTime: 'Immediate',
            effort: 'Low',
            roi: '8.4 Cr Delta',
            impact: 'Significant reduction in Dec-Jan shortfall risk',
            description: 'Pausing non-critical civil works for 2 months to preserve engineering liquidity.'
        },
        {
            id: 'GOV-002',
            title: 'Tighten Marketing Overruns',
            lever: 'Governance',
            owner: 'VP Finance',
            leadTime: '2 Weeks',
            effort: 'High',
            roi: '12.0 Cr Delta',
            impact: 'Zeroes out non-eng priority cuts in Q1',
            description: 'Enforcing strict budget caps for Marketing to prevent spillover into Engineering pool.'
        },
        {
            id: 'EXEC-003',
            title: 'Material Advanced Procurement',
            lever: 'Procurement',
            owner: 'Supply Chain',
            leadTime: '1 Month',
            effort: 'Medium',
            roi: '4.2 Cr Delta',
            impact: 'Protects against steel/cement price volatility',
            description: 'Bulk buy critical inventory now to lock in prices and reduce future demand variance.'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
            {recommendedActions.map(action => {
                const isActive = activeScenarios.includes(action.id);
                return (
                    <div
                        key={action.id}
                        className={clsx(
                            "group flex flex-col bg-slate-900 border rounded-2xl p-6 transition-all duration-300",
                            isActive
                                ? "border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/20"
                                : "border-white/5 hover:border-white/10"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className={clsx(
                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                action.lever === 'Planning' ? "text-blue-400 border-blue-500/20 bg-blue-500/5" :
                                    action.lever === 'Governance' ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                                        "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                            )}>
                                {action.lever}
                            </span>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-500 uppercase block leading-none">ROI Impact</span>
                                <span className="text-sm font-black text-emerald-400 tabular-nums">+{action.roi}</span>
                            </div>
                        </div>

                        <h4 className="text-md font-black text-white uppercase tracking-tight mb-2 leading-tight">
                            {action.title}
                        </h4>

                        <p className="text-xs text-slate-500 mb-6 flex-1 line-clamp-2 italic">
                            "{action.description}"
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-slate-600" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{action.leadTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={12} className="text-slate-600" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{action.owner}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleScenario(action.id)}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-lg"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                )}
                            >
                                {isActive ? (
                                    <> <RotateCcw size={12} /> Reset to Baseline </>
                                ) : (
                                    <> <Play size={10} /> Preview Action </>
                                )}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
