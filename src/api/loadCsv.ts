import Papa from 'papaparse';
import type { ProjectData, ProjectMeta, Department, EngineeringBucket, Allocation, Demand, BucketShare, ComponentShare, UncertaintyParam, Correlation } from './model';

async function fetchCsv<T>(path: string): Promise<T[]> {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    const text = await res.text();
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => resolve(results.data as T[]),
            error: (err: any) => reject(err),
        });
    });
}

export async function loadProjectData(projectId: string): Promise<ProjectData> {
    const basePath = `/data/${projectId}`;

    const [
        metaRows,
        depts,
        buckets,
        allocs,
        demands,
        bShares,
        cShares,
        uncert,
        corrs
    ] = await Promise.all([
        fetchCsv<any>(`${basePath}/project_meta.csv`),
        fetchCsv<Department>(`${basePath}/departments.csv`),
        fetchCsv<EngineeringBucket>(`${basePath}/engineering_buckets.csv`),
        fetchCsv<Allocation>(`${basePath}/planned_allocations_monthly.csv`),
        fetchCsv<Demand>(`${basePath}/engineering_demand_total_monthly.csv`),
        fetchCsv<BucketShare>(`${basePath}/engineering_bucket_shares.csv`),
        fetchCsv<ComponentShare>(`${basePath}/engineering_component_shares.csv`),
        fetchCsv<UncertaintyParam>(`${basePath}/uncertainty_params.csv`),
        fetchCsv<Correlation>(`${basePath}/correlations.csv`).catch(() => []),
    ]);

    const meta: ProjectMeta = {
        ...metaRows[0],
        protect_engineering: String(metaRows[0].protect_engineering).toLowerCase() === 'true'
    };

    const errors: string[] = [];
    const months = [...new Set(allocs.map(a => a.month))];
    if (months.length !== meta.num_months) {
        errors.push(`Month count mismatch: expected ${meta.num_months}, found ${months.length}`);
    }

    const bucketSum = bShares.reduce((sum, b) => sum + b.share_of_engineering_demand, 0);
    if (Math.abs(bucketSum - 1) > 0.05) {
        errors.push(`Engineering bucket shares sum to ${bucketSum.toFixed(2)}, expected 1.0`);
    }

    if (errors.length > 0) {
        throw new Error(errors.join(' | '));
    }

    return {
        meta,
        departments: depts,
        buckets,
        allocations: allocs,
        demands,
        bucketShares: bShares,
        componentShares: cShares,
        uncertainty: uncert,
        correlations: corrs
    };
}
