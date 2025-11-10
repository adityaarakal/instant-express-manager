# Planned Expenses React App – Delivery Plan

This plan converts the spreadsheet analysis into executable work. It is structured into epics, milestones, tasks, and acceptance criteria to ensure the entire `Planned Expenses` tab is faithfully reproduced inside the React application. Timelines are indicative; adjust based on team capacity.

---

## 0. Guiding Principles

1. **Parity first:** replicate every calculation and workflow before adding new features.
2. **Composable architecture:** modularise data ingestion, state management, and UI to support future automation (EMIs, credit cards, etc.).
3. **Test-driven migration:** every Excel formula becomes a tested utility or selector.
4. **Progressive enhancement:** start with local/offline storage; allow future syncing without rewrites.

---

## 1. Epic Breakdown

| Epic | Description | Key Deliverables | Dependencies |
| --- | --- | --- | --- |
| E1 – **Data Extraction & Seed Generation** | Convert Excel data into JSON seeds for the app. | CSV/JSON exports, parsing scripts, Excel parity tests. | Access to workbook. |
| E2 – **Domain Model & Storage Layer** | Define TypeScript interfaces, local persistence, and state store. | `types/plannedExpenses.ts`, Zustand store, localforage wrappers. | E1 outputs. |
| E3 – **UI Foundations & Navigation** | Deliver responsive layout mirroring monthly blocks. | Layout shell, routing, Planner/Dashboard screens. | Base scaffold (done). |
| E4 – **Planner Core (Month Blocks)** | Build month view with editable allocations and statuses. | Month header, account table, status toggles, derived totals. | E2, E3. |
| E5 – **Data Import & Sync** | Allow ingestion from Excel/export JSON; handle `#REF!` remediation. | Python migration script, upload UI, validation. | E1, E4. |
| E6 – **Dashboards & Insights** | Pending vs paid metrics, reminders, charts. | Dashboard cards, due soon panel, charts. | E4. |
| E7 – **QA & Deployment** | Regression tests, accessibility, PWA readiness, docs. | Vitest suites, e2e flows, deployment pipeline. | All prior epics. |

---

## 2. Milestones & Timelines (Suggested)

| Milestone | Target Duration | Scope |
| --- | --- | --- |
| M1 – Baseline Setup | 1 week | Finish scaffold (done), finalise types/interfaces, add lint/test config. |
| M2 – Month Data Model | 1.5 weeks | Complete E1 & E2: migration scripts, state structure, persistence. |
| M3 – Planner UI Alpha | 2 weeks | Implement E4 core: static month rendering with mock data, status toggles, derived totals. |
| M4 – Import & Sync Beta | 2 weeks | Build Excel importer, manual adjustments, error reporting. |
| M5 – Insights & Reminders | 1.5 weeks | Dashboard metrics, due-date notifications, charts. |
| M6 – Stabilisation & Launch | 1 week | QA, accessibility, performance, docs, PWA polish. |

---

## 3. Detailed Task Backlog

### 3.1 Epic E1 – Data Extraction & Seed Generation

- [ ] Write Python script (`scripts/export_planned_expenses.py`) using `openpyxl` to:
  - Detect monthly blocks (date in column A).
  - Collect metadata (`fixedFactor`, `dueDates`, `statusByBucket`).
  - Extract account rows into structured JSON.
- [ ] Export CSV/JSON for Jan–Dec 2023; store under `data/seeds/`.
- [ ] Add command `npm run data:export` invoking the script.
- [ ] Unit tests (Pytest or Vitest via snapshot) verifying totals equal Excel values.

### 3.2 Epic E2 – Domain Model & Storage Layer

- [ ] Finalise `PlannedMonth`, `Allocation`, `Bucket`, `Reminder`, `Settings` interfaces (see `types/plannedExpenses.ts`).
- [ ] Create Zustand stores:
  - `usePlannerStore` (active month, UI state).
  - `usePlannedMonthsStore` (CRUD for months, selectors for totals).
- [ ] Implement persistence wrappers with `localforage` (namespaced stores: `plannedMonths`, `accounts`, `settings`).
- [ ] Provide data hydration on app load + migrations for schema changes.
- [ ] Write Vitest tests for store actions and persistence adapters.

### 3.3 Epic E3 – UI Foundations & Navigation

- [ ] Complete layout components: sidebar or top-nav, breadcrumb area, settings modal.
- [ ] Build `Dashboard`, `Planner`, `Settings` route skeletons (already started).
- [ ] Integrate global theming (MUI + Tailwind) and typography tokens.
- [ ] Ensure responsive behaviour across breakpoints.

### 3.4 Epic E4 – Planner Core (Month Blocks)

- **Month Header Component**
  - [ ] Display month start date, total inflow, quick stats chips (pending vs paid).
  - [ ] Inline edit for salary/inflow, fixed factor, notes.
- **Status Bar**
  - [ ] Render pending/paid toggles for each bucket (Balance, Mutual Funds, etc.).
  - [ ] Wiring to update allocation statuses in store.
- **Account Table**
  - [ ] Render accounts in configured order; show fixed balance, savings, bucket columns.
  - [ ] Inline editing via MUI DataGrid or custom table with Formik forms.
  - [ ] Derived “Remaining” column computed live (using formula utilities).
  - [ ] Display due dates with calendar picker; support Excel serial import.
- **Totals Footer**
  - [ ] Show totals per bucket, pending vs paid breakdown.
  - [ ] Display warnings if totals diverge from projections.
- **Manual Adjustment Support**
  - [ ] Allow user to record adjustment notes/amounts; store separately.

### 3.5 Epic E5 – Data Import & Sync

- [ ] Implement CSV/Excel upload UI (drag-drop or file input).
- [ ] Parse workbook client-side (SheetJS) or server-side (Node script run locally).
- [ ] Map columns to data model; surface `#REF!` issues as actionable alerts.
- [ ] Provide diff preview before importing (existing month vs new data).
- [ ] Enable export back to CSV/JSON for backups.

### 3.6 Epic E6 – Dashboards & Insights

- [ ] Dashboard cards: totals pending, savings progress, CC bill summary.
- [ ] “Due soon” list using due date comparator.
- [ ] Trend charts (Recharts) for allocations vs targets.
- [ ] Search/filter controls (account, bucket, status).
- [ ] Reminder management UI (toggle active, set notifications).

### 3.7 Epic E7 – QA, Automation & Launch

- [ ] Unit tests for all utilities and stores.
- [ ] Component tests with React Testing Library.
- [ ] Integration tests: create month, toggle status, import spreadsheet.
- [ ] Accessibility audit (labels, keyboard navigation).
- [ ] PWA optimisation (service worker, offline support) – fix current build failure.
- [ ] Deployment pipeline (GitHub Actions + Vercel/Netlify).
- [ ] Documentation updates (README, user guides, runbooks).

---

## 4. Cross-Cutting Concerns & Technical Notes

### 4.1 Formula Utilities

- Build in `src/utils/formulas.ts`:
  - `calculateRemaining(inflow, savings, fixedBalance)`
  - `sumByBucket(allocations, status?)`
  - `convertExcelSerial(serial)`
  - `applyDueDateRule(value, dueDate)`
- Add dedicated Vitest suites referencing Excel-derived fixtures.

### 4.2 Settings & Constants

- Store default bucket definitions (name, color, default status) in `settings.json`.
- Fixed factor default (₹1,000) configurable in Settings screen.
- Account metadata (type, display order) stored centrally for consistent rendering.

### 4.3 Error Handling & Alerts

- Track unresolved `#REF!` or missing projections as warnings at import time.
- Provide inline validation for negative remaining cash or mismatched totals.
- Record audit trail for manual adjustments or overrides.

### 4.4 Performance & Offline

- Preload seed data into IndexedDB to ensure offline availability.
- Use React Query only when remote sync is added; for now, rely on Zustand + persistence.
- Memoise derived selectors to keep UI responsive.

---

## 5. Acceptance Criteria per Epic

| Epic | Acceptance Criteria |
| --- | --- |
| E1 | JSON export for at least Jan–Jun 2023 matches Excel values to ±0.01; script documented in README. |
| E2 | State store allows CRUD on months, persists to local storage, and rehydrates without data loss. |
| E3 | App shell loads with navigation + theme; routes accessible; responsive layout verified. |
| E4 | Planner view renders a month from seed data, allows status toggles and inline edits, recalculates totals instantly. |
| E5 | User can import Excel file, preview data, resolve errors, and save into local store. |
| E6 | Dashboard shows accurate metrics, due soon panel updates based on date, charts render with mock data. |
| E7 | Test suite passes, build pipeline green, PWA installable, docs up to date. |

---

## 6. Risk Log & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Broken references remain unresolved | Incorrect totals | Document each during import; add manual mapping UI. |
| Complex formulas mis-translated | Functional deviation | Build unit tests against Excel samples; peer review formula utilities. |
| Large Excel files cause import latency | Poor UX | Stream parsing, show progress indicator, allow background processing. |
| PWA build failure (current issue) | Blocked releases | Review `vite-plugin-pwa` config; optionally disable until final sprint. |
| Scope creep into other sheets | Delays | Freeze MVP scope to `Planned Expenses`; treat other sheets as future epics. |

---

## 7. Deliverables Checklist

- [ ] `docs/planned-expenses-analysis/` documentation (this folder).
- [ ] Python export script + sample JSON seeds.
- [ ] React components & stores implementing planner behaviour.
- [ ] Automated test suites covering calculations and UI interactions.
- [ ] Deployment pipeline and release notes.

---

By following this plan, the team can iteratively ship a production-ready React application that mirrors every aspect of the `Planned Expenses` Excel sheet, while maintaining room for future automation enhancements.

