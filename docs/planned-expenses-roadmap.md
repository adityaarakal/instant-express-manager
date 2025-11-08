# Planned Expenses App Roadmap

A detailed implementation plan to turn the “Planned Expenses” spreadsheet (especially the Planned Expenses tab) into a React PWA built with TypeScript, Tailwind CSS, Material UI, Formik, and local storage. This roadmap assumes we are on branch `feat/excel-automation-app`.

---

## 1. Product Scope & Goals

1. Build a responsive PWA that mirrors the monthly planning workflow from the Planned Expenses sheet.
2. Provide month-by-month cash allocation blocks with `Pending` vs `Paid` statuses, per-account breakdowns, due dates, and savings targets.
3. Persist data locally (via IndexedDB or localStorage wrappers) with an upgrade path to sync/backups.
4. Offer dashboards, form-driven edits, reminders, and integration hooks for other modules later (EMIs, credit cards, projections).

---

## 2. Technical Stack Summary

| Layer | Choice | Notes |
| --- | --- | --- |
| UI | React 18 (TypeScript) | SPA with PWA capability via Vite + workbox | 
| Styling | Tailwind CSS + Material UI | Tailwind for utility-first layout; MUI components for forms, tables, modals |
| Forms | Formik + Yup | Manage complex forms (monthly bucket editor, account allocation forms) |
| State Mgmt | React Query + Zustand | React Query for async data (future API), Zustand for local state (selected month, UI filters) |
| Storage | Local storage wrapper (e.g., `localforage` for IndexedDB) | Provide persistence for planned months, accounts, user preferences |
| Charts | Recharts or Chart.js | Graph total allocations vs. targets |
| Date Utilities | date-fns | Convert Excel serials to dates, handle calendar logic |
| Testing | Vitest + React Testing Library | Unit/integration tests |

---

## 3. Data Model (Domain)

### 3.1 Entities
- `Account` (id, name, type, defaultFixedBalance)
- `Bucket` (id, name, color, defaultStatus)
- `PlannedMonth` (id, monthStartDate, salary, notes)
- `Allocation` (id, plannedMonthId, accountId, bucketId, dueDate, status, fixedFactor, fixedBalance, savingsTarget, actualBalance, sip1, sip2, billAmount, remainingCash)
- `Reminder` (id, allocationId, dueDate, isActive)
- `Settings` (theme, currency, defaultBuckets, constant values e.g. Fixed Factor ₹1,000)

### 3.2 Storage Schema Example
```ts
interface PlannedMonthRecord {
  id: string;
  monthStart: string; // ISO date
  salary: number;
  blocks: AllocationRecord[];
}
```

---

## 4. Implementation Phases & Tasks

### Phase 0 – Project Setup
1. [ ] Configure Vite + React + TypeScript + Tailwind + MUI + Formik baseline.
2. [ ] Set up linting (ESLint + Prettier) / Husky pre-commit hooks.
3. [ ] Enable PWA support (service worker, manifest, offline page).
4. [ ] Integrate Zustand + React Query scaffolding.
5. [ ] Add local storage wrapper (`localforage`) and persistence utilities.

### Phase 1 – Core Domain & Persistence
1. [ ] Translate monthly block structure into TypeScript interfaces.
2. [ ] Implement local persistence layer:**
   - months store (CRUD)
   - accounts store (pre-populate with ICICI 3945, Axis 0370, etc.)
   - settings store (fixed factor, bucket definitions)
3. [ ] Migration utility to import existing Excel data (manual input for now, later parser).
4. [ ] Unit tests for serialization/deserialization logic (Vitest).

### Phase 2 – UI Foundations
1. [ ] Layout shell: header, nav drawer, month selector, dark/light mode.
2. [ ] Dashboard view (cards showing total pending, total paid, month progress).
3. [ ] Planned month page:
   - Month header card (salary, summary, quick actions).
   - Bucket columns with status chips.
   - Account rows (display values: fixedBalance, savings, balance, SIPs, bill).
   - Remaining cash calculations (match Excel `A = total - sum(D) - B`).
4. [ ] Tailwind utility classes for layout & spacing; MUI DataGrid for account table (custom cell renderers for status / due dates).

### Phase 3 – Forms & Editing
1. [ ] Add “Edit Month” modal (Formik + Material UI components) to change salary, fixed factor, due dates.
2. [ ] Account row inline editing (Formik row form with validation using Yup).
3. [ ] Bucket management page (create/edit buckets, assign colors/icons).
4. [ ] Provide ability to toggle status `Pending`/`Paid`, with immediate recalculation of totals.

### Phase 4 – Calculations, Charts, & Automation
1. [ ] Implement derived totals to match spreadsheet outputs:
   - Sum pending vs. paid per bucket.
   - Remaining savings vs. target.
   - CC Bill totals per month.
2. [ ] Add charts (Recharts) for: allocated vs. target, monthly trend.
3. [ ] Reminder engine: show warnings for soon-to-due allocations.
4. [ ] Date conversion utility (Excel serial ↔ ISO date) to present due dates correctly.

### Phase 5 – PWA Enhancements & UX Polish
1. [ ] Add offline support with stale data fallback.
2. [ ] Global search (filter accounts, months, buckets).
3. [ ] Keyboard shortcuts for quick toggling.
4. [ ] Export planned months to CSV / printable reports.
5. [ ] Onboarding/tutorial mode to explain bucket layout.

### Phase 6 – Quality & Deployment
1. [ ] Integration tests (planned month calculations, state persistence) via React Testing Library.
2. [ ] Accessibility audit (a11y checks, keyboard navigation).
3. [ ] Performance profiling (React Profiler, Lighthouse for PWA score).
4. [ ] Deploy to hosting (Netlify/Vercel) with CI pipeline.
5. [ ] Document feature walkthroughs in `/docs` and update README.

---

## 5. Task Breakdown (Detailed Checklist)

### Backlog Items
- [ ] Extract bucket names & colors from Excel and seed defaults.
- [ ] Identify broken references (`#REF!`) and define derived formulas (Saved, Fixed Factor, etc.).
- [ ] Implement migration script for existing Excel data (optional Python script to JSON).
- [ ] Create monthly block component library (HeaderCard, BucketColumn, AccountRow, StatusChip).
- [ ] Build summary metrics: total allocated, total pending, remaining cash.
- [ ] Build reminders UI (timeline & card view).
- [ ] Add settings page for currency, buffers, and localization.
- [ ] Include theming (MUI theme + Tailwind custom colors).
- [ ] Provide import/export functionality.
- [ ] Add analytics (how much goes to Mutual Funds vs. CC Bill per month).

---

## 6. Libraries & Packages Checklist
- `react`, `react-dom`, `react-router-dom`
- `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`
- `@emotion/react`, `@emotion/styled`
- `tailwindcss`, `postcss`, `autoprefixer`
- `formik`, `yup`
- `zustand`
- `@tanstack/react-query`
- `localforage`
- `date-fns`
- `recharts`
- `vite`, `vite-plugin-pwa`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`

---

## 7. Risk & Mitigation
- **Data loss** → Implement backups (JSON export) + instructions for manual save.
- **Complex forms** → Use Formik + Yup to ensure reliable validation and error handling.
- **UI complexity** → Modularize monthly block components; reuse patterns.
- **Consistency with Excel** → Write parity tests that compare output of formulas with sample data loaded from sheet.
- **Performance** → Cache expensive calculations with memoization, keep data normalized.

---

## 8. Deliverables
- PWA with monthly planning view replicating spreadsheet logic.
- Data persistence and editing UI for accounts/buckets/due dates.
- Documentation (technical & user) explaining workflows and how to extend.
- Regression tests to ensure calculated totals match spreadsheet examples.

---

## 9. Next Immediate Tasks
1. Bootstrap project (Phase 0 tasks).
2. Define TypeScript interfaces for months, accounts, buckets.
3. Seed example data from January–April 2023 to validate UI rendering.
4. Implement static monthly block with mock data to lock in design.
5. Hook up local storage and make block reactive to status toggles.

This roadmap provides a clear path from spreadsheet analysis to a functioning React PWA, while leaving room for future integration with the rest of the automation effort (EMI sheet, credit cards, projections, etc.).
