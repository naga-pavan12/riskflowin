import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import {
  ShieldAlert,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Zap,
  BrainCircuit
} from 'lucide-react';
import { FundingRunway } from './FundingRunway';
import { CauseStack } from './CauseStack';
import { RiskCalendar } from './RiskCalendar';
import { CloseProjection } from './CloseProjection';
import { BreachRadar } from './BreachRadar';
import { InflowOutflowChart } from './InflowOutflowChart';
import { MultiverseChart } from './MultiverseChart';
import type { MonthRisk } from '../../data/sampleData';
import { PulseRail } from './PulseRail';
import { calculateHeuristicRisk } from '../../../utils/riskHeuristics';
import { usePulseContext } from '../../../store/PulseContext';
import { Badge } from '../ui/badge';
import { ErrorBoundary } from '../ErrorBoundary';
import { ActionPortfolio } from './ActionPortfolio';

interface DashboardProps {
  onMonthClick?: (month: MonthRisk) => void;
}

export function Dashboard({ onMonthClick }: DashboardProps) {
  const { results, config, currentMonthActuals, setRiskConfig, riskConfig } = useProjectStore();
  const { state: pulseState } = usePulseContext();

  // Replaced useUnifiedRisk with local heuristic calculation
  const riskProfile = React.useMemo(() => calculateHeuristicRisk(pulseState), [pulseState]);
  const isRefining = false;

  // Sync Pulse State to Simulation Risk Config
  React.useEffect(() => {
    // Map Pulse Inputs to Simulation Parameters
    // Deep copy to prevent mutation of existing state
    const newConfig = JSON.parse(JSON.stringify(riskConfig));

    // Labor -> Contractor Risk
    if (pulseState.laborStability === 'Critical') newConfig.execution.contractorRisk = 'high-risk';
    else if (pulseState.laborStability === 'Fluctuating') newConfig.execution.contractorRisk = 'shaky';
    else newConfig.execution.contractorRisk = 'reliable';

    // Material -> Volatility
    if (pulseState.materialAvailability === 'Scarce') newConfig.market.volatilityClass = 'critical';
    else if (pulseState.materialAvailability === 'Partial') newConfig.market.volatilityClass = 'high';
    else newConfig.market.volatilityClass = 'med';

    // Design -> Schedule Confidence
    if (pulseState.designGaps === 'Major') newConfig.execution.scheduleConfidence = 0.5;
    else if (pulseState.designGaps === 'Minor') newConfig.execution.scheduleConfidence = 0.7;
    else newConfig.execution.scheduleConfidence = 0.9;

    // Only update if changed (deep compare simplified)
    if (JSON.stringify(newConfig) !== JSON.stringify(riskConfig)) {
      console.log('[Dashboard] Syncing Pulse -> RiskConfig');
      setRiskConfig(newConfig);
    }
  }, [pulseState, setRiskConfig]); // Intentionally omitting riskConfig to avoid cycles

  if (!results) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4 opacity-20 animate-pulse text-black" />
          <p className="text-sm font-bold uppercase tracking-widest text-black">Running Grounded Simulations...</p>
        </div>
      </div>
    );
  }

  // Calculations
  const historicalStats = results.monthlyStats.filter((s) => s.isHistorical);
  const historicalSpent = historicalStats.reduce((sum, s) => sum + s.cashOutflowP50, 0);
  const currentSpent = currentMonthActuals ?
    (currentMonthActuals.actualPaidToDate.SERVICE +
      currentMonthActuals.actualPaidToDate.MATERIAL +
      currentMonthActuals.actualPaidToDate.INFRA) : 0;
  const totalSpentToDate = historicalSpent + currentSpent;
  const engineeringCap = config.capTotalCr;
  const remainingCap = engineeringCap - totalSpentToDate;
  const futureGaps = results.monthlyStats.filter((s) => !s.isHistorical).reduce((sum, s) => sum + (s.gapToFix || 0), 0);
  const currentMonthStats = results.monthlyStats.find(m => m.month === config.asOfMonth);

  // Helper functions for Monthly Overview
  const getRiskIcon = (status: string, size = 'w-3.5 h-3.5') => {
    const iconClass = size;
    switch (status) {
      case 'low': return <CheckCircle2 className={iconClass} />;
      case 'watch': return <AlertCircle className={iconClass} />;
      case 'severe': return <XCircle className={iconClass} />;
      default: return null;
    }
  };

  const monthsData: MonthRisk[] = results.monthlyStats.map((stat, index) => {
    const riskScore = results.riskScores?.find(r => r.month === (index + 1));
    let status: 'low' | 'watch' | 'severe' = 'low';
    if (riskScore) {
      if (riskScore.level === 'CRITICAL' || riskScore.level === 'HIGH') status = 'severe';
      else if (riskScore.level === 'MED') status = 'watch';
    } else {
      if ((stat.shortfallProb || 0) > 0.5) status = 'severe';
      else if ((stat.shortfallProb || 0) > 0.25) status = 'watch';
    }
    return {
      month: stat.month,
      status,
      probability: (riskScore?.score ?? (stat.shortfallProb * 100)),
      p80: stat.cashOutflowP80,
      gap: stat.gapToFix || 0,
      expectedShortfall: stat.shortfallExpected || 0,
      p80Shortfall: stat.shortfallP80,
      scheduleDebt: stat.scheduleDebtP50 || 0,
      deferredCost: stat.deferredCostExpected || 0,
      drivers: []
    };
  });

  const earlyWarnings = results.earlyWarnings || [];

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20 pt-6 px-4 md:px-8 max-w-[1600px] mx-auto">
      <ErrorBoundary componentName="Dashboard">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black flex items-center gap-2">
              Program Risk Control
              <Badge variant="outline" className="ml-2 font-mono text-xs">V2.1</Badge>
            </h1>
            <p className="text-zinc-500 mt-1">Real-time simulation & liquidity forecasting</p>
          </div>
          <div className="flex items-center gap-3">
            <PulseRail />
          </div>
        </header>

        {/* AI Risk Pulse (The "Living" Component) */}
        {/* Narrative Header - Uber Clean Banner */}
        {results.narrative && (
          <div className="bg-white border border-l-4 border-l-blue-600 border-zinc-200 p-4 rounded-lg flex items-start gap-4 shadow-sm mb-6">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1">Navigator Insight</h4>
              <p className="text-black text-sm font-medium leading-relaxed">
                {results.narrative}
              </p>
            </div>
          </div>
        )}

        {/* Executive Status Strip */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Card 1: Spent To Date */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-500">
              <Activity className="w-24 h-24 text-black -mr-4 -mt-4" />
            </div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wide block mb-3">Spent To Date (Eng)</span>
            <div className="flex items-baseline gap-1.5 tabular-nums relative z-10">
              <span className="text-zinc-400 text-xl font-semibold">₹</span>
              <span className="text-3xl font-bold text-black tracking-tight">{totalSpentToDate.toFixed(1)}</span>
              <span className="text-xs text-zinc-400 font-bold uppercase ml-1">Cr</span>
            </div>
            <div className="text-[11px] font-medium text-emerald-600 mt-2 relative z-10 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
              +₹2.1 Cr vs last month
            </div>
          </div>

          {/* Card 2: Cap Remaining */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-500">
              <ShieldAlert className="w-24 h-24 text-black -mr-4 -mt-4" />
            </div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wide block mb-3">Cap Remaining</span>
            <div className="flex items-baseline gap-1.5 tabular-nums relative z-10">
              <span className={`text-xl font-semibold ${remainingCap < 0 ? 'text-red-500' : 'text-zinc-400'}`}>₹</span>
              <span className={`text-3xl font-bold tracking-tight ${remainingCap < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{remainingCap.toFixed(1)}</span>
              <span className="text-xs text-zinc-400 font-bold uppercase ml-1">Cr</span>
            </div>
            <div className={`text-[11px] font-medium mt-2 relative z-10 inline-block px-1.5 py-0.5 rounded ${remainingCap < 0 ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
              {remainingCap < 0 ? '−' : '+'}₹{Math.abs(remainingCap * 0.02).toFixed(1)} Cr vs last month
            </div>
          </div>

          {/* Card 3: Total Gap */}
          <div className="bg-white p-5 rounded-lg border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-500">
              <TrendingUp className="w-24 h-24 text-black -mr-4 -mt-4" />
            </div>
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wide block mb-3">Total Gap (6m)</span>
            <div className="flex items-baseline gap-1.5 tabular-nums relative z-10">
              <span className="text-xl font-semibold text-zinc-400">₹</span>
              <span className="text-3xl font-bold text-red-600 tracking-tight">{futureGaps.toFixed(1)}</span>
              <span className="text-xs text-zinc-400 font-bold uppercase ml-1">Cr</span>
            </div>
            <div className="text-[11px] font-medium text-zinc-500 mt-2 relative z-10">
              {futureGaps === 0 ? 'No gap projected' : <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded">−₹{(futureGaps * 0.1).toFixed(1)} Cr vs last month</span>}
            </div>
          </div>

          {/* Card 4: AI Risk Pulse (Replaces Health Dist) */}
          <div className="bg-zinc-900 text-white p-5 rounded-lg border border-zinc-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <BrainCircuit className="w-24 h-24 text-white -mr-4 -mt-4 animate-pulse" />
            </div>

            <div className="flex justify-between items-start mb-3">
              <span className="text-zinc-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-400" />
                AI Risk Pulse
              </span>
              {isRefining && (
                <Badge variant="outline" className="text-[9px] h-4 bg-zinc-800 border-zinc-700 text-zinc-300 animate-pulse">
                  REFINING...
                </Badge>
              )}
            </div>

            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold tracking-tight ${riskProfile.risk_label === 'CRITICAL' ? 'text-red-500' :
                  riskProfile.risk_label === 'HIGH' ? 'text-orange-500' :
                    riskProfile.risk_label === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500'
                  }`}>
                  {riskProfile.risk_label}
                </span>
                <span className="text-sm font-medium text-zinc-500">
                  ({(riskProfile.risk_probability * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="mt-3 text-[11px] font-medium text-zinc-400 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Top Driver:</span>
                  <span className="text-white">
                    {riskProfile.top_risk_driver ? riskProfile.top_risk_driver.replace(/_/g, ' ') : 'PENDING'}
                  </span>
                </div>
                {riskProfile.method === 'heuristic' && (
                  <div className="text-yellow-500/50 italic text-[10px] mt-1">
                    * Heuristic Estimate
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Room Panels */}
        <div className="flex flex-col gap-6 mb-8">
          <CloseProjection
            nowCast={results.nowCast}
            plannedTotal={currentMonthStats?.plannedOutflowTotal || 0}
            currentMonth={config.asOfMonth}
          />

          <BreachRadar
            breachRadar={results.breachRadar}
            currentMonth={config.asOfMonth}
          />
        </div>

        {/* Early Warning Panel */}
        {earlyWarnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wide mb-4 flex items-center gap-2 text-amber-800">
              <ShieldAlert className="w-4 h-4" />
              3-Month Early Warnings
            </h3>
            <div className="space-y-3">
              {earlyWarnings.map(w => {
                const levelStyles: Record<string, string> = {
                  CRITICAL: 'border-red-200 bg-red-100/50',
                  HIGH: 'border-orange-200 bg-orange-100/50',
                  MED: 'border-amber-200 bg-amber-100/50',
                  LOW: 'border-zinc-200 bg-white',
                };
                const badgeStyles: Record<string, string> = {
                  CRITICAL: 'bg-red-600 text-white',
                  HIGH: 'bg-orange-600 text-white',
                  MED: 'bg-amber-600 text-white',
                  LOW: 'bg-zinc-600 text-white',
                };
                return (
                  <div
                    key={w.id}
                    className={`flex items-start gap-3 p-3.5 rounded border ${levelStyles[w.level]}`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeStyles[w.level]}`}>
                      {w.level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-black">{w.title}</span>
                      <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{w.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Financial Performance Row */}
        <div className="space-y-6 mb-8">
          <InflowOutflowChart />
          <MultiverseChart />
        </div>

        {/* Monthly Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-black tracking-tight">Monthly Overview</h3>
            <span className="text-[11px] leading-4 text-zinc-500 font-medium">Click a month for details</span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            {monthsData.map((month, index) => {
              const isCurrentMonth = month.month === config.asOfMonth;
              const statusColors = {
                low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                watch: 'bg-amber-50 text-amber-700 border-amber-200',
                severe: 'bg-red-50 text-red-700 border-red-200'
              };

              return (
                <button
                  key={month.month}
                  onClick={() => onMonthClick?.(month)}
                  className={`
                    relative p-3 rounded-lg border transition-all duration-200 ease-out text-left
                    hover:shadow-md
                    ${isCurrentMonth
                      ? 'bg-black text-white border-black shadow-lg ring-2 ring-black ring-offset-2'
                      : 'bg-white text-black border-zinc-200 hover:border-zinc-300'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Simplified Layout */}
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                      <span className={`text-[13px] font-bold tabular-nums ${isCurrentMonth ? 'text-zinc-400' : 'text-zinc-900 group-hover:text-black'}`}>
                        {month.month.slice(0, 7)}
                      </span>
                      {isCurrentMonth && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-white" />}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className={`inline-flex w-full justify-center items-center gap-1.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${statusColors[month.status]} ${isCurrentMonth ? '!bg-zinc-800 !text-white !border-zinc-700' : ''}`}>
                        {getRiskIcon(month.status, 'w-3 h-3')}
                        <span>{month.status}</span>
                      </div>

                      <div className={`text-center text-xs font-medium tabular-nums ${isCurrentMonth ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {month.probability.toFixed(0)}% Risk
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Panels Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Left: Funding Runway (Main Decision Table) */}
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-black uppercase tracking-tight flex items-center gap-2">
                    <TrendingUp size={20} className="text-black" />
                    Funding Runway & Risk
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">Safe Spend Limit benchmarked at P20 Realizable Inflow</p>
                </div>
              </div>
              <FundingRunway stats={results.monthlyStats} />
            </section>
          </div>

          {/* Right: Cause Stack & Secondary Charts */}
          <div className="space-y-6">
            <section className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h3 className="text-lg font-bold text-black uppercase tracking-tight flex items-center gap-2">
                  <ShieldAlert size={20} className="text-black" />
                  Primary Risk Drivers
                </h3>
              </div>
              <CauseStack causes={results.kpis.topDrivers || []} />
            </section>

            <section className="bg-white rounded-lg border border-zinc-200 shadow-sm p-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-4">Risk Heat Calendar</h3>
              <RiskCalendar stats={results.monthlyStats} />
            </section>
          </div>
        </div>

        {/* Bottom: Action Portfolio */}
        <section className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden border-t-4 border-t-black">
          <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-black uppercase tracking-tight flex items-center gap-3">
                <Activity size={24} className="text-emerald-600" />
                Action Portfolio
              </h3>
              <p className="text-sm text-zinc-500 mt-1 font-medium">Quantified mitigations based on projected ROM ROI</p>
            </div>
          </div>
          <ActionPortfolio />
        </section>
      </ErrorBoundary>
    </div>
  );
}
