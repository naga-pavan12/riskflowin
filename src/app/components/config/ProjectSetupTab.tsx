import React from 'react';
import { Settings, Info } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';

export const ProjectSetupTab: React.FC = () => {
    const { config, updateConfig } = useProjectStore();
    const onChange = updateConfig;

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Settings size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Project Parameters</h2>
                    <p className="text-xs text-slate-500">Define core constraints and hierarchy for simulation</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <label className="block">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Project Identity</span>
                        <input
                            type="text"
                            value={config.name}
                            onChange={e => onChange({ name: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                            placeholder="e.g. Burj Khalifa Expansion"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Start Month</span>
                            <input
                                type="month"
                                value={config.startMonth}
                                onChange={e => onChange({ startMonth: e.target.value })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Duration (Months)</span>
                            <input
                                type="number"
                                value={config.durationMonths}
                                onChange={e => onChange({ durationMonths: parseInt(e.target.value) || 0 })}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </label>
                        <label className="block">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Grounding: As Of Month</span>
                            <input
                                type="month"
                                value={config.asOfMonth}
                                onChange={e => onChange({ asOfMonth: e.target.value })}
                                className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-400 focus:border-blue-500 outline-none transition-all"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            Total Budget Cap (₹ Cr)
                            <div className="group relative cursor-help">
                                <Info size={10} className="text-slate-500" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 rounded-lg text-[10px] text-slate-300 font-bold leading-tight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl border border-white/10">
                                    Maximum combined outflow allowed for all departments per contract lifecycle.
                                </div>
                            </div>
                        </span>
                        <input
                            type="number"
                            value={config.capTotalCr}
                            onChange={e => onChange({ capTotalCr: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xl font-black text-white focus:border-blue-500 outline-none transition-all"
                        />
                    </label>

                    <div className="space-y-3 pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={config.protectEngineering}
                                onChange={e => onChange({ protectEngineering: e.target.checked })}
                                className="w-5 h-5 rounded border-white/10 bg-slate-950 text-blue-500 focus:ring-blue-500/20"
                            />
                            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Protect Engineering Budget on Breach</span>
                        </label>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Organizational Units (Entities)</h4>
                        <div className="flex flex-wrap gap-2">
                            {config.entities.map((ent, idx) => (
                                <div key={idx} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-300 flex items-center gap-2">
                                    {ent}
                                    <button onClick={() => onChange({ entities: config.entities.filter((_, i) => i !== idx) })} className="text-slate-600 hover:text-rose-500">×</button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const name = prompt('Enter entity name (e.g., Tower C, Parking Block)');
                                    if (name && name.trim()) {
                                        onChange({ entities: [...config.entities, name.trim()] });
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-[10px] font-bold text-slate-500 hover:text-white hover:border-white/40 transition-all"
                            >+ Add Entity</button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Core Engineering Activities</h4>
                        <div className="flex flex-wrap gap-2">
                            {config.activities.map((act, idx) => (
                                <div key={idx} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-300 flex items-center gap-2">
                                    {act}
                                    <button onClick={() => onChange({ activities: config.activities.filter((_, i) => i !== idx) })} className="text-slate-600 hover:text-rose-500">×</button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const name = prompt('Enter activity name (e.g., Plumbing, Electrical)');
                                    if (name && name.trim()) {
                                        onChange({ activities: [...config.activities, name.trim()] });
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-[10px] font-bold text-slate-500 hover:text-white hover:border-white/40 transition-all"
                            >+ Add Activity</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
