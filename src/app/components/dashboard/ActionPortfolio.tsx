import React, { useState } from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import {
    Zap,
    Shield,
    Target,
    ChevronRight,
    Clock,
    Users,
    ArrowRight,
    AlertTriangle,
    TrendingDown,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

// Trigger suggestions based on simulation results
const getTriggerSuggestions = (results: any) => {
    const triggers = [];

    if (results?.kpis?.probShortfallAnyMonth > 0.5) {
        triggers.push({
            condition: 'Shortfall probability > 50%',
            recommendation: 'risk-elimination',
            urgency: 'high'
        });
    } else if (results?.kpis?.probShortfallAnyMonth > 0.25) {
        triggers.push({
            condition: 'Shortfall probability > 25%',
            recommendation: 'cash-smoothing',
            urgency: 'medium'
        });
    }

    if (results?.kpis?.peakPayablesBacklogP80 > 5) {
        triggers.push({
            condition: 'Peak payables backlog > ₹5Cr',
            recommendation: 'cash-smoothing',
            urgency: 'high'
        });
    }

    if (results?.kpis?.redMonthsCount > 2) {
        triggers.push({
            condition: 'More than 2 red months',
            recommendation: 'risk-elimination',
            urgency: 'high'
        });
    }

    return triggers;
};

export const ActionPortfolio: React.FC = () => {
    const { activeScenarios, toggleScenario, results } = useProjectStore();
    const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);

    const triggers = React.useMemo(() => getTriggerSuggestions(results), [results]);

    // Dynamic Calculation Logic
    const portfolios = React.useMemo(() => {
        if (!results) return [];

        // 1. Calculate Total Risk Exposure (Total Gap to Fix across all months)
        // Default to a baseline if no gap, to show *some* potential improvement
        const totalGap = Math.max(results.monthlyStats.reduce((sum: number, stat: any) => sum + (stat.gapToFix || 0), 0), 10);
        const maxShortfallProb = Math.max(...results.monthlyStats.map((s: any) => s.shortfallProb || 0), 0.1);

        // 2. Define Strategies with Heuristics scales
        return [
            {
                id: 'min-disruption',
                name: 'Min Disruption',
                description: 'Smallest operational changes, preserves current commitments',
                icon: Shield,
                color: 'blue',
                strategy: 'Defer only uncommitted scope; no vendor impact',
                // Heuristic: Solves ~15% of the problem
                deltaCashP50: totalGap * 0.15,
                deltaShortfallPct: Math.round(maxShortfallProb * 100 * 0.2),
                actions: [
                    {
                        id: 'MD-001',
                        title: 'Defer non-critical finishing',
                        type: 'SCOPE_CAP',
                        lever: 'Planning',
                        owner: 'PMC Lead',
                        leadTime: 'Immediate',
                        deltaCashP50: (totalGap * 0.08).toFixed(1),
                        deltaShortfallProb: -5,
                        impactLabel: 'Low disruption'
                    },
                    {
                        id: 'MD-002',
                        title: 'Shift Infra provisioning',
                        type: 'DEFERRAL',
                        lever: 'Planning',
                        owner: 'Infra Lead',
                        leadTime: '1 Week',
                        deltaCashP50: (totalGap * 0.07).toFixed(1),
                        deltaShortfallProb: -3,
                        impactLabel: 'Minimal'
                    }
                ]
            },
            {
                id: 'cash-smoothing',
                name: 'Cash Smoothing',
                description: 'Flatten cash peaks by spreading commitments',
                icon: TrendingDown,
                color: 'amber',
                strategy: 'Reduce invoice lag impact; accelerate slower invoices',
                // Heuristic: Solves ~35% of the problem
                deltaCashP50: totalGap * 0.35,
                deltaShortfallPct: Math.round(maxShortfallProb * 100 * 0.45),
                actions: [
                    {
                        id: 'CS-001',
                        title: 'Split large POs into tranches',
                        type: 'LAG_REDUCTION',
                        lever: 'Procurement',
                        owner: 'Supply Chain',
                        leadTime: '2 Weeks',
                        deltaCashP50: (totalGap * 0.20).toFixed(1),
                        deltaShortfallProb: -12,
                        impactLabel: 'Vendor negotiation'
                    },
                    {
                        id: 'CS-003',
                        title: 'Negotiate extended terms',
                        type: 'LAG_REDUCTION',
                        lever: 'Governance',
                        owner: 'VP Finance',
                        leadTime: '3 Weeks',
                        deltaCashP50: (totalGap * 0.15).toFixed(1),
                        deltaShortfallProb: -8,
                        impactLabel: 'Contract amendment'
                    }
                ]
            },
            {
                id: 'risk-elimination',
                name: 'Risk Elimination',
                description: 'Full hedge against adverse scenarios',
                icon: Target,
                color: 'emerald',
                strategy: 'Lock in prices; cap committed scope; draw reserves',
                // Heuristic: Solves ~95% of the problem
                deltaCashP50: totalGap * 0.95,
                deltaShortfallPct: Math.round(maxShortfallProb * 100 * 0.90),
                actions: [
                    {
                        id: 'RE-001',
                        title: 'Hedge Allocations (100% Coverage)',
                        type: 'HEDGING',
                        lever: 'Finance',
                        owner: 'CFO',
                        leadTime: 'Immediate',
                        deltaCashP50: (totalGap * 0.50).toFixed(1),
                        deltaShortfallProb: -40,
                        impactLabel: 'Capital intensive'
                    },
                    {
                        id: 'RE-002',
                        title: 'Cap Material Scope',
                        type: 'SCOPE_CUT',
                        lever: 'Engineering',
                        owner: 'Project Director',
                        leadTime: '1 Month',
                        deltaCashP50: (totalGap * 0.45).toFixed(1),
                        deltaShortfallProb: -35,
                        impactLabel: 'Significant scope reduction'
                    }
                ]
            }
        ];
    }, [results]);

    const colorStyles: any = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            iconBg: 'bg-blue-100',
            badge: 'bg-blue-100 text-blue-700 border-blue-200'
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
            iconBg: 'bg-amber-100',
            badge: 'bg-amber-100 text-amber-700 border-amber-200'
        },
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            iconBg: 'bg-emerald-100',
            badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        }
    };

    return (
        <div className="p-8 space-y-8">
            {/* Trigger Alerts */}
            {triggers.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                    {triggers.map((trigger, idx) => (
                        <div
                            key={idx}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg border",
                                trigger.urgency === 'high'
                                    ? "bg-red-50 border-red-200"
                                    : "bg-amber-50 border-amber-200"
                            )}
                        >
                            <AlertTriangle size={14} className={trigger.urgency === 'high' ? 'text-red-600' : 'text-amber-600'} />
                            <span className="text-sm text-black font-medium">{trigger.condition}</span>
                            <ArrowRight size={12} className="text-zinc-400" />
                            <Badge variant="outline" className={clsx("bg-white border-zinc-200 text-black", colorStyles[portfolios.find(p => p.id === trigger.recommendation)?.color as keyof typeof colorStyles]?.text)}>
                                {portfolios.find(p => p.id === trigger.recommendation)?.name}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            {/* Portfolio Cards */}
            <div className="grid grid-cols-3 gap-6">
                {portfolios.map(portfolio => {
                    const Icon = portfolio.icon;
                    const isSelected = selectedPortfolio === portfolio.id;
                    const colorClass = portfolio.color === 'blue' ? 'text-blue-600' :
                        portfolio.color === 'amber' ? 'text-amber-600' :
                            'text-emerald-600';
                    const styles = colorStyles[portfolio.color];

                    return (
                        <Card
                            key={portfolio.id}
                            className={clsx(
                                "relative overflow-hidden cursor-pointer transition-all duration-300",
                                isSelected
                                    ? `ring-2 ring-[var(--accent-${portfolio.color})] shadow-lg`
                                    : "hover:border-zinc-300 hover:shadow-md border-zinc-200"
                            )}
                            onClick={() => setSelectedPortfolio(portfolio.id)}
                        >
                            {portfolio.id === 'risk-elimination' && (
                                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-emerald-400" />
                                    Recommended
                                </div>
                            )}

                            <div className="p-5 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg bg-${portfolio.color}-50`}>
                                        <Icon className={`w-6 h-6 ${colorClass}`} />
                                    </div>
                                    <ChevronRight className={clsx(
                                        "w-5 h-5 text-zinc-300 transition-transform",
                                        isSelected && "transform rotate-90 text-black"
                                    )} />
                                </div>

                                <div className="mb-4 flex-1">
                                    <h3 className="text-base font-bold text-black mb-1">
                                        {portfolio.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                                        {portfolio.description}
                                    </p>
                                </div>

                                {/* Impact Stats */}
                                <div className="grid grid-cols-2 gap-3 mt-auto mb-4">
                                    <div className="bg-emerald-50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1">
                                            Delta Cash P50
                                        </div>
                                        <div className="text-sm font-bold text-emerald-700 tabular-nums">
                                            +₹{portfolio.deltaCashP50.toFixed(1)} Cr
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 rounded-lg p-2.5">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1">
                                            Shortfall ↓
                                        </div>
                                        <div className="text-sm font-bold text-emerald-600 tabular-nums">
                                            -{portfolio.deltaShortfallPct}%
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Count */}
                                <div className="flex items-center justify-between text-xs pt-4 border-t border-zinc-100">
                                    <span className="text-zinc-400 font-medium">{portfolio.actions.length} actions available</span>
                                    <span className={clsx("font-bold", styles?.text)}>View details</span>
                                </div>
                            </div>

                            {/* Expanded Actions */}
                            {isSelected && (
                                <div className="bg-zinc-50 border-t border-zinc-200 p-6 space-y-3">
                                    {portfolio.actions.map(action => {
                                        const isActive = activeScenarios.includes(action.id);
                                        return (
                                            <div
                                                key={action.id}
                                                className={clsx(
                                                    "flex items-center justify-between p-4 rounded-lg border transition-all shadow-sm cursor-pointer",
                                                    isActive
                                                        ? "bg-emerald-50 border-emerald-200"
                                                        : "bg-white border-zinc-200 hover:border-zinc-300"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleScenario(action.id);
                                                }}
                                            >
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-sm font-bold text-black">{action.title}</span>
                                                        <Badge variant="outline" className="bg-white text-zinc-600 border-zinc-200 text-[10px] uppercase font-bold">{action.lever}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={12} className="text-zinc-400" /> {action.leadTime}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Users size={12} className="text-zinc-400" /> {action.owner}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase">Delta</p>
                                                        <p className="text-sm font-bold text-emerald-600">+₹{action.deltaCashP50} Cr</p>
                                                    </div>
                                                    <button
                                                        className={clsx(
                                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
                                                            isActive
                                                                ? "bg-emerald-600 text-white"
                                                                : "bg-white text-zinc-300 border border-zinc-200 hover:text-black hover:border-black"
                                                        )}
                                                    >
                                                        {isActive ? <CheckCircle2 size={16} /> : <div className="w-3 h-3 rounded-full bg-current" />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
