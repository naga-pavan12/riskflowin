import React from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import { ShieldAlert, TrendingUp, Activity } from 'lucide-react';
import { FundingRunway } from './FundingRunway';
import { CauseStack } from './CauseStack';
import { ActionPortfolio } from './ActionPortfolio';
import { RiskCalendar } from './RiskCalendar';

export const VPDashboard: React.FC = () => {
    const { results, config } = useProjectStore();

    if (!results) {
        return (
            <div className="flex h-full items-center justify-center text-slate-500">
                <div className="text-center">
                    <Activity size={48} className="mx-auto mb-4 opacity-20 animate-pulse" />
                    <p className="text-sm font-bold uppercase tracking-widest">Running Grounded Simulations...</p>
                </div>
            </div>
        );
    }

    // Top Summary Calculation
    const historicalStats = results.monthlyStats.filter((s) => s.isHistorical);
    const totalSpentToDate = historicalStats.reduce((sum, s) => sum + s.plannedOutflowTotal, 0);
    const remainingCap = config.capTotalCr - totalSpentToDate;
    const futureGaps = results.monthlyStats.filter((s) => !s.isHistorical).reduce((sum, s) => sum + (s.gapToFix || 0), 0);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Executive Status Strip */}
            <header className="grid grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl shadow-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Spent To Date (Eng)</span>
                    <div className="flex items-end gap-2 text-2xl font-black text-white">
                        ₹{totalSpentToDate.toFixed(1)} <span className="text-xs text-slate-400 pb-1.5 font-bold uppercase">Cr</span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl shadow-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Cap Remaining</span>
                    <div className={`flex items-end gap-2 text-2xl font-black ${remainingCap < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                        ₹{remainingCap.toFixed(1)} <span className="text-xs opacity-60 pb-1.5 font-bold uppercase">Cr</span>
                    </div>
                </div>
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl shadow-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Gap (6m)</span>
                    <div className="flex items-end gap-2 text-2xl font-black text-rose-500">
                        ₹{futureGaps.toFixed(1)} <span className="text-xs opacity-60 pb-1.5 font-bold uppercase">Cr</span>
                    </div>
                </div>
                <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl shadow-2xl">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Health Distribution</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
                            <div className="h-full bg-amber-500" style={{ width: '20%' }} />
                            <div className="h-full bg-rose-500" style={{ width: '15%' }} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Core Panels Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Funding Runway (Main Decision Table) */}
                <div className="xl:col-span-2 space-y-8">
                    <section className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-500" />
                                    Funding Runway & Risk
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Safe Spend Limit benchmarked at P20 Realizable Inflow</p>
                            </div>
                        </div>
                        <FundingRunway stats={results.monthlyStats} />
                    </section>
                </div>

                {/* Right: Cause Stack & Secondary Charts */}
                <div className="space-y-8">
                    <section className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                <ShieldAlert size={20} className="text-rose-500" />
                                Primary Risk Drivers
                            </h3>
                        </div>
                        <CauseStack causes={results.kpis.topDrivers || []} />
                    </section>

                    <section className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Heat Calendar</h3>
                        <RiskCalendar stats={results.monthlyStats} />
                    </section>
                </div>
            </div>

            {/* Bottom: Action Portfolio */}
            <section className="bg-slate-950/50 border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Activity size={24} className="text-emerald-400" />
                            Action Portfolio
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Quantified mitigations based on projected ROM ROI</p>
                    </div>
                </div>
                <ActionPortfolio />
            </section>
        </div>
    );
};
