import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePulseContext } from '../../../store/PulseContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Zap,
    HardHat,
    Truck,
    FileWarning,
    IndianRupee
} from 'lucide-react';
import { cn } from '../ui/utils';
import { LaborStability, MaterialAvailability, DesignGaps } from '../../../types';

export function PulseRail() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        state,
        updateFinancials,
        setLaborStability,
        setMaterialAvailability,
        setDesignGaps
    } = usePulseContext();

    // -- Mapping Helpers --
    const laborMap: LaborStability[] = ['Stable', 'Fluctuating', 'Critical'];
    const laborIndex = laborMap.indexOf(state.laborStability);

    // Higher is better for material (0=Scarce, 1=Partial, 2=Full) -> No, let's keep consistent: 0=Bad, 2=Good?
    // Actually, Input enum: 'Full' | 'Partial' | 'Scarce'
    // Let's map 0=Scarce, 1=Partial, 2=Full
    const materialMap: MaterialAvailability[] = ['Scarce', 'Partial', 'Full'];
    const materialIndex = materialMap.indexOf(state.materialAvailability);

    // 0=None, 1=Minor, 2=Major
    const designMap: DesignGaps[] = ['None', 'Minor', 'Major'];
    const designIndex = designMap.indexOf(state.designGaps);

    const getStatusColor = (idx: number, invert = false) => {
        // Normal: 0=Green, 2=Red
        // Invert: 0=Red, 2=Green
        const colors = invert
            ? ['bg-red-500', 'bg-amber-500', 'bg-emerald-500']
            : ['bg-emerald-500', 'bg-amber-500', 'bg-red-500'];
        return colors[idx] || 'bg-zinc-500';
    };

    return (
        <>
            {/* Toggle Button (Fixed Right Edge) */}
            <motion.div
                className="fixed right-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
                initial={false}
                animate={{ x: isOpen ? -320 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 } as any}
            >
                {!isOpen && (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-12 w-8 rounded-l-md rounded-r-none bg-black text-white shadow-lg flex items-center justify-center hover:bg-zinc-800"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                )}
            </motion.div>

            {/* The Rail Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/20 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Drawer Panel */}
                        <motion.div
                            className="fixed right-0 top-0 bottom-0 w-[320px] bg-white border-l border-zinc-200 shadow-2xl z-50 flex flex-col"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 } as any}
                        >
                            {/* Header */}
                            <div className="h-14 border-b border-zinc-100 flex items-center justify-between px-4 bg-zinc-50/50">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                    <span className="font-bold text-sm text-black uppercase tracking-wide">Pulse Context</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 hover:bg-zinc-200/50 rounded-full"
                                >
                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                </Button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-8">

                                {/* Section 1: Financials */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <IndianRupee className="w-3 h-3" /> Financials
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs font-semibold text-zinc-600">Plan Target (₹)</Label>
                                            <Input
                                                type="number"
                                                value={state.financials.targetValue}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFinancials({ targetValue: Number(e.target.value) })}
                                                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-all font-mono text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs font-semibold text-zinc-600">Achieved Value (₹)</Label>
                                            <Input
                                                type="number"
                                                value={state.financials.achievedValue}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFinancials({ achievedValue: Number(e.target.value) })}
                                                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-all font-mono text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs font-semibold text-zinc-600">Held Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                value={state.financials.heldAmount}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFinancials({ heldAmount: Number(e.target.value) })}
                                                className="bg-red-50 border-red-100 focus:bg-white focus:border-red-200 transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Execution Pulse (Sliders) */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <Zap className="w-3 h-3" /> Risk Factors
                                    </h4>

                                    {/* Labor Stability */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                <HardHat className="w-3.5 h-3.5 text-zinc-500" /> Labor Stability
                                            </Label>
                                            <Badge className={cn("text-[9px] uppercase px-1.5 py-0", getStatusColor(laborIndex))}>
                                                {state.laborStability}
                                            </Badge>
                                        </div>
                                        <Slider
                                            value={[laborIndex]}
                                            min={0}
                                            max={2}
                                            step={1}
                                            onValueChange={(val: number[]) => setLaborStability(laborMap[val[0]])}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-[9px] text-zinc-400 font-medium uppercase tracking-wider">
                                            <span>Stable</span>
                                            <span>Critical</span>
                                        </div>
                                    </div>

                                    {/* Material Availability */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                <Truck className="w-3.5 h-3.5 text-zinc-500" /> Supply
                                            </Label>
                                            <Badge className={cn("text-[9px] uppercase px-1.5 py-0", getStatusColor(materialIndex, true))}>
                                                {state.materialAvailability}
                                            </Badge>
                                        </div>
                                        <Slider
                                            value={[materialIndex]}
                                            min={0}
                                            max={2}
                                            step={1}
                                            onValueChange={(val: number[]) => setMaterialAvailability(materialMap[val[0]])}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-[9px] text-zinc-400 font-medium uppercase tracking-wider">
                                            <span>Scarce</span>
                                            <span>Full</span>
                                        </div>
                                    </div>

                                    {/* Design Gaps */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                <FileWarning className="w-3.5 h-3.5 text-zinc-500" /> Design Gaps
                                            </Label>
                                            <Badge className={cn("text-[9px] uppercase px-1.5 py-0", getStatusColor(designIndex))}>
                                                {state.designGaps}
                                            </Badge>
                                        </div>
                                        <Slider
                                            value={[designIndex]}
                                            min={0}
                                            max={2}
                                            step={1}
                                            onValueChange={(val: number[]) => setDesignGaps(designMap[val[0]])}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-[9px] text-zinc-400 font-medium uppercase tracking-wider">
                                            <span>None</span>
                                            <span>Major</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
