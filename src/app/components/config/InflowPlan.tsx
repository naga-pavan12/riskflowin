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

  // Get total inflow for a month (sum of all departments)
  const getMonthTotal = (month: string): number => {
    const monthData = allocations[month];
    if (!monthData) return 0;
    return Object.values(monthData).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Get department allocation for a month
  const getDeptAllocation = (month: string, dept: string): number => {
    return allocations[month]?.[dept as 'ENGINEERING' | 'MARKETING' | 'OTHERS'] || 0;
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
    const engShare = 0.6; // 60% to engineering
    const mktShare = 0.25; // 25% to marketing
    const othShare = 0.15; // 15% to others

    months.forEach(month => {
      updateAllocation(month, 'ENGINEERING', avgPerMonth * engShare);
      updateAllocation(month, 'MARKETING', avgPerMonth * mktShare);
      updateAllocation(month, 'OTHERS', avgPerMonth * othShare);
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
          <h2 className="mb-2">Inflow Plan</h2>
          <p className="text-[var(--text-secondary)]">
            Define planned monthly budget inflows (₹ Cr)
          </p>
        </div>
        <div className="flex items-center justify-center h-[40vh]">
          <div className="text-center">
            <div className="text-[var(--text-secondary)] text-[16px] mb-2">No months configured</div>
            <div className="text-[var(--text-tertiary)] text-[13px]">
              Configure project duration in Project Setup to define inflow plan
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
        <div className="fixed bottom-0 left-[240px] right-0 bg-[var(--accent-blue)] px-8 py-4 z-30 border-t border-blue-400/20">
          <div className="flex items-center justify-between max-w-6xl">
            <span className="text-white font-medium">You have unsaved changes</span>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="!text-white hover:!bg-white/10"
              >
                Discard
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                className="!bg-white !text-[var(--accent-blue)]"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2">Inflow Plan</h2>
        <p className="text-[var(--text-secondary)]">
          Define planned monthly budget inflows by department (₹ Cr)
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={handleBulkFill}>
          Distribute Evenly
        </Button>
        <div className="ml-auto text-[var(--text-secondary)] text-[14px]">
          Total: <span className="text-[var(--text-primary)] font-semibold tabular-nums">{formatCurrency(grandTotal)}</span>
        </div>
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
                  Total
                </th>
                <th className="px-4 py-4 text-right text-[var(--text-secondary)] text-[12px] font-medium uppercase tracking-wide w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider-subtle)]">
              {months.map((month, index) => {
                const monthTotal = getMonthTotal(month);
                return (
                  <tr key={month} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-[var(--text-primary)] font-medium text-[14px]">
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
                        className="w-24 px-2 py-1.5 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={getDeptAllocation(month, 'MARKETING') || ''}
                        placeholder="0"
                        onChange={(e) => handleInputChange(month, 'MARKETING', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={getDeptAllocation(month, 'OTHERS') || ''}
                        placeholder="0"
                        onChange={(e) => handleInputChange(month, 'OTHERS', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 bg-[var(--surface-base)] border border-[var(--divider)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-right tabular-nums text-[13px] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[var(--text-primary)] font-semibold tabular-nums text-[14px]">
                        {formatCurrency(monthTotal)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyPrevious(month, index)}
                        disabled={index === 0}
                        className="!h-7 !text-[12px]"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-[var(--divider)] bg-[var(--surface-elevated)]">
              <tr>
                <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                  Total ({months.length} months)
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
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Budget Cap Reference */}
      <div className="bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--divider)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-1">
              Project Budget Cap
            </div>
            <div className="text-[var(--text-primary)] text-[20px] font-semibold tabular-nums">
              {formatCurrency(config.capTotalCr)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[var(--text-tertiary)] text-[12px] uppercase tracking-wide mb-1">
              Planned vs Cap
            </div>
            <div className={`text-[18px] font-semibold tabular-nums ${grandTotal > config.capTotalCr ? 'text-rose-400' : 'text-emerald-400'}`}>
              {grandTotal > config.capTotalCr ? '+' : ''}{formatCurrency(grandTotal - config.capTotalCr)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
