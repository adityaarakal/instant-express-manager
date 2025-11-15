# Deduction Date Feature Plan

## Overview

Add a separate, editable **"Deduction Date"** field to EMIs and Recurring Templates that represents the actual date when money will be deducted/transacted. This field is independent of start and end dates and can be updated at any time, with options to apply the change to all future transactions or just reset the schedule from the current point.

## Current State

### EMIs
- Calculate next due date based on: `startDate + (completedInstallments * frequency)`
- No way to manually set the actual deduction date separately from start/end dates
- Auto-generation uses calculated date
- Start date and end date define the overall period, but not the actual transaction dates

### Recurring Templates
- Have a `nextDueDate` field that tracks when next transaction should be generated
- This field is automatically updated after each transaction generation
- Start date and end date define the overall period, but not the actual transaction dates
- No way to set a specific deduction date that's different from the schedule

## Requirements

### 1. New Field: `deductionDate`
- **EMIs**: Add `deductionDate?: string` (ISO date string, optional)
  - Represents the actual date when the next installment will be deducted
  - Independent of `startDate` and `endDate`
  - If set, this is used for auto-generation instead of calculated date
  - If not set, falls back to calculated date based on installments
  - Can be updated independently of start/end dates
  
- **Recurring Templates**: Add `deductionDate?: string` (ISO date string, optional)
  - Represents the actual date when the next transaction will be deducted/credited
  - Independent of `startDate`, `endDate`, and `nextDueDate`
  - If set, this is used for auto-generation instead of `nextDueDate`
  - If not set, falls back to `nextDueDate`
  - Can be updated independently of start/end dates

### 2. Update Options
When updating the next transaction date, user should choose:
- **"Update This Date Only"**: Just changes the next due date, schedule continues normally from there
- **"Update All Future Transactions"**: Shifts all future transactions by the same offset
- **"Reset Schedule from This Date"**: Recalculates schedule starting from the new date

### 3. Auto-Generation Logic
- Use `deductionDate` if set, otherwise fall back to calculated date
- For EMIs: If `deductionDate` is set, use it; otherwise calculate from installments
- For Recurring: If `deductionDate` is set, use it; otherwise use `nextDueDate`
- After generating a transaction:
  - EMIs: If `deductionDate` was used, calculate next date based on frequency; if calculated, continue as normal
  - Recurring: Update `nextDueDate` based on frequency; if `deductionDate` was used, update it based on frequency too

### 4. Key Differences from Start/End Dates
- **Start Date**: Defines when the EMI/Recurring template period begins
- **End Date**: Defines when the EMI/Recurring template period ends (optional for Recurring)
- **Deduction Date**: Defines the actual date when the money will be deducted/credited (can be different from start/end dates)
- Example: EMI starts on 1st Jan, ends on 1st Dec, but deduction happens on 5th of each month

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
   deductionDate?: string; // ISO date string, optional - actual date when next installment will be deducted
   ```

2. Update `RecurringExpense`, `RecurringIncome`, `RecurringSavingsInvestment` interfaces:
   ```typescript
   deductionDate?: string; // ISO date string, optional - actual date when next transaction will be deducted/credited
   ```
   
   Note: `nextDueDate` remains for internal scheduling, but `deductionDate` takes precedence for actual transaction generation

### Phase 2: Store Updates
1. **EMI Stores** (`useExpenseEMIsStore`, `useSavingsInvestmentEMIsStore`):
   - Add `updateDeductionDate(emiId, newDate, updateOption)` method
   - Update `checkAndGenerateTransactions()` to use `deductionDate` if set (via `getEffectiveEMIDeductionDate()`)
   - After transaction generation, update `deductionDate` based on frequency if it was set

2. **Recurring Stores** (`useRecurringExpensesStore`, etc.):
   - Add `updateDeductionDate(templateId, newDate, updateOption)` method
   - Update `checkAndGenerateTransactions()` to use `deductionDate` if set (via `getEffectiveRecurringDeductionDate()`)
   - After transaction generation, update `deductionDate` based on frequency if it was set
   - Implement logic for:
     - "Update this date only": Just update `deductionDate`
     - "Update all future transactions": Update all pending transaction dates by offset
     - "Reset schedule from this date": Recalculate schedule from new date

### Phase 3: UI Components
1. Create `DeductionDateUpdateDialog` component:
   - Date picker for selecting new deduction date
   - Radio buttons for update options:
     - "Update this date only": Only changes the deduction date
     - "Update all future transactions": Shifts all future pending transactions by the offset
     - "Reset schedule from this date": Recalculates schedule starting from the new date
   - Show preview of what will change
   - Confirmation button

2. Update EMI Form Dialog:
   - Add optional "Deduction Date" field (separate from start/end dates)
   - Show info text explaining it's the actual date when money will be deducted
   - This field is optional and independent of start/end dates

3. Update Recurring Form Dialog:
   - Add optional "Deduction Date" field (separate from start/end dates)
   - Show info text explaining it's the actual date when money will be deducted/credited
   - Keep `nextDueDate` for internal scheduling, but `deductionDate` takes precedence

4. Add "Update Deduction Date" button to:
   - EMI table row actions
   - Recurring template table row actions

### Phase 4: Auto-Generation Updates
1. Update EMI auto-generation:
   ```typescript
   const deductionDate = getEffectiveEMIDeductionDate(emi);
   // Uses deductionDate if set, otherwise calculates from installments
   ```

2. After generating EMI transaction:
   ```typescript
   // If deductionDate was used, calculate next date based on frequency
   if (emi.deductionDate) {
     const nextDate = calculateNextDateFromDate(deductionDate, emi.frequency);
     updateEMI(emi.id, { deductionDate: nextDate });
   }
   ```

3. Update Recurring auto-generation:
   ```typescript
   const deductionDate = getEffectiveRecurringDeductionDate(template);
   // Uses deductionDate if set, otherwise uses nextDueDate
   ```

4. After generating Recurring transaction:
   ```typescript
   // Update nextDueDate for internal scheduling
   const nextDue = calculateNextDueDate(template.nextDueDate, template.frequency);
   
   // If deductionDate was used, update it based on frequency
   if (template.deductionDate) {
     const nextDeductionDate = calculateNextDateFromDate(deductionDate, template.frequency);
     updateTemplate(template.id, { nextDueDate: nextDue, deductionDate: nextDeductionDate });
   } else {
     updateTemplate(template.id, { nextDueDate: nextDue });
   }
   ```

## Data Migration

- Existing EMIs: `deductionDate` will be `undefined`, will fall back to calculated date (backward compatible)
- Existing Recurring templates: `deductionDate` will be `undefined`, will fall back to `nextDueDate` (backward compatible)
- No data migration needed - all existing data continues to work as before

## Edge Cases

1. **EMI with nextTransactionDate before startDate**: Warn user, allow but validate
2. **EMI with nextTransactionDate after endDate**: Warn user that it's past end date
3. **Recurring template with new date before last generated transaction**: Handle gracefully
4. **Updating date for completed EMI/Recurring**: Should not be allowed or should reactivate

## Testing

1. Test EMI auto-generation with `deductionDate` set
2. Test EMI auto-generation without `deductionDate` (should use calculated)
3. Test updating EMI deduction date with different options
4. Test Recurring deduction date updates with different options
5. Test that deduction date can be different from start/end dates
6. Test backward compatibility with existing data
7. Test edge cases (deduction date before start, after end, etc.)

## Documentation Updates

- USER_GUIDE.md: Explain deduction date feature - that it's separate from start/end dates and represents the actual transaction date
- DEVELOPER_GUIDE.md: Document new `deductionDate` fields and methods
- Explain the difference between start date, end date, and deduction date
- Update examples showing deduction date can be different from start/end dates

