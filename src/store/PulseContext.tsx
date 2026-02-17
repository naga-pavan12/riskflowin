import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    PulseState,
    DEFAULT_PULSE_STATE,
    PulseFinancials,
    LaborStability,
    MaterialAvailability,
    DesignGaps
} from '../types';

const STORAGE_KEY = 'riskinflow_pulse_store_v1';

interface PulseContextType {
    state: PulseState;
    updateFinancials: (updates: Partial<PulseFinancials>) => void;
    setLaborStability: (val: LaborStability) => void;
    setMaterialAvailability: (val: MaterialAvailability) => void;
    setDesignGaps: (val: DesignGaps) => void;
    reset: () => void;
}

const PulseContext = createContext<PulseContextType | null>(null);

function loadFromStorage(): PulseState {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...DEFAULT_PULSE_STATE, ...parsed };
        }
    } catch (e) {
        console.error('Failed to load PulseState from storage', e);
    }
    return DEFAULT_PULSE_STATE;
}

export function PulseProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<PulseState>(loadFromStorage);

    // Persist to localStorage (debounced 1s)
    useEffect(() => {
        const handler = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }, 1000);
        return () => clearTimeout(handler);
    }, [state]);

    const updateFinancials = useCallback((updates: Partial<PulseFinancials>) => {
        setState(prev => ({
            ...prev,
            financials: { ...prev.financials, ...updates }
        }));
    }, []);

    const setLaborStability = useCallback((val: LaborStability) => {
        setState(prev => ({ ...prev, laborStability: val }));
    }, []);

    const setMaterialAvailability = useCallback((val: MaterialAvailability) => {
        setState(prev => ({ ...prev, materialAvailability: val }));
    }, []);

    const setDesignGaps = useCallback((val: DesignGaps) => {
        setState(prev => ({ ...prev, designGaps: val }));
    }, []);

    const reset = useCallback(() => {
        setState(DEFAULT_PULSE_STATE);
    }, []);

    return (
        <PulseContext.Provider value={{
            state,
            updateFinancials,
            setLaborStability,
            setMaterialAvailability,
            setDesignGaps,
            reset
        }}>
            {children}
        </PulseContext.Provider>
    );
}

export function usePulseContext() {
    const context = useContext(PulseContext);
    if (!context) {
        throw new Error('usePulseContext must be used within a PulseProvider');
    }
    return context;
}
