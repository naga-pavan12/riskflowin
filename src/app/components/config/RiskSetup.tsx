import React, { useState } from 'react';
import {
    Shield, Zap, CloudRain, BarChart3, AlertTriangle, Plus, Trash2,
    TrendingUp, DollarSign, Gauge, Ban
} from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import type { RiskConfig, ManualThreat, VolatilityClass, ContractorRisk } from '../../../types';
import { toast } from 'sonner';
import { Button } from '../ui/button';

const VOLATILITY_OPTIONS: { value: VolatilityClass; label: string; sigma: string; color: string }[] = [
    { value: 'low', label: 'Low', sigma: '5%', color: 'text-emerald-600' },
    { value: 'med', label: 'Medium', sigma: '10%', color: 'text-amber-600' },
    { value: 'high', label: 'High', sigma: '20%', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', sigma: '40%', color: 'text-red-600' },
];

const CONTRACTOR_OPTIONS: { value: ContractorRisk; label: string; desc: string }[] = [
    { value: 'reliable', label: 'Reliable', desc: 'Established, on-time track record' },
    { value: 'shaky', label: 'Shaky', desc: 'History of delays, +25% variance' },
    { value: 'high-risk', label: 'High Risk', desc: 'New/unreliable, +50% variance' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function RiskSetup() {
    const { riskConfig, setRiskConfig, months } = useProjectStore();
    const [newThreat, setNewThreat] = useState<Partial<ManualThreat>>({
        name: '', month: 1, amount: 0, probability: 0.3
    });

    const updateMarket = (updates: Partial<RiskConfig['market']>) => {
        setRiskConfig({ ...riskConfig, market: { ...riskConfig.market, ...updates } });
    };

    const updateExecution = (updates: Partial<RiskConfig['execution']>) => {
        setRiskConfig({ ...riskConfig, execution: { ...riskConfig.execution, ...updates } });
    };

    const updateFunding = (updates: Partial<RiskConfig['funding']>) => {
        setRiskConfig({ ...riskConfig, funding: { ...riskConfig.funding, ...updates } });
    };

    const addThreat = () => {
        if (!newThreat.name || !newThreat.month || !newThreat.amount) {
            toast.error('Please fill all threat fields');
            return;
        }
        const threat: ManualThreat = {
            id: `threat-${Date.now()}`,
            name: newThreat.name || '',
            month: newThreat.month || 1,
            amount: newThreat.amount || 0,
            probability: newThreat.probability || 0.3,
        };
        setRiskConfig({ ...riskConfig, threats: [...riskConfig.threats, threat] });
        setNewThreat({ name: '', month: 1, amount: 0, probability: 0.3 });
        toast.success(`Threat "${threat.name}" added`);
    };

    const removeThreat = (id: string) => {
        setRiskConfig({ ...riskConfig, threats: riskConfig.threats.filter(t => t.id !== id) });
    };

    const toggleRainMonth = (month: number) => {
        const current = riskConfig.execution.rainSeasonMonths;
        const updated = current.includes(month)
            ? current.filter(m => m !== month)
            : [...current, month].sort();
        updateExecution({ rainSeasonMonths: updated });
    };

    return (
        <div className="space-y-8 max-w-5xl pb-24">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-black flex items-center gap-3">
                    <Shield className="w-7 h-7 text-black" />
                    Risk Configuration
                </h1>
                <p className="text-zinc-500 mt-1 text-sm">
                    Configure high-fidelity risk parameters that drive the Monte Carlo simulation.
                </p>
            </div>

            {/* Market Risk */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-black" />
                    Market Risk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Volatility Class */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Material Price Volatility
                        </label>
                        <div className="space-y-2">
                            {VOLATILITY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateMarket({ volatilityClass: opt.value })}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-none border transition-all ${riskConfig.market.volatilityClass === opt.value
                                        ? 'border-black bg-zinc-50 text-black ring-1 ring-black'
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                                        }`}
                                >
                                    <span className="font-medium text-sm">{opt.label}</span>
                                    <span className={`text-xs font-mono font-bold ${opt.color}`}>σ = {opt.sigma}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inflation */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Annual Inflation Expectation
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={(riskConfig.market.inflationExpectation * 100).toFixed(0)}
                                onChange={e => updateMarket({ inflationExpectation: Number(e.target.value) / 100 })}
                                className="w-full bg-white border border-zinc-300 px-4 py-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Applied as monthly cumulative bias to MATERIAL costs</p>
                    </div>

                    {/* FX Exposure */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            FX Exposure
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                value={(riskConfig.market.fxExposurePct * 100).toFixed(0)}
                                onChange={e => updateMarket({ fxExposurePct: Number(e.target.value) / 100 })}
                                className="w-full bg-white border border-zinc-300 px-4 py-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">% of costs exposed to currency fluctuation</p>
                    </div>
                </div>
            </section>

            {/* Execution Risk */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2 mb-5">
                    <Zap className="w-5 h-5 text-black" />
                    Execution Risk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Schedule Confidence */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Schedule Confidence
                        </label>
                        <div className="space-y-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={riskConfig.execution.scheduleConfidence * 100}
                                onChange={e => updateExecution({ scheduleConfidence: Number(e.target.value) / 100 })}
                                className="w-full accent-black h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-red-600">Very Low (0%)</span>
                                <span className="text-black font-mono text-lg">
                                    {(riskConfig.execution.scheduleConfidence * 100).toFixed(0)}%
                                </span>
                                <span className="text-emerald-600">Very High (100%)</span>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Low confidence → overrun mean increases from 5% to 10%
                            </p>
                        </div>
                    </div>

                    {/* Contractor Risk */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Contractor Reliability
                        </label>
                        <div className="space-y-2">
                            {CONTRACTOR_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateExecution({ contractorRisk: opt.value })}
                                    className={`w-full text-left px-4 py-3 rounded-none border transition-all ${riskConfig.execution.contractorRisk === opt.value
                                        ? 'border-black bg-zinc-50 text-black ring-1 ring-black'
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300'
                                        }`}
                                >
                                    <span className="font-medium text-sm">{opt.label}</span>
                                    <span className="text-xs text-zinc-400 ml-2">— {opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rain Season Months */}
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-600 mb-3 uppercase tracking-wide">
                            <CloudRain className="w-4 h-4 text-zinc-400" />
                            Rain / Monsoon Season (40% productivity loss)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {MONTH_NAMES.map((name, i) => {
                                const monthNum = i + 1;
                                const isActive = riskConfig.execution.rainSeasonMonths.includes(monthNum);
                                return (
                                    <button
                                        key={monthNum}
                                        onClick={() => toggleRainMonth(monthNum)}
                                        className={`px-3 py-2 rounded-none text-sm font-medium transition-all border ${isActive
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                                            }`}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Funding Risk */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2 mb-5">
                    <DollarSign className="w-5 h-5 text-black" />
                    Funding Risk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Collection Efficiency */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Collection Efficiency
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                value={(riskConfig.funding.collectionEfficiency * 100).toFixed(0)}
                                onChange={e => updateFunding({ collectionEfficiency: Number(e.target.value) / 100 })}
                                className="w-full bg-white border border-zinc-300 px-4 py-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Haircut on inflow (85% = 15% not collected on time)</p>
                    </div>

                    {/* Covenant Hard Stop */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Covenant Hard Stop
                        </label>
                        <button
                            onClick={() => updateFunding({ covenantHardStop: !riskConfig.funding.covenantHardStop })}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-none border transition-all ${riskConfig.funding.covenantHardStop
                                ? 'border-red-600 bg-red-50 text-red-700'
                                : 'border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Ban className="w-4 h-4" />
                                <span className="font-medium text-sm">Bank Freeze</span>
                            </div>
                            <span className="text-xs font-mono font-bold">
                                {riskConfig.funding.covenantHardStop ? 'ACTIVE' : 'OFF'}
                            </span>
                        </button>
                        <p className="text-xs text-zinc-400 mt-1">Funding → 0 if progress below covenant</p>
                    </div>

                    {/* Min Progress Covenant */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-2 uppercase tracking-wide">
                            Min Progress Covenant
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                value={(riskConfig.funding.minProgressCovenant * 100).toFixed(0)}
                                onChange={e => updateFunding({ minProgressCovenant: Number(e.target.value) / 100 })}
                                disabled={!riskConfig.funding.covenantHardStop}
                                className={`w-full bg-white border border-zinc-300 px-4 py-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none ${!riskConfig.funding.covenantHardStop ? 'opacity-40 cursor-not-allowed bg-zinc-50' : ''
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">Minimum physical progress required</p>
                    </div>
                </div>
            </section>

            {/* Manual Threats */}
            <section className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2 mb-5">
                    <AlertTriangle className="w-5 h-5 text-black" />
                    Manual Threats
                </h2>

                {/* Existing Threats */}
                {riskConfig.threats.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {riskConfig.threats.map(threat => (
                            <div
                                key={threat.id}
                                className="flex items-center justify-between px-4 py-3 bg-zinc-50 rounded-none border border-zinc-200"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-black font-medium text-sm">{threat.name}</span>
                                    <span className="text-xs text-zinc-500 font-mono">Month {threat.month}</span>
                                    <span className="text-black font-bold text-sm">₹{threat.amount} Cr</span>
                                    <span className="text-xs text-zinc-500">{(threat.probability * 100).toFixed(0)}% prob</span>
                                </div>
                                <button
                                    onClick={() => removeThreat(threat.id)}
                                    className="text-zinc-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Threat */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1 font-medium uppercase">Name</label>
                        <input
                            type="text"
                            value={newThreat.name || ''}
                            onChange={e => setNewThreat(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Legal Dispute"
                            className="w-full bg-white border border-zinc-300 px-3 py-2 text-sm text-black focus:border-black outline-none rounded-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1 font-medium uppercase">Month</label>
                        <select
                            value={months[(newThreat.month || 1) - 1] || ''}
                            onChange={e => {
                                const idx = months.indexOf(e.target.value);
                                setNewThreat(prev => ({ ...prev, month: idx + 1 }));
                            }}
                            className="w-full bg-white border border-zinc-300 px-3 py-2 text-sm text-black focus:border-black outline-none rounded-none"
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1 font-medium uppercase">Amount (₹Cr)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={newThreat.amount || ''}
                            onChange={e => setNewThreat(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            className="w-full bg-white border border-zinc-300 px-3 py-2 text-sm text-black focus:border-black outline-none rounded-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1 font-medium uppercase">Probability (%)</label>
                        <input
                            type="number"
                            step="5"
                            min="0"
                            max="100"
                            value={((newThreat.probability || 0) * 100).toFixed(0)}
                            onChange={e => setNewThreat(prev => ({ ...prev, probability: Number(e.target.value) / 100 }))}
                            className="w-full bg-white border border-zinc-300 px-3 py-2 text-sm text-black focus:border-black outline-none rounded-none"
                        />
                    </div>
                    <Button
                        onClick={addThreat}
                        className="bg-black text-white hover:bg-zinc-800 rounded-none w-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </div>
            </section>
        </div>
    );
}
