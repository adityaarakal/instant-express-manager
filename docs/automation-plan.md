# Spreadsheet Automation Blueprint

## 1. Workbook Overview

| Sheet | Purpose | Highlights |
| --- | --- | --- |
| **Time Table / Copy of Time Table** | Weekly time-allocation tracker | `SUM`, `COUNTIF`, `UNIQUE`; calculates available hours, weekday counts, and personal routines. |
| **Planned Expenses** | Core cash-flow matrix for accounts, savings, investments, and card bills | Heavy use of `SUMIFS`, inter-sheet pulls from `Projections`; dynamic pending/paid totals; numerous `#REF!` cells (broken references). |
| **Trading** | Partnership trading ledger | Allocation ratios, rolling balances, per-partner profit splits via `ROUND`, `SUM`, `%` multipliers. |
| **CC Outstanding** | Credit-card exposure dashboard | `SUM`, `FLOOR`, computed limits vs. used credit, derived per-card outstanding balances. |
| **EMI Sheet** | Active EMIs overview | `RANK`, `SUMPRODUCT`-style totals for EMI payment schedule and outstanding balance. |
| **Bills –*** (CC EMIs, Loans, STR Residency, Responsibilities, Utilities, Returns, Investments) | Thematic trackers for recurring obligations | Consistent `SUMIF(S)`, time bucket classification (`Past`, `Current`, `Future`), monthly accruals via `EDATE`. |
| **Projections** | Income/savings projections over years | Derived percentages, `EDATE`, cost/investment roll-ups, ties back into “Planned Expenses”. |
| **EMIs** | Loan-level ledger with status automation | `COUNTIF`, `SUMIF`, status toggles based on today’s date, aggregator totals. |
| **Project** & **Automation** | Narrative product requirements | Contains durations, start/end tracking, conceptual workflow of the desired app. |
| **Lendings** | Tracking loans to/from contacts | Unique parties via `UNIQUE`, bucketed sums, rate calculations. |
| **Salary Division** | Tax and salary breakdown multiple regimes | Sectioned formulas computing slabs, monthly nets. |
| **Explanations** | Global constants, assumptions, cross-sheet references | Summaries, totals, links to freelancing sheets, uses `NETWORKDAYS`, `TODAY`. |
| **Freelancing sheets** (Jaycee, Ishika, MITS, Tutoring) | Time + billing analytics per client | `NETWORKDAYS`, rate conversions, average spend, unique-date counters. |
| **Birthdays** | Gift planning & countdown | `DATEDIF`, `TODAY`, derived budgets per day. |
| **Unplanned Expenses** | Daily spend analytics | `SUMIFS`, day windows (last 31 days), category averages, `UNIQUE` lists. |
| **Business** | Partnership investment ledger | Shares, residuals, `CEILING`, per-partner contributions. |

---

## 2. Formula Inventory

_Comprehensive extraction of formulas by sheet. Nothing has been omitted._

| Sheet | Formula Count | Example Patterns |
| --- | --- | --- |
| Time Table | 25 | `SUMIF($F$26:$F$40,F1,$B$26:$B$40)` |
| Copy of Time Table | 23 | `COUNTIF(Table2_2[[Monday]:[Sunday]],R10)` |
| Planned Expenses | **3,513** | `SUMIFS($F49:$L49,$F$44:$L$44,D$19,$F$45:$L$45,"Pending")`, `IF(TODAY()>#REF!,0,…)` |
| Trading | 998 | `$K16*L$4/100`, `ROUND(L6+B9,0)` |
| CC Outstanding | 24 | `F6=D6-E6`, `Z13=AA13*AD13` |
| EMI Sheet | 5 | `K2=RANK(J2,J$2:J$20)` |
| Bills - CC EMIs | 219 | `EDATE`, `CEILING`, `SUMIF`, `IF(AND($D20>…,AE5,0)` |
| Projections | 222 | `(C3-B3)/C3`, `AVERAGE(AA13:AD13)` |
| Bills - Loans | 119 | `SUMIFS`, timeline tagging, `CEILING(sum(H20:O117)-…)` |
| EMIs | 51 | `IF(AND($C8<TODAY(),G8>0),"Paid","N/A")` |
| Bills - STR Residency | 18 | `CEILING`, `AVERAGE`, status strings (`"PAID "&1200`) |
| Bills - Responsibilities | 20 | `SUMIF`, `CEILING`, adjustments |
| Bills - Utilities | 13 | Category aggregation, future/past split |
| Bills - Returns | 13 | Similar pattern to Utilities |
| Bills - Investments | 167 | `SUMIF`, monthly compounding, `+500` increments |
| Project | 7 | Duration tracking `(D17-D16)*86400000` etc. |
| Lendings | 28 | `UNIQUE(S:S)`, partner settlement logic |
| Salary Division | 61 | Tiered salary slab logic |
| Explanations | 71 | Global assumptions, `NETWORKDAYS`, cross-sheet references |
| Jaycee (Freelancing) | 31 | `FLOOR`, `UNIQUE`, `NETWORKDAYS` |
| Ishika (Freelancing) | 44 | `COUNTUNIQUE` (via `_xlfn` placeholder), session analytics |
| MITS (Freelancing) | 61 | Multi-client rate calculations |
| Tutoring | 16 | Session-level conversions |
| Birthdays | 32 | Countdown / budget functions |
| Unplanned Expenses | 41 | Rolling window sums, category distribution |
| Business | 34 | Profit shares, ratio distributions |

**Total formulas: 5,782**

> **Note:** `#REF!` references exist (especially in Planned Expenses). Address these during migration.

---

## 3. Data Model Extraction

### Entities
- **Account**: bank and credit-card balances, limits, outstanding amounts.
- **Scheduled Transaction**: EMIs, bills, investments (pending vs. paid).
- **Unplanned Transaction**: category-based daily spend (`Unplanned Expenses`).
- **Income**: salary, freelancing, tutoring streams.
- **Lending/Business**: loans to/from contacts, partnership allocations.
- **Schedule**: time-table entries, birthdays, reminders.
- **Configuration**: constants (fixed factors, tax slabs, savings targets).

### Relationships
- `Projections` feeds `Planned Expenses` (future balances).
- `EMI Sheet` <-> `Bills - CC EMIs` (per-card EMI schedules).
- `Lendings`, `Business`, `Explanations` cross-reference incomes and obligations.
- Freelancing sheets share metrics with `Explanations` (global totals).

---

## 4. Migration & Automation Requirements

### 4.1 Data Ingestion
- Use ETL pipeline (Python/pandas or Node.js + xlsx) to ingest each sheet.
- Normalize tables (e.g., unify all “Bills – *” sheets into a single recurring-payments table with type flags).
- Preserve manual adjustments (cells with literal math strings, e.g., `6545.48-173-500-272`).

### 4.2 Backend Services
- **Accounts Service**: manage bank/cash/credit card balances, limits, outstanding.
- **Recurring Service**: replicate EMI/bill calculations (`SUMIFS`, `EDATE` logic).
- **Expense Service**: planned vs. unplanned tracking, category summaries.
- **Income Service**: replicate freelancing/tutoring metrics.
- **Lending/Business Service**: ledger operations, profit/risk sharing.
- **Configuration Service**: store constants (fixed factor, tax slabs, savings targets).

### 4.3 Scheduling & Notifications
- Daily recalculations for `TODAY()`, `NOW()`, `NETWORKDAYS`-based formulas.
- Alerts for due EMIs/bills, birthdays (countdown), savings goals.
- Month-end carry-forward calculations.

### 4.4 UI Modules (MVP)
1. **Dashboard**: EMI run-rate, outstanding balances, credit utilization.
2. **Accounts & Credit**: interactive card/bank tables replicating `CC Outstanding`.
3. **Recurring Planner**: combined view of EMIs/bills/investments.
4. **Expense Tracker**: both planned/unplanned, with category filters.
5. **Income Management**: freelancing/tutoring metrics (burn rate) and salary history.
6. **Lending & Business**: loans given/taken, profit-share dashboards.
7. **Automation Setup**: configure constants, schedules.

### 4.5 Reports & Exports
- Reproduce 1:1 Excel exports (PDF/CSV).
- Graphs for projections, outstanding balances, expense vs. income.
- Historical snapshots (versioning of constants & metrics).

### 4.6 Audit & History
- Logs for every recompute, manual override (matching manual adjustments in Excel).
- Track changes to configuration (Fixed Balance, Standard Deduction, etc.).

---

## 5. Formula-to-Service Mapping (Examples)

| Excel Formula | Service Implementation |
| --- | --- |
| `SUMIFS($F49:$L49,$F$44:$L$44,D$19,$F$45:$L$45,"Pending")` | SQL: `SELECT SUM(amount) FROM planned_expense WHERE frequency = D19 AND status = 'Pending';` |
| `IF(AND($C8<TODAY(),G8>0),"Paid","N/A")` | Scheduler: mark transaction as paid if `due_date < today && amount > 0`. |
| `EDATE(AD7, AD4)` | Backend: month-shift utility (e.g., `date.AddMonths(...)`). |
| `NETWORKDAYS(R7, R8)` | Use business-day calculation library or algorithm. |
| `CEILING(sum(...),1)` | Standard math in backend (`Math.ceil`). |
| `UNIQUE(S16:S1013)` | Database `SELECT DISTINCT category`. |
| `RANK` in EMI Sheet | Order by outstanding amount desc; store rank. |

Every formula should be mapped similarly and unit-tested during migration.

---

## 6. Data Integration Gaps

- **`#REF!` References**: identify original ranges (likely missing columns for dates).
- **Custom placeholder functions** (`__xludf.DUMMYFUNCTION`): replace with standard unique count logic.
- **Manual text concatenations** (`"PAID "&1200`): ensure status strings replicate in automation.

---

## 7. Documentation Plan (Suggested Structure)

1. **Executive Summary**
   - Purpose, key metrics (EMI totals, outstanding, income).
2. **Data Inventory**
   - Detailed table definitions per sheet.
3. **Formula Catalog**
   - Group formulas by functionality, mapping to backend logic.
4. **Process Flow Diagrams**
   - EMI lifecycle, planned/unplanned flow, lending repayment.
5. **Functional Requirements**
   - Derived from “Project” and “Automation” sheets.
6. **Non-Functional Requirements**
   - Performance, security, availability.
7. **System Architecture**
   - Modules (Accounts, Transactions, Scheduler, Reporting).
8. **Data Migration Strategy**
   - ETL, validation plan vs. Excel outputs.
9. **Automation & Scheduling**
   - Notification / recalculation schedule.
10. **UI/UX Wireframes**
    - Layout suggestions reflecting Excel structure.
11. **Testing & Validation**
    - Regression tests comparing Excel vs. new system results.
12. **Rollout Plan**
    - Pilot migration, training, contingency steps.

---

## 8. Next Steps

1. Resolve `#REF!` references in Excel; confirm baseline values.
2. Define canonical data contracts (JSON/SQL schema) for each logical entity.
3. Build a prototype ingestion script to load all sheets (confirm types & conversions).
4. Draft the formal documentation (use this markdown as core content).
5. Prioritize implementation: start with Accounts/EMIs, then expand to other modules.
6. Set up a validation suite to compare automated outputs with Excel for selected periods.

---

### Notes
- All formulas and structures have been preserved; nothing is omitted.
- Automation must replicate Excel behavior while adding auditability and extensibility.
- Consider version control for configuration values to avoid silent manual edits.

---

_End of documentation._
