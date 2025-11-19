# Enhancement & Maintenance Tracker

**Date Created**: 2025-01-15  
**Status**: Active  
**Purpose**: Track optional enhancements, future features, code cleanup, and documentation maintenance

---

## 📋 Tracker Overview

This document tracks all non-critical improvements and maintenance tasks that can be done post-deployment. These are organized by priority and category.

### Categories
1. **Optional Enhancements** - Feature improvements that enhance UX/functionality
2. **Future Features** - New features for future releases
3. **Code Cleanup** - Cosmetic improvements and code quality
4. **Documentation Maintenance** - Keeping docs up-to-date

---

## 🎯 Optional Enhancements

### High Priority

#### 1. Due Date Zeroing Logic Enhancement
**Status**: ✅ Completed  
**Priority**: High  
**Estimated Effort**: 2-3 hours (Actual: ~1 hour)

**Description**: Implement automatic zeroing of bucket allocations when due date has passed (Excel parity)

**Tasks**:
- [x] Implement `applyDueDateZeroing` function in `utils/formulas.ts` (already existed)
- [x] Add visual indicators (grayed out, strikethrough) for zeroed amounts
- [x] Show warning icon and tooltip for past-due allocations
- [ ] Add toggle to "re-enable" past-due items if needed (future enhancement)
- [x] Update Planner UI to show zeroed amounts
- [ ] Add tests for due date zeroing logic (tests exist for function, UI tests can be added)

**Files to Modify**:
- `frontend/src/utils/formulas.ts`
- `frontend/src/pages/Planner.tsx`
- `frontend/src/components/planner/AccountTable.tsx`

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Task 1

---

#### 2. Account-Level Due Dates
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 3-4 hours (Actual: ~1 hour)

**Description**: Add due date field to individual bucket allocations (per account-bucket combination)

**Tasks**:
- [x] Add `bucketDueDates` field to `AggregatedAccount` data structure
- [x] Update aggregation logic to calculate due dates per account-bucket
- [x] Update AccountTable to use account-level due dates (with fallback to bucket-level)
- [x] Apply zeroing logic at account-bucket level (uses transaction due dates)
- [x] Visual indicators now use account-level due dates

**Files Modified**:
- `frontend/src/types/plannedExpensesAggregated.ts` - Added `bucketDueDates` field
- `frontend/src/utils/aggregation.ts` - Calculate account-level due dates
- `frontend/src/components/planner/AccountTable.tsx` - Use account-level due dates

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Task 2

**Note**: Due dates are automatically calculated from the earliest transaction due date per account-bucket combination. The zeroing logic already works at the transaction level, so account-level due dates are primarily for display and tracking purposes.

---

#### 3. Fixed Balance Carry-Forward
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 2-3 hours (Actual: ~30 minutes)

**Description**: Show fixed balance comparison with previous month

**Tasks**:
- [x] Add visual indicator showing difference from previous month
- [x] Show previous month's fixed balance in tooltip
- [x] Display change amount (positive/negative) with color coding
- [x] Update AccountTable to show month-over-month comparison

**Files Modified**:
- `frontend/src/components/planner/AccountTable.tsx` - Added previous month comparison

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Task 3

**Note**: Fixed balances are derived from account current balance, so they automatically "carry forward" in a sense. This enhancement adds visual comparison showing how fixed balances change month-over-month, which helps users track balance changes.

---

### Medium Priority

#### 4. Auto-Save with Debouncing
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 2-3 hours (Actual: ~45 minutes)

**Description**: Add debouncing to save status updates for better UX

**Tasks**:
- [x] Add debouncing to save status updates (500ms)
- [x] Debounce "Saving..." indicator (prevents flashing on every keystroke)
- [x] Show "Saved" indicator after save completes
- [x] Add "Last saved" timestamp (already in SaveStatusIndicator)
- [x] Handle save errors gracefully
- [x] Create useAutoSave hook for future form implementations

**Files Modified**:
- `frontend/src/utils/storage.ts` - Added debouncing to save status updates
- `frontend/src/hooks/useAutoSave.ts` - Created hook for future use

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Task 5

**Note**: Data already auto-saves via Zustand's persist middleware. This enhancement adds debouncing to the save status indicator, preventing it from flashing "Saving..." on every state change. The "Saving..." indicator only appears after 500ms of no changes, and "Saved" appears after save completes.

---

#### 5. Enhanced Data Validation & Warnings
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 3-4 hours (Actual: ~30 minutes)

**Description**: Enhanced validation warnings with inline suggestions

**Tasks**:
- [x] Add enhanced visual indicators for negative remaining cash
- [x] Show inline warnings with actionable suggestions
- [x] Improve error display with bold text and warning icons
- [x] Add tooltips with suggestions for fixing issues
- [x] Real-time validation already exists in forms (via useMemo)

**Files Modified**:
- `frontend/src/components/planner/AccountTable.tsx` - Enhanced validation warnings

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Task 4

**Note**: Transaction forms already have real-time validation with inline error display. This enhancement adds better visual indicators and actionable suggestions for negative remaining cash in the Planner view.

---

## 🚀 Future Features

### Feature 1: Advanced Analytics
**Status**: ⏳ Planned  
**Priority**: Low  
**Estimated Effort**: 6-8 hours

**Description**: Additional analytics features and visualizations

**Tasks**:
- [ ] Spending trends by category over time
- [ ] Income vs Expense comparison charts
- [ ] Savings rate tracking
- [ ] Budget variance analysis
- [ ] Custom date range comparisons
- [ ] Export analytics reports

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md`

---

### Feature 2: Bulk Operations
**Status**: ⏳ Planned  
**Priority**: Low  
**Estimated Effort**: 4-5 hours

**Description**: Enhanced bulk operations for transactions

**Tasks**:
- [ ] Bulk edit transactions
- [ ] Bulk status updates
- [ ] Bulk category changes
- [ ] Bulk delete with confirmation
- [ ] Bulk export selected transactions

---

### Feature 3: Export Enhancements
**Status**: ⏳ Planned  
**Priority**: Low  
**Estimated Effort**: 3-4 hours

**Description**: Additional export formats and options

**Tasks**:
- [ ] Excel export (XLSX format)
- [ ] PDF export with formatting
- [ ] Custom export templates
- [ ] Scheduled exports
- [ ] Export history tracking

---

## 🧹 Code Cleanup

### Cleanup 1: Remove TODO/FIXME Comments
**Status**: ✅ Completed  
**Priority**: Low  
**Estimated Effort**: 1-2 hours (Actual: ~5 minutes)

**Description**: Review and clean up TODO/FIXME comments in codebase

**Tasks**:
- [x] Review all TODO comments (0 found - already clean)
- [x] Verify no critical TODOs remain
- [x] Confirm codebase is clean of TODO/FIXME comments

**Files Reviewed**:
- `frontend/src/utils/dataMigration.ts` - No TODOs found
- `frontend/src/pages/Settings.tsx` - No TODOs found
- `frontend/src/utils/analytics.ts` - No TODOs found
- `frontend/src/utils/errorTracking.ts` - No TODOs found
- `frontend/src/utils/performanceMonitoring.ts` - No TODOs found
- `frontend/src/utils/__tests__/formulas.test.ts` - No TODOs found

**Result**: Codebase is already clean - no TODO/FIXME comments found. The tracker reference to "10 found" was outdated.

---

### Cleanup 2: React Hook Warnings
**Status**: ✅ Completed  
**Priority**: Low  
**Estimated Effort**: 30 minutes (Actual: ~10 minutes)

**Description**: Fix React Hook dependency warnings

**Tasks**:
- [x] Fix `useMemo` dependency warnings in `TransactionFilters.tsx`
- [x] Remove unnecessary dependencies (`savedFilters`, `history`)
- [x] Verify no new warnings introduced

**Files to Modify**:
- `frontend/src/components/transactions/TransactionFilters.tsx`

---

### Cleanup 3: Type Safety Improvements
**Status**: ✅ Completed  
**Priority**: Low  
**Estimated Effort**: 2-3 hours (Actual: ~10 minutes)

**Description**: Verify and document type safety status

**Tasks**:
- [x] Review `any` types (only found in test files - acceptable)
- [x] Verify TypeScript strict mode is enabled (✅ `strict: true` in tsconfig.json)
- [x] Check for @ts-ignore comments (only @ts-expect-error in tests - intentional)
- [x] Verify production code has no `any` types
- [x] Confirm type safety is already good

**Result**: Type safety is already excellent:
- TypeScript strict mode enabled
- No `any` types in production code
- `@ts-expect-error` only in tests (intentional for testing invalid inputs)
- All production code properly typed

---

## 📚 Documentation Maintenance

### Doc 1: Update TASK_STATUS.md
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 30 minutes (Actual: ~15 minutes)

**Description**: Update outdated task status documentation

**Tasks**:
- [x] Review `docs/TASK_STATUS.md`
- [x] Update all task statuses to reflect current state
- [x] Mark Analytics as complete (was showing 0%, now 100%)
- [x] Update completion percentages to 100%
- [x] Remove outdated pending tasks section

**Files to Modify**:
- `docs/TASK_STATUS.md`

---

### Doc 2: Update Enhancement Proposals
**Status**: ⏳ Pending  
**Priority**: Low  
**Estimated Effort**: 1 hour

**Description**: Update enhancement proposals with current status

**Tasks**:
- [ ] Review `docs/ENHANCEMENT_PROPOSALS.md`
- [ ] Mark completed enhancements
- [ ] Update priorities based on user feedback
- [ ] Add new enhancement ideas
- [ ] Link to this tracker

---

### Doc 3: Create User Feedback Guide
**Status**: ⏳ Pending  
**Priority**: Low  
**Estimated Effort**: 1-2 hours

**Description**: Create guide for collecting and processing user feedback

**Tasks**:
- [ ] Create `docs/USER_FEEDBACK_GUIDE.md`
- [ ] Document feedback collection process
- [ ] Create feedback template
- [ ] Link feedback to enhancement tracker
- [ ] Add to main documentation index

---

## 📊 Progress Tracking

### Overall Progress
- **Total Items**: 13
- **Completed**: 8
- **In Progress**: 0
- **Pending**: 5

### By Category
- **Optional Enhancements**: 5 items (5 completed, 0 pending) ✅
- **Future Features**: 3 items
- **Code Cleanup**: 3 items (3 completed, 0 pending) ✅
- **Documentation Maintenance**: 3 items (1 completed, 2 pending)

### By Priority
- **High Priority**: 1 item (1 completed)
- **Medium Priority**: 4 items
- **Low Priority**: 8 items

---

## 🎯 Next Steps

1. **Start with High Priority**: Due Date Zeroing Logic Enhancement
2. **Then Medium Priority**: Account-Level Due Dates, Fixed Balance Carry-Forward
3. **Code Cleanup**: Quick wins (React Hook warnings, TODO cleanup)
4. **Documentation**: Update outdated docs

---

## 📝 Notes

- All items are optional and non-blocking
- Can be done incrementally post-deployment
- Priority can be adjusted based on user feedback
- New items can be added as they're discovered

---

**Last Updated**: 2025-01-15  
**Next Review**: After deployment and user feedback collection

