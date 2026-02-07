/**
 * useSimulationData.ts
 * 
 * Adapter hook that transforms the Zustand store + simulation results
 * into the data shape expected by the new RiskInflow Pro UI.
 */

import { useMemo } from 'react';
import { format, parse } from 'date-fns';
import { useProjectStore } from '../../store/useProjectStore';
import type {
    MonthRisk,
    RiskDriver,
    RecommendedAction,
    RiskLevel,
    ComponentType
} from '../data/sampleData';

function getStatusFromProb(prob: number): RiskLevel {
    if (prob < 0.25) return 'low';
    if (prob < 0.60) return 'watch';
    return 'severe';
}

export function useSimulationData() {
    const {
        results,
        config,
        allocations,
        actualOutflows,
        months: storeMonths
    } = useProjectStore();

    // Transform monthlyStats → MonthRisk[]
    const monthsData: MonthRisk[] = useMemo(() => {
        if (!results?.monthlyStats) return [];

        return results.monthlyStats.map(m => {
            // Parse month string like "2025-01" and format as "Jan 2025"
            const displayMonth = format(parse(m.month, 'yyyy-MM', new Date()), 'MMM yyyy');

            // Convert topDrivers for this month
            const drivers: RiskDriver[] = (results?.kpis?.topDrivers || []).slice(0, 3).map((d, idx) => {
                // Parse the driver name like "Concrete-MATERIAL" → activity, component
                const parts = d.name.split('-');
                let component = (parts[1] || 'SERVICE') as ComponentType;

                // Map new driver names to components roughly
                if (d.name.includes('Invoice Lag')) component = 'SERVICE';
                if (d.name.includes('Material Price')) component = 'MATERIAL';
                if (d.name.includes('Execution')) component = 'SERVICE';
                if (d.name.includes('Scope')) component = 'INFRA';

                return {
                    id: String(idx + 1),
                    name: parts[0] || d.name,
                    component,
                    riskContribution: d.contribution > 0 ? Math.min(1, d.contribution / 10) : 0.1,
                    impactContribution: d.contribution > 0 ? Math.min(1, d.contribution / 8) : 0.1,
                    description: `${d.lever} lever`
                };
            });

            return {
                month: displayMonth,
                status: getStatusFromProb(m.shortfallProb),
                probability: m.shortfallProb * 100,
                expectedShortfall: m.shortfallExpected || 0,
                p80Shortfall: m.shortfallP80 || 0,
                scheduleDebt: m.scheduleDebtP50 || 0,
                deferredCost: m.deferredCostExpected || 0,
                drivers
            };
        });
    }, [results]);

    // Top drivers aggregated across all months
    const topDrivers: RiskDriver[] = useMemo(() => {
        if (!results?.kpis?.topDrivers) return [];

        return results.kpis.topDrivers.slice(0, 5).map((d, idx) => {
            const parts = d.name.split('-');
            let component = (parts[1] || 'SERVICE') as ComponentType;

            // Map new driver names to components roughly
            if (d.name.includes('Invoice Lag')) component = 'SERVICE';
            if (d.name.includes('Material Price')) component = 'MATERIAL';
            if (d.name.includes('Execution')) component = 'SERVICE';
            if (d.name.includes('Scope')) component = 'INFRA';

            return {
                id: String(idx + 1),
                name: parts[0] || d.name,
                component,
                riskContribution: d.contribution > 0 ? Math.min(1, d.contribution / 10) : 0.1,
                impactContribution: d.contribution > 0 ? Math.min(1, d.contribution / 8) : 0.1,
                description: `${d.lever} lever - primary risk driver`
            };
        });
    }, [results]);

    // Recommended actions from topCauses (counterfactual attribution)
    const recommendedActions: RecommendedAction[] = useMemo(() => {
        if (!results?.kpis?.topCauses) return [];

        return results.kpis.topCauses.slice(0, 6).map((cause, idx) => {
            // Derive Action Title from Cause
            let title = `Mitigate ${cause.name}`;
            let category = 'Risk';

            if (cause.name.includes('Invoice Lag')) {
                title = 'Split POs / Renegotiate Terms';
                category = 'Procurement';
            }
            if (cause.name.includes('Material Price')) {
                title = 'Lock Rates / Hedge';
                category = 'Supply Chain';
            }
            if (cause.name.includes('Execution')) {
                title = 'Review Forecast Baseline';
                category = 'Planning';
            }
            if (cause.name.includes('Scope')) {
                title = 'Enforce Scope Governance';
                category = 'Governance';
            }

            return {
                id: String(idx + 1),
                title,
                category,
                targetMonths: monthsData.filter(m => m.status !== 'low').slice(0, 3).map(m => m.month),
                reason: `Addresses ${(cause.contribution * 100).toFixed(0)}% of shortfall probability`,
                impact: {
                    redMonths: -Math.floor(cause.contribution * 3),
                    worstP80: -(cause.contribution * 5),
                    probability: -(cause.contribution * 20)
                }
            };
        });
    }, [results, monthsData]);

    // Summary statistics
    const summaryStats = useMemo(() => {
        if (!results?.kpis || !results?.monthlyStats) {
            return {
                overallRisk: 'low' as RiskLevel,
                worstMonth: 'N/A',
                worstProbability: 0,
                worstP80: 0,
                totalExposure: 0,
                expectedShortfall: 0,
                redMonths: 0,
                spentToDate: 0,
                remainingCap: config.capTotalCr,
                totalBudget: config.capTotalCr
            };
        }

        const worstMonthData = results.kpis.worstMonth;
        const worstMonthDisplay = worstMonthData?.month
            ? format(parse(worstMonthData.month, 'yyyy-MM', new Date()), 'MMM yyyy')
            : 'N/A';

        // Calculate spent to date from actual outflows
        let spentToDate = 0;
        const asOf = config.asOfMonth || config.startMonth;
        storeMonths.filter(m => m <= asOf).forEach(m => {
            if (actualOutflows[m]) {
                Object.values(actualOutflows[m]).forEach(entity => {
                    Object.values(entity).forEach(activity => {
                        Object.values(activity).forEach(val => {
                            spentToDate += val;
                        });
                    });
                });
            }
        });

        const totalExpected = results.monthlyStats.reduce((sum, m) => sum + m.shortfallExpected, 0);
        const redMonthsCount = results.monthlyStats.filter(m => m.shortfallProb > 0.5).length;
        const overallProb = results.kpis.probShortfallAnyMonth;

        // Handle both typed definition (prob/amount) and actual worker output (shortfallProb/shortfallP80)
        // With recent fix, it should be prob/amount
        const worstProb = worstMonthData?.prob ?? 0;
        const worstAmount = worstMonthData?.amount ?? 0;

        return {
            overallRisk: getStatusFromProb(overallProb),
            worstMonth: worstMonthDisplay,
            worstProbability: worstProb * 100,
            worstP80: worstAmount,
            totalExposure: totalExpected * 1.5,
            expectedShortfall: totalExpected,
            redMonths: redMonthsCount,
            spentToDate,
            remainingCap: config.capTotalCr - spentToDate,
            totalBudget: config.capTotalCr
        };
    }, [results, config, actualOutflows, storeMonths]);

    return {
        monthsData,
        topDrivers,
        recommendedActions,
        summaryStats,
        isLoading: !results,
        config
    };
}
