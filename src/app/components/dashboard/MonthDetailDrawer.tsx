import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { SimpleDrawer as Drawer } from '../ui/drawer';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useProjectStore } from '../../../store/useProjectStore';
import type { ComponentType } from '../../../types';
import { toast } from 'sonner';

interface MonthDetailDrawerProps {
  month: string | null; // Just the YYYY-MM string
  open: boolean;
  onClose: () => void;
  onAdvancedClick: () => void;
}

export function MonthDetailDrawer({ month, open, onClose, onAdvancedClick }: MonthDetailDrawerProps) {
  const { results: simulationResults, config, updateConfig, policyConfig, setPolicyConfig } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'drivers' | 'analysis'>('analysis');

  // SAFE DATA EXTRACTION (Must run every render to satisfy Rules of Hooks)
  const stats = useMemo(() => {
    if (!month || !simulationResults?.monthlyStats) return undefined;
    return simulationResults.monthlyStats.find((m: any) => m.month === month);
  }, [simulationResults, month]);

  const relevantDrivers = useMemo(() => {
    return (simulationResults?.kpis?.topDrivers || []).filter((d: any) => d.contribution > 0).slice(0, 3);
  }, [simulationResults]);

  const primaryDriver = relevantDrivers[0];

  const isShortfall = (stats?.shortfallP80 || 0) > 0.1;
  const status = isShortfall ? ((stats?.shortfallP80 || 0) > 1.0 ? 'severe' : 'watch') : 'low';
  const probability = (stats?.shortfallProb || 0) * 100;

  // "Why" Narrative (Hook)
  const whyNarrative = useMemo(() => {
    if (!month || !stats) return '';

    if (!isShortfall) {
      return `Projected cash flow for ${month} is healthy. Available liquidity is sufficient to cover P80 demand.`;
    }

    if (!primaryDriver) {
      return `Shortfall driven by general volatility in demand surpassing the funding cap.`;
    }

    const amount = (stats.shortfallP80 || 0).toFixed(2);
    return `The projected shortfall of ₹${amount} Cr is primarily driven by ${primaryDriver.name} (${(primaryDriver.impactOnShortfall * 100).toFixed(0)}% contribution). High volatility in this sector is pushing cash demand beyond the 20% safe buffer.`;
  }, [isShortfall, month, stats, primaryDriver]);

  // Suggested Fixes (Calculation)
  const suggestedFixes = useMemo(() => {
    if (!isShortfall || !stats) return [];

    const fixes = [];
    // 1. Liquidity Injection
    fixes.push({
      id: 'inject_liquidity',
      title: 'Inject Liquidity',
      description: `Increase funding cap to cover ₹${(stats.shortfallP80 || 0).toFixed(2)} Cr gap.`,
      impact: 'Guaranteed',
      color: 'emerald'
    });

    // 2. Deferral
    if (primaryDriver && (primaryDriver.name.includes('Material') || primaryDriver.name.includes('Labor'))) {
      fixes.push({
        id: 'defer_payments',
        title: 'Defer Payments',
        description: 'Push non-critical payments to next quarter.',
        impact: 'High',
        color: 'blue'
      });
    }
    return fixes;
  }, [isShortfall, stats, primaryDriver]);

  // Actions
  const applyFix = (actionId: string) => {
    if (!config || !stats) return;

    switch (actionId) {
      case 'inject_liquidity':
        const needed = (stats.shortfallP80 || 0) * 1.2;
        updateConfig({ capTotalCr: (config.capTotalCr || 0) + needed });
        toast.success(`Liquidity Injected`, {
          description: `Added ₹${needed.toFixed(2)} Cr to Project Cap. Rerunning simulation...`
        });
        break;

      case 'defer_payments':
        if (setPolicyConfig && policyConfig) {
          setPolicyConfig({
            ...policyConfig,
            breachMode: 'payablesBacklogThrottle',
            maxThrottlePctPerMonth: 0.60
          });
          toast.success(`Payment Deferral Activated`, {
            description: `Authorized up to 60% payment deferral to preserve cash.`
          });
        }
        break;

      case 'value_engineering':
        const currentCap = config.capTotalCr || 0;
        updateConfig({ capTotalCr: currentCap + 1.0 });
        toast.success(`Value Engineering Applied`, {
          description: `Optimized scope to reduce projected burn.`
        });
        break;
    }
  };

  // UI Helpers
  const getRiskIcon = (s: string) => {
    switch (s) {
      case 'low': return <CheckCircle2 className="w-4 h-4" />;
      case 'watch': return <AlertCircle className="w-4 h-4" />;
      case 'severe': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getBadgeClassName = (s: string) => {
    switch (s) {
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'watch': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'severe': return 'bg-red-50 text-red-700 border-red-200';
      default: return '';
    }
  };

  const formatCurrency = (val: number | undefined) => {
    const v = val || 0;
    if (v === 0) return '₹0 Cr';
    return `₹${v.toFixed(2)} Cr`;
  };

  // FINAL RENDER CHECK: If no data, return null (after all hooks)
  if (!month || !stats) {
    // If open is true but no stats, we might want to show loading or empty?
    // For now, return null to match previous behavior safely
    return null;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={month}
      width="45%"
    >
      <div className="space-y-8 pb-12">
        {/* Header with Status */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`flex items-center gap-2 px-3 py-1 text-sm ${getBadgeClassName(status)}`}
          >
            {getRiskIcon(status)}
            <span className="font-semibold uppercase tracking-wide text-xs">{status === 'low' ? 'Projected Safe' : 'Capital Shortfall'}</span>
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Probability
            </div>
            <div className="text-black text-3xl font-bold tabular-nums tracking-tight">
              {probability.toFixed(1)}%
            </div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Expected Gap
            </div>
            <div className="text-black text-3xl font-bold tabular-nums tracking-tight">
              {formatCurrency(stats.shortfallExpected)}
            </div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Worst Case (P80)
            </div>
            <div className={`text-3xl font-bold tabular-nums tracking-tight ${isShortfall ? 'text-red-600' : 'text-black'}`}>
              {formatCurrency(stats.shortfallP80)}
            </div>
          </div>
        </div>

        {/* Why / Analysis Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-black font-bold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Risk Diagnosis
            </h4>
          </div>

          <Card className="p-5 shadow-sm bg-white border-zinc-200">
            <div className="flex gap-4">
              <div className="mt-1">
                {isShortfall ? <AlertCircle className="w-5 h-5 text-red-600" /> : <ShieldCheck className="w-5 h-5 text-emerald-600" />}
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-zinc-800 text-sm leading-relaxed">
                  {whyNarrative}
                </p>

                {/* Driver Tags */}
                {isShortfall && relevantDrivers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {relevantDrivers.map((d: any) => (
                      <Badge key={d.name} variant="secondary" className="bg-zinc-100 text-zinc-700 border-zinc-200 font-mono text-[10px]">
                        {d.name.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* FIX SECTION (The "Offer a Fix") */}
        {isShortfall && (
          <div>
            <h4 className="text-black font-bold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Recommended Fixes
            </h4>

            <div className="space-y-3">
              {suggestedFixes.map(fix => (
                <Card key={fix.id} className="group overflow-hidden border-l-4 border-l-emerald-500 hover:shadow-md transition-all">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-black text-sm">{fix.title}</h5>
                      <p className="text-zinc-500 text-xs mt-1">{fix.description}</p>
                    </div>
                    <Button
                      onClick={() => applyFix(fix.id)}
                      size="sm"
                      className="bg-black text-white hover:bg-zinc-800 shadow-sm"
                    >
                      Apply Fix
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
