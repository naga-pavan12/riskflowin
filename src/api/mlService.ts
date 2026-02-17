/**
 * ML Service API Client
 * =====================
 * 
 * Type-safe fetch wrapper for the risk-ml-service (FastAPI on port 8000).
 * Handles all three prediction endpoints with automatic fallback on errors.
 * 
 * The client never throws — it always returns a result object with an
 * `error` flag so the UI can degrade gracefully.
 */

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const ML_SERVICE_URL = 'http://localhost:8000';
const TIMEOUT_MS = 15_000; // 15s timeout (Prophet can be slow on first run)

// ==============================================================================
// RESPONSE TYPES
// ==============================================================================

/** Engine A response: Supply/Burn Rate Forecast */
export interface SupplyForecastResult {
    forecast: Array<{
        date: string;
        yhat: number;
        yhat_lower: number;
        yhat_upper: number;
    }>;
    method: 'prophet' | 'linear' | 'flat' | 'error_fallback';
    data_points_used: number;
    trend_direction: 'increasing' | 'decreasing' | 'stable';
}

/** Engine B response: Risk Classification */
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

/** Engine C response: Solvency Projection */
export interface SolvencyProjectionResult {
    p10: number;
    p50: number;
    p90: number;
    dominant_attention: string;
    attention_weights: Record<string, number>;
    confidence: number;
    method: 'statistical_mimicry' | 'tft' | 'error_fallback';
}

/** Unified ML response wrapper */
export interface MLResponse<T> {
    error: boolean;
    error_message?: string;
    data: T;
}

// ==============================================================================
// SAFE DEFAULTS (used when the service is unreachable)
// ==============================================================================

const SUPPLY_FALLBACK: SupplyForecastResult = {
    forecast: [],
    method: 'error_fallback',
    data_points_used: 0,
    trend_direction: 'stable',
};

const RISK_FALLBACK: RiskClassificationResult = {
    risk_probability: 0.5,
    risk_label: 'MEDIUM',
    feature_importance: {},
    top_risk_driver: 'UNKNOWN',
    stress_breakdown: { liquidity: 0.5, quality: 0.5, execution: 0.5 },
    method: 'error_fallback',
};

const SOLVENCY_FALLBACK: SolvencyProjectionResult = {
    p10: 0,
    p50: 5,
    p90: 15,
    dominant_attention: 'UNKNOWN',
    attention_weights: {},
    confidence: 0,
    method: 'error_fallback',
};

// ==============================================================================
// CORE FETCH HELPER
// ==============================================================================

async function mlFetch<T>(
    endpoint: string,
    body: unknown,
    fallback: T,
): Promise<MLResponse<T>> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const res = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timer);

        if (!res.ok) {
            console.warn(`[mlService] ${endpoint} returned ${res.status}`);
            return { error: true, error_message: `HTTP ${res.status}`, data: fallback };
        }

        const json = await res.json();
        return json as MLResponse<T>;
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`[mlService] ${endpoint} failed: ${msg}`);
        return { error: true, error_message: msg, data: fallback };
    }
}

// ==============================================================================
// PUBLIC API
// ==============================================================================

/**
 * Engine A — Supply/Burn Rate Forecast (Prophet)
 */
export async function predictSupply(
    history: Array<{ date: string; value: number }>,
    forecastDays = 30,
): Promise<MLResponse<SupplyForecastResult>> {
    return mlFetch('/predict/supply', { history, forecast_days: forecastDays }, SUPPLY_FALLBACK);
}

/**
 * Engine B — Risk Classification (XGBoost heuristic proxy)
 * 
 * Accepts vital signs from CurrentMonthActuals and maps them to the
 * 12-vector format the ML service expects.
 */
export async function predictRisk(vectors: {
    velocity_pct: number;
    resource_density: number;
    rework_count: number;
    vendor_aging: number;
    unbilled_asset: number;
    advance_burn: number;
    burn_rate: number;
    lead_time_var: number;
    indent_latency: number;
    drawing_gap: number;
    methodology_gap: number;
    work_front_gap: number;
}, pulseInputs?: {
    labor_stability: string;
    material_availability: string;
    design_gaps: string;
}): Promise<MLResponse<RiskClassificationResult>> {
    return mlFetch('/predict/risk', { vectors, pulse_inputs: pulseInputs }, RISK_FALLBACK);
}

/**
 * Engine C — Solvency Projection (TFT statistical mimicry)
 */
export async function predictSolvency(
    staticData: {
        budget_cr: number;
        location_tier: string;
        months_elapsed: number;
        months_total: number;
    },
    history: Array<Record<string, number | string>>,
): Promise<MLResponse<SolvencyProjectionResult>> {
    return mlFetch(
        '/predict/solvency',
        { static_data: staticData, history },
        SOLVENCY_FALLBACK,
    );
}

/**
 * Health check — verify the ML service is reachable
 */
export async function checkMLServiceHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${ML_SERVICE_URL}/health`, {
            signal: AbortSignal.timeout(3000),
        });
        return res.ok;
    } catch {
        return false;
    }
}
