import type { ProjectData } from '../api/model';
import { sampleTriangular, generateCorrelatedUniforms } from './distributions';

export interface IterationResult {
    monthlyInflow: number[];
    monthlyDemand: number[];
    monthlyShortfall: number[];
    totalInflow: number;
    hasShortfall: boolean;
    isReliable: boolean;
    q4Shortfall: boolean;
    driverImpacts: Map<string, number>;
}

export function runIteration(
    data: ProjectData,
    volatilityFactor: number,
    corrStrength: number
): IterationResult {
    const { meta, allocations, demands, bucketShares, componentShares, uncertainty } = data;
    const numMonths = meta.num_months;

    const monthlyInflow: number[] = [];
    const monthlyDemand: number[] = [];
    const monthlyShortfall: number[] = [];

    let cumulativeSpend = 0;
    let hasShortfall = false;
    let q4Shortfall = false;
    let rolloverPool = 0;

    const driverImpacts = new Map<string, number>();

    for (let m = 0; m < numMonths; m++) {
        const monthStr = allocations[m * data.departments.length]?.month;

        let totalEngDemand = 0;
        const baseDemand = demands.find(d => d.month === monthStr)?.engineering_demand_total_cr || 0;

        const bucketUniforms = generateCorrelatedUniforms(data.buckets.length, corrStrength);

        data.buckets.forEach((bucket, idx) => {
            const bShare = bucketShares.find(s => s.bucket_id === bucket.bucket_id)?.share_of_engineering_demand || 0;
            const bUncert = uncertainty.find(u => u.entity_type === 'ENG_BUCKET' && u.entity_id === bucket.bucket_id);

            let bMult = 1.0;
            if (bUncert) {
                const ramp = 1 + (bUncert.ramp_pct_total || 0) * (m / (numMonths - 1));
                const low = 1 + (bUncert.low_mult - 1) * volatilityFactor;
                const high = 1 + (bUncert.high_mult - 1) * volatilityFactor;
                const mode = 1 + (bUncert.mode_mult - 1) * volatilityFactor;
                bMult = sampleTriangular(bucketUniforms[idx], low, mode, high) * ramp;
            }

            const bucketTotal = baseDemand * bShare * bMult;

            const cRows = componentShares.filter(s => s.bucket_id === bucket.bucket_id);
            cRows.forEach(cs => {
                const cUncert = uncertainty.find(u => u.entity_type === 'COST_COMPONENT' && u.entity_id === cs.cost_component);
                let cMult = 1.0;
                if (cUncert) {
                    const u = Math.random();
                    const low = 1 + (cUncert.low_mult - 1) * volatilityFactor;
                    const high = 1 + (cUncert.high_mult - 1) * volatilityFactor;
                    const mode = 1 + (cUncert.mode_mult - 1) * volatilityFactor;
                    cMult = sampleTriangular(u, low, mode, high);
                }

                const segmentDemand = bucketTotal * cs.share_within_bucket * cMult;
                totalEngDemand += segmentDemand;

                const driverKey = `${bucket.bucket_id} - ${cs.cost_component}`;
                const impact = segmentDemand - (baseDemand * bShare * cs.share_within_bucket);
                driverImpacts.set(driverKey, (driverImpacts.get(driverKey) || 0) + impact);
            });
        });

        let totalOtherDemand = 0;
        const currentAllocs = allocations.filter(a => a.month === monthStr);
        currentAllocs.forEach(a => {
            if (a.dept_id === 'ENGINEERING') return;
            const dUncert = uncertainty.find(u => u.entity_type === 'DEPT' && u.entity_id === a.dept_id);
            let mult = 1.0;
            if (dUncert) {
                const u = Math.random();
                mult = sampleTriangular(u, dUncert.low_mult, dUncert.mode_mult, dUncert.high_mult);
            }
            totalOtherDemand += a.planned_inflow_cr * mult;
        });

        const engPlanned = currentAllocs.find(a => a.dept_id === 'ENGINEERING')?.planned_inflow_cr || 0;
        let availableEng = engPlanned + (meta.underspend_policy === 'ROLLOVER_NEXT_MONTH' ? rolloverPool : 0);

        if (cumulativeSpend + totalEngDemand + totalOtherDemand > meta.cap_total_cr) {
            const headroom = Math.max(0, meta.cap_total_cr - cumulativeSpend);
            const totalNeeded = totalEngDemand + totalOtherDemand;
            const ratio = totalNeeded > 0 ? Math.min(1, headroom / totalNeeded) : 1;

            if (!meta.protect_engineering) {
                availableEng = availableEng * ratio;
            } else {
                if (headroom < totalEngDemand) {
                    availableEng = Math.min(availableEng, headroom);
                }
            }
        }

        const realizable = Math.min(totalEngDemand, availableEng);
        monthlyInflow.push(realizable);
        monthlyDemand.push(totalEngDemand);
        const shortfall = Math.max(0, totalEngDemand - realizable);
        monthlyShortfall.push(shortfall);

        if (shortfall > 0.01) {
            hasShortfall = true;
            if (m >= numMonths - 3) q4Shortfall = true;
        }

        cumulativeSpend += (realizable + totalOtherDemand);
        rolloverPool = meta.underspend_policy === 'ROLLOVER_NEXT_MONTH' ? Math.max(0, availableEng - totalEngDemand) : 0;
    }

    return {
        monthlyInflow,
        monthlyDemand,
        monthlyShortfall,
        totalInflow: monthlyInflow.reduce((a, b) => a + b, 0),
        hasShortfall,
        isReliable: cumulativeSpend <= meta.cap_total_cr + 0.1,
        q4Shortfall,
        driverImpacts
    };
}
