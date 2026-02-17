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
        return <CheckCircle2 className="w-4 h-4" />;
      case 'watch':
        return <AlertCircle className="w-4 h-4" />;
      case 'severe':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch (status) {
      case 'low': return 'secondary'; // Will use emerald-50 in component
      case 'watch': return 'secondary'; // Will use amber-50
      case 'severe': return 'destructive'; // Will use red-50
      default: return 'default';
    }
  };

  // Custom badge styles to override default valid
  const getBadgeClassName = (status: string) => {
    switch (status) {
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'watch': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'severe': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default: return '';
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
      SERVICE: 'bg-blue-50 text-blue-700 border-blue-200',
      MATERIAL: 'bg-purple-50 text-purple-700 border-purple-200',
      INFRA: 'bg-amber-50 text-amber-700 border-amber-200'
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
            className={`flex items-center gap-2 px-3 py-1 text-sm border ${getBadgeClassName(month.status)}`}
          >
            {getRiskIcon(month.status)}
            <span className="font-semibold uppercase tracking-wide text-xs">{getRiskLabel(month.status)} Risk</span>
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              Probability
            </div>
            <div className="text-black text-3xl font-bold tabular-nums tracking-tight">
              {month.probability.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              Expected Shortfall
            </div>
            <div className="text-black text-3xl font-bold tabular-nums tracking-tight">
              {formatCurrency(month.expectedShortfall)}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
              P80 Shortfall
            </div>
            <div className="text-black text-3xl font-bold tabular-nums tracking-tight">
              {formatCurrency(month.p80Shortfall)}
            </div>
          </div>
        </div>

        {/* What Happens */}
        <div>
          <h4 className="text-black font-bold text-sm mb-3">Analysis</h4>
          <Card className="p-5 shadow-sm bg-zinc-50/50 border-zinc-200">
            <p className="text-zinc-800 text-sm leading-relaxed">
              There is a <span className="font-bold text-black">{month.probability.toFixed(1)}%</span> probability
              that spending will exceed budget in {month.month}. In the worst-case (P80) scenario,
              the shortfall could reach <span className="font-bold text-red-600">{formatCurrency(month.p80Shortfall)}</span>,
              with an expected shortfall of <span className="font-bold text-black">{formatCurrency(month.expectedShortfall)}</span>.
            </p>
          </Card>
        </div>

        {/* Why Section with Tabs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-black font-bold text-sm">Drivers</h4>

            {/* Segmented Control */}
            <div className="inline-flex rounded-lg bg-zinc-100 p-1 border border-zinc-200">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`
                  px-4 py-1.5 rounded-md text-xs font-bold transition-all
                  ${activeTab === 'drivers'
                    ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                    : 'text-zinc-500 hover:text-black hover:bg-zinc-200/50'
                  }
                `}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab('entities')}
                className={`
                  px-4 py-1.5 rounded-md text-xs font-bold transition-all
                  ${activeTab === 'entities'
                    ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                    : 'text-zinc-500 hover:text-black hover:bg-zinc-200/50'
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
                <Card key={driver.id} className="p-4 shadow-sm hover:border-zinc-300 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-black font-bold text-sm">
                            {driver.name}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 border ${getComponentBadgeColor(driver.component)}`}
                            variant="outline"
                          >
                            {driver.component}
                          </Badge>
                        </div>
                        <p className="text-zinc-500 text-xs">
                          {driver.description}
                        </p>
                      </div>
                      <div className="text-zinc-400 text-xs font-bold font-mono">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="flex gap-8 pt-3 border-t border-zinc-100">
                      <div>
                        <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1">
                          Risk Contribution
                        </div>
                        <div className="text-black text-sm font-bold tabular-nums">
                          {(driver.riskContribution * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1">
                          Impact Contribution
                        </div>
                        <div className="text-black text-sm font-bold tabular-nums">
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
            <Card className="p-8 shadow-sm border-dashed border-zinc-300 bg-zinc-50/50">
              <div className="text-zinc-400 text-center text-sm font-medium">
                Entity-level breakdown coming soon
              </div>
            </Card>
          )}
        </div>

        {/* Actions for This Month */}
        {monthActions.length > 0 && (
          <div>
            <h4 className="text-black font-bold text-sm mb-4">Recommended Actions</h4>
            <div className="space-y-3">
              {monthActions.map((action) => (
                <Card key={action.id} className="p-0 shadow-sm overflow-hidden border-zinc-200">
                  <div className="p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-1 rounded bg-blue-50 text-blue-600">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-black font-bold text-sm">
                            {action.title}
                          </span>
                        </div>
                        <p className="text-zinc-600 text-xs leading-relaxed pl-7">
                          {action.reason}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-zinc-500 border-zinc-200 font-normal bg-zinc-50">
                        {action.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex gap-4 text-xs">
                      <span className="text-emerald-700 font-bold tabular-nums bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {action.impact.worstP80 > 0 ? '+' : ''}{formatCurrency(Math.abs(action.impact.worstP80))} Savings
                      </span>
                      <span className="text-emerald-700 font-bold tabular-nums bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {action.impact.probability > 0 ? '+' : ''}{action.impact.probability.toFixed(1)}% Conf.
                      </span>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-black text-white hover:bg-zinc-800">
                      Apply Action
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Diagnostics Link */}
        <div className="pt-6 border-t border-zinc-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdvancedClick}
            className="text-zinc-500 hover:text-black hover:bg-zinc-100 pl-0"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Advanced Diagnostics
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
