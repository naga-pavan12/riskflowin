# Production Roadmap: Risk Inflow System

This document outlines the strategic technical plan to transition the **Risk Inflow** application from a Client-Side Prototype to a scalable, secure, and production-ready Enterprise System.

---

## 🏗 Phase 1: Hardening the Core (Current Web App)
**Goal:** Make the current Client-Side application robust, bug-free, and deployable as a standalone "Single Player" tool.

### 1.1. Application Stability
- [ ] **State Management**: Refactor `ProjectContext` to use a more robust state manager like **Zustand** or **Redux Toolkit** to handle complex nested state updates (allocations, outflows) more predictably than `useState`.
- [ ] **Data Validation**: Implement `zod` schemas for all inputs (Configuration, Allocations, Outflows) to prevent "Garbage In, Crash Out".
- [ ] **Error Boundaries**: Wrap major components (`Dashboard`, `ActionPortfolio`) in Granular Error Boundaries to prevent white-screen crashes.

### 1.2. Performance Optimization
- [ ] **Web Worker Optimization**: The `simulation.worker.ts` is compute-heavy.
    - Implement `SharedArrayBuffer` for zero-copy data transfer between Main Thread and Worker.
    - chunk simulation iterations (e.g., 500 at a time) to report progress checks.
- [ ] **Rendering**: Use `useTransition` for heavy UI updates (like toggling scenarios) to keep the UI responsive.
- [ ] **Bundle Size**: Lazy load heavy charts (`Recharts`) and the Simulation Engine.

### 1.3. Persistence (Local)
- [ ] **IndexedDB**: Move from `localStorage` (5MB limit) to `idb` (IndexedDB wrapper) to store full simulation histories and multiple project snapshots.

---

## 🚀 Phase 2: The Backend Shift (The "Real" App)
**Goal:** Introduce a centralized backend for collaboration, persistence, and heavy lifting.

### 2.1. System Architecture
```mermaid
graph TD
    Client[React Clients] -->|REST/GraphQL| API[API Gateway]
    API -->|Auth| Auth[Auth Service (Cognito/Auth0)]
    API -->|CRUD| Core[Core Service (Node/NestJS)]
    API -->|Compute| Engine[Risk Engine (Python/Rust)]
    Core --> DB[(PostgreSQL)]
    Engine --> Redis[(Redis Cache)]
```

### 2.2. Technology Stack Selection
*   **Database**: **PostgreSQL** (Relational data for Projects, Entities, Users) + **JSONB** (for flexible Risk Configs).
*   **API Layer**: **Node.js (NestJS)** or **Python (FastAPI)**.
    *   *Recommendation*: **FastAPI** if the team is Data Science heavy (easy integration with pandas/numpy for the Risk Engine).
*   **Auth**: **Auth0** or **AWS Cognito** (Enterprise requirement).

### 2.3. The "Hybrid" Simulation Model
*   **Client-Side (Quick)**: Keep the existing Web Worker for instant "What-If" feedback (Interactive mode).
*   **Server-Side (Deep)**: Offload massive simulations (100k+ iterations, multi-project Monte Carlo) to the Python backend.
    *   *Why?* Precision, Audit logs, and comparison against historical benchmarks.

---

## 🔌 Phase 3: Data Ingestion & Integration
**Goal**: Connect to the "Source of Truth" (ERPs) to automate data flow.

### 3.1. ETL Pipeline
*   **Ingest**: Connectors for SAP, Oracle Primavera, or MSP (Microsoft Project).
*   **Normalize**: Convert different data schemas into the `OutflowData` and `DeptAllocation` format.
*   **Frequency**: Nightly batch jobs to update `PlannedOutflows` and `Actuals`.

### 3.2. Data Lake (Optional)
*   Store raw historical simulation results in **S3/Parquet** for future ML model training (The "God Mode" future).

---

## 🛡 Phase 4: Enterprise Security & DevOps
**Goal**: Meet the requirements of CISO/IT departments.

### 4.1. Security
*   **RBAC**: Roles for `Executive` (View Only), `ProjectManager` (Edit Scenarios), `Admin` (System Config).
*   **Audit Logging**: Track *who* changed *what* assumption (e.g., "User X changed Volatility to Low").

### 4.2. DevOps / CI/CD
*   **Dockerization**: Containerize the Frontend, API, and Engine.
*   **Infrastructure as Code**: Terraform scripts for AWS/Azure deployment.
*   **Environments**: Dev -> Staging -> Prod.

---

## 📅 Execution Plan (Detailed)

### Sprint 1-2: Foundation
1.  Setup Monorepo (Turborepo) with `apps/web`, `apps/api`, `packages/shared-types`.
2.  Implement `zod` validation shared between FE and BE.
3.  Migrate `ProjectContext` logic to a clean Service layer in the API.

### Sprint 3-4: The Database
1.  Design Schema (Prisma/TypeORM).
2.  Implement User Auth.
3.  Create "Save Project" / "Load Project" APIs.

### Sprint 5-6: The Engine
1.  Port `simulation.worker.ts` logic to Python (pandas/numpy) or robust TypeScript Node service.
2.  Implement "Deep Simulation" endpoint.


### Sprint 7+: Integrations
1.  Build Excel/CSV Importer.
2.  Build ERP Connectors.

---

## 💾 Appendix A: Data Models (Draft Schema)

### 1. `projects`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `org_id` | UUID | FK to Organization |
| `name` | MAXCHAR | Project Name |
| `config` | JSONB | Stores `ProjectConfig` (Duration, Entities) |
| `risk_settings` | JSONB | Stores `RiskConfig` (Volatility, Threats) |
| `policy_settings` | JSONB | Stores `PolicyConfig` (Breach rules) |

### 2. `simulations`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `project_id` | UUID | FK to Project |
| `triggered_by` | UUID | User ID |
| `input_snapshot` | JSONB | Copy of Allocations/Outflows at runtime |
| `results_summary` | JSONB | `kpis`, `monthlyStats` (Lightweight) |
| `s3_path` | VARCHAR | Path to full Parquet/JSON dump of 10k iterations |
| `created_at` | TIMESTAMP | |

### 3. `outflows` (Time-Series)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `project_id` | UUID | FK |
| `month` | DATE | Grounded Month |
| `entity` | VARCHAR | Tower A, etc. |
| `activity` | VARCHAR | Concrete, etc. |
| `service_amt` | DECIMAL | |
| `material_amt` | DECIMAL | |
| `infra_amt` | DECIMAL | |
| `type` | ENUM | PLANNED, ACTUAL, FORECAST |

---

## 📡 Appendix B: API Specification (Draft)

### Project Management
- `GET /projects`: List all projects for user.
- `POST /projects`: Create new project.
- `GET /projects/:id/state`: Get full state (Config + Allocations + Outflows) for UI hydration.

### Simulation
- `POST /projects/:id/simulate`: Trigger a server-side deep simulation.
    - **Body**: `{ iterations: 10000, seed: 123, scenarios: ['s1'] }`
    - **Response**: `{ jobId: "job_123" }` (Async)
- `GET /projects/:id/simulations/:jobId`: Get simulation status/results.

### Scenarios
- `POST /projects/:id/scenarios`: Create a new named scenario (Snapshot).
- `PATCH /projects/:id/config`: Update live config (Local state sync).

