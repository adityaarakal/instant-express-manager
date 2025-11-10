# Implementation Checklists & Work Tracking

This document provides detailed checklists to track execution across data migration, development, QA, and release. Use it as a living tracker while delivering the Planned Expenses React application.

---

## 1. Data Migration Checklist *(One-time workbook reference)*

These items were used to bootstrap the app from the legacy spreadsheet. They can stay parked unless we explicitly revisit historical imports.

- [x] Install Python dependencies (`openpyxl`) via project-local environment (`.pydeps`).
- [x] Implement `scripts/export_planned_expenses.py`.
- [x] Export Jan–Jun 2023 monthly blocks to `data/seeds/planned-expenses.json`.
- [ ] Validate totals against Excel:
  - [ ] Remaining cash per account _(matches for 77/95 months; 18 months still require inflow/remaining backfill due to `#REF!` formulas)_.
  - [x] Bucket totals (Balance, Mutual Funds, CC Bill, Maintenance).
  - [x] Pending vs paid sums _(parity confirmed when blank status cells default to “Pending”)._
- [x] Catalogue all `#REF!` occurrences and map to source data.
- [ ] Document manual adjustments and rationale (optional/backlog).
- [x] Store conversion utility for Excel serial → ISO date.
- [ ] Create README instructions for rerunning export (optional/backlog).
- [ ] Backfill inflow & remaining cash values for `#REF!` months (18 instances) and re-run remaining cash parity *(optional, parked for post-MVP)*.
  - Affected months: 2023-04-01 → 2024-09-01 (inclusive, 18 consecutive months).

---

## 2. React Development Checklist

### 2.1 Core Infrastructure

- [ ] Finalise TypeScript interfaces (`types/plannedExpenses.ts`).
- [ ] Build Zustand stores (`usePlannerStore`, `usePlannedMonthsStore`).
- [ ] Integrate persistence layer (localforage).
- [ ] Register selectors for derived totals and due-date filters.

### 2.2 Planner View

- [ ] Month header component (date, inflow, fixed factor).
- [ ] Status bar with toggle chips (Pending/Paid).
- [ ] Account table with inline editing (Formik + MUI DataGrid).
- [ ] Remaining cash column (computed).
- [ ] Due date editor (date picker).
- [ ] Totals footer with warnings (projections mismatch, negative remaining).
- [ ] Manual adjustment modal.

### 2.3 Dashboard & Settings

- [ ] Dashboard cards (pending allocations, savings progress, reminders).
- [ ] Charts for allocations vs targets (Recharts).
- [ ] Reminder list (due soon).
- [ ] Settings page: currency, fixed factor, default buckets, theme toggle.

### 2.4 Import/Export

- [ ] Upload component (SheetJS parsing).
- [ ] Preview & diff view.
- [ ] Error reporting (missing buckets, unknown accounts, `#REF!`).
- [ ] Export to JSON/CSV.

---

## 3. Testing & Quality Assurance Checklist

- [ ] Unit tests for formula utilities (`calculateRemaining`, `sumByBucket`, etc.).
- [ ] Store tests verifying actions and persistence.
- [ ] Component tests for Planner (status toggle, inline edits).
- [ ] Integration tests covering import flow → planner updates → dashboard totals.
- [ ] Visual regression snapshots for month layout.
- [ ] Accessibility audit (keyboard navigation, ARIA labels).
- [ ] Performance checks (React Profiler, load testing).
- [ ] PWA audit (Lighthouse score, offline mode).

---

## 4. Deployment Checklist

- [ ] Resolve current `vite-plugin-pwa` build error (service worker write failure).
- [ ] Configure environment-specific settings (API endpoints reserved).
- [ ] Setup CI pipeline (lint, test, build).
- [ ] Deploy to staging (Vercel/Netlify).
- [ ] Smoke test staging environment (import sample data, check totals).
- [ ] Prepare production release notes and rollback plan.
- [ ] Enable monitoring/logging (Sentry or equivalent) for runtime errors.

---

## 5. Documentation & Handover

- [ ] Update main `README` with setup instructions, data import guide, and troubleshooting.
- [ ] Document formula parity in `docs/planned-expenses-analysis/02-formulas-and-calculations.md` (maintained).
- [ ] Record migration process and scripts in `docs/automation-plan.md` (or new section).
- [ ] Create user training material (screenshots, flow walkthrough).
- [ ] Capture post-launch support plan (contacts, escalation).

---

Maintaining these checklists ensures no aspect of the Excel-to-React migration is overlooked. Keep them updated as tasks progress and expand them if new requirements emerge.

