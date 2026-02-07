import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Zap } from 'lucide-react';
import { SimpleDrawer as Drawer } from '../ui/drawer';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { type MonthRisk, type ComponentType, recommendedActions } from '../../data/sampleData';

interface MonthDetailDrawerProps {
  month: MonthRisk | null;
  open: boolean;
  onClose: () => void;
  onAdvancedClick: () => void;
}

export function MonthDetailDrawer({ month, open, onClose, onAdvancedClick }: MonthDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'drivers' | 'entities'>('drivers');

  if (!month) return null;

  const getRiskIcon = (status: string) => {
    switch (status) {
      case 'low':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'watch':
        return <AlertCircle className="w-5 h-5" />;
      case 'severe':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch (status) {
      case 'low':
      case 'watch':
        return 'secondary';
      case 'severe':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getRiskLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (value: number) => {
    if (value >= 10) return `₹${value.toFixed(1)} Cr`;
    return `₹${value.toFixed(2)} Cr`;
  };

  const getComponentBadgeColor = (component: ComponentType) => {
    const colors: Record<ComponentType, string> = {
      SERVICE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      MATERIAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      INFRA: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
    return colors[component];
  };

  const monthActions = recommendedActions.filter(action =>
    action.targetMonths.includes(month.month)
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={month.month}
      width="45%"
    >
      <div className="space-y-8">
        {/* Header with Status */}
        <div className="flex items-center gap-3">
          <Badge
            variant={getBadgeVariant(month.status)}
            className="flex items-center gap-2 px-3 py-1 text-sm"
          >
            {getRiskIcon(month.status)}
            <span>{getRiskLabel(month.status)} Risk</span>
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-2">
              Probability
            </div>
            <div className="text-[var(--text-primary)] text-[28px] font-semibold tabular-nums">
              {month.probability.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-2">
              Expected Shortfall
            </div>
            <div className="text-[var(--text-primary)] text-[28px] font-semibold tabular-nums">
              {formatCurrency(month.expectedShortfall)}
            </div>
          </div>
          <div>
            <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-2">
              P80 Shortfall
            </div>
            <div className="text-[var(--text-primary)] text-[28px] font-semibold tabular-nums">
              {formatCurrency(month.p80Shortfall)}
            </div>
          </div>
        </div>

        {/* What Happens */}
        <div>
          <h4 className="text-[var(--text-secondary)] mb-3">What happens</h4>
          <Card className="p-4 shadow-sm">
            <p className="text-[var(--text-primary)] text-[15px] leading-relaxed">
              There is a <span className="font-semibold">{month.probability.toFixed(1)}%</span> probability
              that spending will exceed budget in {month.month}. In the worst-case (P80) scenario,
              the shortfall could reach <span className="font-semibold">{formatCurrency(month.p80Shortfall)}</span>,
              with an expected shortfall of <span className="font-semibold">{formatCurrency(month.expectedShortfall)}</span>.
            </p>
          </Card>
        </div>

        {/* Why Section with Tabs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[var(--text-secondary)]">Why</h4>

            {/* Segmented Control */}
            <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--surface-elevated)] p-1 border border-[var(--divider)]">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`
                  px-4 py-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium transition-all
                  ${activeTab === 'drivers'
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab('entities')}
                className={`
                  px-4 py-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium transition-all
                  ${activeTab === 'entities'
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                Entities
              </button>
            </div>
          </div>

          {activeTab === 'drivers' && (
            <div className="space-y-3">
              {month.drivers.map((driver, index) => (
                <Card key={driver.id} className="p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[var(--text-primary)] font-medium">
                            {driver.name}
                          </span>
                          <Badge
                            className={getComponentBadgeColor(driver.component)}
                          >
                            {driver.component}
                          </Badge>
                        </div>
                        <p className="text-[var(--text-secondary)] text-[14px]">
                          {driver.description}
                        </p>
                      </div>
                      <div className="text-[var(--text-tertiary)] text-[13px] font-medium">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="flex gap-6 pt-3 border-t border-[var(--divider-subtle)]">
                      <div>
                        <div className="text-[var(--text-tertiary)] text-[11px] uppercase tracking-wide mb-1">
                          Risk Contribution
                        </div>
                        <div className="text-[var(--text-primary)] text-[15px] font-semibold tabular-nums">
                          {(driver.riskContribution * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-tertiary)] text-[11px] uppercase tracking-wide mb-1">
                          Impact Contribution
                        </div>
                        <div className="text-[var(--text-primary)] text-[15px] font-semibold tabular-nums">
                          {(driver.impactContribution * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'entities' && (
            <Card className="p-4 shadow-sm">
              <div className="text-[var(--text-secondary)] text-center py-8">
                Entity-level breakdown coming soon
              </div>
            </Card>
          )}
        </div>

        {/* Actions for This Month */}
        {monthActions.length > 0 && (
          <div>
            <h4 className="text-[var(--text-secondary)] mb-4">Actions for this month</h4>
            <div className="space-y-3">
              {monthActions.map((action) => (
                <Card key={action.id} className="p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-[var(--accent-blue)]" />
                          <span className="text-[var(--text-primary)] font-medium">
                            {action.title}
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] text-[14px]">
                          {action.reason}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {action.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--divider-subtle)]">
                      <div className="flex gap-4 text-[13px]">
                        <span className="text-[var(--accent-green)] font-medium tabular-nums">
                          {action.impact.worstP80 > 0 ? '+' : ''}{formatCurrency(Math.abs(action.impact.worstP80))}
                        </span>
                        <span className="text-[var(--accent-green)] font-medium tabular-nums">
                          {action.impact.probability > 0 ? '+' : ''}{action.impact.probability.toFixed(1)}%
                        </span>
                      </div>
                      <Button variant="default" size="sm">
                        Apply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Diagnostics Link */}
        <div className="pt-6 border-t border-[var(--divider)]">
          <Button
            variant="link"
            size="sm"
            onClick={onAdvancedClick}
            className="!p-0 !h-auto"
          >
            <TrendingUp className="w-4 h-4" />
            Advanced diagnostics
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
