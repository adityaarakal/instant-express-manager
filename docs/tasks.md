# Planned Expenses React App – Execution Tasks

> **Note:** The original Excel workbook now serves only as a design reference. Ongoing data entry and management will happen inside this application. Any Excel export/import workflows are optional backlog items, kept for historical parity but not required for daily use.

This document lists every major task required to deliver the Planned Expenses automation project. Tasks are ordered sequentially; each phase builds on the previous one. Work through them in order unless priorities change explicitly.

---

## Phase 1 — Data Foundations

### Task 1 – Finalise Workbook Export *(Completed)*
- Extend `scripts/export_planned_expenses.py` to cover all months without manual limits. ✅
- Detect `#REF!` cells and capture raw formulas for manual adjustments. ✅
- Generate canonical JSON/CSV seeds under `data/seeds/` and snapshot results. ✅

### Task 2 – Validate Export Parity *(On Hold)*
- Spot-check totals (remaining cash, bucket sums, pending vs paid) against Excel for representative months.
  - ✅ Bucket totals match for Jan–May 2023.
  - ✅ Pending vs paid totals align once blank status cells default to “Pending”.
-  - ⏳ Remaining cash aligns for 77/95 months; REF-affected months (Apr 2023 → Sep 2024) documented and deferred to post-MVP cleanup.
- Document discrepancies and remediation steps (missing projections, broken references, manual overrides). ✅

### Task 3 – Catalogue Supporting Data Sources *(Completed)*
- ✅ Identify required inputs from auxiliary sheets (`Projections`, `CC Outstanding`, EMIs, bills`). See `docs/planned-expenses-analysis/05-supporting-data-sources.md`.
- ✅ Decide what must be present for MVP vs deferred modules; mapping notes captured in the supporting data sources document.

---

## Phase 2 — Domain & State Layer

### Task 4 – Finalise TypeScript Models *(Completed)*
- Lock final interfaces in `src/types/plannedExpenses.ts` (SIP splits, adjustments, raw references). ✅
- Capture bucket metadata (display names, colors, order) in a shared config file. ✅

### Task 5 – Build Persistence & Stores *(Completed)*
- ✅ Implemented core Zustand stores (`usePlannedMonthsStore`, `usePlannerStore`, `useSettingsStore`) with localforage persistence.
- ✅ Added reusable storage helper for localforage-backed persistence.
- ✅ Seeded demo data from exported JSON and exposed selectors for derived totals/reminders.

### Task 6 – Implement Formula Utilities *(Completed)*
- ✅ Added formula helpers (`calculateRemainingCash`, `sumBucketByStatus`, `applyDueDateRule`, `convertExcelSerialToIso`) in `src/utils/formulas.ts`.
- ✅ Added derived totals helper and tests with Vitest fixtures.

---

## Phase 3 — UI Foundations

### Task 7 – Complete Layout & Navigation *(Completed)*
- ✅ Upgraded responsive layout with mobile drawer, desktop nav, and theme toggle.
- ✅ Connected the MUI theme to persisted settings with light/dark/system support.

### Task 8 – Planner Month View (Read-Only) *(Completed)*
- ✅ Render month header, status ribbon, account table, and totals footer from seed data.
- ✅ Display due dates, remaining cash, and bucket statuses accurately.
- ✅ Added month selector dropdown to switch between available months.
- ✅ Created reusable components: `MonthViewHeader`, `StatusRibbon`, `AccountTable`, `TotalsFooter`.

### Task 9 – Planner Interactions (Editable) *(Completed)*
- ✅ Enable inline editing for balances, savings, allocations, and status toggles.
- ✅ Add manual adjustment handling and real-time derived totals.
- ✅ Created EditableCell component for inline editing with currency formatting.
- ✅ Made StatusRibbon clickable to toggle pending/paid status.
- ✅ Made AccountTable editable for fixed balance, savings, and bucket amounts.
- ✅ Made MonthViewHeader editable for inflow and fixed factor.
- ✅ Added store methods to update allocations with automatic remaining cash recalculation.

---

## Phase 4 — Import/Export & Sync

### Task 10 – Import Flow *(Completed)*
- ✅ Build workbook upload UI if historical spreadsheets ever need to be imported again.
- ✅ Map imported data to internal stores; surface warnings for unknown mappings or `#REF!`.
- ✅ Provide preview/diff before commit.
- ✅ Created ImportDialog component with file upload and JSON parsing.
- ✅ Added preview with summary (months, accounts, ref errors).
- ✅ Surface warnings for #REF! errors and validation issues.
- ✅ Import button in Planner page to trigger import flow.

### Task 11 – Export & Backups *(Completed)*
- ✅ Allow exporting months to JSON/CSV for backups or offline storage.
- ✅ Document round-trip procedure (App → backup) if needed.
- ✅ Created export utilities for JSON and CSV formats.
- ✅ Built ExportDialog component with format selection.
- ✅ Added Export button in Planner page.
- ✅ JSON exports can be re-imported (round-trip support).
- ✅ CSV exports suitable for spreadsheet applications.

---

## Phase 5 — Insights & Settings

### Task 12 – Dashboard Metrics *(Completed)*
- ✅ Implement summary cards (pending allocations, savings progress, CC bills).
- ✅ Add due-soon reminders and trend charts powered by aggregated data.
- ✅ Created `calculateDashboardMetrics` utility to aggregate data across all months.
- ✅ Built `SummaryCard` component for displaying key metrics with icons.
- ✅ Built `DueSoonReminders` component showing upcoming due dates with urgency indicators.
- ✅ Added savings trend summary with totals and averages.

### Task 13 – Settings & Configuration *(Completed)*
- ✅ Manage currency, default fixed factor, bucket definitions, and theme toggles.
- ✅ Persist preferences globally and apply across components.
- ✅ Built comprehensive Settings page with currency selector, fixed factor input, and theme toggle.
- ✅ Added bucket definitions management (names, colors, default statuses).
- ✅ Added reminders toggle and save/reset functionality.
- ✅ All settings persist via Zustand store with localforage.

---

## Phase 6 — Quality & Release

### Task 14 – Testing Suite *(Completed)*
- ✅ Add Vitest coverage for stores and utilities, plus component/integration tests.
- ✅ Validate Planner interactions, import flows, and dashboard outputs.
- ✅ Added comprehensive tests for `usePlannedMonthsStore` (upsert, remove, update, totals).
- ✅ Added tests for `calculateBucketTotals` utility with edge cases.
- ✅ Added tests for `calculateDashboardMetrics` utility.
- ✅ Existing formula tests already cover calculation logic.

### Task 15 – PWA & Build Stability *(Completed)*
- ✅ Resolve Vite PWA service-worker build failures.
- ✅ Run Lighthouse, confirm offline support, and optimise performance.
- ✅ Updated PWA configuration with better workbox settings (skipWaiting, clientsClaim).
- ✅ Disabled PWA in dev mode to avoid build issues during development.
- ✅ Added build optimizations: code splitting, minification, console removal.
- ✅ Configured manual chunks for better caching (react, mui, query vendors).
- ✅ Added image caching strategy for offline support.

### Task 16 – Documentation & Handover *(Completed)*
- ✅ Update README with setup, data import, and troubleshooting guides.
- ✅ Produce user walkthroughs and developer onboarding notes.
- ✅ Finalise release notes and CI/CD deployment pipeline (staging + production).
- ✅ Created comprehensive README.md with project structure, installation, usage, and deployment.
- ✅ Created USER_GUIDE.md with step-by-step user instructions.
- ✅ Created DEVELOPER_GUIDE.md with architecture, development workflow, and common tasks.
- ✅ Documented GitHub Pages deployment process.

---

Use this document as the single source for task ordering. Update statuses and notes alongside implementation to keep progress transparent. 

