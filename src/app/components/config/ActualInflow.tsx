import React, { useState, useMemo } from 'react';
import { Save, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectStore } from '../../../store/useProjectStore';
import { format, parse } from 'date-fns';

export function ActualInflow() {
    const {
        config,
        months,
        allocations,
        actualAllocations,
        setActualAllocations,
    } = useProjectStore();

    const [hasChanges, setHasChanges] = useState(false);

    const formatMonth = (month: string) => {
        try {
            return format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy');
        } catch {
            return month;
        }
    };

    // Determine which months are historical (before or equal to asOfMonth)
    const asOfIndex = months.indexOf(config.asOfMonth);

    const getMonthTotal = (month: string): number => {
        const monthData = actualAllocations[month];
        if (!monthData) return 0;
        return Object.values(monthData).reduce((sum, val) => sum + (val || 0), 0);
    };

    const getPlannedTotal = (month: string): number => {
        const monthData = allocations[month];
        if (!monthData) return 0;
        return Object.values(monthData).reduce((sum, val) => sum + (val || 0), 0);
    };

    const getDeptAllocation = (month: string, dept: string): number => {
        return actualAllocations[month]?.[dept as 'ENGINEERING' | 'MARKETING' | 'OTHERS'] || 0;
    };

    const grandTotal = useMemo(() => {
        return months.reduce((sum, month) => sum + getMonthTotal(month), 0);
    }, [months, actualAllocations]);

    const grandPlanned = useMemo(() => {
        return months.reduce((sum, month) => sum + getPlannedTotal(month), 0);
    }, [months, allocations]);

    const handleInputChange = (month: string, dept: string, value: number) => {
        setActualAllocations((prev: any) => ({
            ...prev,
            [month]: {
                ...(prev[month] || {}),
                [dept]: Math.max(0, value),
            }
        }));
        setHasChanges(true);
    };

    const handleCopyPlanned = (month: string) => {
        const planned = allocations[month];
        if (planned) {
            setActualAllocations((prev: any) => ({
                ...prev,
                [month]: { ...planned }
            }));
            setHasChanges(true);
        }
    };

    const formatCurrency = (value: number) => {
        if (value >= 100) return `₹${value.toFixed(0)} Cr`;
        if (value >= 10) return `₹${value.toFixed(1)} Cr`;
        return `₹${value.toFixed(2)} Cr`;
    };

    if (months.length === 0) {
        return (
            <div className="max-w-6xl space-y-8">
                <div>
                    <h2 className="mb-2">Actual Inflow</h2>
                    <p className="text-[var(--text-secondary)]">
                        Record actual monthly budget inflows received (₹ Cr)
                    </p>
                </div>
                <div className="flex items-center justify-center h-[40vh]">
                    <div className="text-center">
                        <div className="text-[var(--text-secondary)] text-[16px] mb-2">No months configured</div>
                        <div className="text-[var(--text-tertiary)] text-[13px]">
                            Configure project duration in Project Setup first
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl space-y-8">
            {/* Unsaved Changes Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-[240px] right-0 bg-emerald-600 px-8 py-4 z-30 border-t border-emerald-400/20">
                    <div className="flex items-center justify-between max-w-6xl">
                        <span className="text-white font-medium">You have unsaved changes</span>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHasChanges(false)}
                                className="!text-white hover:!bg-white/10"
                            >
                                Discard
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setHasChanges(false)}
                                className="!bg-white !text-emerald-700"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="mb-2">Actual Inflow</h2>
                <p className="text-[var(--text-secondary)]">
                    Record actual monthly budget inflows received by department (₹ Cr).
                    <span className="text-[var(--text-muted)] ml-2">Planned values shown for comparison.</span>
                </p>
            </div>

            {/* Grid Editor */}
            <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-[var(--surface-elevated)] border-b border-[var(--divider)]">
                            <tr>
                                <th className="px-6 py-4 text-left text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Month
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Engineering
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Marketing
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Others
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Actual Total
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Planned
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide">
                                    Variance
                                </th>
                                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide w-28">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--divider-subtle)]">
                            {months.map((month, index) => {
                                const actualTotal = getMonthTotal(month);
                                const plannedTotal = getPlannedTotal(month);
                                const variance = actualTotal - plannedTotal;
                                const isHistorical = index <= asOfIndex;

                                return (
                                    <tr key={month} className={`hover:bg-white/[0.02] transition-colors ${!isHistorical ? 'opacity-40' : ''}`}>
                                        <td className="px-6 py-3">
                                            <span className="text-[var(--text-primary)] font-medium text-[14px]">
                                                {formatMonth(month)}
                                            </span>
                                            {month === config.asOfMonth && (
                                                <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">NOW</span>
                                            )}
                                        </td>
                                        {['ENGINEERING', 'MARKETING', 'OTHERS'].map(dept => (
                                            <td key={dept} className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    value={getDeptAllocation(month, dept) || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleInputChange(month, dept, parseFloat(e.target.value) || 0)}
                                                    disabled={!isHistorical}
                                                    className="w-24 px-2 py-1.5 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[var(--text-primary)] font-semibold tabular-nums text-[14px]">
                                                {formatCurrency(actualTotal)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-[var(--text-muted)] tabular-nums text-[13px]">
                                                {formatCurrency(plannedTotal)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`tabular-nums text-[13px] font-medium ${variance > 0 ? 'text-emerald-400' : variance < 0 ? 'text-rose-400' : 'text-slate-500'
                                                }`}>
                                                {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyPlanned(month)}
                                                disabled={!isHistorical}
                                                className="!h-7 !text-[12px]"
                                            >
                                                <Copy className="w-3 h-3" />
                                                Use Planned
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="border-t border-[var(--divider)] bg-[var(--surface-elevated)]">
                            <tr>
                                <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                                    Total ({months.filter((_, i) => i <= asOfIndex).length} months recorded)
                                </td>
                                <td className="px-4 py-4 text-right text-blue-400 font-medium tabular-nums">
                                    {formatCurrency(months.reduce((sum, m) => sum + getDeptAllocation(m, 'ENGINEERING'), 0))}
                                </td>
                                <td className="px-4 py-4 text-right text-purple-400 font-medium tabular-nums">
                                    {formatCurrency(months.reduce((sum, m) => sum + getDeptAllocation(m, 'MARKETING'), 0))}
                                </td>
                                <td className="px-4 py-4 text-right text-amber-400 font-medium tabular-nums">
                                    {formatCurrency(months.reduce((sum, m) => sum + getDeptAllocation(m, 'OTHERS'), 0))}
                                </td>
                                <td className="px-4 py-4 text-right text-[var(--text-primary)] font-semibold tabular-nums text-[18px]">
                                    {formatCurrency(grandTotal)}
                                </td>
                                <td className="px-4 py-4 text-right text-[var(--text-muted)] tabular-nums">
                                    {formatCurrency(grandPlanned)}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className={`font-semibold tabular-nums ${grandTotal - grandPlanned > 0 ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                        {grandTotal - grandPlanned > 0 ? '+' : ''}{formatCurrency(grandTotal - grandPlanned)}
                                    </span>
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Collection Summary */}
            <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-1">
                            Total Actual Inflow
                        </div>
                        <div className="text-[var(--text-primary)] text-[20px] font-semibold tabular-nums">
                            {formatCurrency(grandTotal)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-1">
                            Collection Rate
                        </div>
                        <div className={`text-[18px] font-semibold tabular-nums ${grandPlanned > 0 && grandTotal / grandPlanned >= 0.95 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                            {grandPlanned > 0 ? ((grandTotal / grandPlanned) * 100).toFixed(1) : 0}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
