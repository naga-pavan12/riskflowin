import React from 'react';
import type { SimulationResults } from '../../../types';
import { Info, AlertTriangle, CheckCircle, AlertCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { FundingCoverageCard } from './FundingCoverageCard';

export const RiskDashboard: React.FC<{ results: SimulationResults }> = ({ results }) => {
    // Aggregations for new KPIs
    const totalExposure = Object.values(results.kpis.monthlyShortfallP80).reduce((a, b) => a + b, 0);
    const redMonthCount = results.monthlyStats.filter(s => s.shortfallProb >= 0.3 || s.shortfallP80 >= 10).length;

    return (
        <div className="space-y-6">
            {/* KPI Row - Decision Ready */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Funding Coverage (Mini-strip) */}
                <FundingCoverageCard data={results.kpis.monthlyCoverageProb} />

                {/* 2. Worst Squeeze Month */}
                <KpiCard
                    label="Worst Squeeze Month"
                    value={new Date(results.kpis.worstMonth.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    subValue={`${(results.kpis.worstMonth.prob * 100).toFixed(0)}% Prob | ₹${results.kpis.worstMonth.amount.toFixed(1)} Cr (P80)`}
                    tooltip="The month with the highest combined likelihood and severity of funding shortfall."
                    accent="danger"
                    icon={AlertTriangle}
                />

                {/* 3. Total Shortfall Exposure */}
                <KpiCard
                    label="Total Shortfall Exposure"
                    value={`₹${totalExposure.toFixed(0)} Cr`}
                    subValue={`${redMonthCount} Critical Months`}
                    tooltip="Sum of P80 Shortfalls across all months. Indicates total liquidity risk magnitude."
                    accent={totalExposure > 10 ? 'warning' : 'brand'}
                    icon={DollarSign}
                />

                {/* 4. Top Driver & Lever */}
                <KpiCard
                    label="Top Driver & Lever"
                    value={results.kpis.primaryDriver.key.replace(/-/, ' ')}
                    subValue={`Lever: ${results.kpis.topDrivers?.[0]?.lever || 'Review'}`}
                    tooltip="The single biggest contributor to shortfall risk. Focus mitigation here."
                    accent="brand"
                    icon={TrendingUp}
                />
            </div>

            {/* Suffocation Matrix Table - Decision Style */}
            <section className="exec-card p-5 relative">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                        <AlertTriangle size={18} className="text-warning" /> Monthly Budget Risk Matrix
                    </h3>
                    <DiagnosticsPanel diagnostics={results.kpis.diagnostics} />
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-bg-card)' }}>
                            <tr className="border-b" style={{ borderColor: 'var(--color-border-soft)' }}>
                                <th className="exec-label py-3 px-4">Month</th>
                                <th className="exec-label py-3 px-4 text-right">Planned Inflow</th>
                                <th className="exec-label py-3 px-4 text-right">Realizable (P50)</th>
                                <th className="exec-label py-3 px-4 text-right">Eng. Demand</th>
                                <th className="exec-label py-3 px-4 text-center">Coverage Prob</th>
                                <th className="exec-label py-3 px-4 text-center">Risk Prob</th>
                                <th className="exec-label py-3 px-4 text-right">Severity (P80)</th>
                                <th className="exec-label py-3 px-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.monthlyStats.map((s, idx) => {
                                const prob = s.shortfallProb * 100;
                                const planned = s.plannedAllocation;
                                const p80Shortfall = s.shortfallP80;

                                // Red/Amber/Green Logic
                                const isCritical = prob >= 30 || (planned > 0 && p80Shortfall >= 10);
                                const isWarning = !isCritical && (prob >= 10 || p80Shortfall >= 5);
                                const isSafe = !isCritical && !isWarning;

                                const status = isCritical ? 'danger' : isWarning ? 'warning' : 'success';

                                return (
                                    <tr
                                        key={idx}
                                        className={clsx(
                                            "transition-colors",
                                            idx % 2 === 1 ? "bg-white/[0.01]" : ""
                                        )}
                                        style={{ borderBottom: '1px solid var(--color-border-soft)' }}
                                    >
                                        <td className="py-3 px-4 font-semibold text-sm text-text-secondary">
                                            {new Date(s.month).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-text-muted tabular-nums">
                                            ₹{s.plannedAllocation.toFixed(1)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-text-primary font-semibold tabular-nums">
                                            ₹{s.realizableInflowP50.toFixed(1)}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right text-text-muted tabular-nums">
                                            ₹{s.plannedOutflowTotal.toFixed(1)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={clsx(
                                                "text-xs font-bold",
                                                s.coverageProb >= 0.9 ? "text-success" : s.coverageProb >= 0.7 ? "text-warning" : "text-danger"
                                            )}>
                                                {(s.coverageProb * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <RiskMeter value={prob} />
                                        </td>
                                        <td className="py-3 px-4 text-sm text-right tabular-nums">
                                            <span className={clsx("font-semibold", p80Shortfall > 0 ? "text-danger" : "text-text-muted")}>
                                                {p80Shortfall > 0 ? `₹${p80Shortfall.toFixed(1)}` : '-'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <StatusPill status={status} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   KPI Card - Single Metric
   ───────────────────────────────────────────────────────────── */
const KpiCard: React.FC<{
    label: string;
    value: string;
    subValue: string;
    tooltip: string;
    accent: 'brand' | 'success' | 'warning' | 'danger';
    icon?: React.ElementType;
}> = ({ label, value, subValue, tooltip, accent, icon: Icon }) => {
    const accentColors = {
        brand: 'border-l-brand',
        success: 'border-l-success',
        warning: 'border-l-warning',
        danger: 'border-l-danger',
    };

    return (
        <div className={clsx("exec-card p-5 border-l-4", accentColors[accent])}>
            <div className="flex items-center gap-1.5 mb-3 group cursor-help relative">
                <span className="exec-label">{label}</span>
                {Icon ? <Icon size={14} className="text-text-muted" /> : <Info size={12} className="text-text-muted" />}
                <div className="absolute left-0 bottom-full mb-2 w-52 p-3 bg-bg-elevated rounded-lg text-xs text-text-secondary leading-snug opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-border-soft">
                    {tooltip}
                </div>
            </div>
            <div className="exec-value mb-1 capitalize">{value}</div>
            <div className="text-xs text-text-muted">{subValue}</div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Risk Meter (Visual Bar)
───────────────────────────────────────────────────────────── */
const RiskMeter: React.FC<{ value: number }> = ({ value }) => {
    const color = value >= 30 ? 'bg-danger' : value >= 10 ? 'bg-warning' : 'bg-success';
    return (
        <div className="flex items-center gap-2 justify-center">
            <div className="w-12 h-1.5 rounded-full bg-border-soft overflow-hidden">
                <div
                    className={clsx("h-full rounded-full transition-all", color)}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
            <span className={clsx("text-xs font-semibold tabular-nums", value >= 30 ? "text-danger" : value >= 10 ? "text-warning" : "text-text-muted")}>
                {value.toFixed(0)}%
            </span>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Status Pill (Accessible)
───────────────────────────────────────────────────────────── */
const StatusPill: React.FC<{ status: 'success' | 'warning' | 'danger' }> = ({ status }) => {
    const config = {
        success: { label: 'On Track', icon: CheckCircle, className: 'status-pill--success' },
        warning: { label: 'Watch', icon: AlertCircle, className: 'status-pill--warning' },
        danger: { label: 'Suffocated', icon: XCircle, className: 'status-pill--danger' },
    };
    const { label, icon: Icon, className } = config[status];
    return (
        <span className={clsx("status-pill", className)}>
            <Icon size={12} /> {label}
        </span>
    );
};

/* ─────────────────────────────────────────────────────────────
   Diagnostics Panel (Developer/Advanced)
───────────────────────────────────────────────────────────── */
const DiagnosticsPanel: React.FC<{ diagnostics?: SimulationResults['kpis']['diagnostics'] }> = ({ diagnostics }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    if (!diagnostics) return null;

    const diff = Math.abs(diagnostics.simTotalEngInflowP50 - diagnostics.sumMonthlyP50);
    const errorPct = diagnostics.simTotalEngInflowP50 > 0 ? (diff / diagnostics.simTotalEngInflowP50) * 100 : 0;
    const isHealthy = errorPct < 20;

    return (
        <div className="relative z-20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border",
                    isOpen
                        ? "bg-bg-elevated text-text-primary border-border-soft"
                        : "bg-transparent text-text-muted border-border-soft hover:bg-bg-elevated"
                )}
            >
                {isOpen ? 'Close' : 'Diagnostics'}
                <span className={clsx("w-2 h-2 rounded-full", isHealthy ? "bg-success" : "bg-danger")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 exec-card p-4 shadow-2xl z-50">
                    <div className="space-y-2.5 text-xs">
                        <DiagRow label="Horizon" value={`${diagnostics.horizonMonths} Months`} />
                        <DiagRow label="Planned Inflow" value={`₹${diagnostics.plannedTotalEngInflow.toFixed(1)} Cr`} />
                        <DiagRow label="Planned Outflow" value={`₹${diagnostics.plannedTotalEngOutflow.toFixed(1)} Cr`} />
                        <hr className="border-border-soft" />
                        <DiagRow label="Sim Total P50" value={`₹${diagnostics.simTotalEngInflowP50.toFixed(1)} Cr`} />
                        <DiagRow label="Sum Monthly P50" value={`₹${diagnostics.sumMonthlyP50.toFixed(1)} Cr`} />
                        <DiagRow
                            label="Aggregation Delta"
                            value={`${errorPct.toFixed(1)}%`}
                            color={isHealthy ? 'text-success' : 'text-danger'}
                        />
                        <hr className="border-border-soft" />
                        <DiagRow label="Cholesky" value={diagnostics.choleskySuccess ? 'OK' : 'Fallback'} />
                        <DiagRow label="Seed" value={diagnostics.seed.toString()} />
                    </div>
                </div>
            )}
        </div>
    );
};

const DiagRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center">
        <span className="text-text-muted">{label}</span>
        <span className={clsx("font-semibold tabular-nums text-text-primary", color)}>{value}</span>
    </div>
);
