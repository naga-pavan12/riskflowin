import React, { useState, useEffect } from 'react';
import { Settings, Code, AlertCircle } from 'lucide-react';
import { SimpleDrawer as Drawer } from '../ui/drawer';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
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
          <Button variant="outline" onClick={onClose} className="border-zinc-300 text-black hover:bg-zinc-50">
            Cancel
          </Button>
          <Button variant="default" onClick={handleApply} className="bg-black text-white hover:bg-zinc-800">
            Apply Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Warning */}
        <Card className="bg-amber-50 border-amber-200 p-4 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-black font-bold mb-1 text-sm">
                Advanced Monte Carlo Settings
              </div>
              <p className="text-amber-800/80 text-xs leading-relaxed">
                These controls affect simulation accuracy and runtime. Changes may impact forecast reliability.
              </p>
            </div>
          </div>
        </Card>

        {/* Simulation Controls */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-zinc-500" />
            <h4 className="text-black font-bold text-sm">Simulation Parameters</h4>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-black text-xs font-bold uppercase tracking-wider">Volatility Factor (Sigma)</label>
              <Input
                type="number"
                step="0.01"
                value={localVolatility}
                onChange={(e) => setLocalVolatility(e.target.value)}
                className="bg-white border-zinc-300 focus:ring-black focus:border-black text-black"
              />
              <p className="text-zinc-500 text-xs">Standard deviation multiplier (0.1 - 1.0)</p>
            </div>

            <div className="space-y-2">
              <label className="text-black text-xs font-bold uppercase tracking-wider">Correlation Coefficient (Rho)</label>
              <Input
                type="number"
                step="0.01"
                value={localCorrelation}
                onChange={(e) => setLocalCorrelation(e.target.value)}
                className="bg-white border-zinc-300 focus:ring-black focus:border-black text-black"
              />
              <p className="text-zinc-500 text-xs">Cross-component correlation (0.0 - 1.0)</p>
            </div>

            <div className="space-y-2">
              <label className="text-black text-xs font-bold uppercase tracking-wider">Random Seed</label>
              <Input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="bg-white border-zinc-300 focus:ring-black focus:border-black text-black"
              />
              <p className="text-zinc-500 text-xs">For reproducible results</p>
            </div>

            <div className="space-y-2">
              <label className="text-black text-xs font-bold uppercase tracking-wider">Iterations</label>
              <Input
                type="number"
                step="1000"
                value={iterations}
                onChange={(e) => setIterations(e.target.value)}
                className="bg-white border-zinc-300 focus:ring-black focus:border-black text-black"
              />
              <p className="text-zinc-500 text-xs">Monte Carlo simulation runs (min 1000)</p>
            </div>
          </div>
        </div>

        {/* Diagnostics */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-4 h-4 text-zinc-500" />
            <h4 className="text-black font-bold text-sm">System Health</h4>
          </div>

          <Card className="p-0 border-zinc-200 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              <div className="flex items-center justify-between p-4 bg-white">
                <span className="text-zinc-600 text-sm font-medium">
                  Last Run
                </span>
                <span className="text-black font-mono text-xs">
                  {new Date().toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white">
                <span className="text-zinc-600 text-sm font-medium">
                  Missing Actuals
                </span>
                <Badge variant={missingActualsCount > 0 ? "secondary" : "outline"} className={missingActualsCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "text-zinc-500 border-zinc-200"}>
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
