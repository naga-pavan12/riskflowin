/**
 * Early Warning System — Deterministic (non-Monte Carlo) checks
 * 
 * Runs on CurrentMonthActuals + budget data to produce traffic-light warnings.
 * These are immediate signals, not probabilistic forecasts.
 */

import type { CurrentMonthActuals, EarlyWarning } from '../types';

export function getEarlyWarnings(
    actuals: CurrentMonthActuals | undefined,
    engineeringCap: number,
    next3MonthsBudget: number
): EarlyWarning[] {
    if (!actuals) return [];

    const warnings: EarlyWarning[] = [];
    const totalActualPaid =
        actuals.actualPaidToDate.SERVICE +
        actuals.actualPaidToDate.MATERIAL +
        actuals.actualPaidToDate.INFRA;

    // ========================================================================
    // 1. COMMITMENT ICEBERG — PO value > 120% of near-term budget
    // ========================================================================
    if (actuals.committedPOValue > 0 && next3MonthsBudget > 0) {
        const commitmentRatio = actuals.committedPOValue / next3MonthsBudget;
        if (commitmentRatio > 1.2) {
            warnings.push({
                id: 'commitment-iceberg',
                level: commitmentRatio > 1.5 ? 'CRITICAL' : 'HIGH',
                title: 'Commitment Iceberg',
                message: `Committed POs (₹${actuals.committedPOValue.toFixed(1)} Cr) exceed ${(commitmentRatio * 100).toFixed(0)}% of next 3 months' budget. Expect cash crunch in ~60 days.`,
                metric: 'PO/Budget Ratio',
                value: commitmentRatio,
                threshold: 1.2,
            });
        }
    }

    // ========================================================================
    // 2. CPI EFFICIENCY — Earned Value / Actual Cost < 0.85
    // ========================================================================
    if (actuals.physicalProgressPct > 0 && totalActualPaid > 0 && engineeringCap > 0) {
        const earnedValue = engineeringCap * actuals.physicalProgressPct;
        const cpi = earnedValue / totalActualPaid;

        if (cpi < 0.85) {
            warnings.push({
                id: 'low-cpi',
                level: cpi < 0.70 ? 'CRITICAL' : 'MED',
                title: 'Low Cost Efficiency',
                message: `CPI: ${cpi.toFixed(2)} — You are spending ₹1.00 to get ₹${cpi.toFixed(2)} of value. Target ≥ 0.85.`,
                metric: 'CPI',
                value: cpi,
                threshold: 0.85,
            });
        }
    }

    // ========================================================================
    // 3. SCHEDULE VARIANCE — Physical vs Planned progress
    // ========================================================================
    if (actuals.physicalProgressPct > 0 && actuals.plannedProgressPct > 0) {
        const spi = actuals.physicalProgressPct / actuals.plannedProgressPct;

        if (spi < 0.85) {
            warnings.push({
                id: 'schedule-slip',
                level: spi < 0.70 ? 'HIGH' : 'MED',
                title: 'Schedule Slippage',
                message: `SPI: ${spi.toFixed(2)} — Physical progress (${(actuals.physicalProgressPct * 100).toFixed(0)}%) lags planned (${(actuals.plannedProgressPct * 100).toFixed(0)}%).`,
                metric: 'SPI',
                value: spi,
                threshold: 0.85,
            });
        }
    }

    // ========================================================================
    // 4. HARD BUDGET BREACH — Paid + ETC > Cap
    // ========================================================================
    if (actuals.estimateToComplete > 0 && engineeringCap > 0) {
        const forecastTotal = totalActualPaid + actuals.estimateToComplete;
        const overrun = forecastTotal - engineeringCap;

        if (overrun > 0) {
            warnings.push({
                id: 'hard-budget-breach',
                level: 'CRITICAL',
                title: 'Hard Budget Breach',
                message: `Forecast (Paid + ETC) = ₹${forecastTotal.toFixed(1)} Cr exceeds Engineering Cap by ₹${overrun.toFixed(1)} Cr.`,
                metric: 'Forecast vs Cap',
                value: forecastTotal,
                threshold: engineeringCap,
            });
        }
    }

    // Sort: CRITICAL first, then HIGH, MED, LOW
    const levelOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MED: 2, LOW: 3 };
    warnings.sort((a, b) => (levelOrder[a.level] ?? 4) - (levelOrder[b.level] ?? 4));

    return warnings;
}
