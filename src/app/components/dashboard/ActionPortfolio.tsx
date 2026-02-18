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
    CheckCircle2,
    Play
} from 'lucide-react';
import { clsx } from 'clsx';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';

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
    const {
        results,
        config, updateConfig,
        policyConfig, setPolicyConfig,
        applyFactor,
        triggerSimulation,
        loading
    } = useProjectStore();

    const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
    const [applyingAction, setApplyingAction] = useState<string | null>(null);
    const [appliedActions, setAppliedActions] = useState<string[]>([]); // Track locally for now

    const triggers = React.useMemo(() => getTriggerSuggestions(results), [results]);

    // Dynamic Calculation Logic
    const portfolios = React.useMemo(() => {
        if (!results) return [];

        const totalGap = Math.max(results.monthlyStats.reduce((sum: number, stat: any) => sum + (stat.gapToFix || 0), 0), 0);
        const maxShortfallProb = Math.max(...results.monthlyStats.map((s: any) => s.shortfallProb || 0), 0);

        const hasRisk = totalGap > 0 || maxShortfallProb > 0.1;

        const baseGap = hasRisk ? Math.max(totalGap, 10) : 0;
        const baseProb = hasRisk ? Math.max(maxShortfallProb, 0.1) : 0;

        // Helper to check if an action is already active/applied
        const isActionActive = (id: string) => {
            if (appliedActions.includes(id)) return true;

            // Check Store State
            if (id === 'MD-002' && policyConfig.breachMode === 'payablesBacklogThrottle' && policyConfig.maxThrottlePctPerMonth === 0.20) return true;
            if (id === 'CS-001' && policyConfig.breachMode === 'payablesBacklogThrottle' && policyConfig.maxThrottlePctPerMonth === 0.40) return true;
            if (id === 'CS-002' && policyConfig.frictionMultiplier && policyConfig.frictionMultiplier >= 1.3) return true;
            // Liquidity check is hard via config alone without baseline, so rely on local state or simplistic check
            return false;
        };

        const allPortfolios = [
            {
                id: 'min-disruption',
                name: 'Min Disruption',
                description: 'Smallest operational changes, preserves current commitments',
                icon: Shield,
                color: 'blue',
                strategy: 'Defer only uncommitted scope; no vendor impact',
                deltaCashP50: baseGap * 0.15,
                deltaShortfallPct: Math.round(baseProb * 100 * 0.2),
                actions: [
                    {
                        id: 'MD-001',
                        title: 'Defer non-critical finishing',
                        type: 'SCOPE_CAP',
                        lever: 'Planning',
                        owner: 'PMC Lead',
                        leadTime: 'Immediate',
                        deltaCashP50: (baseGap * 0.08).toFixed(1),
                        deltaShortfallProb: -(baseProb * 100 * 0.05).toFixed(1),
                        impactLabel: 'Low disruption',
                        description: 'Reduces demand by 5% via scope deferral.'
                    },
                    {
                        id: 'MD-002',
                        title: 'Minor Payment Throttle',
                        type: 'DEFERRAL',
                        lever: 'Planning',
                        owner: 'Infra Lead',
                        leadTime: '1 Week',
                        deltaCashP50: (baseGap * 0.07).toFixed(1),
                        deltaShortfallProb: -(baseProb * 100 * 0.03).toFixed(1),
                        impactLabel: 'Minimal',
                        description: 'Throttles payables backlog by 20%.'
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
                deltaCashP50: baseGap * 0.35,
                deltaShortfallPct: Math.round(baseProb * 100 * 0.45),
                actions: [
                    {
                        id: 'CS-001',
                        title: 'Aggressive Payment Throttle',
                        type: 'LAG_REDUCTION',
                        lever: 'Procurement',
                        owner: 'Supply Chain',
                        leadTime: '2 Weeks',
                        deltaCashP50: (baseGap * 0.20).toFixed(1),
                        deltaShortfallProb: -(baseProb * 100 * 0.12).toFixed(1),
                        impactLabel: 'Vendor negotiation',
                        description: 'Throttles payables backlog by 40%.'
                    },
                    {
                        id: 'CS-002',
                        title: 'Extend Payment Terms',
                        type: 'LAG_REDUCTION',
                        lever: 'Governance',
                        owner: 'VP Finance',
                        leadTime: '3 Weeks',
                        deltaCashP50: (baseGap * 0.15).toFixed(1),
                        deltaShortfallProb: -(baseProb * 100 * 0.08).toFixed(1),
                        impactLabel: 'Contract amendment',
                        description: 'Increases friction multiplier to 1.3x.'
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
                deltaCashP50: baseGap * 0.95,
                deltaShortfallPct: Math.round(baseProb * 100 * 0.90),
                actions: [
                    {
                        id: 'RE-001',
                        title: 'Inject Liquidity (Cap +20%)',
                        type: 'HEDGING',
                        lever: 'Finance',
                        owner: 'CFO',
                        leadTime: 'Immediate',
                        deltaCashP50: (baseGap * 0.50).toFixed(1),
                        deltaShortfallProb: -(baseProb * 100 * 0.40).toFixed(1),
                        impactLabel: 'Capital intensive',
                        description: 'Increases project cap by 20%.'
                    },
                    {
                        id: 'RE-002',
                        title: 'Major Scope Reduction',
                        type: 'SCOPE_CUT',
                        lever: 'Engineering',
                        owner: 'Project Director',
                        leadTime: '1 Month',
                        deltaCashP50: (baseGap * 0.45).toFixed(1),
                        deltaShortfallProb: -(baseProb * 100 * 0.35).toFixed(1),
                        impactLabel: 'Significant scope reduction',
                        description: 'Reduces demand by 15% across all items.'
                    }
                ]
            }
        ];

        // Filter actions: Include only those NOT Active and RELEVANT (impact > 0)
        return allPortfolios.map(p => {
            const validActions = p.actions.filter(a => {
                // Check if effective impact is near zero
                const isZeroImpact = parseFloat(a.deltaCashP50) <= 0.01 && Math.abs(parseFloat(String(a.deltaShortfallProb))) < 0.1;
                return !isActionActive(a.id) && !isZeroImpact;
            });

            return {
                ...p,
                availableActions: validActions,
                allActions: p.actions
            };
        });
    }, [results, appliedActions, policyConfig]);

    const handleApplyAction = async (actionId: string, portfolioId: string) => {
        setApplyingAction(actionId);

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // UI delay

            switch (actionId) {
                case 'MD-001':
                    applyFactor('OUTFLOW', 'engineering', results?.monthlyStats.filter((m: any) => !m.isHistorical).map((m: any) => m.month) || [], 0.95);
                    toast.success('Scope Deferral Applied', { description: 'Reduced engineering demand by 5%.' });
                    break;

                case 'MD-002':
                    setPolicyConfig({
                        ...policyConfig,
                        breachMode: 'payablesBacklogThrottle',
                        maxThrottlePctPerMonth: 0.20
                    });
                    toast.success('Minor Throttle Applied', { description: 'Payables backlog throttle set to 20%.' });
                    break;

                case 'CS-001':
                    setPolicyConfig({
                        ...policyConfig,
                        breachMode: 'payablesBacklogThrottle',
                        maxThrottlePctPerMonth: 0.40
                    });
                    toast.success('Aggressive Throttle Applied', { description: 'Payables backlog throttle set to 40%.' });
                    break;

                case 'CS-002':
                    setPolicyConfig({
                        ...policyConfig,
                        frictionMultiplier: 1.3
                    });
                    toast.success('Payment Terms Extended', { description: 'Payment friction multiplier increased to 1.3x.' });
                    break;

                case 'RE-001':
                    const currentCap = config.capTotalCr || 0;
                    updateConfig({ capTotalCr: currentCap * 1.2 });
                    toast.success('Liquidity Injected', { description: `Project cap increased to ₹${(currentCap * 1.2).toFixed(0)} Cr.` });
                    break;

                case 'RE-002':
                    applyFactor('OUTFLOW', 'engineering', results?.monthlyStats.filter((m: any) => !m.isHistorical).map((m: any) => m.month) || [], 0.85);
                    toast.success('Major Scope Cut Applied', { description: 'Reduced engineering demand by 15%.' });
                    break;
            }

            setAppliedActions(prev => [...prev, actionId]);
            triggerSimulation();

        } catch (e) {
            console.error(e);
            toast.error('Failed to apply action');
        } finally {
            setApplyingAction(null);
        }
    };

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
                    const actionCount = portfolio.availableActions.length;

                    return (
                        <Card
                            key={portfolio.id}
                            className={clsx(
                                "relative overflow-hidden cursor-pointer transition-all duration-300",
                                isSelected
                                    ? `ring-2 ring-[var(--accent-${portfolio.color})] shadow-lg`
                                    : "hover:border-zinc-300 hover:shadow-md border-zinc-200"
                            )}
                            onClick={() => setSelectedPortfolio(isSelected ? null : portfolio.id)}
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
                                    <span className={clsx("font-medium", actionCount === 0 ? "text-zinc-300" : "text-zinc-500")}>
                                        {actionCount === 0 ? 'No actions available' : `${actionCount} actions available`}
                                    </span>
                                    <span className={clsx("font-bold", styles?.text)}>
                                        {isSelected ? 'Close' : 'View details'}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Actions */}
                            {isSelected && (
                                <div className="bg-zinc-50 border-t border-zinc-200 p-6 space-y-3">
                                    {actionCount === 0 ? (
                                        <div className="text-center py-4 text-zinc-400 text-xs italic">
                                            All recommended actions have been applied or are not currently applicable.
                                        </div>
                                    ) : (
                                        portfolio.availableActions.map(action => {
                                            const isActionApplying = applyingAction === action.id;

                                            return (
                                                <div
                                                    key={action.id}
                                                    className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:border-zinc-300 transition-all cursor-default"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-black">{action.title}</span>
                                                                <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 text-[10px] uppercase font-bold">{action.type}</Badge>
                                                            </div>
                                                            <p className="text-xs text-zinc-500">{action.description}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end justify-between mt-3">
                                                        <div className="text-xs text-zinc-500 font-medium space-y-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={12} className="text-zinc-400" /> {action.leadTime}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users size={12} className="text-zinc-400" /> {action.owner}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApplyAction(action.id, portfolio.id)}
                                                            disabled={loading || !!applyingAction}
                                                            className={clsx(
                                                                "h-8 text-xs font-bold",
                                                                portfolio.color === 'blue' ? "bg-blue-600 hover:bg-blue-700" :
                                                                    portfolio.color === 'amber' ? "bg-amber-600 hover:bg-amber-700" :
                                                                        "bg-emerald-600 hover:bg-emerald-700"
                                                            )}
                                                        >
                                                            {isActionApplying ? (
                                                                <span className="flex items-center gap-2">Applying...</span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">Apply <Play size={10} fill="currentColor" /></span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
