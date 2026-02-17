import React, { useState } from 'react';
import { Save, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
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
    setActualOutflows,
    plannedOutflows,
    copyRange
  } = useProjectStore();

  const [hasChanges, setHasChanges] = useState(false);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);

  // Auto-select Current Month on load
  React.useEffect(() => {
    if (months.length > 0 && config.asOfMonth) {
      const idx = months.indexOf(config.asOfMonth);
      if (idx !== -1) setSelectedMonthIdx(idx);
    }
  }, [months, config.asOfMonth]);

  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(config.activities.length > 0 ? [config.activities[0]] : [])
  );

  // Get activities and entities from config
  const activities = config.activities;
  const entities = config.entities;

  // Current selected month
  const selectedMonth = months[selectedMonthIdx] || '';
  // Limit selection to historical months (<= asOfMonth)
  const asOfIndex = months.indexOf(config.asOfMonth);
  const isFuture = selectedMonth > config.asOfMonth;

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
    let total = 0;

    if (!outflows?.[month]) return 0;

    entities.forEach(entity => {
      const data = outflows[month]?.[entity]?.[activity];
      if (data) {
        total += (data.SERVICE || 0) + (data.MATERIAL || 0) + (data.INFRA || 0);
      }
    });

    return total;
  };

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

  const handleCopyForecast = () => {
    // Copy planned values to actuals for this month
    setActualOutflows((prev: any) => {
      const next = { ...prev };
      if (plannedOutflows[selectedMonth]) {
        next[selectedMonth] = JSON.parse(JSON.stringify(plannedOutflows[selectedMonth]));
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleValueChange = (
    entity: string,
    activity: string,
    component: 'SERVICE' | 'MATERIAL' | 'INFRA',
    value: number
  ) => {
    setActualOutflows((prev: any) => ({
      ...prev,
      [selectedMonth]: {
        ...(prev[selectedMonth] || {}),
        [entity]: {
          ...(prev[selectedMonth]?.[entity] || {}),
          [activity]: {
            ...(prev[selectedMonth]?.[entity]?.[activity] || {}),
            [component]: value
          }
        }
      }
    }));
    setHasChanges(true);
  };

  const formatCurrency = (value: number) => {
    if (value >= 100) return `₹${value.toFixed(0)} Cr`;
    if (value >= 10) return `₹${value.toFixed(1)} Cr`;
    return `₹${value.toFixed(2)} Cr`;
  };

  // Empty state
  if (activities.length === 0) {
    return (
      <div className="max-w-7xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Recorded Actuals</h2>
          <p className="text-zinc-500">
            Record actual spend by activity and component type
          </p>
        </div>
        <div className="flex items-center justify-center h-[40vh] bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <div className="text-zinc-400 text-sm">
            No activities configured
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8 pb-24">
      {/* Unsaved Changes Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-[260px] right-0 bg-black px-8 py-4 z-30 border-t border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-white font-medium">You have unsaved changes</span>
            <Button
              size="sm"
              onClick={() => setHasChanges(false)}
              className="bg-white text-black hover:bg-zinc-200"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Recorded Actuals</h2>
        <p className="text-zinc-500">
          Record actual spend vs plan. Future months are read-only.
        </p>
      </div>

      {/* Month Selector used as tabs */}
      <div className="border-b border-zinc-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-0">
          {months.slice(0, asOfIndex + 1).map((month, idx) => (
            <button
              key={month}
              onClick={() => setSelectedMonthIdx(idx)}
              className={`
                px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2
                ${selectedMonthIdx === idx
                  ? 'border-black text-black'
                  : 'border-transparent text-zinc-500 hover:text-black hover:border-zinc-300'
                }
                `}
            >
              {formatMonth(month)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyForecast}
          className="border-zinc-300 text-black hover:bg-zinc-50"
        >
          <Copy className="w-4 h-4 mr-2" />
          Populate from Plan
        </Button>
      </div>

      {/* Activities */}
      <div className="space-y-4">
        {activities.map(activity => {
          const actualTotal = getActivityTotal(activity, selectedMonth, 'actual');
          const forecastTotal = getActivityTotal(activity, selectedMonth, 'forecast');
          const isExpanded = expandedActivities.has(activity);

          return (
            <div
              key={activity}
              className={`bg-white rounded-lg border transition-all duration-200 ${isExpanded ? 'border-zinc-300 shadow-sm' : 'border-zinc-200 hover:border-zinc-300'}`}
            >
              {/* Activity Header */}
              <button
                onClick={() => toggleActivity(activity)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-black" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="text-black font-bold text-base">
                    {activity}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                      Planned
                    </div>
                    <div className="text-zinc-500 font-medium tabular-nums text-sm">
                      {formatCurrency(forecastTotal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                      Actual
                    </div>
                    <div className="text-black font-bold tabular-nums text-lg">
                      {formatCurrency(actualTotal)}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content - Show by Entity */}
              {isExpanded && (
                <div className="p-6 space-y-6 border-t border-zinc-100 bg-zinc-50/50 rounded-b-lg">
                  {entities.map(entity => {
                    const actuals = getActualValues(entity, activity, selectedMonth);
                    const forecast = getForecastValues(entity, activity, selectedMonth);
                    const entityTotal = actuals.SERVICE + actuals.MATERIAL + actuals.INFRA;

                    return (
                      <div key={entity} className="space-y-3 bg-white p-5 rounded border border-zinc-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-zinc-50 pb-2">
                          <span className="text-zinc-700 text-sm font-bold uppercase tracking-wide">
                            {entity}
                          </span>
                          <span className="text-zinc-400 text-xs font-medium tabular-nums">
                            Actual Subtotal: <span className="text-black font-bold">{formatCurrency(entityTotal)}</span>
                          </span>
                        </div>

                        {/* Component Inputs */}
                        <div className="grid grid-cols-3 gap-6">
                          {/* Service */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <label className="block text-zinc-500 text-xs font-bold uppercase">
                                Service
                              </label>
                              <span className="text-[10px] text-zinc-400">Plan: {forecast.SERVICE.toFixed(1)}</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">₹</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={actuals.SERVICE || ''}
                                onChange={(e) => handleValueChange(entity, activity, 'SERVICE', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-black text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                              />
                            </div>
                          </div>
                          {/* Material */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <label className="block text-zinc-500 text-xs font-bold uppercase">
                                Material
                              </label>
                              <span className="text-[10px] text-zinc-400">Plan: {forecast.MATERIAL.toFixed(1)}</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">₹</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={actuals.MATERIAL || ''}
                                onChange={(e) => handleValueChange(entity, activity, 'MATERIAL', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-black text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                              />
                            </div>
                          </div>
                          {/* Infra */}
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <label className="block text-zinc-500 text-xs font-bold uppercase">
                                Infra
                              </label>
                              <span className="text-[10px] text-zinc-400">Plan: {forecast.INFRA.toFixed(1)}</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">₹</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={actuals.INFRA || ''}
                                onChange={(e) => handleValueChange(entity, activity, 'INFRA', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-black text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                              />
                            </div>
                          </div>
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
}
