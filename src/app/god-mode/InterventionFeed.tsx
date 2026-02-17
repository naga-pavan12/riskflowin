/**
 * InterventionFeed — "Jarvis-style" Mission Control Feed
 * 
 * The main God Mode view. Shows:
 * 1. System Health gauge
 * 2. Scenario selector
 * 3. Vertical stream of Intervention cards (Red/Amber/Blue)
 * 4. Drill-down signal charts
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Zap, Shield, AlertTriangle, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, Activity, RefreshCw,
    Brain, Eye, Radio
} from 'lucide-react';
import { useGodModeStore, type GodModeDataSource } from '../../store/useGodModeStore';
import { SignalChart, VECTOR_LABELS } from './SignalChart';
import type { Intervention, GodModeScenario, HealthGrade, RiskVector, MLInsights } from '../../types/godMode';

// ============================================================================
// STYLES
// ============================================================================

const SEVERITY_STYLES: Record<string, { border: string; bg: string; pulse: string; badge: string; icon: string }> = {
    CRITICAL: {
        border: 'border-red-500/60',
        bg: 'bg-red-950/40',
        pulse: 'animate-pulse',
        badge: 'bg-red-600 text-white',
        icon: 'text-red-400',
    },
    HIGH: {
        border: 'border-amber-500/50',
        bg: 'bg-amber-950/30',
        pulse: '',
        badge: 'bg-amber-600 text-white',
        icon: 'text-amber-400',
    },
    MEDIUM: {
        border: 'border-blue-500/30',
        bg: 'bg-blue-950/20',
        pulse: '',
        badge: 'bg-blue-600 text-white',
        icon: 'text-blue-400',
    },
};

const HEALTH_COLORS: Record<HealthGrade, { text: string; ring: string; bg: string }> = {
    GREEN: { text: 'text-emerald-400', ring: 'ring-emerald-500/50', bg: 'bg-emerald-500' },
    AMBER: { text: 'text-amber-400', ring: 'ring-amber-500/50', bg: 'bg-amber-500' },
    RED: { text: 'text-red-400', ring: 'ring-red-500/50', bg: 'bg-red-500' },
    BLACK: { text: 'text-red-600', ring: 'ring-red-700/50', bg: 'bg-red-700' },
};

const SCENARIO_CONFIG: Record<GodModeScenario, { label: string; desc: string; color: string }> = {
    HEALTHY: { label: 'HEALTHY', desc: 'All systems nominal', color: 'bg-emerald-600' },
    STRESSED: { label: 'STRESSED', desc: 'Multiple vectors degrading', color: 'bg-amber-600' },
    CRITICAL: { label: 'CRITICAL', desc: 'Cascading failures active', color: 'bg-red-600' },
};

// ============================================================================
// INTERVENTION CARD
// ============================================================================

function InterventionCard({
    intervention,
    signals,
    onApprove,
    onReject,
}: {
    intervention: Intervention;
    signals: any[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const style = SEVERITY_STYLES[intervention.severity];
    const isActioned = intervention.status !== 'PENDING';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`
        relative rounded-xl border-2 ${style.border} ${style.bg}
        backdrop-blur-sm transition-all duration-300
        ${style.pulse}
        ${isActioned ? 'opacity-50' : ''}
      `}
        >
            {/* Severity Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${intervention.severity === 'CRITICAL' ? 'bg-red-500' :
                intervention.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />

            <div className="p-5 pl-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${style.badge}`}>
                                {intervention.type}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800 text-zinc-400`}>
                                {intervention.causalChain.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-mono">
                                {Math.round(intervention.confidence * 100)}% conf
                            </span>
                        </div>
                        <h3 className="text-white font-bold text-[15px] leading-tight">
                            {intervention.title}
                        </h3>
                        <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                            {intervention.message}
                        </p>
                    </div>
                </div>

                {/* Root Cause Vectors */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {intervention.rootCause.map(v => (
                        <span
                            key={v}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                        >
                            {VECTOR_LABELS[v] || v}
                        </span>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                    {intervention.autoAction && !isActioned && (
                        <>
                            <button
                                onClick={() => onApprove(intervention.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black text-xs font-bold
                  hover:bg-zinc-200 transition-all active:scale-95"
                            >
                                <CheckCircle2 size={14} />
                                Approve: {intervention.autoAction}
                            </button>
                            <button
                                onClick={() => onReject(intervention.id)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold
                  hover:bg-zinc-700 hover:text-white transition-all"
                            >
                                <XCircle size={14} />
                                Override
                            </button>
                        </>
                    )}
                    {isActioned && (
                        <span className={`text-xs font-bold uppercase tracking-wide ${intervention.status === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {intervention.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                    )}

                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                        <Eye size={12} />
                        {expanded ? 'Hide' : 'Drill Down'}
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                </div>

                {/* Drill-Down Charts */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {intervention.rootCause.map(v => (
                                    <div key={v} className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                                        <SignalChart
                                            signals={signals}
                                            vector={v}
                                            color={
                                                intervention.severity === 'CRITICAL' ? '#ef4444' :
                                                    intervention.severity === 'HIGH' ? '#f59e0b' : '#3b82f6'
                                            }
                                            height={100}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ============================================================================
// HEALTH GAUGE
// ============================================================================

function HealthGauge({ score, grade }: { score: number; grade: HealthGrade }) {
    const colors = HEALTH_COLORS[grade];
    const circumference = 2 * Math.PI * 52;
    const dashOffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    {/* Background ring */}
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="8" />
                    {/* Progress ring */}
                    <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke={grade === 'GREEN' ? '#10b981' : grade === 'AMBER' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${colors.text}`}>{score}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Health</span>
                </div>
            </div>
            <span className={`mt-2 text-xs font-black uppercase tracking-widest ${colors.text}`}>
                {grade}
            </span>
        </div>
    );
}

// ============================================================================
// VECTOR HEATMAP (Quick Overview)
// ============================================================================

function VectorHeatmap({ vectorScores }: { vectorScores: Record<RiskVector, number> }) {
    const entries = Object.entries(vectorScores) as [RiskVector, number][];

    return (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {entries.map(([vector, score]) => {
                const color = score >= 70 ? 'bg-emerald-900/40 border-emerald-700/30 text-emerald-400' :
                    score >= 40 ? 'bg-amber-900/40 border-amber-700/30 text-amber-400' :
                        'bg-red-900/40 border-red-700/30 text-red-400';
                return (
                    <div
                        key={vector}
                        className={`rounded-lg border p-2.5 text-center ${color} transition-all`}
                    >
                        <div className="text-lg font-black">{score}</div>
                        <div className="text-[8px] font-bold uppercase tracking-wider mt-0.5 text-zinc-400">
                            {VECTOR_LABELS[vector]?.split(' ')[0] || vector}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// ML INSIGHTS PANEL
// ============================================================================

const RISK_LABEL_STYLES: Record<string, { bg: string; text: string }> = {
    LOW: { bg: 'bg-emerald-900/50', text: 'text-emerald-400' },
    MEDIUM: { bg: 'bg-amber-900/50', text: 'text-amber-400' },
    HIGH: { bg: 'bg-orange-900/50', text: 'text-orange-400' },
    CRITICAL: { bg: 'bg-red-900/50', text: 'text-red-400' },
};

function MLInsightsPanel({ insights }: { insights: MLInsights }) {
    const { risk, solvency, serviceOnline } = insights;

    return (
        <div className="space-y-4">
            {/* Service Status */}
            <div className={`rounded-xl border p-4 ${serviceOnline
                ? 'border-emerald-800/50 bg-emerald-950/20'
                : 'border-red-800/50 bg-red-950/20'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${serviceOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        ML Engine
                    </span>
                    <span className={`text-[10px] font-bold ml-auto ${serviceOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                        {serviceOnline ? 'CONNECTED' : 'OFFLINE'}
                    </span>
                </div>
                <p className="text-[10px] text-zinc-600">
                    risk-ml-service @ localhost:8000
                </p>
            </div>

            {/* Risk Classification */}
            {risk && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-zinc-500" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Risk Score</h2>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-600">{risk.method}</span>
                    </div>

                    {/* Probability + Label */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl font-black tabular-nums text-white">
                            {Math.round(risk.risk_probability * 100)}
                        </div>
                        <div>
                            <span className={`text-xs font-black px-2.5 py-1 rounded ${RISK_LABEL_STYLES[risk.risk_label]?.bg || ''} ${RISK_LABEL_STYLES[risk.risk_label]?.text || 'text-zinc-400'}`}>
                                {risk.risk_label}
                            </span>
                            <p className="text-[10px] text-zinc-600 mt-1.5">
                                Top Driver: <span className="text-zinc-400 font-bold">{risk.top_risk_driver}</span>
                            </p>
                        </div>
                    </div>

                    {/* Stress Breakdown Bars */}
                    <div className="space-y-2.5">
                        {Object.entries(risk.stress_breakdown).map(([key, val]) => {
                            const pct = Math.round(val * 100);
                            const color = pct >= 60 ? 'bg-red-500' : pct >= 35 ? 'bg-amber-500' : 'bg-emerald-500';
                            return (
                                <div key={key}>
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="font-bold uppercase tracking-wider text-zinc-400">{key}</span>
                                        <span className="font-bold text-zinc-300 tabular-nums">{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${color} rounded-full transition-all duration-700`}
                                            style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Top Feature Importance */}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-2 block">
                            Feature Importance
                        </span>
                        <div className="space-y-1.5">
                            {Object.entries(risk.feature_importance).slice(0, 5).map(([feat, weight]) => (
                                <div key={feat} className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500/60 rounded-full"
                                            style={{ width: `${Math.round(weight * 100)}%` }} />
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-500 w-20 truncate">{feat}</span>
                                    <span className="text-[9px] font-bold text-zinc-400 tabular-nums w-8 text-right">
                                        {Math.round(weight * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Solvency Projection */}
            {solvency && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-zinc-500" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Overrun Risk</h2>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-600">{solvency.method}</span>
                    </div>

                    {/* P10 / P50 / P90 gauges */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'P10', value: solvency.p10, color: 'text-emerald-400', sub: 'Optimistic' },
                            { label: 'P50', value: solvency.p50, color: 'text-amber-400', sub: 'Expected' },
                            { label: 'P90', value: solvency.p90, color: 'text-red-400', sub: 'Pessimistic' },
                        ].map(q => (
                            <div key={q.label} className="text-center bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
                                <div className={`text-xl font-black ${q.color} tabular-nums`}>
                                    {q.value > 0 ? '+' : ''}{q.value.toFixed(1)}%
                                </div>
                                <div className="text-[9px] font-bold text-zinc-500 uppercase mt-1">{q.label}</div>
                                <div className="text-[8px] text-zinc-600 mt-0.5">{q.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Dominant Attention */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600">
                            Watching: <span className="font-bold text-violet-400">{solvency.dominant_attention}</span>
                        </span>
                        <span className="text-[9px] text-zinc-700 tabular-nums">
                            conf: {(solvency.confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InterventionFeed() {
    const {
        scenario, setScenario,
        dataSource, setDataSource,
        signals, interventions, systemHealth,
        mlInsights,
        isRunning, lastRunAt,
        runAnalysis, approveIntervention, rejectIntervention,
    } = useGodModeStore();

    // Auto-run on mount
    useEffect(() => {
        if (interventions.length === 0 && !isRunning) {
            runAnalysis();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pendingCount = interventions.filter(i => i.status === 'PENDING').length;
    const criticalCount = interventions.filter(i => i.severity === 'CRITICAL').length;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header — Mission Control Style */}
            <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/50">
                                <Brain size={22} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    GOD MODE
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-violet-400' : criticalCount > 0 ? 'bg-red-400' : 'bg-emerald-400'
                                            }`}></span>
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-violet-500' : criticalCount > 0 ? 'bg-red-500' : 'bg-emerald-500'
                                            }`}></span>
                                    </span>
                                </h1>
                                <p className="text-zinc-500 text-xs font-medium mt-0.5">
                                    Causal Inference Engine • {pendingCount} Pending • {interventions.length} Total
                                    {mlInsights?.serviceOnline && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                            ML
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Last Run */}
                            {lastRunAt && (
                                <span className="text-[10px] text-zinc-600 font-mono">
                                    {new Date(lastRunAt).toLocaleTimeString()}
                                </span>
                            )}

                            {/* Refresh */}
                            <button
                                onClick={() => runAnalysis()}
                                disabled={isRunning}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold
                  hover:bg-zinc-700 transition-all disabled:opacity-50 border border-zinc-700"
                            >
                                <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
                                {isRunning ? 'Analyzing...' : 'Re-Scan'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-12 gap-6">

                    {/* LEFT COLUMN —  Health + Scenario + Vectors */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">

                        {/* System Health */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Activity size={16} className="text-zinc-500" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">System Health</h2>
                            </div>
                            {systemHealth ? (
                                <>
                                    <HealthGauge score={systemHealth.overallScore} grade={systemHealth.grade} />
                                    <div className="mt-6">
                                        <VectorHeatmap vectorScores={systemHealth.vectorScores} />
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <Radio size={24} className="text-zinc-700 animate-pulse" />
                                </div>
                            )}
                        </div>

                        {/* Data Source Toggle */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Radio size={16} className="text-zinc-500" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Data Source</h2>
                            </div>
                            <div className="flex gap-2 mb-4">
                                {(['LIVE', 'SIMULATED'] as GodModeDataSource[]).map(ds => (
                                    <button
                                        key={ds}
                                        onClick={() => setDataSource(ds)}
                                        className={`
                                            flex-1 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-center transition-all border
                                            ${dataSource === ds
                                                ? ds === 'LIVE'
                                                    ? 'bg-emerald-900/50 border-emerald-600/50 text-emerald-400 ring-1 ring-emerald-600/30'
                                                    : 'bg-violet-900/50 border-violet-600/50 text-violet-400 ring-1 ring-violet-600/30'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                                            }
                                        `}
                                    >
                                        {ds === 'LIVE' ? '● LIVE' : '◇ SIM'}
                                    </button>
                                ))}
                            </div>
                            {dataSource === 'LIVE' ? (
                                <div className="text-xs text-emerald-400/80 bg-emerald-950/30 rounded-lg p-3 border border-emerald-800/30">
                                    <span className="font-bold">Reading from Current Month Actuals</span>
                                    <p className="text-zinc-500 mt-1">Enter vital signs in the Pulse Check form to feed the engine.</p>
                                </div>
                            ) : (
                                /* Scenario Selector — only in SIMULATED mode */
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap size={14} className="text-zinc-600" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Scenario</span>
                                    </div>
                                    {(Object.keys(SCENARIO_CONFIG) as GodModeScenario[]).map(s => {
                                        const cfg = SCENARIO_CONFIG[s];
                                        const isActive = scenario === s;
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => setScenario(s)}
                                                className={`
                                                    w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all
                                                    ${isActive
                                                        ? 'border-zinc-600 bg-zinc-800 text-white ring-1 ring-zinc-600'
                                                        : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                                                    <div>
                                                        <div className="text-xs font-bold">{cfg.label}</div>
                                                        <div className="text-[10px] text-zinc-500 mt-0.5">{cfg.desc}</div>
                                                    </div>
                                                </div>
                                                {isActive && <CheckCircle2 size={14} className="text-zinc-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ML Intelligence Panel — only in LIVE mode with results */}
                        {dataSource === 'LIVE' && mlInsights && (
                            <MLInsightsPanel insights={mlInsights} />
                        )}
                    </div>

                    {/* RIGHT COLUMN — Intervention Feed */}
                    <div className="col-span-12 lg:col-span-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield size={16} className="text-zinc-500" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Intervention Feed</h2>
                            {criticalCount > 0 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                                    {criticalCount} CRITICAL
                                </span>
                            )}
                        </div>

                        {isRunning ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 animate-ping absolute" />
                                    <Brain size={32} className="text-violet-400 animate-pulse relative" />
                                </div>
                                <p className="text-zinc-500 text-sm font-bold mt-6 uppercase tracking-widest">
                                    Analyzing Causal Chains...
                                </p>
                            </div>
                        ) : interventions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                                <Shield size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-bold">All Clear</p>
                                <p className="text-xs mt-1">No interventions detected</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {interventions.map((intervention, idx) => (
                                        <InterventionCard
                                            key={intervention.id}
                                            intervention={intervention}
                                            signals={signals}
                                            onApprove={approveIntervention}
                                            onReject={rejectIntervention}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
