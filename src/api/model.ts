export interface ProjectMeta {
    project_id: string;
    project_name: string;
    currency_unit: string;
    cap_total_cr: number;
    start_month: string;
    num_months: number;
    underspend_policy: string;
    overspend_trigger: string;
    cut_method: string;
    protect_engineering: boolean;
}

export interface Department {
    dept_id: string;
    dept_name: string;
}

export interface EngineeringBucket {
    bucket_id: string;
    bucket_name: string;
    display_order: number;
}

export interface Allocation {
    project_id: string;
    month: string;
    dept_id: string;
    planned_inflow_cr: number;
}

export interface Demand {
    project_id: string;
    month: string;
    engineering_demand_total_cr: number;
}

export interface BucketShare {
    project_id: string;
    bucket_id: string;
    share_of_engineering_demand: number;
}

export interface ComponentShare {
    project_id: string;
    bucket_id: string;
    cost_component: string;
    share_within_bucket: number;
}

export interface UncertaintyParam {
    project_id: string;
    entity_type: 'ENG_BUCKET' | 'COST_COMPONENT' | 'DEPT';
    entity_id: string;
    dist_type: string;
    low_mult: number;
    mode_mult: number;
    high_mult: number;
    ramp_pct_total: number;
    notes?: string;
}

export interface Correlation {
    project_id: string;
    entity_a: string;
    entity_b: string;
    corr: number;
}

export interface ProjectData {
    meta: ProjectMeta;
    departments: Department[];
    buckets: EngineeringBucket[];
    allocations: Allocation[];
    demands: Demand[];
    bucketShares: BucketShare[];
    componentShares: ComponentShare[];
    uncertainty: UncertaintyParam[];
    correlations: Correlation[];
}
