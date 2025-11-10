# Planned Expenses Workbook – System Overview

This document captures a full inventory of the workbook `docs/Copy of Expense Shares.xlsx`, with emphasis on the `Planned Expenses` tab that powers the automation effort. It summarises sheet-level dependencies, data domains, and how information flows across the workbook so we can replicate all capabilities inside the React application.

---

## 1. Workbook Contents & Roles

| Sheet | Role in the workflow | Notes / Dependencies |
| --- | --- | --- |
| `Planned Expenses` | **Primary operations dashboard.** Tracks month-by-month cash allocations, Pending vs Paid statuses, due dates and buffers. | Pulls projections, salary, EMI, CC bills, reminders. **Target tab for the React app.** |
| `Trading` | Investment tracking sheet (equity/SIP purchase ledger). | Aggregated totals feed `Mutual Funds` columns in `Planned Expenses`. |
| `CC Outstanding` | Outstanding balances per credit card. | Aligns with `CC Bill` columns when calculating pending card payments. |
| `EMI Sheet`, `EMIs` | Loan EMI schedules. | Link to monthly obligations that appear in `Expense` buckets. |
| `Bills - CC EMIs`, `Bills - Loans`, `Bills - Utilities`, `Bills - Responsibilities`, `Bills - STR Residency`, `Bills - Investments`, `Bills - Returns` | Detailed recurring/non-recurring bill trackers segmented by type. | Their totals are consolidated in the monthly block totals inside `Planned Expenses`. |
| `Salary Division` | Salary allotment rules (base salary, bonus splits). | Provides inputs to the `Pending` total line in the `Planned Expenses` block. |
| `Projections` | Forward-looking targets for savings, investments, credit-card payments. | Referenced explicitly (e.g., `=Projections!C14`) for `Pending` totals and due-date-based amounts. |
| `Automation` | Early notes on workbook automation. | Helps cross-check assumptions (no direct formulas). |
| `Project`, `Lendings`, `Unplanned Expenses`, `Birthdays`, `Business`, freelancing sheets (`Jaycee`, `Ishika`, `MITS`, `Tutoring`) | Ancillary trackers for specific income streams and obligations. | Feed data into overall monthly planning but currently linked via manual copy or `#REF!` spots. |

> **Key takeaway:** Even though the React app will initially target the `Planned Expenses` sheet, we must accommodate data inputs (or placeholders) for EMIs, credit cards, bills, trading, and salary to keep totals accurate.

---

## 2. `Planned Expenses` Sheet Snapshot

- **Dimensions:** 1,114 rows × 13 columns (A–M) currently populated.
- **Month coverage:** January 2023 onwards; each month represented by a 10–12 row block.
- **Core concepts:**
  - _Monthly block header_ with date, bucket names, status row, fixed factor row, and due dates.
  - _Allocation rows_ per account (ICICI, Axis, Paytm, etc.), each splitting values across buckets.
  - _Status-driven formulas_ using `SUMIFS` to segment totals by bucket (`Balance`, `Mutual Funds`, `CC Bill`, `Maintenance`, etc.) and status (`Pending`/`Paid`).
  - _Broken references (`#REF!`)_ indicating missing links to prior months or other sheets—must be resolved in the app by explicit data modelling.

---

## 3. External References & Data Dependencies

- **Cross-sheet formulas** observed:
  - `=Projections!C14`, `=Projections!D14` for “Pending” totals in April & May blocks.
  - `ICICI 7018`, `ICICI 3002`, `Miyapur` columns reference card/bill accounts partially defined under other sheets (e.g., `CC Outstanding`, `Bills - STR Residency`).
  - `=if(today()>#REF!, 0, ...)` patterns show date-based auto-zeroing driven by due dates.
- **Status-based aggregations:**
  - `sumifs($F49:$L49,$F$44:$L$44,D$19,$F$45:$L$45,"Pending")` style formulas appear on every row to compute the amount still pending for the same bucket.
  - `sum(B49:B57)` style formulas compile fixed balances per block.
- **Manual adjustments** exist (`=6545.48-173-500-272`), signalling ad-hoc corrections on top of referenced totals. The React implementation must allow free-form adjustments or metadata to explain adjustments.

---

## 4. Accounts, Buckets, Statuses

| Entity | Examples | Notes |
| --- | --- | --- |
| Accounts | `ICICI 3945`, `Axis 0370`, `Axis 7503`, `HSBC 9006`, `Paytm 4366`, `SBI 5825`, `Paytm Wallet`, `PhonePe Wallet`, `Splitwise` | Each account row holds columns for fixed balance, savings transfers, bucket allocations, SIPs, and bills. |
| Buckets | `Balance`, `Mutual Funds`, `CC Bill`, `Maintenance`, `Savings`, `Expense` | Controlled via column headers inside each block; determine what totals appear in dashboards. |
| Status flags | `Pending`, `Paid` | Row at `N+1`. The entire block’s calculations depend on toggling these statuses. |
| Constants | `Fixed Factor` (₹1,000 seen repeatedly), due dates, initial buffer/inflow row values | Must be stored centrally in app settings & month metadata. |

---

## 5. Core Business Rules to Preserve

1. **Remaining Cash = Total Inflow – Savings – Fixed Balance.** Each row’s “Remaining” cell uses variations of `= <inflow> - SUM(D row) - B row`.
2. **Pending Totals Filter by Status:** “Pending” total cells use `SUMIFS(..., status="Pending")`; when status flips to `Paid`, the pending total becomes zero.
3. **Due-Date-Driven Zeroing:** `IF(TODAY()> dueDate, 0, ...)` ensures obligations disappear after due dates. The app must replicate this logic either declaratively (rules) or via derived calculations.
4. **Cross-sheet Totals:** Values from `Projections` and other sheets feed into the monthly inflow row—lack of these inputs would break totals.
5. **Broken references as warnings:** Anywhere `#REF!` appears we must trace the original source to avoid data-loss during migration.

---

## 6. Migration Watchlist

- Catalogue every `#REF!` and determine source (likely prior month totals or a renamed sheet).
- Enumerate all credit-card identifiers and map them to their outstanding/statement information.
- Extract due dates and convert Excel serials (`44986`, `44927`, etc.) to ISO dates for our data API.
- Treat manual overrides (e.g., arithmetic adjustments) as special ledger entries requiring audit metadata.

---

## 7. Next Documents

The remainder of the documentation dives deep into each part of the conversion plan:

1. `01-planned-expenses-structure.md` – Block-by-block breakdown of the sheet layout, columns, and data semantics.
2. `02-formulas-and-calculations.md` – Exhaustive list of formulas, derived fields, and dependencies to reproduce in code.
3. `03-react-app-delivery-plan.md` – Executable roadmap for delivering the React application, including Epics, Milestones, and task-level details.
4. `04-implementation-checklists.md` – Trackable checklists for data migration, feature rollout, QA, and production readiness.

Each document is intentionally scoped to prevent latency/timeouts while still delivering maximal detail. Combined, they provide a full blueprint for bringing the spreadsheet to life in the app without missing any functionality.

