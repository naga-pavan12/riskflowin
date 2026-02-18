export interface RiskClassificationResult {
    risk_probability: number;
    risk_label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    feature_importance: Record<string, number>;
    top_risk_driver: string;
    stress_breakdown: {
        liquidity: number;
        quality: number;
        execution: number;
    };
    method: 'heuristic' | 'xgboost' | 'error_fallback';
}
