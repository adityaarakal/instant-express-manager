# Planned Expenses Sheet Breakdown

This document captures an in-depth understanding of the “Planned Expenses” worksheet, which acts as the central planning dashboard in `Copy of Expense Shares.xlsx`.

## High-Level Structure

- The tab is organized into repeating **monthly blocks**, each roughly 12 rows tall. Column A holds Excel serial dates (e.g., `44927`, `44958`, etc.) corresponding to 1 Jan 2023, 1 Feb 2023, and so on.
- Every block captures a month’s **cash allocations** across four top-level buckets: `Balance`, `Investment`, `Investment`, and `Expense`.
- `Pending` vs. `Paid` labels appear in row N+1 of each block, driving all `SUMIFS` logic that determines outstanding vs. completed allocations.

## Anatomy of a Monthly Block

1. **Category Header (Rows N–N+4)**
   - `Row N` lists the month start date in the first column and the bucket headings in columns F–I.
   - `Row N+1` contains the status flags (`Pending`, `Paid`).
   - `Row N+2 (Fixed Factor)` stores a standard buffer (₹1,000) and the due dates for each bucket (Excel serial dates mapped to actual deadlines).
   - `Row N+3` often represents a pure liability (e.g., Axis 2009 credit card), feeding the `CC Bill` bucket.
   - `Row N+4 (Remaining)` names the granular buckets (`Savings`, `Balance`, `Mutual Funds`, `CC Bill`) and sets the total targets. Many values are pulled from the `Projections` sheet.

2. **Account Distribution Rows (Rows N+5 onward)**
   - Each subsequent row corresponds to a bank account or wallet (ICICI 3945, Axis 0370, Axis 7503, HSBC 9006, Paytm 4366, etc.).
   - Key columns:
     - **Col B (“Fixed Balance”)** – the minimum balance you want to maintain in that account.
     - **Col D (“Savings”)** – pending transfers into savings from that account.
     - **Col F (“Balance”)** – expected end-of-month balance after allocations.
     - **Cols G/H (“Mutual Funds”)** – SIP amounts (backed by the `Pending`/`Paid` flag).
     - **Col I (“CC Bill” / “Maintenance”)** – consolidated payments (credit card, maintenance fees, etc.).
   - Column A formulas such as `A = total - sum(D) - B` compute how much cash remains unassigned after meeting fixed balance and savings commitments.

3. **Totals & Status-Driven Calculations**
   - `SUMIFS` across columns F–L filter by bucket headers (`Balance`, `Mutual Funds`, etc.) and the status flag (`Pending` or `Paid`).
   - Row labels (“Remaining”, “Fixed Balance”) are used as criteria for these `SUMIFS` to keep the totals aligned regardless of column position.
   - As statuses flip from “Pending” to “Paid”, the totals automatically update and the “pending” amount for that bucket drops.

4. **Forward Planning & Calendar Integration**
   - Due dates in row N+2 are stored as Excel serials and should be converted to real dates in the app (e.g., 44580 → 2022‑01‑19).
   - Blocks reference future salary inflows and obligations (e.g., row 47/48 includes monthly salary of ₹129,632 and shows how much is still pending allocation).
   - Broken formulas (`#REF!`) indicate columns referenced in the original workbook were moved/deleted; these need to be reconstructed during migration (likely referencing Projections or previous months).

## Why It’s the “Main Dashboard”

- **Cash visibility**: Each block shows the cash position per account after all obligations for that month.
- **Obligation tracking**: `Pending` vs. `Paid` status lets you instantly see remaining workloads (EMI, SIP, bill payments).
- **Targets and buffers**: `Fixed Factor` and `Fixed Balance` categories enforce minimum balance policies.
- **Due-date-driven planning**: The due dates in row N+2 support calendar reminders and automation.
- **Integration hub**: Figures here originate from `Projections`, `Bills`, `EMI Sheet`, and other tabs—this sheet consolidates them so you know what to do right now.

## Replication Notes for the App

1. **Data Model**
   - Create a `planned_month` entity with attributes: month start date, salary inflow, statuses, due dates.
   - Model `planned_allocation` records for each account/bucket combination (fields: account, bucket, fixed balance, savings requirement, balance target, SIP amounts, bill amounts, status).

2. **Buckets & Statuses**
   - Preserve bucket names (`Balance`, `Mutual Funds`, `Maintenance/CC Bill`, `Savings`) and statuses (`Pending`, `Paid`) to mirror existing `SUMIFS` logic.

3. **Fixed Balances & Buffers**
   - Store constants like ₹1,000 “Fixed Factor” and per-account fixed balances; they repeat monthly with minor adjustments.

4. **Calendaring**
   - Convert serial due dates to `YYYY-MM-DD` and trigger reminders/automation for upcoming payments (e.g., SIP due 2023‑04‑16).

5. **Credit Card Liabilities**
   - Rows topping the CC Bill bucket (Axis 2009, ICICI 7018, etc.) form the card payoff schedule and drive overall credit card views.

6. **Carry-overs & Projections**
   - Resolve `#REF!` by tracing back to `Projections` or prior month totals so the month-to-month flow is intact.

7. **UI Suggestions**
   - Mirror the Excel layout: one panel per month, bucket headings, account rows, and status chips (`Pending`/`Paid`).
   - Highlight pending totals, due dates, and remaining unallocated cash to keep parity with the planner workflow.

## Known Issues / Migration Tasks

- **`#REF!` cells**: Several later months have broken references. Document the intended source (likely previous columns or Projections) and restore them in the automated system.
- **Manual adjustments**: Some cells are literal arithmetic (e.g., `6545.48-173-500-272`); preserve the intent as explanatory adjustments during migration.
- **Naming consistency**: Bucket names, account labels, and card names are reused across other sheets (Bills, CC Outstanding); ensure the same identifiers appear across modules.

## Summary

The “Planned Expenses” tab is the command center for monthly cash management. It merges projections, actual account balances, investment commitments, and bill payments into a single actionable view. Any automated application built from this workbook should faithfully reproduce the block structure, status-driven calculations, and calendar integration to preserve the current workflow.
