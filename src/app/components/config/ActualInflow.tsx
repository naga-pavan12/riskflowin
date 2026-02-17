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

    // Prune future actuals whenever asOfMonth changes
    React.useEffect(() => {
        const futureMonths = months.filter((_, i) => i > asOfIndex);
        const hasFutureData = futureMonths.some(m => actualAllocations[m]?.['ENGINEERING'] > 0);

        if (hasFutureData) {
            setActualAllocations(prev => {
                const next = { ...prev };
                futureMonths.forEach(m => {
                    if (next[m]) delete next[m];
                });
                return next;
            });
            // No need to setHasChanges(true) as this is a cleanup
        }
    }, [asOfIndex, months, actualAllocations, setActualAllocations]);

    const getMonthTotal = (month: string): number => {
        return actualAllocations[month]?.['ENGINEERING'] || 0;
    };

    const getPlannedTotal = (month: string): number => {
        return allocations[month]?.['ENGINEERING'] || 0;
    };

    const getDeptAllocation = (month: string, dept: string): number => {
        return actualAllocations[month]?.[dept as 'ENGINEERING'] || 0;
    };

    const grandTotal = useMemo(() => {
        return months.reduce((sum, month) => sum + getMonthTotal(month), 0);
    }, [months, actualAllocations]);

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
                    <h2 className="text-2xl font-bold text-black mb-2">Actual Inflow</h2>
                    <p className="text-zinc-500">
                        Record actual monthly budget inflows received (₹ Cr)
                    </p>
                </div>
                <div className="flex items-center justify-center h-[40vh] bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    <div className="text-center">
                        <div className="text-zinc-500 font-medium text-lg mb-2">No months configured</div>
                        <div className="text-zinc-400 text-sm">
                            Configure project duration in Project Setup
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Only show months up to asOfMonth
    const actualMonths = months.slice(0, asOfIndex + 1);

    return (
        <div className="max-w-6xl space-y-8 pb-24">
            {/* Unsaved Changes Bar */}
            {hasChanges && (
                <div className="fixed bottom-0 left-[260px] right-0 bg-black px-8 py-4 z-30 border-t border-zinc-800 shadow-xl">
                    <div className="flex items-center justify-between max-w-6xl mx-auto">
                        <span className="text-white font-medium">You have unsaved changes</span>
                        <Button
                            size="sm"
                            onClick={() => setHasChanges(false)}
                            className="bg-white text-black hover:bg-zinc-200"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-black mb-2">Actual Inflow</h2>
                <p className="text-zinc-500">
                    Record actual monthly budget inflows received (₹ Cr). Future months are disabled.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Actual Inflow</p>
                    <p className="text-3xl font-bold text-black tabular-nums">{formatCurrency(grandTotal)}</p>
                </div>
                {/* Could add variance vs plan here */}
            </div>

            {/* Grid Editor */}
            <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                    Month
                                </th>
                                <th className="px-4 py-4 text-right text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                    Actual Received
                                </th>
                                <th className="px-4 py-4 text-right text-zinc-500 text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Planned
                                </th>
                                <th className="px-4 py-4 text-right text-zinc-500 text-xs font-bold uppercase tracking-wider w-32">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {actualMonths.map((month) => {
                                const monthTotal = getMonthTotal(month);
                                const plannedTotal = getPlannedTotal(month);
                                const variance = monthTotal - plannedTotal;

                                return (
                                    <tr key={month} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-3">
                                            <span className="text-black font-medium text-sm">
                                                {formatMonth(month)}
                                            </span>
                                            {month === config.asOfMonth && (
                                                <span className="ml-2 text-[10px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                    Current
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                value={getDeptAllocation(month, 'ENGINEERING') || ''}
                                                placeholder="0"
                                                onChange={(e) => handleInputChange(month, 'ENGINEERING', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-black text-right tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all font-medium"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-zinc-400 font-medium tabular-nums text-sm">
                                                {formatCurrency(plannedTotal)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyPlanned(month)}
                                                className="text-zinc-400 hover:text-black hover:bg-zinc-200 opacity-0 group-hover:opacity-100 transition-all text-xs"
                                            >
                                                <Copy className="w-3 h-3 mr-1" />
                                                Copy Plan
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {months.length > actualMonths.length && (
                <div className="text-center p-8 border border-dashed border-zinc-200 rounded-lg bg-zinc-50">
                    <p className="text-zinc-400 text-sm">
                        Future months ({months.length - actualMonths.length}) are hidden. Advance the "As of Month" in Project Setup to unlock them.
                    </p>
                </div>
            )}
        </div>
    );
}
