export interface MitigationAction {
    title: string;
    lever: string;
    months: string[];
    impactDeltas: {
        probShortfall: number;
        worstShortfallCr: number;
        q4Risk: number;
    };
    owner: string;
    description: string;
}

export function generateMitigations(
    monthlyStats: any[],
    topDrivers: any[]
): MitigationAction[] {
    const actions: MitigationAction[] = [];
    const topSqueezeMonths = [...monthlyStats]
        .sort((a, b) => b.shortfallProb - a.shortfallProb)
        .slice(0, 3)
        .map(m => m.month);

    topDrivers.slice(0, 3).forEach(driver => {
        const [bucket, component] = driver.key.split(' - ');

        if (component === 'MATERIAL') {
            actions.push({
                title: `Lock Rates for ${bucket}`,
                lever: `Reduce ${driver.key} high_mult spread by 15%`,
                months: topSqueezeMonths,
                impactDeltas: {
                    probShortfall: -0.12,
                    worstShortfallCr: -driver.impactCr * 0.4,
                    q4Risk: -0.05
                },
                owner: 'Procurement',
                description: `${bucket} Material is a top variance driver. SECURE fixed pricing or early bulk buys.`
            });
        } else if (component === 'SERVICE') {
            actions.push({
                title: `Subcontractor Productivity Plan`,
                lever: `Reduce ${driver.key} high_mult spread by 10%`,
                months: topSqueezeMonths,
                impactDeltas: {
                    probShortfall: -0.08,
                    worstShortfallCr: -driver.impactCr * 0.25,
                    q4Risk: -0.03
                },
                owner: 'Planning',
                description: `Service cost variance is high in ${bucket}. Standardize productivity targets.`
            });
        }
    });

    // Re-phasing logic
    if (topSqueezeMonths.length > 0) {
        actions.push({
            title: 'Shift Non-Critical Finishing',
            lever: 'Move FINISHING scope from peak risk months',
            months: topSqueezeMonths,
            impactDeltas: {
                probShortfall: -0.15,
                worstShortfallCr: -5.5,
                q4Risk: -0.08
            },
            owner: 'Project Governance',
            description: 'The peak months coincide with high finishing load. Deferring non-structural finishes reduces the immediate squeeze.'
        });
    }

    return actions;
}
