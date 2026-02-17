import { RCABreakdown, RiskScore, EarlyWarning } from '../../types/index';

/**
 * Generates an executive summary string.
 * Template: "Project Status is [CRITICAL/STABLE]. Primary driver is [RCA.Driver]. [Operational Alert if RiskScore > 80]. Recommended Action: [MitigationStrategy]."
 */
export function generateNarrative(
    rca: RCABreakdown,
    riskScores: RiskScore[],
    earlyWarnings: EarlyWarning[],
    currentMonthIdx: number = 0
): string {
    // Filter to Future/Current Scope
    // riskScores[i].month is 1-based. We want to keep months where index >= currentMonthIdx
    const relevantScores = riskScores.filter(s => s.month > currentMonthIdx);

    // 1. Determine Status
    const criticalMonths = relevantScores.filter(s => s.level === 'CRITICAL').length;
    const highMonths = relevantScores.filter(s => s.level === 'HIGH').length;

    let status = 'STABLE';
    if (criticalMonths > 0 || earlyWarnings.some(w => w.level === 'CRITICAL')) status = 'CRITICAL';
    else if (highMonths > 2 || earlyWarnings.some(w => w.level === 'HIGH')) status = 'AT RISK';

    // 2. Primary Driver
    const driver = rca.primaryDriver;

    // 3. Operational Alert
    const peakRisk = relevantScores.reduce((prev, current) => (prev.score > current.score) ? prev : current, relevantScores[0] || { score: 0 });
    let opAlert = "";
    if (peakRisk && peakRisk.score > 80) {
        opAlert = ` Critical Operational Stress detected in Month ${peakRisk.month} due to ${peakRisk.primaryFactor}.`;
    }

    // 4. Recommendation
    let recommendation = "Monitor monthly variances.";
    if (driver.includes("Market")) recommendation = "Consider hedging material contracts or pre-ordering to lock prices.";
    if (driver.includes("Efficiency")) recommendation = "Review site productivity and potential scope creep.";
    if (driver.includes("Schedule")) recommendation = "Crash critical path activities or renegotiate milestones.";
    if (driver.includes("Funding")) recommendation = "Initiate bridge financing or defer non-critical scope.";

    if (status === 'CRITICAL') {
        recommendation = "IMMEDIATE INTERVENTION REQUIRED. " + recommendation;
    }

    // Compose Narrative
    return `Project Status is ${status}. Primary driver of variance is ${driver}.${opAlert} Recommended Action: ${recommendation}`;
}
