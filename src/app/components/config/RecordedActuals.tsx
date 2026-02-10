
import React, { useState, useMemo } from 'react';
import { Save, Copy, ChevronDown, ChevronRight, Upload, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useProjectStore } from '../../../store/useProjectStore';
import { format, parse } from 'date-fns';

interface ComponentValues {
  SERVICE: number;
  MATERIAL: number;
  INFRA: number;
}

export function RecordedActuals() {
  const {
    config,
    months,
    actualOutflows,
    plannedOutflows,
    updateOutflow,
    copyRange
  } = useProjectStore();

  const [hasChanges, setHasChanges] = useState(false);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(config.activities.length > 0 ? [config.activities[0]] : [])
  );

  // Get activities and entities from config
  const activities = config.activities;
  const entities = config.entities;

  // Current selected month
  const selectedMonth = months[selectedMonthIdx] || '';

  // Format month for display
  const formatMonth = (month: string) => {
    try {
      return format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy');
    } catch {
      return month;
    }
  };

  // Get component values for actuals
  const getActualValues = (entity: string, activity: string, month: string): ComponentValues => {
    const data = actualOutflows[month]?.[entity]?.[activity];
    return {
      SERVICE: data?.SERVICE || 0,
      MATERIAL: data?.MATERIAL || 0,
      INFRA: data?.INFRA || 0
    };
  };

  // Get component values for forecast (for comparison)
  const getForecastValues = (entity: string, activity: string, month: string): ComponentValues => {
    const data = plannedOutflows[month]?.[entity]?.[activity];
    return {
      SERVICE: data?.SERVICE || 0,
      MATERIAL: data?.MATERIAL || 0,
      INFRA: data?.INFRA || 0
    };
  };

  // Calculate totals for an activity across all entities
  const getActivityTotal = (activity: string, month: string, type: 'actual' | 'forecast'): number => {
    const outflows = type === 'actual' ? actualOutflows : plannedOutflows;
    if (!outflows[month]) return 0;

    let total = 0;
    entities.forEach(entity => {
      const entityData = outflows[month]?.[entity]?.[activity];
      if (entityData) {
        total += (entityData.SERVICE || 0) + (entityData.MATERIAL || 0) + (entityData.INFRA || 0);
      }
    });

    return total;
  };

  // Count months without actuals
  const monthsWithoutActuals = useMemo(() => {
    return months.filter(month => {
      const hasData = Object.keys(actualOutflows[month] || {}).length > 0;
      return !hasData;
    }).length;
  }, [months, actualOutflows]);

  const toggleActivity = (activity: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activity)) {
        newSet.delete(activity);
      } else {
        newSet.add(activity);
      }
      return newSet;
    });
  };

  const handleCopyPrevious = () => {
    if (selectedMonthIdx > 0) {
      const prevMonth = months[selectedMonthIdx - 1];
      copyRange('OUTFLOW', 'actual', prevMonth, [selectedMonth]);
      setHasChanges(true);
    }
  };

  const handleValueChange = (
    entity: string,
    activity: string,
    component: 'SERVICE' | 'MATERIAL' | 'INFRA',
    value: number
  ) => {
    updateOutflow('actual', selectedMonth, entity, activity, component, value);
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setHasChanges(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 100) return `₹${value.toFixed(0)} Cr`;
    if (value >= 10) return `₹${value.toFixed(1)} Cr`;
    return `₹${value.toFixed(2)} Cr`;
  };

  // Calculate variance percentage
  const getVariance = (actual: number, forecast: number): { value: number; color: string } => {
    if (forecast === 0) return { value: 0, color: 'text-[var(--text-tertiary)]' };
    const variance = ((actual - forecast) / forecast) * 100;
    return {
      value: variance,
      color: variance < 0 ? 'text-emerald-400' : variance > 0 ? 'text-rose-400' : 'text-[var(--text-tertiary)]'
    };
  };

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="max-w-7xl space-y-8">
        <div>
          <h2 className="mb-2">Recorded Actuals</h2>
          <p className="text-[var(--text-secondary)]">
            Enter actual spending data as it becomes available
          </p>
        </div>
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-center">
            <div className="text-[var(--text-secondary)] text-[16px] mb-2">No activities configured</div>
            <div className="text-[var(--text-tertiary)] text-[13px]">
              Add activities in Project Setup to record actuals
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8">
      {/* Unsaved Changes Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-[240px] right-0 bg-[var(--accent-blue)] px-8 py-4 z-30 border-t border-blue-400/20">
          <div className="flex items-center justify-between max-w-7xl">
            <span className="text-white font-medium">You have unsaved changes</span>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="!text-white hover:!bg-white/10"
              >
                Discard
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                className="!bg-white !text-[var(--accent-blue)]"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="mb-2">Recorded Actuals</h2>
            <p className="text-[var(--text-secondary)]">
              Enter actual spending data as it becomes available
            </p>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-[13px]">
            <Clock className="w-4 h-4" />
            <span>Last updated: {format(new Date(), 'MMM d, yyyy HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {months.map((month, idx) => (
          <button
            key={month}
            onClick={() => setSelectedMonthIdx(idx)}
            className={`
              px-4 py-2 rounded-[var(--radius-md)] text-[14px] font-medium transition-all whitespace-nowrap
              ${selectedMonthIdx === idx
                ? 'bg-[var(--accent-blue)] text-white'
                : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--divider)]'
              }
            `}
          >
            {formatMonth(month)}
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyPrevious}
          disabled={selectedMonthIdx === 0}
        >
          <Copy className="w-4 h-4" />
          Copy from Previous Month
        </Button>
        <Button variant="secondary" size="sm" disabled>
          <Upload className="w-4 h-4" />
          Import CSV (coming soon)
        </Button>
        {monthsWithoutActuals > 0 && (
          <div className="ml-auto">
            <Badge variant="secondary">
              {monthsWithoutActuals} months without actuals
            </Badge>
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="space-y-3">
        {activities.map(activity => {
          const actualTotal = getActivityTotal(activity, selectedMonth, 'actual');
          const forecastTotal = getActivityTotal(activity, selectedMonth, 'forecast');
          const variance = getVariance(actualTotal, forecastTotal);

          return (
            <div
              key={activity}
              className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] overflow-hidden"
            >
              {/* Activity Header */}
              <button
                onClick={() => toggleActivity(activity)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-b border-[var(--divider-subtle)]"
              >
                <div className="flex items-center gap-3">
                  {expandedActivities.has(activity) ? (
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                  )}
                  <span className="text-[var(--text-primary)] font-medium">
                    {activity}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[var(--text-tertiary)] text-[11px] uppercase tracking-wide">
                      Actual
                    </div>
                    <div className="text-[var(--text-primary)] font-semibold tabular-nums">
                      {formatCurrency(actualTotal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--text-tertiary)] text-[11px] uppercase tracking-wide">
                      vs Forecast
                    </div>
                    <div className={`font - semibold tabular - nums ${variance.color} `}>
                      {variance.value > 0 ? '+' : ''}{variance.value.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content - By Entity */}
              {expandedActivities.has(activity) && (
                <div className="p-6 space-y-6">
                  {entities.map(entity => {
                    const actuals = getActualValues(entity, activity, selectedMonth);
                    const forecasts = getForecastValues(entity, activity, selectedMonth);
                    const entityActualTotal = actuals.SERVICE + actuals.MATERIAL + actuals.INFRA;
                    const entityForecastTotal = forecasts.SERVICE + forecasts.MATERIAL + forecasts.INFRA;
                    const entityVariance = getVariance(entityActualTotal, entityForecastTotal);

                    return (
                      <div key={entity} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--text-secondary)] text-[13px] font-medium">
                            {entity}
                          </span>
                          <div className="flex items-center gap-4 text-[12px]">
                            <span className="text-[var(--text-tertiary)]">
                              Actual: {formatCurrency(entityActualTotal)}
                            </span>
                            <span className="text-[var(--text-tertiary)]">
                              Forecast: {formatCurrency(entityForecastTotal)}
                            </span>
                            <span className={entityVariance.color}>
                              {entityVariance.value > 0 ? '+' : ''}{entityVariance.value.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[var(--text-tertiary)] text-[12px] mb-1.5">
                              Service (₹ Cr)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={actuals.SERVICE || ''}
                              placeholder="0"
                              onChange={(e) => handleValueChange(entity, activity, 'SERVICE', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                            />
                          </div>
                          <div>
                            <label className="block text-[var(--text-tertiary)] text-[12px] mb-1.5">
                              Material (₹ Cr)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={actuals.MATERIAL || ''}
                              placeholder="0"
                              onChange={(e) => handleValueChange(entity, activity, 'MATERIAL', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                            />
                          </div>
                          <div>
                            <label className="block text-[var(--text-tertiary)] text-[12px] mb-1.5">
                              Infra (₹ Cr)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={actuals.INFRA || ''}
                              placeholder="0"
                              onChange={(e) => handleValueChange(entity, activity, 'INFRA', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Activity Summary */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--divider-subtle)]">
                    <div className="text-[var(--text-tertiary)] text-[13px]">
                      Total actual: <span className="text-[var(--text-primary)] font-semibold tabular-nums">{formatCurrency(actualTotal)}</span>
                    </div>
                    <div className="text-[var(--text-tertiary)] text-[13px]">
                      Forecast was: <span className="text-[var(--text-secondary)] font-semibold tabular-nums">{formatCurrency(forecastTotal)}</span>
                      <span className={`ml - 2 ${variance.color} `}>{variance.value > 0 ? '+' : ''}{variance.value.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Month Summary */}
      <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6">
        <div className="flex items-center justify-between">
          <div className="text-[var(--text-secondary)] text-[14px]">
            Total Actuals for {formatMonth(selectedMonth)}
          </div>
          <div className="text-[var(--text-primary)] text-[20px] font-semibold tabular-nums">
            {formatCurrency(
              activities.reduce((sum, act) => sum + getActivityTotal(act, selectedMonth, 'actual'), 0)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
