import React, { useState } from 'react';
import { ProjectSetupTab } from './ProjectSetupTab';
import { AllocationsTab } from './AllocationsTab';
import { OutflowsTab } from './OutflowsTab';
import { Settings, PieChart, BarChart3, TrendingUp, History } from 'lucide-react';

interface ConfigTabShellProps {
    onClose: () => void;
}

const ConfigTabShell: React.FC<ConfigTabShellProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'setup' | 'allocations' | 'planned' | 'projected' | 'actuals'>('setup');

    const tabs = [
        { id: 'setup', label: 'General Setup', icon: Settings },
        { id: 'allocations', label: 'Dept Allocations', icon: PieChart },
        { id: 'planned', label: 'Engineering: Planned', icon: BarChart3 },
        { id: 'projected', label: 'Engineering: Forecasts', icon: TrendingUp },
        { id: 'actuals', label: 'Engineering: Actuals', icon: History },
    ];

    return (
        <div className="flex h-full bg-slate-900 text-slate-100 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-slate-700 p-4 flex flex-col gap-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Configurator</h2>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span className="font-medium">{tab.label}</span>
                    </button>
                ))}

                <div className="mt-auto pt-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {activeTab === 'setup' && <ProjectSetupTab />}
                    {activeTab === 'allocations' && <AllocationsTab />}
                    {activeTab === 'planned' && <OutflowsTab dataset="planned" />}
                    {activeTab === 'projected' && <OutflowsTab dataset="projected" />}
                    {activeTab === 'actuals' && <OutflowsTab dataset="actual" />}
                </div>
            </div>
        </div>
    );
};

export default ConfigTabShell;
