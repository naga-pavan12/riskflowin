import React, { useState } from 'react';
import { RefreshCw, Download, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/button';

interface DashboardHeaderProps {
    volatility: number;
    onVolatilityChange: (val: number) => void;
    correlation: number;
    onCorrelationChange: (val: number) => void;
    onRefresh: () => void;
    loading: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    volatility, onVolatilityChange, correlation, onCorrelationChange, onRefresh, loading
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 space-y-4 mb-6">
            {/* Top Row: Title + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        className="bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={clsx("mr-2", loading ? 'animate-spin' : '')} />
                        {loading ? 'Running...' : 'Refresh Forecast'}
                    </Button>

                    {/* Advanced Toggle */}
                    <Button
                        variant="outline"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50"
                    >
                        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showAdvanced ? 'Hide Parameters' : 'Advanced'}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-zinc-200 text-zinc-400 hover:text-black hover:bg-zinc-50"
                        title="Share"
                    >
                        <Share2 size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-zinc-200 text-zinc-400 hover:text-black hover:bg-zinc-50"
                        title="Export"
                    >
                        <Download size={16} />
                    </Button>
                </div>
            </div>

            {/* Advanced Sliders (Collapsible) */}
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
                    <SliderControl
                        label="Demand Volatility"
                        value={volatility}
                        min={0.1}
                        max={3.0}
                        step={0.1}
                        onChange={onVolatilityChange}
                        displayValue={`${volatility.toFixed(1)}x`}
                        lowLabel="Low"
                        highLabel="High"
                    />
                    <SliderControl
                        label="Correlation Strength"
                        value={correlation}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={onCorrelationChange}
                        displayValue={`${(correlation * 100).toFixed(0)}%`}
                        lowLabel="Independent"
                        highLabel="Systemic"
                    />
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Slider Control (Clean, Accessible)
───────────────────────────────────────────────────────────── */
const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    displayValue: string;
    lowLabel: string;
    highLabel: string;
}> = ({ label, value, min, max, step, onChange, displayValue, lowLabel, highLabel }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-zinc-700 uppercase tracking-wide">{label}</label>
            <span className="text-sm font-bold text-black tabular-nums bg-zinc-100 px-2 py-0.5 rounded">{displayValue}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full accent-black h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
        </div>
    </div>
);
