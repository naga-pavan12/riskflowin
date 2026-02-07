import React, { useState, useEffect } from 'react';
import { Settings, Code, AlertCircle } from 'lucide-react';
import { SimpleDrawer as Drawer } from '../ui/drawer';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useProjectStore } from '../../../store/useProjectStore';
import { toast } from 'sonner';

interface AdvancedDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedDrawer({ open, onClose }: AdvancedDrawerProps) {
  const {
    volatilityFactor,
    setVolatilityFactor,
    corrStrength,
    setCorrStrength,
    months,
    actualOutflows,
    config
  } = useProjectStore();

  const [localVolatility, setLocalVolatility] = useState(String(volatilityFactor));
  const [localCorrelation, setLocalCorrelation] = useState(String(corrStrength));
  const [seed, setSeed] = useState('42');
  const [iterations, setIterations] = useState('5000');

  // Sync local state when store changes or drawer opens
  useEffect(() => {
    if (open) {
      setLocalVolatility(String(volatilityFactor));
      setLocalCorrelation(String(corrStrength));
    }
  }, [open, volatilityFactor, corrStrength]);

  const handleApply = () => {
    const v = parseFloat(localVolatility);
    const c = parseFloat(localCorrelation);

    if (!isNaN(v) && v > 0 && v <= 1) setVolatilityFactor(v);
    if (!isNaN(c) && c >= 0 && c <= 1) setCorrStrength(c);

    toast.success('Simulation parameters updated', {
      description: 'The simulation will re-run with new settings.'
    });
    onClose();
  };

  // Calculate missing actuals
  const missingActualsCount = months.slice(0, months.indexOf(config.asOfMonth) + 1).filter(m => {
    // Check if any entity has actuals for this month
    const monthData = actualOutflows[m];
    if (!monthData) return true;
    return Object.keys(monthData).length === 0;
  }).length;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Advanced Settings"
      width="40%"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleApply}>
            Apply Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Warning */}
        <Card className="bg-[var(--status-watch-bg)] border-[var(--status-watch-border)] p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--status-watch-text)] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium mb-1">
                Advanced Monte Carlo Settings
              </div>
              <p className="text-[var(--text-secondary)] text-[14px]">
                These controls affect simulation accuracy and runtime. Changes may impact forecast reliability.
              </p>
            </div>
          </div>
        </Card>

        {/* Simulation Controls */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
            <h4 className="text-[var(--text-secondary)]">Simulation Parameters</h4>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Volatility Factor</label>
              <Input
                type="number"
                step="0.01"
                value={localVolatility}
                onChange={(e) => setLocalVolatility(e.target.value)}
              />
              <p className="text-[var(--text-tertiary)] text-[12px]">Standard deviation multiplier (0.1 - 1.0)</p>
            </div>

            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Correlation Coefficient</label>
              <Input
                type="number"
                step="0.01"
                value={localCorrelation}
                onChange={(e) => setLocalCorrelation(e.target.value)}
              />
              <p className="text-[var(--text-tertiary)] text-[12px]">Cross-component correlation (0.0 - 1.0)</p>
            </div>

            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Random Seed</label>
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
              <p className="text-[var(--text-tertiary)] text-[12px]">For reproducible results</p>
            </div>

            <div className="space-y-2">
              <label className="text-[var(--text-secondary)] text-[13px] font-medium">Iterations</label>
              <Input
                type="number"
                step="1000"
                value={iterations}
                onChange={(e) => setIterations(e.target.value)}
              />
              <p className="text-[var(--text-tertiary)] text-[12px]">Monte Carlo simulation runs (min 1000)</p>
            </div>
          </div>
        </div>

        {/* Diagnostics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-[var(--text-secondary)]" />
            <h4 className="text-[var(--text-secondary)]">Diagnostics</h4>
          </div>

          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-[14px]">
                  Last Run
                </span>
                <span className="text-[var(--text-primary)] font-medium text-[14px]">
                  {new Date().toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] text-[14px]">
                  Missing Actuals
                </span>
                <Badge variant={missingActualsCount > 0 ? "secondary" : "outline"}>
                  {missingActualsCount} months
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Drawer>
  );
}
