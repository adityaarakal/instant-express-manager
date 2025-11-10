# Planned Expenses Sheet – Structural Blueprint

This document maps every part of the `Planned Expenses` worksheet so that the React application can mirror its layout, behaviour, and data relationships exactly. It is organised top-down: month block header, allocation rows, status mechanics, and supporting metadata.

---

## 1. Monthly Block Anatomy

Each month spans 10–12 rows. The pattern repeats for every month and is the most critical structure to replicate in the UI. Rows below are described relative to the block start row `N`.

| Row Offset | Excel Example | Purpose | Key Values / Columns |
| --- | --- | --- | --- |
| `N` | `A:N = 1-Jan-2023, "", "", "", "", Balance, Investment, Investment, Expense, ...` | **Month Header**. Column A holds the month start date; columns F–I display bucket headers. | Date column uses actual Excel `datetime` objects. Bucket labels drive status-based `SUMIFS`. |
| `N+1` | `D = Pending`, `G:H:I = Paid` | **Status Banner**. Defines which columns are considered pending vs paid. | Only literal text; however, these labels are used heavily in formulas. |
| `N+2` | `A = "Fixed Factor"`, `B = 1000`, `F = "Due Date"`, `G/H/I = Excel serial dates` | **Buffer + Due Dates**. Stores the ₹1,000 fixed factor plus due dates for each bucket. | Due dates need conversion to ISO strings in the app. |
| `N+3` | `A = inflow total (e.g., 17,263.21)`, `H = "Axis 2009"` | **Primary inflow row**. Shows total salary/inflow alongside top-level obligations such as a credit card or rent. | May include references to `Projections` or other sheets. |
| `N+4` | `A = "Remaining"`, `D = "Savings"`, `F = "Balance"`, `G = "Mutual Funds"`, `I = "CC Bill"` | **Bucket legend**. Names used for conditional sums & UI labels. | Must be stored verbatim to ensure `SUMIFS` parity. |
| `N+5..` | `Account rows (ICICI 3945, Axis 0370, etc.)` | **Per-account allocations**. Each row corresponds to a bank/card account with columns for fixed balance, savings transfers, SIPs, and bill allocations. | Column definitions below. |
| Final row | break before next date | **Separator**. The next month begins immediately after the account list. | Keep metadata to know where a block ends. |

---

## 2. Column Definitions (per account row)

| Column (Excel) | Header meaning | React data field | Notes |
| --- | --- | --- | --- |
| `A` | `Remaining` | `remainingCash` | Formula-driven: `=totalInflow - SUM(D row) - B row`. Represents unallocated cash for the account after meeting obligations. |
| `B` | `Fixed Balance` | `fixedBalance` | Target minimum balance to preserve in the account. Often pulled from previous month values (`=B34 + B46`, etc.). |
| `C` | _(usually blank)_ | `notes` | Optional comment column; keep for parity. |
| `D` | `Savings` | `savingsTransfer` | Amount to move into savings/investments. Feeds `SUMIFS` when the bucket is “Savings”. |
| `E` | `Due Date` / dynamic values | `dueDateOverride` | Sometimes stores Excel serial dates or `TODAY()` checks for auto-zeroing. |
| `F` | `Balance` bucket column | `bucketAllocations["Balance"]` | Actual values to remain in the account. |
| `G` | `Mutual Funds` or `CC Bill` | `bucketAllocations[bucketName]` | Depending on the month group, may map to SIP1. |
| `H` | Additional bucket (Mutual Funds / CC Bill) | `bucketAllocations[bucketName]` | Typically corresponds to SIP2 or credit card dues. |
| `I` | `Expense` / `Maintenance` | `bucketAllocations[bucketName]` | Usually credit-card or maintenance payments. |
| `J–M` | Currently blank or reserved | `extensions` | Reserve for future features (EMIs, bonuses). |

### Notable Patterns

- **Mutual Funds split into two columns** to support different SIPs (e.g., `sip1` and `sip2` fields).
- **Credit card rows** (e.g., `Axis 2009`, `ICICI 7018`) use columns `G–I` to track current month’s bill and maintenance charges.
- **`Splitwise` / `Wallet` rows** exist with zero balances—should still be modelled to allow future use.

---

## 3. Status Mechanics

The status row (row `N+1`) controls whether each bucket shows as “Pending” or “Paid”.

- **Excel usage:** Formulas reference statuses via `SUMIFS`, e.g.:
  - `=SUMIFS($F49:$L49, $F$44:$L$44, D$19, $F$45:$L$45, "Pending")`
- **Implications for the app:**
  - Each allocation needs a `status` field with values `pending` or `paid`.
  - Bucket totals must be computed twice: once for pending, once for paid.
  - UI should surface status toggles directly on each allocation row, just like the Excel manual process.

---

## 4. Inflow & Carry-over Rows

The first numeric row beneath `Fixed Factor` often contains:

| Column | Example Formula | Description |
| --- | --- | --- |
| `A` | raw inflow value (`17263.21`) | Total cash on hand entering the month (salary + leftover). |
| `B` | blank or `=SUM(B49:B57)` | Month-level fixed balance total. |
| `D` | blank or `=SUM(D49:D57)` | Sum of savings transfers for the month. |
| `E` | `=IF(TODAY()>dueDate, 0, E46 * (dueDate - prevDueDate + 1))` | Projects residual amounts after due date passes. |
| `F` | `=SUM(F49:F57)` | Total Balance bucket. |
| `G/I` | labelled credit cards | Immediately display outstanding card names for quick reference. |

> The React data model should include a `monthSummary` object capturing inflow, fixed factor, due dates, and status totals to power dashboard cards.

---

## 5. Due Dates & Calendar Integration

- Due dates appear both:
  - in row `N+2` under the “Due Date” header (`G`, `H`, `I` cells) and
  - inside account rows (column `E`) using formulas like `=TODAY()` or direct serial values.
- Excel serial conversions observed:
  - `44986 → 2023-03-22`
  - `44927 → 2023-01-22`
  - `44580 → 2022-01-19`
- **App requirement:** Implement a utility to convert serials ↔ ISO dates and store them as real `Date` objects or ISO strings. Provide friendly formatting in the UI and use them to trigger reminders in the planner.

---

## 6. Handling Broken References (`#REF!`)

Several formulas contain `#REF!` placeholders due to structural changes in the workbook:

- Examples:
  - `= #REF! - SUM(D47) - B47`
  - `= IF(TODAY()>#REF!, 0, E46*(#REF! - #REF! + 1))`
- **Mitigation plan:**
  1. During migration, identify for each `#REF!` which source should supply the value (e.g., previous month’s remaining cash, projections row).
  2. Add dedicated fields in the new data model instead of referencing positional cells.
  3. Preserve the logic by converting formulas into explicit calculations or rules (e.g., `remainingCash = baseRemaining - savingsTotal - fixedBalance`).

---

## 7. Account Catalogue (Jan–May 2023 sample)

| Account Label | Description | Observed Columns Used |
| --- | --- | --- |
| `ICICI 3945` | Primary salary account | `Balance`, `Savings`, `CC Bill` |
| `Axis 0370` | Secondary salary/spends account | `Balance`, `Mutual Funds`, `CC Bill` |
| `Axis 7503` | Supplementary account | `Balance` only |
| `HSBC 9006` | Investment linked account | `Balance` |
| `Paytm 4366` | Wallet account | `Balance`, `Maintenance` |
| `SBI 5825` | Buffer account | `Balance` |
| `Paytm Wallet` | Digital wallet | `Balance` |
| `PhonePe Wallet` | Digital wallet | `Balance` |
| `Splitwise` | Shared expense tracker | `Balance` (0) |
| `ICICI 7018`, `ICICI 3002` | Credit cards | `CC Bill`, `Maintenance` |
| `Miyapur` | Rent/maintenance label | `Expense` column |

When building the React app, seed a reference dataset of accounts with metadata (`type`, `displayOrder`, `defaultFixedBalance`, `isCreditCard`) to control rendering order and behaviour.

---

## 8. Block Sequencing & Parsing Strategy

To parse/migrate the Excel data:

1. **Detect block start:** any row where Column A is a date value.
2. **Collect metadata:** from rows `N…N+4` (status, fixed factor, due dates, bucket names).
3. **Accumulate accounts:** iterate until the next block start (column A = date or blank row).
4. **Store as JSON:** 
   ```json
   {
     "monthStart": "2023-03-01",
     "fixedFactor": 1000,
     "dueDates": { "balance": "2023-03-19", "mutualFunds": "2023-03-22", "ccBill": "2023-01-02" },
     "inflow": 4283.83,
     "statusByBucket": { "Balance": "Pending", "Mutual Funds": "Paid", "CC Bill": "Paid" },
     "accounts": [ ... ]
   }
   ```
5. **Repeat for all months** to produce seed data for the application.

---

## 9. UI Replication Checklist

- [ ] Month header component showing date, total inflow, and quick summary chips.
- [ ] Status ribbon with clickable chips to flip `Pending` / `Paid`.
- [ ] Fixed factor & due date row with inline date pickers.
- [ ] Account table featuring:
  - Inline edit for fixed balance, savings, bucket allocations.
  - Status indicator per bucket.
  - Derived “Remaining” field computed on the fly.
- [ ] Footer summarising totals (sum of `Balance`, `Mutual Funds`, `CC Bill`, etc.).
- [ ] Warning banner for broken references or missing data once imported.

---

## 10. Data Model Alignment

- `PlannedMonth`: `id`, `monthStartDate`, `fixedFactor`, `salaryInflow`, `statusByBucket`, `dueDates`, `notes`.
- `AccountAllocation`: `id`, `plannedMonthId`, `accountId`, `bucketId`, `status`, `fixedBalance`, `savingsTarget`, `balanceTarget`, `sip1`, `sip2`, `billAmount`, `remainingCash`.
- `Bucket`: `id`, `name`, `color`, `displayOrder`.
- `Reminder`: `id`, `allocationId`, `dueDate`, `isActive`.

Each of these will be used in the `03-react-app-delivery-plan.md` to map into API/state tasks.

---

This structural blueprint feeds directly into the formula translation (see `02-formulas-and-calculations.md`) and the implementation roadmap (`03-react-app-delivery-plan.md`). Ensure no structural assumption is lost during migration; the React components can now be designed with full knowledge of the underlying spreadsheet grammar.

