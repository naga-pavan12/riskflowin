import React, { useState, useEffect } from 'react';
import { Save, Building2, Calendar, IndianRupee, Settings2, Plus, X, Layers, Activity } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export function ProjectSetup() {
  const { config, updateConfig } = useProjectStore();

  // Local state for form editing
  const [formData, setFormData] = useState({
    name: config.name,
    startMonth: config.startMonth,
    asOfMonth: config.asOfMonth,
    durationMonths: config.durationMonths,
    capTotalCr: config.capTotalCr,
    protectEngineering: config.protectEngineering,
    underspendPolicy: config.underspendPolicy,
    entities: [...config.entities],
    activities: [...config.activities],
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [newEntity, setNewEntity] = useState('');
  const [newActivity, setNewActivity] = useState('');

  // Sync form data with config changes
  useEffect(() => {
    setFormData({
      name: config.name,
      startMonth: config.startMonth,
      asOfMonth: config.asOfMonth,
      durationMonths: config.durationMonths,
      capTotalCr: config.capTotalCr,
      protectEngineering: config.protectEngineering,
      underspendPolicy: config.underspendPolicy,
      entities: [...config.entities],
      activities: [...config.activities],
    });
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfig(formData);
    setHasChanges(false);
    toast.success('Configuration saved', {
      description: 'Project settings have been updated'
    });
  };

  const handleDiscard = () => {
    setFormData({
      name: config.name,
      startMonth: config.startMonth,
      asOfMonth: config.asOfMonth,
      durationMonths: config.durationMonths,
      capTotalCr: config.capTotalCr,
      protectEngineering: config.protectEngineering,
      underspendPolicy: config.underspendPolicy,
      entities: [...config.entities],
      activities: [...config.activities],
    });
    setHasChanges(false);
  };

  const addEntity = () => {
    if (newEntity.trim() && !formData.entities.includes(newEntity.trim())) {
      handleChange('entities', [...formData.entities, newEntity.trim()]);
      setNewEntity('');
    }
  };

  const removeEntity = (entity: string) => {
    handleChange('entities', formData.entities.filter(e => e !== entity));
  };

  const addActivity = () => {
    if (newActivity.trim() && !formData.activities.includes(newActivity.trim())) {
      handleChange('activities', [...formData.activities, newActivity.trim()]);
      setNewActivity('');
    }
  };

  const removeActivity = (activity: string) => {
    handleChange('activities', formData.activities.filter(a => a !== activity));
  };

  return (
    <div className="max-w-4xl space-y-8 pb-24">
      {/* Unsaved Changes Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-[240px] right-0 bg-[var(--accent-blue)] px-8 py-4 z-30 border-t border-blue-400/20">
          <div className="flex items-center justify-between max-w-4xl">
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

      {/* Header */}
      <div>
        <h2 className="text-[var(--text-primary)] text-[24px] font-semibold mb-2">Project Setup</h2>
        <p className="text-[var(--text-secondary)]">
          Configure project parameters, budget, and organizational structure
        </p>
      </div>

      {/* Project Information */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-[var(--text-secondary)] font-medium">Project Information</h3>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Project Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Duration (Months)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.durationMonths}
                onChange={(e) => handleChange('durationMonths', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-[var(--text-secondary)] font-medium">Timeline</h3>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Start Month</label>
              <input
                type="month"
                value={formData.startMonth}
                onChange={(e) => handleChange('startMonth', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">
                As-Of Month
                <span className="text-[var(--text-tertiary)] font-normal ml-2">(Grounding Date)</span>
              </label>
              <input
                type="month"
                value={formData.asOfMonth}
                onChange={(e) => handleChange('asOfMonth', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
              />
              <p className="text-[var(--text-tertiary)] text-[12px]">
                Months up to this date use actual data
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">End Month</label>
              <div className="px-4 py-3 bg-[var(--graphite-900)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-secondary)]">
                {/* Computed from start + duration */}
                {(() => {
                  const start = new Date(formData.startMonth + '-01');
                  start.setMonth(start.getMonth() + formData.durationMonths - 1);
                  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                })()}
              </div>
              <p className="text-[var(--text-tertiary)] text-[12px]">
                Calculated from start + duration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Budget Configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-[var(--text-secondary)] font-medium">Budget Configuration</h3>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)] text-[13px] font-medium">Total Budget Cap (₹ Crores)</label>
            <input
              type="number"
              min="0"
              step="10"
              value={formData.capTotalCr}
              onChange={(e) => handleChange('capTotalCr', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
            />
            <p className="text-[var(--text-tertiary)] text-[12px]">
              Maximum total expenditure allowed for this project
            </p>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-[var(--text-secondary)] font-medium">Policies</h3>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6 space-y-6">
          {/* Underspend Policy */}
          <div className="space-y-3">
            <label className="text-[var(--text-secondary)] text-[13px] font-medium">Underspend Policy</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="underspendPolicy"
                  value="ROLLOVER_NEXT_MONTH"
                  checked={formData.underspendPolicy === 'ROLLOVER_NEXT_MONTH'}
                  onChange={(e) => handleChange('underspendPolicy', e.target.value)}
                  className="w-4 h-4 accent-[var(--accent-blue)]"
                />
                <div>
                  <div className="text-[var(--text-primary)] text-[14px] font-medium">Rollover to Next Month</div>
                  <div className="text-[var(--text-tertiary)] text-[12px]">Unused budget carries over</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="underspendPolicy"
                  value="LAPSE"
                  checked={formData.underspendPolicy === 'LAPSE'}
                  onChange={(e) => handleChange('underspendPolicy', e.target.value)}
                  className="w-4 h-4 accent-[var(--accent-blue)]"
                />
                <div>
                  <div className="text-[var(--text-primary)] text-[14px] font-medium">Lapse</div>
                  <div className="text-[var(--text-tertiary)] text-[12px]">Unused budget is forfeited</div>
                </div>
              </label>
            </div>
          </div>

          {/* Protect Engineering Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[var(--divider)]">
            <div>
              <div className="text-[var(--text-primary)] text-[14px] font-medium">Protect Engineering Budget</div>
              <div className="text-[var(--text-tertiary)] text-[12px]">Prioritize engineering allocations during shortfalls</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.protectEngineering}
                onChange={(e) => handleChange('protectEngineering', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--graphite-700)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent-blue)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-blue)]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Entities */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-[var(--text-secondary)] font-medium">Entities / Cost Centers</h3>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6 space-y-4">
          <p className="text-[var(--text-tertiary)] text-[13px]">
            Define the organizational units or cost centers for budget allocation
          </p>

          {/* Current Entities */}
          <div className="flex flex-wrap gap-2">
            {formData.entities.map((entity) => (
              <Badge
                key={entity}
                variant="secondary"

                className="flex items-center gap-2 pr-2"
              >
                {entity}
                <button
                  onClick={() => removeEntity(entity)}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add New Entity */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newEntity}
              onChange={(e) => setNewEntity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEntity()}
              placeholder="Add new entity..."
              className="flex-1 px-4 py-2 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors text-[14px]"
            />
            <Button variant="secondary" size="sm" onClick={addEntity}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-[var(--text-secondary)] font-medium">Activities / Work Items</h3>
        </div>

        <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-6 space-y-4">
          <p className="text-[var(--text-tertiary)] text-[13px]">
            Define the types of work or activities for cost tracking
          </p>

          {/* Current Activities */}
          <div className="flex flex-wrap gap-2">
            {formData.activities.map((activity) => (
              <Badge
                key={activity}
                variant="secondary"

                className="flex items-center gap-2 pr-2"
              >
                {activity}
                <button
                  onClick={() => removeActivity(activity)}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add New Activity */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addActivity()}
              placeholder="Add new activity..."
              className="flex-1 px-4 py-2 bg-[var(--graphite-800)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors text-[14px]"
            />
            <Button variant="secondary" size="sm" onClick={addActivity}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-[var(--divider)]">
        <Button variant="secondary" onClick={handleDiscard}>
          Reset to Defaults
        </Button>
        <Button variant="default" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
