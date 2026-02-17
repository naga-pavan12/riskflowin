import React, { useState, useMemo } from 'react';
import { Save, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { useProjectStore } from '../../../store/useProjectStore';
import { format, parse } from 'date-fns';

export function InflowPlan() {
  const {
    config,
    months,
    allocations,
    updateAllocation,
    copyRange
  } = useProjectStore();

  const [hasChanges, setHasChanges] = useState(false);

  // Format month for display (e.g., "Jan 2025")
  const formatMonth = (month: string) => {
    try {
      return format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy');
    } catch {
      return month;
    }
  };

  // Get total inflow for a month (Engineering only)
  const getMonthTotal = (month: string): number => {
    return allocations[month]?.['ENGINEERING'] || 0;
  };

  // Get department allocation for a month
  const getDeptAllocation = (month: string, dept: string): number => {
    return allocations[month]?.[dept as 'ENGINEERING'] || 0;
  };

  // Total across all months
  const grandTotal = useMemo(() => {
    return months.reduce((sum, month) => sum + getMonthTotal(month), 0);
  }, [months, allocations]);

  const handleInputChange = (month: string, dept: string, value: number) => {
    updateAllocation(month, dept, value);
    setHasChanges(true);
  };

  const handleCopyPrevious = (month: string, index: number) => {
    if (index > 0) {
      const previousMonth = months[index - 1];
      copyRange('ALLOC', 'allocations', previousMonth, [month]);
      setHasChanges(true);
    }
  };

  const handleBulkFill = () => {
    // Distribute total evenly across all months
    if (months.length === 0) return;

    const avgPerMonth = grandTotal / months.length;

    months.forEach(month => {
      updateAllocation(month, 'ENGINEERING', avgPerMonth);
      updateAllocation(month, 'MARKETING', 0);
      updateAllocation(month, 'OTHERS', 0);
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // Data is already saved to localStorage via the store
    setHasChanges(false);
  };

  const handleDiscard = () => {
    setHasChanges(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 100) return `₹${value.toFixed(0)} Cr`;
    if (value >= 10) return `₹${value.toFixed(1)} Cr`;
    return `₹${value.toFixed(2)} Cr`;
  };

  // Empty state
  if (months.length === 0) {
    return (
      <div className="max-w-6xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Planned Inflow</h2>
          <p className="text-zinc-500">
            Define planned monthly budget inflows (₹ Cr)
          </p>
        </div>
        <div className="flex items-center justify-center h-[40vh] bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <div className="text-center">
            <div className="text-zinc-500 font-medium text-lg mb-2">No months configured</div>
            <div className="text-zinc-400 text-sm">
              Configure project duration in Project Setup to define inflow plan
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 pb-24">
      {/* Unsaved Changes Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-[260px] right-0 bg-black px-8 py-4 z-30 border-t border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <span className="text-white font-medium">You have unsaved changes</span>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="text-white hover:text-white hover:bg-white/10"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-white text-black hover:bg-zinc-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-black mb-2">Planned Inflow</h2>
        <p className="text-zinc-500">
          Define planned monthly engineering budget inflows (₹ Cr)
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={handleBulkFill} className="border-zinc-300 text-black hover:bg-zinc-50">
          Distribute Evenly
        </Button>
        <div className="ml-auto text-zinc-500 text-sm font-medium">
          Total: <span className="text-black font-bold tabular-nums ml-1">{formatCurrency(grandTotal)}</span>
        </div>
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
                  Engineering
                </th>
                <th className="px-4 py-4 text-right text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-4 text-right text-zinc-500 text-xs font-bold uppercase tracking-wider w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {months.map((month, index) => {
                const monthTotal = getMonthTotal(month);
                return (
                  <tr key={month} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-3">
                      <span className="text-black font-medium text-sm">
                        {formatMonth(month)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={getDeptAllocation(month, 'ENGINEERING') || ''}
                        placeholder="0"
                        onChange={(e) => handleInputChange(month, 'ENGINEERING', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-black text-right tabular-nums text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-black font-bold tabular-nums text-sm">
                        {formatCurrency(monthTotal)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPrevious(month, index)}
                          className="text-zinc-400 hover:text-black hover:bg-zinc-200 opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy from previous month"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-50 border-t border-zinc-200">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-black">Total</td>
                <td className="px-4 py-4 text-right text-sm font-bold text-black tabular-nums">
                  {/* Engineering Column Total would go here if needed */}
                </td>
                <td className="px-4 py-4 text-right text-sm font-bold text-black tabular-nums">
                  {formatCurrency(grandTotal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
