# Planned Expenses – Formula Catalogue & Logic Mapping

This document catalogues every formula pattern discovered in the `Planned Expenses` sheet and maps each to equivalent logic that must exist in the React codebase. Treat this as the canonical reference when translating Excel behaviour into TypeScript utilities and derived selectors.

---

## 1. Core Formula Families

### 1.1 Remaining Cash Calculation

- **Excel pattern:**  
  `= <baseValue> - SUM(D<Row>) - B<Row>`  
  Example: `= #REF! - SUM(D47) - B47`
- **Meaning:** Starting cash (`baseValue`) minus savings transfers (`column D`) minus fixed balance (`column B`).
- **Implementation:**  
  ```ts
  remainingCash = baseValue - savingsTransfer - fixedBalance;
  ```
  `baseValue` often comes from previous month’s remaining balance or an inflow row. Keep this as a separate field in the API response.

### 1.2 Fixed Balance Carry-Forward

- **Excel pattern:** `=B34 + B46`, `=SUM(B49:B57)`
- **Meaning:** accumulate previous month’s fixed balances to maintain buffers.
- **Implementation:**  
  - Provide `account.defaultFixedBalance`.
  - Each month: `fixedBalance = defaultFixedBalance + adjustments`.

### 1.3 Savings Pending Totals

- **Excel pattern:**  
  `=SUMIFS($F55:$L55, $F$44:$L$44, D$19, $F$45:$L$45, "Pending")`
- **Meaning:** For the row, sum columns where bucket header equals the current bucket label (e.g., `"Savings"`) and status row equals `"Pending"`.
- **Implementation:**  
  ```ts
  const pendingTotal = allocations
    .filter(a => a.bucket === targetBucket && a.status === 'pending')
    .reduce((sum, a) => sum + a.amount, 0);
  ```
  Provide selectors for both pending and paid totals.

### 1.4 Month Totals

- **Excel pattern:** `=SUM(F49:F57)` and `=SUM(D49:D57)`
- **Meaning:** Aggregated bucket totals for the whole month.
- **Implementation:** Precompute aggregated metrics per `PlannedMonth`.

### 1.5 Due Date Zeroing

- **Excel pattern:**  
  `=IF(TODAY()> dueDateCell, 0, E46 * (dueDateCell - prevDate + 1))`
- **Meaning:** After due date passes, zero-out the amount; otherwise compute prorated amount based on date range.
- **Implementation:** Introduce a rule engine or computed property that evaluates current date vs due date, factoring in proration if applicable.

### 1.6 Manual Overrides

- **Excel pattern:** `=6545.48-173-500-272`
- **Meaning:** Hard-coded adjustments to reach a target.
- **Implementation:** Permit `adjustments` metadata per allocation so manual corrections can persist with explanations.

---

## 2. Status-Driven `SUMIFS`

| Purpose | Excel Formula | React Equivalent |
| --- | --- | --- |
| Row-level pending total | `=SUMIFS($F64:$M64,$F59:$M59,D63,$F60:$M60,"Pending")` | Filter allocations by `bucketId` & `status === 'pending'`. |
| Paid total | same formula but `"Paid"` | `status === 'paid'`. |
| Month-level pending by bucket | `=SUMIFS($F$49:$L$57,$F$44:$L$44,"Balance",$F$45:$L$45,"Pending")` | Derived selector aggregated per bucket. |

> **Implementation detail:** Precompute `totalsByBucket[bucketId] = { pending, paid, total }` inside a selector or React Query transformer to avoid repeated calculations in components.

---

## 3. External Sheet References

### 3.1 Projections

- Examples: `=Projections!C14`, `=Projections!D14`
- Typically used for the “Pending” inflow line and savings target.
- **Action:** Mirror the referenced projection values in a dedicated API endpoint or local seed data (`projectionsRepository`) and make them available during month creation.

### 3.2 Credit Card Identifiers

- Strings like `ICICI 7018`, `ICICI 3002`, `Miyapur` embedded in inflow rows.
- **Action:** Map to `CreditCardAccount` entities with metadata (statement date, due date, autopay). Provide cross-module linkage with `CC Outstanding` data when available.

### 3.3 `#REF!` dependencies

- Occurs where rows reference deleted columns, often previous-month data.
- **Action:** Document each `#REF!` location, identify intended source (likely `Remaining` from previous month or `Projections!` cell), and replace with explicit fields in the JSON API or migration script.

---

## 4. Date Handling Rules

| Scenario | Excel Example | Rule |
| --- | --- | --- |
| Due date per bucket | `G3 = 44580` (19 Jan 2022) | Convert to ISO `2022-01-19`; store in `dueDates["Balance"]`. |
| Savings due date | `D(N+4) = 2023-04-16` | Provide bucket-specific reminder offsets. |
| Auto-zero after due | `E61` uses `TODAY()` comparison | Evaluate `if (today > dueDate) return 0` each time totals are computed. |

Implement a `convertExcelSerialToIso(serial: number): string` helper and a complementary `parseIsoDate` utility to maintain accuracy.

---

## 5. Derived Metrics Required in App

| Metric | Source Formula | Usage |
| --- | --- | --- |
| `totalPending` per bucket | `SUMIFS` with status `"Pending"` | Dashboard cards, planner alerts. |
| `totalPaid` per bucket | `SUMIFS` with status `"Paid"` | Historical tracking, charts. |
| `remainingCash` per account | `baseValue - savings - fixedBalance` | Display next to each account row. |
| `monthSavingsTarget` | `SUM(D rows)` | Validate against projections; show progress bars. |
| `monthFixedBalance` | `SUM(B rows)` | Ensure buffers maintained. |
| `monthlySipTotals` | `SUM(G rows)` / `SUM(H rows)` | Graph SIP contributions. |
| `ccBillTotal` | `SUM(I rows)` | Feed credit card payoff screen. |
| `dueSoon` list | Compare due dates with today + 5 days | Trigger reminders UI. |

---

## 6. Migration & Validation Tests

For each formula family, create unit tests to assert parity with Excel:

1. **Remaining calculation parity**  
   - Input: sample row data from March 2023.  
   - Expectation: computed `remainingCash` equals Excel value within ±0.01.
2. **Status totals**  
   - Input: allocations with mixed `pending` and `paid`.  
   - Expectation: `totalsByBucket["Balance"].pending` matches Excel `SUMIFS`.
3. **Due date zeroing**  
   - Input: due date in past vs future.  
   - Expectation: past due → 0, future → computed amount.
4. **Projection linkage**  
   - Input: `Projections` dataset.  
   - Expectation: derived monthly inflow equals Excel cell.

---

## 7. Implementation Strategy for Formulas

1. **Define TypeScript utilities** in `src/utils`:
   - `calculateRemaining({ inflow, savings, fixedBalance })`
   - `aggregateTotalsByBucket(allocations)`
   - `applyDueDateRule(value, dueDate, today)`
2. **Integrate with Zustand store**:
   - Store raw allocations; derived selectors compute totals dynamically.
3. **Persist statuses** and bucket assignments so toggling updates derived totals instantly.
4. **Create parity tests** using Vitest with sample datasets exported from Excel (CSV).

---

## 8. Checklist

- [ ] Capture sample data for at least Jan–May 2023 with formulas evaluated to values.
- [ ] Implement TypeScript utilities mirroring each formula family.
- [ ] Add unit tests covering `remaining`, `sumifs`, `dueDate`, `projection` logic.
- [ ] Validate React components render derived metrics identical to Excel (visual diff).
- [ ] Record any deviations (e.g., manual overrides) with user-facing annotations in the app.

---

By following this catalogue, we guarantee that every Excel calculation is ported correctly and no implicit behaviour is lost during the transition.

