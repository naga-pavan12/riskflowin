import { MonthlyStats, RiskConfig, RiskScore } from '../../types/index';

/**
 * Calculates Operational Risk Scores for each month based on:
 * 1. Velocity: Rate of change of spend (Ramp-up risk)
 * 2. Capacity: Absolute spend vs Max Monthly Burn limit
 * 3. Liquidity: Funding coverage buffer
 */
export function calculateRiskScores(
    stats: MonthlyStats[],
    limits: RiskConfig['limits']
): RiskScore[] {
    const scores: RiskScore[] = [];

    for (let i = 0; i < stats.length; i++) {
        const current = stats[i];
        const prev = i > 0 ? stats[i - 1] : null;

        let velocityScore = 0;
        let capacityScore = 0;
        let liquidityScore = 0;

        // 1. VELOCITY (Acceleration)
        if (prev && prev.cashOutflowP50 > 0) {
            const velocity = current.cashOutflowP50 / prev.cashOutflowP50;
            if (velocity > limits.maxVelocityChange) {
                // e.g. 1.5x ramp up -> Score 100 if > maxVelocity
                const excess = velocity - limits.maxVelocityChange; // e.g. 1.5 - 1.2 = 0.3
                velocityScore = Math.min(100, (excess / 0.5) * 100);
            }
        }

        // 2. CAPACITY (Burn Rate)
        if (current.cashOutflowP80 > limits.maxMonthlyBurn) {
            const overflow = current.cashOutflowP80 - limits.maxMonthlyBurn;
            capacityScore = Math.min(100, (overflow / (limits.maxMonthlyBurn * 0.2)) * 100);
        }

        // 3. LIQUIDITY (Coverage)
        // If probShortfall > 50%, liquidity risk is high.
        // OR if P50 shortfall > minLiquidityBuffer
        if (current.shortfallProb > 0.1) {
            liquidityScore = current.shortfallProb * 100;
        }

        // Aggregate Score (Max of factors, or weighted avg? User said "Primary Factor")
        // We define score as the impacts.

        const maxScore = Math.max(velocityScore, capacityScore, liquidityScore);

        let primaryFactor: RiskScore['primaryFactor'] = 'LIQUIDITY';
        if (velocityScore === maxScore) primaryFactor = 'VELOCITY';
        if (capacityScore === maxScore) primaryFactor = 'CAPACITY';
        if (liquidityScore === maxScore) primaryFactor = 'LIQUIDITY';

        let level: RiskScore['level'] = 'LOW';
        if (maxScore > 80) level = 'CRITICAL';
        else if (maxScore > 50) level = 'HIGH';
        else if (maxScore > 20) level = 'MED';

        scores.push({
            month: i + 1, // 1-based index matching user req, though stats has YYYY-MM
            score: Math.round(maxScore),
            level,
            primaryFactor,
            breakdown: {
                velocity: Math.round(velocityScore),
                capacity: Math.round(capacityScore),
                liquidity: Math.round(liquidityScore)
            }
        });
    }

    return scores;
}
