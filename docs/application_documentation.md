# Risk Inflow System - Technical Documentation

**Version:** 2.0.0
**Status:** In Development (Alpha)
**Target Audience:** Development Team, System Architects

---

## 1. System Overview

**Risk Inflow** is a specialized Risk Management & Liquidity Forecasting system for large-scale construction projects. Unlike traditional tools that rely on static "Planned vs. Actual" graphs, Risk Inflow uses **Stochastic Simulation (Monte Carlo)** to forecast future cash flow risks, liquidity breaches, and schedule slippage.

### Core Philosophy
1.  **Engineering-Driven**: Financials are derived from physical engineering progress, not just arbitrary budgets.
2.  **Probabilistic**: We don't say "You will run out of cash in May." We say "There is an 85% probability of a liquidity breach in May, with a P50 shortfall of ₹20Cr."
3.  **Action-Oriented**: The system recommends specific mitigation portfolios (e.g., "Cash Smoothing") and instantly simulates their impact.

---

## 2. Technical Architecture

### 2.1. Stack
*   **Frontend**: React 19 (Vite), TypeScript 5.
*   **State Management**: React Context (`ProjectContext`) + `localStorage` for persistence.
*   **Simulation Engine**: Web Worker (`simulation.worker.ts`) for off-main-thread heavy computation.
*   **UI Framework**: Tailwind CSS v4, Lucide React (Icons), Recharts (Visualization).
*   **Validation**: Zod.

### 2.2. Folder Structure
```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/       # Core UI Widgets (BreachRadar, ActionPortfolio)
│   │   ├── ui/              # Shared Primitives (Card, Button, Badge)
│   │   └── Layouts/         # AppShell, TopBar
│   └── App.tsx              # Root Component (Routing)
├── store/
│   ├── ProjectContext.tsx   # Global State Store
│   └── useProjectStore.ts   # Hook Wrapper
├── types/
│   └── index.ts             # Domain Models (Single Source of Truth)
├── workers/
│   └── simulation.worker.ts # The Math Engine
└── main.tsx                 # Entry Point
```

---

## 3. Data Domain & Models

The application's data structure is defined in `src/types/index.ts`. All data inputs are validated using `zod` schemas.

### 3.1. Core Entities
*   **`ProjectConfig`**: Static metadata (Name, Start Month, Duration). define the "Grid" (Entities x Activities).
*   **`OutflowData`**: A sparse 4D tensor storing cost data.
    *   Structure: `Month -> Entity -> Activity -> Component (Material/Service/Infra) -> Value`.
*   **`DeptAllocation`**: Budget allocated to the Engineering department per month.
*   **`RiskConfig`**: The "Knobs" for the simulation (Volatility, Contractor Risk, Rain Season).

### 3.2. Configuration Objects
*   **`PolicyConfig`**: Rules for automated breach resolution.
    *   `breachMode`: "payablesBacklogThrottle".
    *   `frictionMultiplier`: Penalty cost for deferring payments (e.g., 1.1x).

---

## 4. The Simulation Engine (`simulation.worker.ts`)

This is the heart of the application. It runs a Monte Carlo simulation (default 5,000 iterations) to generate probabilistic forecasts.

### 4.1. Simulation Flow (Per Iteration)
For each month $t$ from $Start$ to $End$:

1.  **Inflow Generation**:
    *   Calculate `Available Cash` = `Allocated Budget` + `CarryForward (from t-1)`.
    *   Apply `Collection Efficiency` (e.g., 90%).

2.  **Demand Simulation (Probabilistic Cost)**:
    *   Base Cost comes from `Physical Plan`.
    *   **Market Shock**: Correlated normal distribution shock applied to Material costs.
    *   **Idiosyncratic Shock**: Specific vendor risk applied to individual items.
    *   **Execution Risk**: Labor/Service costs scaled by `Contractor Reliability`.
    *   **Rain Season**: If $t$ is a monsoon month, efficiency drops (Cost rises by $1/0.9$).
    *   $Total Demand_t = \sum (BaseCost * (1 + Impacts))$.

3.  **Cash Outflow (Invoice Lag)**:
    *   Costs incurred in $t$ are not paid immediately.
    *   We apply delay curves (e.g., Material: 60% paid in $t+1$, 40% in $t+2$).
    *   $CashDue_t = \sum (Lagged Payments) + PayablesBacklog_{t-1}$.

4.  **Liquidity Check**:
    *   If `Available Cash` >= `CashDue_t`:
        *   Pay full amount.
        *   `CarryForward_t` = `Available` - `Due`.
        *   `Backlog_t` = 0.
    *   If `Available Cash` < `CashDue_t` (**BREACH**):
        *   Pay `Available`.
        *   `Shortfall_t` = `Due` - `Available`.
        *   `Backlog_t` = `Shortfall_t` (Used as liability for next month).
        *   **Breach Event**: Logged for "Kill Chain" analysis.

### 4.2. Aggregation (Post-Simulation)
The worker aggregates 5,000 iterations to produce:
*   **P50/P80 Curves**: 50th and 80th percentile values for Cash Flow, Shortfall, and Backlog.
*   **Breach Radar**: Probability distribution of the *first* month a breach occurs.
*   **Driver Attribution**: Sensitivity analysis to identify which input (e.g., "Steel Price") caused the most variance.

---

## 5. State Management (`ProjectContext.tsx`)

### 5.1. Persistence Strategy
*   **Auto-Save**: State changes (e.g., updating a cell) are debounced (1000ms) and saved to `localStorage`.
*   **Hydration**: On load, the app checks `localStorage`. If empty, it seeds with `DEFAULT_CONFIG` (Demo Data).

### 5.2. Worker Integration
*   **Trigger**: `useEffect` watches for changes in `config` or `inputs`.
*   **Cycle**:
    1.  UI updates state.
    2.  `triggerSimulation()` is called (Debounced).
    3.  Main thread serializes state -> Posts message to Worker.
    4.  Worker computes -> Posts `SimulationResults` back.
    5.  `setResults()` updates the Dashboard.

---

## 6. Component Hierarchy (Key Components)

### 6.1. `Dashboard.tsx`
The main container. Orchestrates the layout of widgets.
*   **Children**:
    *   `ExecutiveConsole`: Top bar with Project ID and Date.
    *   `CloseProjection`: "Current Month Actuals" card (The `NowCast`).
    *   `DecisionCockpit`: **[REMOVED/DEFERRED]** (Previously used for sandbox).
    *   `BreachRadar`: Visualizes the "Time to Impact" (Earliest breach probability).
    *   `ActionPortfolio`: The Strategic Controller. Allows applying "Cash Smoothing" or "Risk Elimination" strategies.
    *   `MultiverseChart`: The primary fan chart showing P50/P80 cash flow cones.

### 6.2. `ActionPortfolio.tsx`
Handles the interactive mitigation strategies.
*   **Logic**:
    *   Reads `results.kpis` to detect "High Risk" or "Cash Crunch".
    *   Generates card data dynamically.
    *   **Apply Action**: Updates `policyConfig` directly (e.g., changes `maxThrottlePct` from 0% to 40%).

### 6.3. `MultiverseChart.tsx`
Complex Visualization.
*   **Library**: `Recharts`.
*   **Data**: Consumes `results.monthlyStats`.
*   **Layers**:
    *   Area: Range between P50 and P80 (The Risk Cone).
    *   Line: P50 Forecast.
    *   Bars: Payables Backlog (Visualizing the debt pile-up).

---

## 7. Interfaces & APIs

### 7.1. Simulation Input (Worker Contract)
```typescript
interface SimulationInput {
    config: ProjectConfig;
    allocations: DeptAllocation; // Inflows
    plannedOutflows: OutflowData; // Baseline Plan
    engineeringDemand: OutflowData; // Active working plan
    actualOutflows: OutflowData; // Historicals
    currentMonthActuals: CurrentMonthActuals; // Now-Cast signals
    riskConfig: RiskConfig; // Volatility params
    iterations: number; // Default 5000
    seed: number; // Default 42 (Deterministic)
}
```

### 7.2. Simulation Output
```typescript
interface SimulationResults {
    monthlyStats: MonthlyStats[]; // Time-series P50/P80
    kpis: {
        probShortfallAnyMonth: number; // 0.0 - 1.0
        totalDeferredCost: number;
        topDrivers: Driver[]; // Attribution
    };
    breachRadar: BreachRadarResults; // Earliest breach distribution
    nowCast: NowCastResults; // Current month projection
}
```

---

## 8. User Interface & Data Flow

### 8.1. Navigation Structure (Sidebar)
The application is organized into three functional zones, accessible via the collapsible sidebar (`AppShell.tsx`):

1.  **CONSOLE**:
    *   **Dashboard**: The command center. Displays synthesized risk intelligence.
    *   **Project Setup**: Core configuration (Entities, Duration, Activities).
2.  **PLANNING** (Input Layer):
    *   **Planned Outflow** (`EngineeringDemand`): Granular cost forecasting (Entity x Activity x Component).
    *   **Planned Inflow**: Revenue / Funding limits.
    *   **Risk Setup**: Configuration of volatility parameters (Inflations, Delays).
3.  **ACTUALS** (Grounding Layer):
    *   **Actual Inflow**: Recorded funding received.
    *   **Actual Outflow**: Verified spend from ERP.
    *   **Current Month Actuals**: The "Now-Cast" inputs (Physical Progress, PO Value) to ground the month's starting point.

### 8.2. The Dashboard (Command Center)
The **Dashboard** `Dashboard.tsx` is the primary interface for decision-making. It is not just a display layer but an interactive control room.

#### A. Executive Status Strip
Top-level metrics for immediate situational awareness:
*   **Spent To Date**: Total verified expenditure (Historical Actuals + Current Month Verified).
*   **Cap Remaining**: `Total Budget - Spent`. Turns red if negative.
*   **Total Gap (6m)**: Projected liquidity shortfall over the next 6 months (P50).
*   **AI Risk Pulse**: A synthetic score derived from the "Pulse Rail" (Labor/Material/Design signals).

#### B. Control Panels
*   **Close Projection (Now-Cast)**: Bridges the gap between "Accounting Actuals" and "Physical Reality". shows *Projected EOM Invoice* vs *Plan*.
*   **Breach Radar**: Distribution of the *First Breach Month*. Answers "When will we first run out of money?".
    *   *Backend Connection*: Consumes `results.breachRadar`. derived from 5,000 iterations in the worker.

#### C. Financial Visualization
*   **Multiverse Chart**: The core risk cone.
    *   **Blue Line**: P50 (Expected) Cumulative Cash Flow.
    *   **Blue Shaded Area**: P50-P80 Risk Cone (Volatility).
    *   **Red Bars**: Payables Backlog (Unpaid invoices carried forward).
*   **Inflow vs Outflow**: Bar chart comparing Realizable Inflow (P20) vs Required Outflow (P50).

#### D. Action Portfolio (The Controller)
A bottom-pinned interactive panel (`ActionPortfolio.tsx`).
*   **Purpose**: Allows the Project Manager to apply mitigation strategies.
*   **Mechanism**: Clicking "activate" on a strategy (e.g., "Cash Smoothing") directly modifies the `PolicyConfig` in the `ProjectContext`, triggering a re-simulation.
*   **Feedback Loop**: The dashboard updates instantly (approx 200ms) to show the *Delta* (Reduction in Shortfall).

### 8.3. Input Screens (e.g., Planned Outflow)
The input screens (like `EngineeringDemand.tsx`) share a consistent design pattern optimized for data entry:
*   **Month Selector**: Horizontal scrollable list grounded to `config.startMonth`.
*   **Accordion Grid**:
    *   **Level 1**: Activity (e.g., "Concrete"). Shows total value.
    *   **Level 2**: Entity (e.g., "Tower A").
    *   **Level 3**: Component Inputs (Service, Material, Infra).
*   **Unsaved Changes**: A global dirty state tracker via `useProjectStore` shows a "Save/Discard" floating footer if local state differs from committed state.

### 8.4. Visual Feedback & Connection to Backend
1.  **Input Action**: User types `50` into Material Cost.
2.  **Local State**: React state updates immediately (Optimistic UI).
3.  **Debounce**: After 1s of inactivity, `ProjectContext` saves to `localStorage`.
4.  **Simulation Trigger**: The store detects a data change and posts a message to `simulation.worker.ts`.
5.  **Processing**: Worker runs 5k iterations (takes ~150ms).
6.  **Results**: Worker posts `SimulationResults` back.
7.  **Re-Render**: `results` object in Store updates -> Dashboard components re-render with new P50/P80 curves.

### 8.5. Configuration Screens (e.g., Risk Setup)
For parameter tuning (`RiskSetup.tsx`), the UI shifts from data grids to interactive controls:
*   **Toggle Groups**: Used for categorical selection (e.g., "Low/Med/High" Volatility).
*   **Range Sliders**: For probability inputs (e.g., "Schedule Confidence 70%"). Visual feedback shows the impact (e.g., "Low confidence → overrun mean increases").
*   **List Builders**: For "Manual Threats", allowing dynamic addition/removal of discrete risk events.

This **Unidirectional Data Flow** (UI -> Store -> Worker -> Store -> UI) ensures that the Risk Engine is always "Live" and consistent with the inputs.

```
