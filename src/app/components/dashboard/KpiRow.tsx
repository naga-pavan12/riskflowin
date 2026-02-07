import type { SimulationResults } from '../../../types';
import type { ProjectData } from '../../../api/model';
import { Activity, CheckCircle, AlertTriangle, TrendingDown } from 'lucide-react';

interface KpiRowProps {
    kpis: SimulationResults['kpis'];
    data: ProjectData | null;
}

export const KpiRow: React.FC<KpiRowProps> = ({ kpis }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
                title="Est. Realizable Inflow"
                value={`₹${kpis.totalRealizableInflowP50.toFixed(0)} Cr`}
                subValue={`Range: ₹${kpis.totalRealizableInflowP10.toFixed(0)} - ₹${kpis.totalRealizableInflowP90.toFixed(0)}`}
                icon={<Activity size={20} />}
                color="blue"
            />
            <Card
                title="Delivery Confidence"
                value={`${(kpis.probMeetPlan * 100).toFixed(1)}%`}
                subValue="Probability of staying within cap"
                icon={<CheckCircle size={20} />}
                color="emerald"
            />
            <Card
                title="Liquidity Risk"
                value={`${(kpis.probShortfallAnyMonth * 100).toFixed(1)}%`}
                subValue="Probability of any shortfall"
                icon={<TrendingDown size={20} />}
                color="amber"
            />
            <Card
                title="Primary Driver"
                value={kpis.primaryDriver?.key || 'None'}
                subValue={`${(kpis.primaryDriver?.contribution * 100).toFixed(1)}% of total variance`}
                icon={<AlertTriangle size={20} />}
                color="rose"
            />
        </div>
    );
};

interface CardProps {
    title: string;
    value: string;
    subValue: string;
    icon: React.ReactNode;
    color: 'blue' | 'emerald' | 'amber' | 'rose';
}

const Card: React.FC<CardProps> = ({ title, value, subValue, icon, color }) => {
    const themes = {
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20"
    };

    return (
        <div className={`p-6 bg-slate-900 border ${themes[color].split(' ')[2]} rounded-2xl shadow-xl transition-transform hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{title}</span>
                <div className={`p-2 rounded-xl ${themes[color].split(' ')[1]} ${themes[color].split(' ')[0]}`}>
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tight">{subValue}</div>
            </div>
        </div>
    );
};
