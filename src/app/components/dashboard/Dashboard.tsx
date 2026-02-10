import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import {
  ShieldAlert,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { FundingRunway } from './FundingRunway';
import { CauseStack } from './CauseStack';
import { ActionPortfolio } from './ActionPortfolio';
import { RiskCalendar } from './RiskCalendar';
import { CloseProjection } from './CloseProjection';
import { BreachRadar } from './BreachRadar';
import { DebtBacklogTrend } from './DebtBacklogTrend';
import { getEarlyWarnings } from '../../../analysis/earlyWarnings';
import { InflowOutflowChart } from './InflowOutflowChart';
import type { MonthRisk } from '../../data/sampleData';

interface DashboardProps {
  onMonthClick?: (month: MonthRisk) => void;
}

export function Dashboard({ onMonthClick }: DashboardProps) {
  const { results, config, currentMonthActuals, engineeringDemand } = useProjectStore();

  if (!results) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4 opacity-20 animate-pulse" />
          <p className="text-sm font-bold uppercase tracking-widest">Running Grounded Simulations...</p>
        </div>
      </div>
    );
  }

  // Calculations
  const historicalStats = results.monthlyStats.filter((s) => s.isHistorical);

  // Calculate historical spent (using actuals from simulation)
  const historicalSpent = historicalStats.reduce((sum, s) => sum + s.cashOutflowP50, 0);

  // Calculate current month spent from real-time inputs
  const currentSpent = currentMonthActuals ?
    (currentMonthActuals.actualPaidToDate.SERVICE +
      currentMonthActuals.actualPaidToDate.MATERIAL +
      currentMonthActuals.actualPaidToDate.INFRA) : 0;

  const totalSpentToDate = historicalSpent + currentSpent;

  // Engineering Cap = project budget from config, NOT the sum of demand
  const engineeringCap = config.capTotalCr;

  const remainingCap = engineeringCap - totalSpentToDate;
  const futureGaps = results.monthlyStats.filter((s) => !s.isHistorical).reduce((sum, s) => sum + (s.gapToFix || 0), 0);
  const currentMonthStats = results.monthlyStats.find(m => m.month === config.asOfMonth);

  // Helper functions for Monthly Overview
  const getRiskIcon = (status: string, size = 'w-3.5 h-3.5') => {
    const iconClass = size;
    switch (status) {
      case 'low':
        return <CheckCircle2 className={iconClass} />;
      case 'watch':
        return <AlertCircle className={iconClass} />;
      case 'severe':
        return <XCircle className={iconClass} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-emerald-400';
      case 'watch': return 'text-amber-400';
      case 'severe': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'low': return 'bg-emerald-500/5 border-emerald-500/10';
      case 'watch': return 'bg-amber-500/5 border-amber-500/10';
      case 'severe': return 'bg-rose-500/5 border-rose-500/10';
      default: return 'bg-slate-900/50 border-white/5';
    }
  };

  // Convert monthlyStats to MonthRisk format for Monthly Overview
  const monthsData: MonthRisk[] = results.monthlyStats.map(stat => {
    const shortfallProb = stat.shortfallProb || 0;
    let status: 'low' | 'watch' | 'severe' = 'low';
    if (shortfallProb > 0.5) status = 'severe';
    else if (shortfallProb > 0.25) status = 'watch';

    return {
      month: stat.month,
      status,
      probability: shortfallProb * 100,
      p80: stat.cashOutflowP80,
      gap: stat.gapToFix || 0,
      expectedShortfall: stat.shortfallExpected || 0,
      p80Shortfall: stat.shortfallP80,
      scheduleDebt: stat.scheduleDebtP50 || 0,
      deferredCost: stat.deferredCostExpected || 0,
      drivers: []
    };
  });

  // Calculate health distribution percentages
  const healthCounts = monthsData.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = monthsData.length;
  const healthPct = {
    low: ((healthCounts.low || 0) / total) * 100,
    watch: ((healthCounts.watch || 0) / total) * 100,
    severe: ((healthCounts.severe || 0) / total) * 100
  };

  // Early Warning System
  const nonHistoricalStats = results.monthlyStats.filter(s => !s.isHistorical);
  const next3MonthsBudget = nonHistoricalStats.slice(0, 3).reduce((sum: number, s) => sum + s.plannedAllocation, 0);
  const earlyWarnings = getEarlyWarnings(currentMonthActuals, engineeringCap, next3MonthsBudget);

  return (
    <div className="p-8 space-y-8">
      {/* Executive Status Strip */}
      <header className="grid grid-cols-4 gap-5">
        {/* Card 1: Spent To Date */}
        {/* Card 1: Spent To Date */}
        <div className="glass-panel p-5 rounded-xl border-l-[3px] border-l-blue-500 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <Activity className="w-24 h-24 text-blue-500 -mr-4 -mt-4" />
          </div>
          <span className="text-label block mb-2">Spent To Date (Eng)</span>
          <div className="flex items-baseline gap-1.5 tabular-nums relative z-10">
            <span className="text-text-tertiary text-xl font-semibold">₹</span>
            <span className="text-3xl font-bold text-text-primary tracking-tight">{totalSpentToDate.toFixed(1)}</span>
            <span className="text-xs text-text-muted font-bold uppercase ml-1">Cr</span>
          </div>
          <div className="text-[11px] leading-4 text-text-secondary mt-2 font-mono relative z-10">
            +₹2.1 Cr vs last month
          </div>
        </div>

        {/* Card 2: Cap Remaining */}
        {/* Card 2: Cap Remaining */}
        <div className="glass-panel p-5 rounded-xl border-l-[3px] border-l-emerald-500 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <ShieldAlert className="w-24 h-24 text-emerald-500 -mr-4 -mt-4" />
          </div>
          <span className="text-label block mb-2">Cap Remaining</span>
          <div className="flex items-baseline gap-1.5 tabular-nums relative z-10">
            <span className={`text-xl font-semibold ${remainingCap < 0 ? 'text-accent-rose' : 'text-text-tertiary'}`}>₹</span>
            <span className={`text-3xl font-bold tracking-tight ${remainingCap < 0 ? 'text-accent-rose' : 'text-accent-emerald'}`}>{remainingCap.toFixed(1)}</span>
            <span className="text-xs text-text-muted font-bold uppercase ml-1">Cr</span>
          </div>
          <div className={`text-[11px] leading-4 mt-2 font-mono relative z-10 ${remainingCap < 0 ? 'text-accent-rose/80' : 'text-accent-emerald/80'}`}>
            {remainingCap < 0 ? '−' : '+'}₹{Math.abs(remainingCap * 0.02).toFixed(1)} Cr vs last month
          </div>
        </div>

        {/* Card 3: Total Gap */}
        {/* Card 3: Total Gap */}
        <div className="glass-panel p-5 rounded-xl border-l-[3px] border-l-rose-500 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <TrendingUp className="w-24 h-24 text-rose-500 -mr-4 -mt-4" />
          </div>
          <span className="text-label block mb-2">Total Gap (6m)</span>
          <div className="flex items-baseline gap-1.5 tabular-nums relative z-10">
            <span className="text-xl font-semibold text-accent-rose/70">₹</span>
            <span className="text-3xl font-bold text-accent-rose tracking-tight">{futureGaps.toFixed(1)}</span>
            <span className="text-xs text-text-muted font-bold uppercase ml-1">Cr</span>
          </div>
          <div className="text-[11px] leading-4 text-text-secondary mt-2 font-mono relative z-10">
            {futureGaps === 0 ? 'No gap projected' : `−₹${(futureGaps * 0.1).toFixed(1)} Cr vs last month`}
          </div>
        </div>

        {/* Card 4: Health Distribution */}
        {/* Card 4: Health Distribution */}
        <div className="glass-panel p-5 rounded-xl border-l-[3px] border-l-purple-500 relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500">
            <CheckCircle2 className="w-24 h-24 text-purple-500 -mr-4 -mt-4" />
          </div>
          <span className="text-label block mb-2">Health Distribution</span>
          <div className="flex items-center gap-2 mt-3 mb-1">
            <div className="h-2.5 flex-1 bg-surface-active rounded-full overflow-hidden flex">
              <div className="h-full bg-accent-emerald transition-all duration-500" style={{ width: `${healthPct.low}%` }} />
              <div className="h-full bg-accent-amber transition-all duration-500" style={{ width: `${healthPct.watch}%` }} />
              <div className="h-full bg-accent-rose transition-all duration-500" style={{ width: `${healthPct.severe}%` }} />
            </div>
          </div>
          {/* Legend with counts */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-emerald" />
              <span className="text-[11px] leading-4 text-text-secondary font-medium">Low <span className="text-text-primary tabular-nums">{healthCounts.low || 0}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-amber" />
              <span className="text-[11px] leading-4 text-text-secondary font-medium">Watch <span className="text-text-primary tabular-nums">{healthCounts.watch || 0}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-rose" />
              <span className="text-[11px] leading-4 text-text-secondary font-medium">Severe <span className="text-text-primary tabular-nums">{healthCounts.severe || 0}</span></span>
            </div>
          </div>
        </div>
      </header>


      {/* Control Room Panels */}
      {/* Control Room Panels */}
      <div className="flex flex-col gap-6">
        <CloseProjection
          nowCast={results.nowCast}
          plannedTotal={currentMonthStats?.plannedOutflowTotal || 0}
          currentMonth={config.asOfMonth}
        />
        <BreachRadar
          breachRadar={results.breachRadar}
          currentMonth={config.asOfMonth}
        />
        <DebtBacklogTrend
          monthlyStats={results.monthlyStats}
        />
      </div>

      {/* Early Warning Panel */}
      {earlyWarnings.length > 0 && (
        <div className="glass-panel rounded-xl p-5 border-l-4 border-l-amber-500/50">
          <h3 className="text-label mb-4 flex items-center gap-2 text-amber-500">
            <ShieldAlert className="w-4 h-4" />
            3-Month Early Warnings
          </h3>
          <div className="space-y-3">
            {earlyWarnings.map(w => {
              const levelStyles: Record<string, string> = {
                CRITICAL: 'border-red-500/30 bg-red-500/5',
                HIGH: 'border-orange-500/30 bg-orange-500/5',
                MED: 'border-amber-500/30 bg-amber-500/5',
                LOW: 'border-slate-700/40 bg-slate-800/30',
              };
              const badgeStyles: Record<string, string> = {
                CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
                HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                MED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                LOW: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
              };
              return (
                <div
                  key={w.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border ${levelStyles[w.level]}`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyles[w.level]}`}>
                    {w.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-text-primary">{w.title}</span>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{w.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Performance Graph */}
      <InflowOutflowChart />

      {/* Monthly Overview */}
      {/* Monthly Overview */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary tracking-wide">Monthly Overview</h3>
          <span className="text-[11px] leading-4 text-text-muted font-medium">Click a month for details</span>
        </div>

        <div className="grid grid-cols-12 gap-2">
          {monthsData.map((month, index) => {
            const isCurrentMonth = month.month === config.asOfMonth;
            const statusPillColors = {
              low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
              watch: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
              severe: 'bg-rose-500/15 text-rose-400 border-rose-500/20'
            };

            return (
              <button
                key={month.month}
                onClick={() => onMonthClick?.(month)}
                className={`
                  relative p-3 rounded-xl border transition-all duration-200 ease-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50
                  active:scale-[0.98]
                  ${isCurrentMonth
                    ? 'bg-brand/10 border-brand/30 ring-1 ring-brand/20 shadow-[0_0_20px_-10px_rgba(59,130,246,0.4)] -translate-y-px'
                    : 'glass-panel hover:bg-surface-hover hover:border-border-highlight'
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Month + Status Pill Row */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] leading-4 text-slate-400 font-medium tabular-nums">
                    {month.month.slice(0, 7)}
                  </span>
                </div>

                {/* Status Pill */}
                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold uppercase tracking-wide ${statusPillColors[month.status]}`}>
                  {getRiskIcon(month.status, 'w-2.5 h-2.5')}
                  <span>{month.status}</span>
                </div>

                {/* Risk Percentage */}
                <div className="text-white text-sm font-semibold mt-2 tabular-nums">
                  {month.probability.toFixed(0)}%
                </div>

                {/* Micro-metric */}
                <div className="text-[10px] leading-3 text-slate-500 mt-1 font-mono tabular-nums">
                  Gap ₹{(month.gap ?? 0).toFixed(1)} Cr
                </div>

                {/* Current Month Indicator */}
                {isCurrentMonth && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-slate-950" />
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Core Panels Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Funding Runway (Main Decision Table) */}
        <div className="xl:col-span-2 space-y-8">
          <section className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border-medium flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500" />
                  Funding Runway & Risk
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Safe Spend Limit benchmarked at P20 Realizable Inflow</p>
              </div>
            </div>
            <FundingRunway stats={results.monthlyStats} />
          </section>
        </div>

        {/* Right: Cause Stack & Secondary Charts */}
        <div className="space-y-8">
          <section className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border-medium">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <ShieldAlert size={20} className="text-rose-500" />
                Primary Risk Drivers
              </h3>
            </div>
            <CauseStack causes={results.kpis.topDrivers || []} />
          </section>

          <section className="glass-panel rounded-2xl overflow-hidden p-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Heat Calendar</h3>
            <RiskCalendar stats={results.monthlyStats} />
          </section>
        </div>
      </div>

      {/* Bottom: Action Portfolio */}
      <section className="glass-panel rounded-2xl overflow-hidden border-t-4 border-t-blue-500/20">
        <div className="p-8 border-b border-border-medium flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Activity size={24} className="text-emerald-400" />
              Action Portfolio
            </h3>
            <p className="text-sm text-slate-400 mt-1">Quantified mitigations based on projected ROM ROI</p>
          </div>
        </div>
        <ActionPortfolio />
      </section>
    </div>
  );
}
