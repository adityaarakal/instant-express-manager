# Planned Expenses React App – Execution Tasks

This document lists every major task required to deliver the Planned Expenses automation project. Tasks are ordered sequentially; each phase builds on the previous one. Work through them in order unless priorities change explicitly.

---

## Phase 1 — Data Foundations

### Task 1 – Finalise Workbook Export
- Extend `scripts/export_planned_expenses.py` to cover all months without manual limits.
- Detect `#REF!` cells and capture raw formulas for manual adjustments.
- Generate canonical JSON/CSV seeds under `data/seeds/` and snapshot results.

### Task 2 – Validate Export Parity
- Spot-check totals (remaining cash, bucket sums, pending vs paid) against Excel for representative months.
- Document discrepancies and remediation steps (missing projections, broken references, manual overrides).

### Task 3 – Catalogue Supporting Data Sources
- Identify required inputs from auxiliary sheets (`Projections`, `CC Outstanding`, EMIs, bills).
- Decide what must be present for MVP vs deferred modules; record mapping notes.

---

## Phase 2 — Domain & State Layer

### Task 4 – Finalise TypeScript Models
- Lock final interfaces in `src/types/plannedExpenses.ts` (SIP splits, adjustments, raw references).
- Capture bucket metadata (display names, colors, order) in a shared config file.

### Task 5 – Build Persistence & Stores
- Implement Zustand stores (`usePlannedMonthsStore`, `usePlannerStore`, settings/accounts slices).
- Add localforage persistence, hydration, and schema migration utilities.
- Seed demo data from exported JSON; expose selectors for derived totals and reminders.

### Task 6 – Implement Formula Utilities
- Translate Excel formulas into TypeScript helpers (`calculateRemaining`, `aggregateTotals`, `applyDueDateRule`, serial conversions).
- Cover utilities with Vitest unit tests using exported fixtures.

---

## Phase 3 — UI Foundations

### Task 7 – Complete Layout & Navigation
- Finish the shared layout shell, theming, and navigation scaffolding.
- Ensure responsive behaviour and route placeholders for upcoming features.

### Task 8 – Planner Month View (Read-Only)
- Render month header, status ribbon, account table, and totals footer from seed data.
- Display due dates, remaining cash, and bucket statuses accurately.

### Task 9 – Planner Interactions (Editable)
- Enable inline editing for balances, savings, allocations, and status toggles.
- Add manual adjustment handling and real-time derived totals.

---

## Phase 4 — Import/Export & Sync

### Task 10 – Import Flow
- Build workbook upload UI (SheetJS or script invocation).
- Map imported data to internal stores; surface warnings for unknown mappings or `#REF!`.
- Provide preview/diff before commit.

### Task 11 – Export & Backups
- Allow exporting months back to JSON/CSV for backups.
- Document round-trip procedure (Excel → app → export).

---

## Phase 5 — Insights & Settings

### Task 12 – Dashboard Metrics
- Implement summary cards (pending allocations, savings progress, CC bills).
- Add due-soon reminders and trend charts powered by aggregated data.

### Task 13 – Settings & Configuration
- Manage currency, default fixed factor, bucket definitions, and theme toggles.
- Persist preferences globally and apply across components.

---

## Phase 6 — Quality & Release

### Task 14 – Testing Suite
- Add Vitest coverage for stores and utilities, plus component/integration tests.
- Validate Planner interactions, import flows, and dashboard outputs.

### Task 15 – PWA & Build Stability
- Resolve Vite PWA service-worker build failures.
- Run Lighthouse, confirm offline support, and optimise performance.

### Task 16 – Documentation & Handover
- Update README with setup, data import, and troubleshooting guides.
- Produce user walkthroughs and developer onboarding notes.
- Finalise release notes and CI/CD deployment pipeline (staging + production).

---

Use this document as the single source for task ordering. Update statuses and notes alongside implementation to keep progress transparent. 

