import React, { useState } from 'react';
import { RefreshCw, Download, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

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
        <div className="exec-card p-5 space-y-4">
            {/* Top Row: Title + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                            "bg-brand text-white hover:opacity-90 disabled:opacity-50"
                        )}
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Running...' : 'Refresh Forecast'}
                    </button>

                    {/* Advanced Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-muted border border-border-soft hover:bg-bg-elevated transition-all"
                    >
                        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showAdvanced ? 'Hide Parameters' : 'Advanced'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="p-2.5 rounded-lg border border-border-soft text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
                        title="Share"
                    >
                        <Share2 size={16} />
                    </button>
                    <button
                        className="p-2.5 rounded-lg border border-border-soft text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all"
                        title="Export"
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Advanced Sliders (Collapsible) */}
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-soft">
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
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="exec-label">{label}</label>
            <span className="text-sm font-semibold text-brand tabular-nums">{displayValue}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full"
        />
        <div className="flex justify-between text-[10px] text-text-muted">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
        </div>
    </div>
);
