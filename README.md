# RiskInflow Pro

A probabilistic risk management platform for large-scale engineering projects.

## Overview
RiskInflow Pro helps project executives visualize liquidity risks and schedule debt using Monte Carlo simulations. It shifts the worldview from "Financial Budgeting" to "Operational Reality", where Engineering is an independent liquidity silo.

## Key Features
- **Executive Console**: High-level dashboard for VPs/Directors to monitor P20 Safe Spend Limits and Funding Runway.
- **Monte Carlo Engine**: Simulates thousands of project lifecycles to predict cash flow breaches.
- **Risk Factors**: Models Invoice Lag, Material Price Volatility, Execution Overrun, and Scope Drift.
- **Mitigation Playbook**: AI-suggested actions to recover from projected shortfalls.

## Architecture
- **Frontend**: React, TypeScript, Tailwind CSS, Recharts.
- **State**: Zustand (`useProjectStore`).
- **Engine**: Web Worker (`simulation.worker.ts`) for non-blocking computation.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Project Structure
- `src/app`: Main Application UI (Platform & Console views).
- `src/workers`: Simulation Engine (Web Worker).
- `src/store`: Global State Management.
- `src/hooks`: Custom React Hooks.
- `src/types`: Shared TypeScript definitions.

