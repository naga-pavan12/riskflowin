import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Zap,
  Loader2,
} from 'lucide-react'; // Verified exports exist in 0.563.0
import { Button } from '../ui/button';
import { useSimulationData } from '../../hooks/useSimulationData';
import type { MonthRisk } from '../../data/sampleData';
import { toast } from 'sonner';

interface DashboardProps {
  onMonthClick: (month: MonthRisk) => void;
}

export function Dashboard({ onMonthClick }: DashboardProps) {
  // Use live simulation data instead of hardcoded sample data
  const { monthsData, topDrivers, recommendedActions, summaryStats, isLoading, config } = useSimulationData();

  const formatCurrency = (value: number) => {
    if (value >= 10) return `₹${value.toFixed(1)} Cr`;
    return `₹${value.toFixed(2)} Cr`;
  };

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
      default: return 'text-[var(--text-secondary)]';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'low': return 'bg-emerald-500/5 border-emerald-500/10';
      case 'watch': return 'bg-amber-500/5 border-amber-500/10';
      case 'severe': return 'bg-rose-500/5 border-rose-500/10';
      default: return 'bg-[var(--surface-elevated)] border-[var(--divider)]';
    }
  };

  const handleApplyAction = (actionId: string, actionTitle: string) => {
    toast.success('Action applied', {
      description: actionTitle
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--accent-blue)] animate-spin mx-auto mb-4" />
          <div className="text-[var(--text-secondary)] text-[14px]">Running simulation...</div>
          <div className="text-[var(--text-tertiary)] text-[12px] mt-1">Analyzing {config.durationMonths} months</div>
        </div>
      </div>
    );
  }

  // Empty state - no data
  if (!monthsData || monthsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-[var(--text-secondary)] text-[16px] mb-2">No simulation data available</div>
          <div className="text-[var(--text-tertiary)] text-[13px]">Configure your project and inflow plan to see risk analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Minimal Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`${getStatusColor(summaryStats.overallRisk)}`}>
              {getRiskIcon(summaryStats.overallRisk)}
            </span>
            <span className="text-[var(--text-primary)] text-[15px] font-medium">
              {summaryStats.overallRisk.charAt(0).toUpperCase() + summaryStats.overallRisk.slice(1)} Risk
            </span>
          </div>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span className="text-[var(--text-secondary)] text-[14px]">
            Worst month: <span className="text-[var(--text-primary)] font-medium">{summaryStats.worstMonth}</span>
          </span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span className="text-[var(--text-secondary)] text-[14px]">
            P80: <span className="text-[var(--text-primary)] font-medium">{formatCurrency(summaryStats.worstP80)}</span>
          </span>
        </div>
        <span className="text-[var(--text-tertiary)] text-[13px]">
          Spent {formatCurrency(summaryStats.spentToDate)} of {formatCurrency(summaryStats.spentToDate + summaryStats.remainingCap)}
        </span>
      </div>

      {/* KPI Cards - Cleaner, more minimal */}
      <div className="grid grid-cols-4 gap-5">
        {/* Coverage Outlook */}
        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5">
          <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wider mb-4">
            Next 3 Months
          </div>
          <div className="flex gap-2">
            {monthsData.slice(0, 3).map((month) => (
              <div
                key={month.month}
                className={`flex-1 py-2.5 rounded-md border text-center ${getStatusBg(month.status)}`}
              >
                <div className="text-[var(--text-secondary)] text-[11px] mb-0.5">
                  {month.month.split(' ')[0]}
                </div>
                <div className={`text-[13px] font-semibold tabular-nums ${getStatusColor(month.status)}`}>
                  {month.probability.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Month */}
        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5">
          <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wider mb-4">
            Highest Risk
          </div>
          <div className="text-[var(--text-primary)] text-[20px] font-semibold mb-1">
            {summaryStats.worstMonth}
          </div>
          <div className="text-[var(--text-secondary)] text-[13px]">
            {summaryStats.worstProbability.toFixed(0)}% probability • {formatCurrency(summaryStats.worstP80)} P80
          </div>
        </div>

        {/* Total Exposure */}
        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5">
          <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wider mb-4">
            Total Exposure
          </div>
          <div className="text-[var(--text-primary)] text-[20px] font-semibold mb-1">
            {formatCurrency(summaryStats.expectedShortfall)}
          </div>
          <div className="text-[var(--text-secondary)] text-[13px]">
            <span className="text-rose-400">{summaryStats.redMonths}</span> months at risk
          </div>
        </div>

        {/* Primary Driver */}
        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5">
          <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wider mb-4">
            Top Driver
          </div>
          <div className="text-[var(--text-primary)] text-[15px] font-medium mb-1">
            {topDrivers[0]?.name || 'N/A'}
          </div>
          <div className="text-[var(--text-secondary)] text-[13px]">
            {topDrivers[0] ? `${(topDrivers[0].riskContribution * 100).toFixed(0)}% of risk contribution` : 'No risk drivers identified'}
          </div>
        </div>
      </div>

      {/* Monthly Timeline - Simplified */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[var(--text-primary)] text-[16px] font-medium">Monthly Overview</h3>
          <span className="text-[var(--text-tertiary)] text-[12px]">Click a month for details</span>
        </div>

        <div className="grid grid-cols-12 gap-2">
          {monthsData.map((month) => (
            <button
              key={month.month}
              onClick={() => onMonthClick(month)}
              className={`
                p-3 rounded-lg border transition-all hover:scale-[1.02]
                ${getStatusBg(month.status)}
                hover:border-[var(--accent-blue)]/50
              `}
            >
              <div className="text-[var(--text-secondary)] text-[11px] mb-1">
                {month.month.split(' ')[0]}
              </div>
              <div className={`flex items-center justify-center gap-1 ${getStatusColor(month.status)}`}>
                {getRiskIcon(month.status, 'w-3 h-3')}
              </div>
              <div className="text-[var(--text-primary)] text-[12px] font-medium mt-1 tabular-nums">
                {month.probability.toFixed(0)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Risk Drivers - Simplified table */}
      <div>
        <h3 className="text-[var(--text-primary)] text-[16px] font-medium mb-5">Risk Drivers</h3>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left px-5 py-3 text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider font-medium">Driver</th>
                <th className="text-left px-5 py-3 text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider font-medium">Category</th>
                <th className="text-right px-5 py-3 text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider font-medium">Risk %</th>
                <th className="text-right px-5 py-3 text-[var(--text-tertiary)] text-[11px] uppercase tracking-wider font-medium">Impact %</th>
              </tr>
            </thead>
            <tbody>
              {topDrivers.map((driver, index) => (
                <tr key={driver.id} className="border-b border-[var(--divider)] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-tertiary)] text-[12px] tabular-nums">{index + 1}</span>
                      <span className="text-[var(--text-primary)] text-[14px]">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[var(--text-secondary)] text-[13px]">{driver.component}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[var(--text-primary)] text-[14px] font-medium tabular-nums">
                      {(driver.riskContribution * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-[var(--text-primary)] text-[14px] font-medium tabular-nums">
                      {(driver.impactContribution * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions - Compact */}
      <div>
        <h3 className="text-[var(--text-primary)] text-[16px] font-medium mb-5">Suggested Actions</h3>

        <div className="space-y-3">
          {recommendedActions.slice(0, 3).map((action) => (
            <div
              key={action.id}
              className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5 flex items-center justify-between gap-6 hover:border-[var(--divider-hover)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[var(--accent-blue)]" />
                </div>
                <div>
                  <div className="text-[var(--text-primary)] text-[14px] font-medium mb-0.5">
                    {action.title}
                  </div>
                  <div className="text-[var(--text-tertiary)] text-[13px]">
                    {action.impact.redMonths < 0 && (
                      <span className="text-emerald-400">
                        {Math.abs(action.impact.redMonths)} fewer red months
                      </span>
                    )}
                    {action.impact.redMonths < 0 && action.impact.worstP80 < 0 && ' • '}
                    {action.impact.worstP80 < 0 && (
                      <span className="text-emerald-400">
                        Save {formatCurrency(Math.abs(action.impact.worstP80))}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApplyAction(action.id, action.title)}
                >
                  Apply
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
