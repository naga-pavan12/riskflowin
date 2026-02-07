// Helper: Inverse Transform Sampling for Triangular Distribution
// low, mode, high multiplier
export function sampleTriangular(u: number, low: number, mode: number, high: number): number {
    const c = (mode - low) / (high - low);
    if (u < c) {
        return low + Math.sqrt(u * (high - low) * (mode - low));
    } else {
        return high - Math.sqrt((1 - u) * (high - low) * (high - mode));
    }
}

// Simple Box-Muller to get Standard Normal
export function sampleNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Error Function for Normal CDF (Approximation)
function erif(x: number): number {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

export function normalCDF(x: number): number {
    return 0.5 * (1 + erif(x / Math.sqrt(2)));
}

// Gaussian Copula implementation for N correlated variables
// For prototype, we use a single common factor approach for simplicity vs full Cholesky
export function generateCorrelatedUniforms(n: number, rho: number): number[] {
    const common = sampleNormal();
    const uniforms: number[] = [];
    const sqrtRho = Math.sqrt(rho);
    const sqrtOneMinusRho = Math.sqrt(1 - rho);

    for (let i = 0; i < n; i++) {
        const specific = sampleNormal();
        const lat = sqrtRho * common + sqrtOneMinusRho * specific;
        uniforms.push(normalCDF(lat));
    }
    return uniforms;
}
