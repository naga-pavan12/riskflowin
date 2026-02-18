# Risk Inflow - Dashboard Math & Logic Reference

**Version:** 4.0 (Complete Dashboard Coverage)
**Status:** Live on Production

This document maps every number on the Dashboard to its formula and data source.

---

## 1. Executive Console (Top Strip)

### 1.1. Spent To Date
*   **Formula**:
    $$
    \text{Spent} = \sum \text{VerifiedActuals}_{\text{Historical}} + \text{CurrentMonth}_{\text{Paid}}
    $$

### 1.2. Cap Remaining
*   **Formula**: $\text{TotalCap} - \text{SpentToDate}$

### 1.3. Total Gap (6m)
*   **Formula**: $\sum_{t=Now}^{Now+6} \max(0, \text{P50\_Demand}_t - \text{P20\_Limit}_t)$

### 1.4. AI Risk Pulse
*   **Formula**: $0.5 + \text{Labor}(0.3) + \text{Supply}(0.3) + \text{Design}(0.25)$
*   **Thresholds**: Critical $\ge 0.8$, High $\ge 0.6$.

---

## 2. Monthly Overview (The Grid)

This section displays a micro-card for every month in the project duration.

### 2.1. Status Logic (Color)
*   **Input**: `Shortfall Probability` from Simulation ($P_{short}$).
*   **Rules**:
    *   **Severe (Red)**: $P_{short} > 50\%$ OR Explicit Risk Score = 'CRITICAL'.
    *   **Watch (Amber)**: $P_{short} > 25\%$.
    *   **Low (Green)**: $P_{short} \le 25\%$.

### 2.2. Risk %
*   **Display**: "X% Risk"
*   **Formula**:
    $$
    \text{Risk\%} = \text{Count}(\text{Iterations with Shortfall}) / 5000 \times 100
    $$

---

## 3. Action Portfolio (Mitigation Engine)

This engine highlights strategies to fix the projected gaps.

### 3.1. Recommendation Triggers
The system "suggests" a portfolio based on severity:
1.  **Risk Elimination**: If $P_{short} > 50\%$ OR Red Months > 2.
2.  **Cash Smoothing**: If $P_{short} > 25\%$ OR Peak Backlog > ₹5 Cr.
3.  **Min Disruption**: Default/Low urgency.

### 3.2. Impact Calculations (Projected ROI)
We estimate the "Delta" (Benefit) of each action *before* running a full simulation, using heuristic multipliers on the `BaseGap`.

*   **Base Gap**: $\max(\text{TotalGap}, 10 \text{ Cr})$
*   **Base Prob**: $\max(P_{short}, 10\%)$

#### Portfolio A: Min Disruption
*   **Strategy**: Defer uncommitted scope.
*   **Cash Impact**: $+15\%$ of Base Gap.
*   **Risk Reduction**: $-20\%$ of Base Prob.

#### Portfolio B: Cash Smoothing
*   **Strategy**: Aggressive throttling & payment term extension.
*   **Cash Impact**: $+35\%$ of Base Gap.
*   **Risk Reduction**: $-45\%$ of Base Prob.

#### Portfolio C: Risk Elimination
*   **Strategy**: Capital injection or major scope cuts.
*   **Cash Impact**: $+95\%$ of Base Gap (Essentially fixes the hole).
*   **Risk Reduction**: $-90\%$ of Base Prob.

---

## 4. Charts & Projections

### 4.1. Close Projection (Now-Cast)
*   **EOM Cash Due**: $\text{Incurred}(t) \times \text{LagCurve}$.
*   **Exceed Plan Risk**: Probability that $\text{Actuals} > \text{Budget}$.

### 4.2. Breach Radar
*   **Time-to-Breach**: Median month index where Balance turns negative.

### 4.3. Funding Runway (Main Table)
*   **Safe Spend Limit**: P20 (Conservative) Inflow.
*   **Cash Demand**: P50 (Expected) Outflow, including backlog.
*   **Gap**: $\text{Demand} - \text{Limit}$.

### 4.4. Multiverse Chart
*   **Cone**: Plots the P10 to P90 range of cumulative spend paths.
*   **Baseline**: Deterministic Engineering Plan (Purple Line).

---

## 5. Simulation Engine (The Core)

*   **Demand Generation**: Stochastic ($Cost \times \text{VolShock}$).
*   **Invoice Lag**: Delays payment (e.g., Material pays 0% in Month 1, 60% in Month 2).
*   **Liquidity Check**: If $\text{Available} < \text{Due}$, create **Backlog** and record **Shortfall**.
