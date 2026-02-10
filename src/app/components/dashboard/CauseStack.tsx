import React from 'react';
import { ArrowDownRight, Tag } from 'lucide-react';

interface CauseStackProps {
    causes: { name: string; contribution: number }[];
}

export const CauseStack: React.FC<CauseStackProps> = ({ causes }) => {
    // Show top 5-10
    const topCauses = causes.slice(0, 8);

    const getLever = (name: string) => {
        if (name.includes('Eng')) return 'Planning';
        if (name.includes('Mkt')) return 'Governance';
        return 'Execution';
    };

    return (
        <div className="p-6 space-y-4">
            {topCauses.map((cause, idx) => (
                <div key={cause.name} className="flex items-center gap-4 bg-surface hover:bg-surface-hover p-3 rounded-lg border border-border-subtle hover:border-border-highlight transition-all group">
                    <div className="w-6 h-6 rounded-md bg-app/50 flex items-center justify-center text-[10px] font-black text-text-tertiary group-hover:text-brand border border-white/5">
                        {idx + 1}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <span className="text-[11px] font-black text-text-primary uppercase tracking-tight line-clamp-1">{cause.name}</span>
                            <span className="text-xs font-black text-accent-rose tabular-nums">₹{cause.contribution.toFixed(1)} Cr</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="h-1 flex-1 bg-app/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-accent-rose/50 group-hover:bg-accent-rose transition-all"
                                    style={{ width: `${Math.min(100, causes[0].contribution > 0 ? (cause.contribution / causes[0].contribution) * 100 : 0)}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-black text-text-muted uppercase flex items-center gap-1">
                                <Tag size={8} /> {getLever(cause.name)}
                            </span>
                        </div>
                    </div>

                    <button className="p-2 text-text-muted hover:text-brand transition-colors">
                        <ArrowDownRight size={14} />
                    </button>
                </div>
            ))}

            {causes.length === 0 && (
                <div className="py-12 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest italic">
                    All drivers within tolerance
                </div>
            )}
        </div>
    );
};
