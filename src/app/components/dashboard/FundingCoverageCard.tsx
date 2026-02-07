import React from 'react';
import { clsx } from 'clsx';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface FundingCoverageCardProps {
    data: Record<string, number>; // Month -> Coverage Prob
}

export const FundingCoverageCard: React.FC<FundingCoverageCardProps> = ({ data }) => {
    // Get next 3 months relative to start
    const months = Object.keys(data).sort().slice(0, 3);

    return (
        <div className="exec-card p-5 border-l-4 border-l-brand h-full relative group">
            <div className="flex items-center gap-1.5 mb-3">
                <span className="exec-label">Funding Coverage</span>
                <Info size={12} className="text-text-muted" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-bg-elevated rounded-lg text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-border-soft">
                    Probability that Realizable Inflow covers Demand for the next 3 months.
                    Green: {'>'}90%, Amber: 70-90%, Red: {'<'}70%.
                </div>
            </div>

            <div className="flex gap-2">
                {months.map(m => {
                    const prob = data[m] || 0;
                    const status = prob >= 0.9 ? 'success' : prob >= 0.7 ? 'warning' : 'danger';
                    const icon = status === 'success' ? CheckCircle : status === 'warning' ? AlertTriangle : XCircle;
                    const IconComp = icon;

                    return (
                        <div key={m} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded bg-bg-subtle border border-border-soft">
                            <span className="text-[10px] font-bold text-text-muted uppercase">
                                {new Date(m).toLocaleDateString(undefined, { month: 'short' })}
                            </span>
                            <IconComp
                                size={18}
                                className={clsx(
                                    status === 'success' ? "text-success" :
                                        status === 'warning' ? "text-warning" : "text-danger"
                                )}
                            />
                            <span className="text-[10px] font-semibold text-text-secondary">
                                {(prob * 100).toFixed(0)}%
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="text-xs text-text-muted mt-2 text-center">Next 3 Months Horizon</div>
        </div>
    );
};
