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

// Portfolio Definitions
const PORTFOLIOS = [
    {
        id: 'min-disruption',
        name: 'Min Disruption',
        description: 'Smallest operational changes, preserves current commitments',
        icon: Shield,
        color: 'blue',
        strategy: 'Defer only uncommitted scope; no vendor impact',
        actions: [
            {
                id: 'MD-001',
                title: 'Defer Tower B non-critical finishing',
                type: 'SCOPE_CAP',
                lever: 'Planning',
                owner: 'PMC Lead',
                leadTime: 'Immediate',
                deltaCashP50: 4.2,
                deltaShortfallProb: -8,
                impactLabel: 'Low disruption'
            },
            {
                id: 'MD-002',
                title: 'Shift Infrastructure provisioning by 1 month',
                type: 'DEFERRAL',
                lever: 'Planning',
                owner: 'Infra Lead',
                leadTime: '1 Week',
                deltaCashP50: 3.8,
                deltaShortfallProb: -5,
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
        actions: [
            {
                id: 'CS-001',
                title: 'Split large POs into 3 tranches',
                type: 'LAG_REDUCTION',
                lever: 'Procurement',
                owner: 'Supply Chain',
                leadTime: '2 Weeks',
                deltaCashP50: 6.5,
                deltaShortfallProb: -12,
                impactLabel: 'Vendor negotiation required'
            },
            {
                id: 'CS-002',
                title: 'Advance 30% material payment',
                type: 'LAG_REDUCTION',
                lever: 'Procurement',
                owner: 'Finance',
                leadTime: '1 Week',
                deltaCashP50: 2.8,
                deltaShortfallProb: -4,
                impactLabel: 'Cash float used'
            },
            {
                id: 'CS-003',
                title: 'Negotiate extended service terms',
                type: 'LAG_REDUCTION',
                lever: 'Governance',
                owner: 'VP Finance',
                leadTime: '3 Weeks',
                deltaCashP50: 5.2,
                deltaShortfallProb: -9,
                impactLabel: 'Contract amendment'
            }
        ]
    },
    {
        id: 'risk-elimination',
        name: 'Risk Elimination',
        description: 'Full hedge against adverse scenarios',
        icon: Target,
        color: 'rose',
        strategy: 'Lock in prices; cap committed scope; draw reserves',
        actions: [
            {
                id: 'RE-001',
                title: 'Bulk material lock-in at current prices',
                type: 'VOLATILITY',
                lever: 'Procurement',
                owner: 'Supply Chain',
                leadTime: '1 Month',
                deltaCashP50: 12.0,
                deltaShortfallProb: -22,
                impactLabel: 'High capital tie-up'
            },
            {
                id: 'RE-002',
                title: 'Draw contingency reserve (₹10Cr)',
                type: 'RESERVE',
                lever: 'Governance',
                owner: 'CFO',
                leadTime: 'Immediate',
                deltaCashP50: 10.0,
                deltaShortfallProb: -18,
                impactLabel: 'One-time usage'
            },
            {
                id: 'RE-003',
                title: 'Cap scope at 85% of plan',
                type: 'SCOPE_CAP',
                lever: 'Planning',
                owner: 'Project Director',
                leadTime: '1 Week',
                deltaCashP50: 8.5,
                deltaShortfallProb: -15,
                impactLabel: 'Delivery impact'
            }
        ]
    }
];

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

    const triggers = getTriggerSuggestions(results);
    const recommendedPortfolio = triggers.length > 0 ? triggers[0].recommendation : null;

    const colorStyles = {
        blue: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            text: 'text-blue-400',
            activeBg: 'bg-blue-600',
            badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        },
        amber: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            text: 'text-amber-400',
            activeBg: 'bg-amber-600',
            badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        },
        rose: {
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/30',
            text: 'text-rose-400',
            activeBg: 'bg-rose-600',
            badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Trigger Alerts */}
            {triggers.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                    {triggers.map((trigger, idx) => (
                        <div
                            key={idx}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg border",
                                trigger.urgency === 'high'
                                    ? "bg-rose-500/10 border-rose-500/30"
                                    : "bg-amber-500/10 border-amber-500/30"
                            )}
                        >
                            <AlertTriangle size={14} className={trigger.urgency === 'high' ? 'text-rose-400' : 'text-amber-400'} />
                            <span className="text-sm text-[var(--text-primary)]">{trigger.condition}</span>
                            <ArrowRight size={12} className="text-[var(--text-muted)]" />
                            <Badge className={colorStyles[PORTFOLIOS.find(p => p.id === trigger.recommendation)?.color as keyof typeof colorStyles]?.badge}>
                                {PORTFOLIOS.find(p => p.id === trigger.recommendation)?.name}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}

            {/* Portfolio Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {PORTFOLIOS.map(portfolio => {
                    const Icon = portfolio.icon;
                    const styles = colorStyles[portfolio.color as keyof typeof colorStyles];
                    const isSelected = selectedPortfolio === portfolio.id;
                    const isRecommended = portfolio.id === recommendedPortfolio;
                    const totalDelta = portfolio.actions.reduce((sum, a) => sum + a.deltaCashP50, 0);
                    const totalShortfallReduction = portfolio.actions.reduce((sum, a) => sum + Math.abs(a.deltaShortfallProb), 0);

                    return (
                        <div
                            key={portfolio.id}
                            className={clsx(
                                "relative flex flex-col rounded-[var(--radius-lg)] border transition-all duration-300 cursor-pointer group",
                                isSelected
                                    ? `${styles.bg} ${styles.border} ring-1 ring-white/10 shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]`
                                    : "bg-[var(--surface-elevated)] border-[var(--divider)] hover:border-white/10 hover:shadow-lg"
                            )}
                            onClick={() => setSelectedPortfolio(isSelected ? null : portfolio.id)}
                        >
                            {/* Recommended Badge */}
                            {isRecommended && (
                                <div className="absolute -top-3 left-4 z-10">
                                    <Badge className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/40 font-bold tracking-wide">
                                        <Zap size={10} className="mr-1 fill-white" /> Recommended
                                    </Badge>
                                </div>
                            )}

                            <div className="p-5">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", styles.bg)}>
                                            <Icon size={20} className={styles.text} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{portfolio.name}</h4>
                                            <p className="text-xs text-slate-500">{portfolio.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={20}
                                        className={clsx(
                                            "transition-transform",
                                            isSelected ? "rotate-90 text-white" : "text-slate-600"
                                        )}
                                    />
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Delta Cash P50</p>
                                        <p className="text-lg font-bold text-emerald-400">+₹{totalDelta.toFixed(1)} Cr</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Shortfall ↓</p>
                                        <p className="text-lg font-bold text-emerald-400">-{totalShortfallReduction}%</p>
                                    </div>
                                </div>

                                {/* Strategy */}
                                <p className="text-xs text-slate-400 italic mb-4">"{portfolio.strategy}"</p>

                                {/* Actions Count */}
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">{portfolio.actions.length} actions</span>
                                    <span className={styles.text}>View details →</span>
                                </div>
                            </div>

                            {/* Expanded Actions */}
                            {isSelected && (
                                <div className="border-t border-white/5 p-5 space-y-3">
                                    {portfolio.actions.map(action => {
                                        const isActive = activeScenarios.includes(action.id);
                                        return (
                                            <div
                                                key={action.id}
                                                className={clsx(
                                                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                    isActive
                                                        ? "bg-emerald-500/10 border-emerald-500/30"
                                                        : "bg-slate-800/50 border-transparent hover:border-white/10"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleScenario(action.id);
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-white">{action.title}</span>
                                                        <Badge className={styles.badge}>{action.lever}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} /> {action.leadTime}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users size={10} /> {action.owner}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-500">Delta</p>
                                                        <p className="text-sm font-bold text-emerald-400">+₹{action.deltaCashP50} Cr</p>
                                                    </div>
                                                    <button
                                                        className={clsx(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                            isActive
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                                        )}
                                                    >
                                                        {isActive ? <CheckCircle2 size={16} /> : <ArrowRight size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
