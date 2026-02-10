import React, { useState } from 'react';
import {
    Shield, Zap, CloudRain, BarChart3, AlertTriangle, Plus, Trash2,
    TrendingUp, DollarSign, Gauge, Ban
} from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import type { RiskConfig, ManualThreat, VolatilityClass, ContractorRisk } from '../../../types';
import { toast } from 'sonner';

const VOLATILITY_OPTIONS: { value: VolatilityClass; label: string; sigma: string; color: string }[] = [
    { value: 'low', label: 'Low', sigma: '5%', color: 'text-green-400' },
    { value: 'med', label: 'Medium', sigma: '10%', color: 'text-amber-400' },
    { value: 'high', label: 'High', sigma: '20%', color: 'text-orange-400' },
    { value: 'critical', label: 'Critical', sigma: '40%', color: 'text-red-400' },
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
        name: '', month: months[0] || '', amount: 0, probability: 0.3
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
            month: newThreat.month || months[0],
            amount: newThreat.amount || 0,
            probability: newThreat.probability || 0.3,
        };
        setRiskConfig({ ...riskConfig, threats: [...riskConfig.threats, threat] });
        setNewThreat({ name: '', month: months[0] || '', amount: 0, probability: 0.3 });
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
        <div className="space-y-8 max-w-5xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Shield className="w-7 h-7 text-blue-400" />
                    Risk Configuration
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                    Configure high-fidelity risk parameters that drive the Monte Carlo simulation.
                </p>
            </div>

            {/* Market Risk */}
            <section className="bg-[#1a1a2e]/60 border border-slate-800/60 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Market Risk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Volatility Class */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Material Price Volatility
                        </label>
                        <div className="space-y-2">
                            {VOLATILITY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateMarket({ volatilityClass: opt.value })}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${riskConfig.market.volatilityClass === opt.value
                                            ? 'border-blue-500/50 bg-blue-500/10 text-white'
                                            : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="font-medium">{opt.label}</span>
                                    <span className={`text-xs font-mono ${opt.color}`}>σ = {opt.sigma}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inflation */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Annual Inflation Expectation
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={(riskConfig.market.inflationExpectation * 100).toFixed(0)}
                                onChange={e => updateMarket({ inflationExpectation: Number(e.target.value) / 100 })}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Applied as monthly cumulative bias to MATERIAL costs</p>
                    </div>

                    {/* FX Exposure */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            FX Exposure
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                value={(riskConfig.market.fxExposurePct * 100).toFixed(0)}
                                onChange={e => updateMarket({ fxExposurePct: Number(e.target.value) / 100 })}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">% of costs exposed to currency fluctuation</p>
                    </div>
                </div>
            </section>

            {/* Execution Risk */}
            <section className="bg-[#1a1a2e]/60 border border-slate-800/60 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Execution Risk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Schedule Confidence */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Schedule Confidence
                        </label>
                        <div className="space-y-3">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={riskConfig.execution.scheduleConfidence * 100}
                                onChange={e => updateExecution({ scheduleConfidence: Number(e.target.value) / 100 })}
                                className="w-full accent-blue-500"
                            />
                            <div className="flex justify-between text-xs">
                                <span className="text-red-400">Very Low (0%)</span>
                                <span className="text-white font-mono text-lg">
                                    {(riskConfig.execution.scheduleConfidence * 100).toFixed(0)}%
                                </span>
                                <span className="text-green-400">Very High (100%)</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Low confidence → overrun mean increases from 5% to 10%
                            </p>
                        </div>
                    </div>

                    {/* Contractor Risk */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Contractor Reliability
                        </label>
                        <div className="space-y-2">
                            {CONTRACTOR_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateExecution({ contractorRisk: opt.value })}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all ${riskConfig.execution.contractorRisk === opt.value
                                            ? 'border-blue-500/50 bg-blue-500/10 text-white'
                                            : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="font-medium">{opt.label}</span>
                                    <span className="text-xs text-slate-500 ml-2">— {opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rain Season Months */}
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                            <CloudRain className="w-4 h-4 text-sky-400" />
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
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                                                : 'bg-slate-800/40 border border-slate-700/40 text-slate-500 hover:border-slate-600'
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
            <section className="bg-[#1a1a2e]/60 border border-slate-800/60 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Funding Risk
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Collection Efficiency */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Collection Efficiency
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                value={(riskConfig.funding.collectionEfficiency * 100).toFixed(0)}
                                onChange={e => updateFunding({ collectionEfficiency: Number(e.target.value) / 100 })}
                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Haircut on inflow (85% = 15% not collected on time)</p>
                    </div>

                    {/* Covenant Hard Stop */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Covenant Hard Stop
                        </label>
                        <button
                            onClick={() => updateFunding({ covenantHardStop: !riskConfig.funding.covenantHardStop })}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${riskConfig.funding.covenantHardStop
                                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                                    : 'border-slate-700/50 bg-slate-800/30 text-slate-400'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Ban className="w-4 h-4" />
                                <span className="font-medium">Bank Freeze</span>
                            </div>
                            <span className="text-xs font-mono">
                                {riskConfig.funding.covenantHardStop ? 'ACTIVE' : 'OFF'}
                            </span>
                        </button>
                        <p className="text-xs text-slate-500 mt-1">Funding → 0 if progress below covenant</p>
                    </div>

                    {/* Min Progress Covenant */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Min Progress Covenant
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                value={(riskConfig.funding.minProgressCovenant * 100).toFixed(0)}
                                onChange={e => updateFunding({ minProgressCovenant: Number(e.target.value) / 100 })}
                                disabled={!riskConfig.funding.covenantHardStop}
                                className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2.5 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 outline-none ${!riskConfig.funding.covenantHardStop ? 'opacity-40 cursor-not-allowed' : ''
                                    }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Minimum physical progress required</p>
                    </div>
                </div>
            </section>

            {/* Manual Threats */}
            <section className="bg-[#1a1a2e]/60 border border-slate-800/60 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Manual Threats
                </h2>

                {/* Existing Threats */}
                {riskConfig.threats.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {riskConfig.threats.map(threat => (
                            <div
                                key={threat.id}
                                className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-lg border border-slate-700/40"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-white font-medium">{threat.name}</span>
                                    <span className="text-xs text-slate-400 font-mono">{threat.month}</span>
                                    <span className="text-amber-400 text-sm">₹{threat.amount} Cr</span>
                                    <span className="text-xs text-slate-500">{(threat.probability * 100).toFixed(0)}% prob</span>
                                </div>
                                <button
                                    onClick={() => removeThreat(threat.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors"
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
                        <label className="block text-xs text-slate-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={newThreat.name || ''}
                            onChange={e => setNewThreat(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Legal Dispute"
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Month</label>
                        <select
                            value={newThreat.month || ''}
                            onChange={e => setNewThreat(prev => ({ ...prev, month: e.target.value }))}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none"
                        >
                            {months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Amount (₹Cr)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={newThreat.amount || ''}
                            onChange={e => setNewThreat(prev => ({ ...prev, amount: Number(e.target.value) }))}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Probability (%)</label>
                        <input
                            type="number"
                            step="5"
                            min="0"
                            max="100"
                            value={((newThreat.probability || 0) * 100).toFixed(0)}
                            onChange={e => setNewThreat(prev => ({ ...prev, probability: Number(e.target.value) / 100 }))}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={addThreat}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Add Threat
                    </button>
                </div>
            </section>
        </div>
    );
}
