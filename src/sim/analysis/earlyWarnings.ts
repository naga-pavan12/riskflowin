import { CurrentMonthActuals, EarlyWarning } from '../../types/index';

/**
 * Generates deterministic Early Warnings based on "Big Company" signals.
 * 
 * 1. Iceberg Check: Committed POs vs Budget Cap (Toyota Method)
 * 2. Efficiency Check: CPI (Earned Value) (Lockheed Method)
 * 3. Insolvency Check: EAC vs Budget Cap (Unilever Method)
 */
export function getEarlyWarnings(
    actuals: CurrentMonthActuals,
    budgetCap: number
): EarlyWarning[] {
    const warnings: EarlyWarning[] = [];

    if (!actuals) return warnings;

    const actualSpent =
        actuals.actualPaidToDate.SERVICE +
        actuals.actualPaidToDate.MATERIAL +
        actuals.actualPaidToDate.INFRA;

    // 1. ICEBERG CHECK (Toyota Method)
    // If Committed POs (unpaid liability) exceed 20% of the total budget, risk is hidden.
    const committedPO = actuals.committedPOValue || 0;
    const icebergThreshold = budgetCap * 0.20;

    if (committedPO > icebergThreshold) {
        warnings.push({
            id: 'iceberg-risk',
            level: 'HIGH',
            title: 'Iceberg Risk Detected',
            message: `Committed PO value (₹${committedPO.toFixed(1)}Cr) exceeds 20% of Project Cap. Significant hidden liability.`,
            metric: 'Committed POs',
            threshold: '> 20% of Cap'
        });
    }

    // 2. EFFICIENCY CHECK (Lockheed Method / CPI)
    // CPI = (Budget * PhysicalProgress) / ActualSpent
    // If CPI < 0.85, we are bleeding cash for every unit of progress.
    if (actualSpent > 0 && actuals.physicalProgressPct > 0) {
        const ev = budgetCap * actuals.physicalProgressPct; // Earned Value
        const cpi = ev / actualSpent;

        if (cpi < 0.85) {
            warnings.push({
                id: 'efficiency-drag',
                level: 'MED',
                title: 'Low Efficiency (CPI)',
                message: `Cost Performance Index is ${cpi.toFixed(2)}. Project is generating only ₹${cpi.toFixed(2)} of value for every ₹1 spent.`,
                metric: 'CPI',
                threshold: '< 0.85'
            });
        }
    }

    // 3. INSOLVENCY CHECK (Unilever Method / EAC)
    // If (ActualSpent + EstimateToComplete) > BudgetCap, the project is technically bankrupt.
    const eac = actualSpent + actuals.estimateToComplete;
    if (eac > budgetCap) {
        warnings.push({
            id: 'insolvency-risk',
            level: 'CRITICAL',
            title: 'Insolvency Forecast',
            message: `Estimate at Completion (₹${eac.toFixed(1)}Cr) exceeds Project Cap (₹${budgetCap}Cr). Immediate scope reduction required.`,
            metric: 'EAC vs Cap',
            threshold: 'Exceeds Cap'
        });
    }

    return warnings;
}
