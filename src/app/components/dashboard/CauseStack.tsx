import React from 'react';
import { ArrowUpRight, Tag, Layers, Database, Zap } from 'lucide-react';

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

    const getIcon = (name: string) => {
        if (name.includes('Eng')) return <Layers className="w-3 h-3" />;
        if (name.includes('Mkt')) return <Database className="w-3 h-3" />;
        return <Zap className="w-3 h-3" />;
    };

    return (
        <div className="p-0">
            {topCauses.map((cause, idx) => (
                <div
                    key={cause.name}
                    className="flex items-center gap-4 p-4 border-b border-zinc-100 last:border-none hover:bg-zinc-50 transition-all group"
                >
                    <div className="w-6 h-6 flex items-center justify-center text-[11px] font-bold text-zinc-400 group-hover:text-black bg-zinc-100 rounded group-hover:bg-white border border-transparent group-hover:border-zinc-200 transition-all">
                        {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-black truncate pr-4">{cause.name}</span>
                            <span className="text-sm font-bold text-red-600 tabular-nums whitespace-nowrap">₹{cause.contribution.toFixed(1)} Cr</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-1.5 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${Math.min(100, causes[0].contribution > 0 ? (cause.contribution / causes[0].contribution) * 100 : 0)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase flex items-center gap-1.5 min-w-[80px] justify-end">
                                {getIcon(cause.name)}
                                {getLever(cause.name)}
                            </span>
                        </div>
                    </div>

                    <button className="p-2 text-zinc-300 hover:text-black transition-colors">
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            ))}

            {causes.length === 0 && (
                <div className="py-12 text-center text-xs font-medium text-zinc-400 uppercase tracking-widest italic">
                    All drivers within tolerance
                </div>
            )}
        </div>
    );
};
