import { RCABreakdown, RiskConfig, MonthlyStats } from '../../types/index';

/**
 * Decomposes the variance into primary drivers:
 * - Price (Market Volatility)
 * - Usage (Scope/Efficiency)
 * - Time (Schedule Drift)
 * - Funding (Inflow gaps)
 */
export function analyzeRootCause(
    historicalStats: MonthlyStats[],
    futureStats: MonthlyStats[],
    riskConfig: RiskConfig
): RCABreakdown {

    // We analyze the FUTURE P80 outcome vs the PLAN
    const totalProjectedOutflowP80 = futureStats.reduce((sum, s) => sum + s.cashOutflowP80, 0);
    const totalPlannedOutflow = futureStats.reduce((sum, s) => sum + s.plannedOutflowTotal, 0);

    const totalShortfall = Math.max(0, totalProjectedOutflowP80 - totalPlannedOutflow);

    // 1. Time Variance (Schedule Drift)
    // Measures cost of standing army (Fixed Costs) due to delays.
    // Simplifying assumption: If scheduleConfidence is low, time variance is high.
    const scheduleDrag = 1.0 - riskConfig.execution.scheduleConfidence; // 0.3 if conf is 0.7
    const timeVariance = totalShortfall * scheduleDrag * 0.4; // Weighted assumption for MVP

    // 2. Funding Variance (Inflow Gaps)
    // Not directly a cost driver, but a shortfall driver.
    // For RCA on *Cost*, we focus on outflow drivers. 
    // If we want RCA on *Shortfall*, we include Funding.
    // Let's assume RCA is for *Project Stress* (Shortfall).
    const fundingGap = futureStats.reduce((sum, s) => sum + Math.max(0, s.plannedAllocation - s.realizableInflowP20), 0);
    const fundingDriver = fundingGap > 0 ? fundingGap : 0;

    // 3. Remaining Variance (Price vs Usage)
    // Split based on Market Volatility Class
    // Higher Volatility Class -> Higher Price Variance portion
    let priceWeight = 0.3;
    switch (riskConfig.market.volatilityClass) {
        case 'high': priceWeight = 0.6; break;
        case 'critical': priceWeight = 0.8; break;
        case 'med': priceWeight = 0.4; break;
        case 'low': priceWeight = 0.2; break;
    }

    const remainingVariance = Math.max(0, totalShortfall - timeVariance); // Funding is separate from Cost variance
    const priceVariance = remainingVariance * priceWeight;
    const usageVariance = remainingVariance * (1 - priceWeight);

    // Identify Primary Driver
    const drivers = {
        price: priceVariance,
        usage: usageVariance,
        time: timeVariance,
        funding: fundingDriver
    };

    let maxVal = -1;
    let primary = 'Unknown';

    if (drivers.price > maxVal) { maxVal = drivers.price; primary = 'Market Volatility (Price)'; }
    if (drivers.usage > maxVal) { maxVal = drivers.usage; primary = 'Execution Efficiency (Usage)'; }
    if (drivers.time > maxVal) { maxVal = drivers.time; primary = 'Schedule Drift (Time)'; }
    if (drivers.funding > maxVal) { maxVal = drivers.funding; primary = 'Inflow Reliability (Funding)'; }

    return {
        shortfallAmount: totalShortfall,
        primaryDriver: primary,
        drivers: drivers
    };
}
