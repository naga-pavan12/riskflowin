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

export function EngineeringDemand() {
  const {
    config,
    months,
    engineeringDemand, // Changed from plannedOutflows
    updateOutflow,
    copyRange
  } = useProjectStore();

  const [hasChanges, setHasChanges] = useState(false);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set(config.activities.length > 0 ? [config.activities[0]] : [])
  );

  // Get activities from project config
  const activities = config.activities;
  const entities = config.entities;

  // Current selected month in YYYY-MM format
  const selectedMonth = months[selectedMonthIdx] || '';

  // Format month for display (e.g., "Jan 2025")
  const formatMonth = (month: string) => {
    try {
      return format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy');
    } catch {
      return month;
    }
  };

  // Calculate totals for an activity across all entities
  const getActivityTotal = (activity: string, month: string): ComponentValues => {
    const totals: ComponentValues = { SERVICE: 0, MATERIAL: 0, INFRA: 0 };

    if (!engineeringDemand?.[month]) return totals; // Use engineeringDemand

    entities.forEach(entity => {
      const entityData = engineeringDemand[month]?.[entity]?.[activity];
      if (entityData) {
        totals.SERVICE += entityData.SERVICE || 0;
        totals.MATERIAL += entityData.MATERIAL || 0;
        totals.INFRA += entityData.INFRA || 0;
      }
    });

    return totals;
  };

  // Get component values for a specific entity/activity
  const getComponentValues = (entity: string, activity: string, month: string): ComponentValues => {
    const data = engineeringDemand?.[month]?.[entity]?.[activity]; // Use engineeringDemand
    return {
      SERVICE: data?.SERVICE || 0,
      MATERIAL: data?.MATERIAL || 0,
      INFRA: data?.INFRA || 0
    };
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

  const handleCopyPrevious = () => {
    if (selectedMonthIdx > 0) {
      const prevMonth = months[selectedMonthIdx - 1];
      copyRange('OUTFLOW', 'engineering', prevMonth, [selectedMonth]); // Target engineering
      setHasChanges(true);
    }
  };

  const handleValueChange = (
    entity: string,
    activity: string,
    component: 'SERVICE' | 'MATERIAL' | 'INFRA',
    value: number
  ) => {
    updateOutflow('engineering', selectedMonth, entity, activity, component, value); // Target engineering
    setHasChanges(true); // Keep local change tracking (even though store updates immediately)
  };

  const handleSave = () => {
    // Data is already saved to localStorage via the store
    setHasChanges(false);
  };

  const handleDiscard = () => {
    // Reload from localStorage would require a page refresh
    setHasChanges(false);
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
          <h2 className="text-2xl font-bold text-black mb-2">Planned Outflow</h2>
          <p className="text-zinc-500">
            Define demand forecasts by activity and component type
          </p>
        </div>
        <div className="flex items-center justify-center h-[40vh] bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <div className="text-center">
            <div className="text-zinc-500 font-medium text-lg mb-2">No activities configured</div>
            <div className="text-zinc-400 text-sm">
              Add activities in Project Setup to define demand forecasts
            </div>
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
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="text-white hover:text-white hover:bg-white/10"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-white text-black hover:bg-zinc-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Planned Outflow</h2>
        <p className="text-zinc-500">
          Define demand forecasts by activity and component type
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {months.map((month, idx) => (
          <button
            key={month}
            onClick={() => setSelectedMonthIdx(idx)}
            className={`
              px-4 py-2 rounded text-sm font-bold transition-all whitespace-nowrap border
              ${selectedMonthIdx === idx
                ? 'bg-black text-white border-black shadow-md'
                : 'bg-white text-zinc-500 hover:text-black border-zinc-200 hover:border-zinc-300'
              }
            `}
          >
            {formatMonth(month)}
          </button>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyPrevious}
          disabled={selectedMonthIdx === 0}
          className="border-zinc-300 text-black hover:bg-zinc-50"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy from Previous Month
        </Button>
      </div>

      {/* Activities */}
      <div className="space-y-4">
        {activities.map(activity => {
          const totals = getActivityTotal(activity, selectedMonth);
          const grandTotal = totals.SERVICE + totals.MATERIAL + totals.INFRA;
          const isExpanded = expandedActivities.has(activity);

          return (
            <div
              key={activity}
              className={`bg-white rounded-lg border transition-all duration-200 ${isExpanded ? 'border-zinc-300 shadow-sm' : 'border-zinc-200 hover:border-zinc-300'}`}
            >
              {/* Activity Header */}
              <button
                onClick={() => toggleActivity(activity)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-t-lg"
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
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                      Total
                    </div>
                    <div className="text-black font-bold tabular-nums text-lg">
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content - Show by Entity */}
              {isExpanded && (
                <div className="p-6 space-y-6 border-t border-zinc-100 bg-zinc-50/30 rounded-b-lg">
                  {entities.map(entity => {
                    const values = getComponentValues(entity, activity, selectedMonth);
                    const entityTotal = values.SERVICE + values.MATERIAL + values.INFRA;

                    return (
                      <div key={entity} className="space-y-3 bg-white p-4 rounded border border-zinc-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-zinc-700 text-sm font-bold uppercase tracking-wide">
                            {entity}
                          </span>
                          <span className="text-zinc-400 text-xs font-medium tabular-nums">
                            Subtotal: <span className="text-black font-bold">{formatCurrency(entityTotal)}</span>
                          </span>
                        </div>

                        {/* Component Inputs */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-zinc-500 text-xs font-medium mb-1.5 uppercase">
                              Service
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-zinc-400 text-sm">₹</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={values.SERVICE || ''}
                                placeholder="0"
                                onChange={(e) => handleValueChange(entity, activity, 'SERVICE', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-black text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-zinc-500 text-xs font-medium mb-1.5 uppercase">
                              Material
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-zinc-400 text-sm">₹</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={values.MATERIAL || ''}
                                placeholder="0"
                                onChange={(e) => handleValueChange(entity, activity, 'MATERIAL', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-black text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-zinc-500 text-xs font-medium mb-1.5 uppercase">
                              Infra
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-zinc-400 text-sm">₹</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={values.INFRA || ''}
                                placeholder="0"
                                onChange={(e) => handleValueChange(entity, activity, 'INFRA', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-black text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Activity Summary */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 mt-4">
                    <div className="flex gap-6 text-xs font-medium">
                      <span className="text-zinc-600">
                        Service: <span className="text-black font-bold">{formatCurrency(totals.SERVICE)}</span>
                      </span>
                      <span className="text-zinc-600">
                        Material: <span className="text-black font-bold">{formatCurrency(totals.MATERIAL)}</span>
                      </span>
                      <span className="text-zinc-600">
                        Infra: <span className="text-black font-bold">{formatCurrency(totals.INFRA)}</span>
                      </span>
                    </div>
                    <div className="text-zinc-500 text-xs uppercase tracking-wide font-bold">
                      Activity total: <span className="text-black text-base font-bold tabular-nums ml-2">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Month Summary */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm flex items-center justify-between sticky bottom-6 z-20">
        <div className="text-zinc-500 text-sm font-medium">
          Total Demand for <span className="text-black font-bold">{formatMonth(selectedMonth)}</span>
        </div>
        <div className="text-black text-2xl font-bold tabular-nums">
          {formatCurrency(
            activities.reduce((sum, act) => {
              const totals = getActivityTotal(act, selectedMonth);
              return sum + totals.SERVICE + totals.MATERIAL + totals.INFRA;
            }, 0)
          )}
        </div>
      </div>
    </div>
  );
}
