# Supporting Data Sources Inventory

This document enumerates every workbook sheet that fed the legacy `Planned Expenses` spreadsheet. It is kept as reference material while we finish reproducing the workflow in the React application. The new app is the source of truth going forward; Excel import/export is optional.

---

## Legend

- **Status**
  - ✅ = Required for MVP parity.
  - 🕒 = Optional for MVP; plan for later.
- **Acquisition**
  - `manual` – capture via static seed or user input.
  - `script` – automate extraction from Excel.
  - `future` – needs dedicated API/service before automation.

---

## 1. Core Financial Inputs

| Sheet | Status | Fields / Notes | Acquisition | Consumer in App |
| --- | --- | --- | --- | --- |
| `Planned Expenses` | ✅ | Month blocks already exported via `scripts/export_planned_expenses.py`. | script | Planner view, dashboards. |
| `Projections` | ✅ | `C14`, `D14`, and related forecast cells referenced by inflow rows (`=#REF!` formulas). Needed to backfill month inflows and determine savings targets. | script (future enhancement) | Month header (salary/inflow), savings progress indicators. |
| `Salary Division` | ✅ | Base salary, bonus splits; used to compute “Pending” totals in header rows. | manual snapshot or script | Month summary cards, analytics. |

---

## 2. Credit & Liability Data

| Sheet | Status | Fields / Notes | Acquisition | Consumer in App |
| --- | --- | --- | --- | --- |
| `CC Outstanding` | ✅ | Card identifiers (`ICICI 7018`, `Axis 2009`, etc.), statement/outstanding balances, due dates. | manual seed (MVP) → script | Credit card allocations in Planner, future CC dashboard. |
| `Bills - CC EMIs` | 🕒 | Installment schedules tied to credit cards; monthly obligations beyond current month. | future | Long-term cashflow projections. |
| `EMI Sheet` / `EMIs` | 🕒 | Loan accounts, EMI amount, due dates. | future | EMI module, reminders. |

---

## 3. Recurring Bills & Responsibilities

| Sheet | Status | Fields / Notes | Acquisition | Consumer in App |
| --- | --- | --- | --- | --- |
| `Bills - Utilities`, `Bills - Responsibilities`, `Bills - STR Residency`, `Bills - Investments`, `Bills - Returns` | 🕒 | Recurring/non-recurring expenses outside core planner buckets. Capture name, amount, frequency, due date. | future (manual entry suffices for MVP) | Later dashboards & automation. |
| `Bills - Loans` | 🕒 | Additional loan obligations separate from EMIs. | future | Loan analytics. |

---

## 4. Investments & Trading

| Sheet | Status | Fields / Notes | Acquisition | Consumer in App |
| --- | --- | --- | --- | --- |
| `Trading` | 🕒 | SIP purchases, equity transactions feeding “Mutual Funds” buckets. Capture ISIN/name, amount, schedule. | future | Investment dashboards. |
| `Bills - Investments` | 🕒 | Lump-sum investments and returns, feed into savings/investment analytics. | future | Savings planner extensions. |

---

## 5. Income Streams Beyond Salary

| Sheet | Status | Fields / Notes | Acquisition | Consumer in App |
| --- | --- | --- | --- | --- |
| `Project`, `Business`, `Lendings` | 🕒 | Additional cash inflows/outflows influencing remaining cash. | future | Cashflow forecasting, scenario planning. |
| Freelancing sheets (`Jaycee`, `Ishika`, `MITS`, `Tutoring`) | 🕒 | Source-specific income schedules. | future | Income analytics module. |
| `Unplanned Expenses`, `Birthdays` | 🕒 | Ad-hoc spending categories useful for forecasting but not critical to MVP. | future | Alerts/reminders. |

---

## 6. Automation Planning

| Sheet | Status | Purpose | Action |
| --- | --- | --- | --- |
| `Automation` | 🕒 | Notes about intended automation flows. | Parse during backlog grooming; no data ingestion needed. |

---

## 7. Immediate Follow-ups

1. **Projections extraction** – extend the export script to capture referenced projection cells so month inflows can be backfilled (unblocks remaining-cash parity).
2. **Credit card metadata** – compile static JSON for card identifiers (limit, statement date, due date) to ensure Planner UI can surface contextual information.
3. **Supporting sheet inventory table in README** – add high-level summary for contributors referencing this checklist.

Once the above are complete, Task 3 can be marked done and we can move toward implementing the data acquisition flow for the MVP. 

