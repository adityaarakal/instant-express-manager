# Transaction/Due Date Feature Plan

## Overview

Add a separate, editable "Next Transaction Date" or "Due Date" field to EMIs and Recurring Templates that can be updated at any time, with options to apply the change to all future transactions or just reset the schedule from the current point.

## Current State

### EMIs
- Calculate next due date based on: `startDate + (completedInstallments * frequency)`
- No way to manually adjust when the next transaction should be generated
- Auto-generation uses calculated date

### Recurring Templates
- Have a `nextDueDate` field that tracks when next transaction should be generated
- This field is automatically updated after each transaction generation
- Not directly editable by users
- No way to shift the schedule for all future transactions

## Requirements

### 1. New Field: `nextTransactionDate`
- **EMIs**: Add `nextTransactionDate?: string` (ISO date string, optional)
  - If set, this overrides the calculated next due date
  - If not set, falls back to calculated date based on installments
  - Can be updated independently of start/end dates
  
- **Recurring Templates**: Already have `nextDueDate`, but needs to be:
  - Made directly editable
  - Provide update options when changed

### 2. Update Options
When updating the next transaction date, user should choose:
- **"Update This Date Only"**: Just changes the next due date, schedule continues normally from there
- **"Update All Future Transactions"**: Shifts all future transactions by the same offset
- **"Reset Schedule from This Date"**: Recalculates schedule starting from the new date

### 3. Auto-Generation Logic
- Use `nextTransactionDate` (EMI) or `nextDueDate` (Recurring) if set
- For EMIs: If `nextTransactionDate` is set, use it; otherwise calculate from installments
- After generating a transaction:
  - EMIs: If `nextTransactionDate` was used, calculate next date based on frequency; if calculated, continue as normal
  - Recurring: Update `nextDueDate` based on frequency (existing behavior)

### 4. UI Components
- Add date field to EMI form (optional, labeled "Next Transaction Date (optional)")
- Make `nextDueDate` editable in Recurring form
- Add "Update Due Date" button/action on EMI and Recurring list items
- Create `DateUpdateDialog` component with:
  - Date picker for new date
  - Radio buttons for update options:
    - "Update this date only"
    - "Update all future transactions" (shifts by offset)
    - "Reset schedule from this date" (for recurring only)

## Implementation Plan

### Phase 1: Type Updates
1. Update `ExpenseEMI` and `SavingsInvestmentEMI` interfaces:
   ```typescript
   nextTransactionDate?: string; // ISO date string, optional
   ```

2. `RecurringExpense`, `RecurringIncome`, `RecurringSavingsInvestment` already have `nextDueDate`, no changes needed to type

### Phase 2: Store Updates
1. **EMI Stores** (`useExpenseEMIsStore`, `useSavingsInvestmentEMIsStore`):
   - Add `updateNextTransactionDate(emiId, newDate, updateOption)` method
   - Update `checkAndGenerateTransactions()` to use `nextTransactionDate` if set
   - After transaction generation, update `nextTransactionDate` based on frequency

2. **Recurring Stores** (`useRecurringExpensesStore`, etc.):
   - Add `updateNextDueDate(templateId, newDate, updateOption)` method
   - Implement logic for:
     - "Update this date only": Just update `nextDueDate`
     - "Update all future transactions": Update all pending transaction dates by offset
     - "Reset schedule from this date": Recalculate schedule from new date

### Phase 3: UI Components
1. Create `DateUpdateDialog` component:
   - Date picker for selecting new date
   - Radio buttons for update options
   - Show preview of what will change
   - Confirmation button

2. Update EMI Form Dialog:
   - Add optional "Next Transaction Date" field
   - Only show if EMI is already created (for editing)

3. Update Recurring Form Dialog:
   - Make `nextDueDate` editable
   - Show info text about how it affects schedule

4. Add "Update Date" button to:
   - EMI table row actions
   - Recurring template table row actions

### Phase 4: Auto-Generation Updates
1. Update EMI auto-generation:
   ```typescript
   const nextDueDate = emi.nextTransactionDate || 
     calculateNextDueDate(emi.startDate, emi.frequency, emi.completedInstallments);
   ```

2. After generating EMI transaction:
   ```typescript
   // If nextTransactionDate was used, calculate next date
   if (emi.nextTransactionDate) {
     const nextDate = calculateNextDateFromDate(emi.nextTransactionDate, emi.frequency);
     updateEMI(emi.id, { nextTransactionDate: nextDate });
   }
   ```

3. Recurring templates: Existing logic should work, just ensure `nextDueDate` updates correctly

## Data Migration

- Existing EMIs: `nextTransactionDate` will be `undefined`, will fall back to calculated date (backward compatible)
- Existing Recurring templates: Already have `nextDueDate`, no migration needed

## Edge Cases

1. **EMI with nextTransactionDate before startDate**: Warn user, allow but validate
2. **EMI with nextTransactionDate after endDate**: Warn user that it's past end date
3. **Recurring template with new date before last generated transaction**: Handle gracefully
4. **Updating date for completed EMI/Recurring**: Should not be allowed or should reactivate

## Testing

1. Test EMI auto-generation with `nextTransactionDate` set
2. Test EMI auto-generation without `nextTransactionDate` (should use calculated)
3. Test updating EMI date with different options
4. Test Recurring date updates with different options
5. Test backward compatibility with existing data
6. Test edge cases (dates before start, after end, etc.)

## Documentation Updates

- USER_GUIDE.md: Explain nextTransactionDate feature
- DEVELOPER_GUIDE.md: Document new fields and methods
- Update examples and screenshots if needed

