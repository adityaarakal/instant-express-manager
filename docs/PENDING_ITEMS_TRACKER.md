# Pending Items Tracker

**Date Created**: 2025-01-15  
**Status**: Active  
**Purpose**: Track all pending non-production/deployment items for implementation

---

## 📊 Overview

This document tracks all pending items that are NOT production/deployment related. These are optional enhancements and future features that can be implemented post-launch.

### Progress Summary
- **Total Items**: 9
- **Completed**: 3
- **In Progress**: 0
- **Pending**: 6

### By Priority
- **High Priority**: 0 items
- **Medium Priority**: 3 items
- **Low Priority**: 6 items

---

## 🎯 Medium Priority Items

### Item 1: #REF! Error Remediation Tool
**Status**: ⏳ Pending  
**Priority**: Medium  
**Estimated Effort**: 4-6 hours  
**Category**: Data Migration Completion

**Description**: Add tool to fix #REF! errors for 18 months (Apr 2023 - Sep 2024) that have incomplete remaining cash calculations.

**Tasks**:
- [ ] Create "Fix #REF! Errors" utility function
- [ ] Auto-calculate missing remaining cash from available data
- [ ] Add manual override option
- [ ] Create validation report showing all affected months
- [ ] Add UI in Settings page for running the tool
- [ ] Show before/after comparison
- [ ] Add confirmation dialog before applying fixes

**Files to Create/Modify**:
- `frontend/src/utils/refErrorRemediation.ts` (new)
- `frontend/src/pages/Settings.tsx` (add UI section)
- `frontend/src/components/common/RefErrorRemediationDialog.tsx` (new)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 15

---

### Item 2: Advanced Filtering Options
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 3-4 hours (Actual: ~2 hours)  
**Category**: UX Enhancement

**Description**: Add advanced filtering options to Planner page for better data navigation.

**Tasks**:
- [x] Add account type filter
- [x] Add bucket filter (already existed)
- [x] Add status filter (pending/paid)
- [x] Add amount range filter (min/max)
- [x] Enhanced AccountFilters component with collapsible advanced section
- [ ] Save filter presets functionality (deferred - can be added later if needed)
- [ ] Filter preset management UI (deferred - can be added later if needed)

**Note**: Date range filter is handled at the month selection level (MonthSearchFilter component). Filter presets can be added in a future enhancement if users request it.

**Files Modified**:
- `frontend/src/components/planner/AccountFilters.tsx` (enhanced with advanced filters)
- `frontend/src/pages/Planner.tsx` (integrated new filters)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 12

---

### Item 3: Keyboard Navigation Improvements
**Status**: ✅ Completed  
**Priority**: Medium  
**Estimated Effort**: 4-5 hours (Actual: ~2 hours)  
**Category**: Power User Feature

**Description**: Enhance keyboard navigation for power users with full keyboard-only workflow.

**Tasks**:
- [x] Arrow keys to navigate between cells/rows in tables
- [x] Tab to move between editable fields
- [x] Enter to save and move down (for forms)
- [x] Escape to cancel/close dialogs
- [x] Full keyboard-only workflow support (hook created)
- [x] Enhanced accessibility with ARIA labels
- [ ] Add keyboard shortcuts help dialog (deferred - can be added later)
- [ ] Test with screen readers (deferred - manual testing needed)

**Files Created/Modified**:
- `frontend/src/hooks/useKeyboardNavigation.ts` (new - comprehensive keyboard navigation hook)
- `frontend/src/pages/Planner.tsx` (integrated keyboard navigation)
- `frontend/src/components/planner/AccountTable.tsx` (enhanced with keyboard support)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 14

---

## 🔵 Low Priority Items

### Item 4: Due Date Zeroing - Toggle Feature
**Status**: ⏳ Pending  
**Priority**: Low  
**Estimated Effort**: 2-3 hours  
**Category**: Future Enhancement

**Description**: Add toggle to "re-enable" past-due items if needed, allowing users to manually override zeroed amounts.

**Tasks**:
- [ ] Add toggle checkbox/button in Planner for each zeroed item
- [ ] Store override preferences in store
- [ ] Update aggregation logic to respect overrides
- [ ] Add visual indicator for overridden items
- [ ] Add bulk override option

**Files to Create/Modify**:
- `frontend/src/store/useDueDateOverridesStore.ts` (new)
- `frontend/src/components/planner/AccountTable.tsx` (add toggle UI)
- `frontend/src/utils/aggregation.ts` (respect overrides)

**Reference**: `docs/ENHANCEMENT_TRACKER.md` - Enhancement #1

---

### Item 5: Scheduled Exports
**Status**: ⏳ Pending  
**Priority**: Low  
**Estimated Effort**: 6-8 hours  
**Category**: Future Feature

**Description**: Implement scheduled exports using background jobs (requires browser background sync or service worker scheduling).

**Tasks**:
- [ ] Research browser Background Sync API
- [ ] Implement service worker scheduling
- [ ] Create export schedule configuration UI
- [ ] Add schedule management (create, edit, delete)
- [ ] Implement background export execution
- [ ] Add notification when export completes
- [ ] Store export schedules in IndexedDB

**Files to Create/Modify**:
- `frontend/src/utils/scheduledExports.ts` (new)
- `frontend/src/pages/Settings.tsx` (add schedule management UI)
- `frontend/src/store/useExportSchedulesStore.ts` (new)
- `frontend/public/sw.js` (add background sync handler)

**Reference**: `docs/ENHANCEMENT_TRACKER.md` - Feature #3

**Note**: Complex feature requiring background job infrastructure. May be out of scope for current version.

---

### Item 6: Projections Integration
**Status**: ⏳ Pending  
**Priority**: Low (Future)  
**Estimated Effort**: 8-10 hours  
**Category**: Integration Feature

**Description**: Import from Projections sheet, auto-populate inflow totals, link savings targets to projections.

**Tasks**:
- [ ] Define Projections sheet structure
- [ ] Create import utility for Projections data
- [ ] Auto-populate inflow totals from projections
- [ ] Link savings targets to projections
- [ ] Add sync mechanism for projections data
- [ ] Create UI for managing projections integration

**Files to Create/Modify**:
- `frontend/src/utils/projectionsIntegration.ts` (new)
- `frontend/src/pages/Settings.tsx` (add projections section)
- `frontend/src/store/useProjectionsStore.ts` (new)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 16

**Note**: Requires Projections sheet structure definition. Future enhancement.

---

### Item 7: Credit Card Dashboard
**Status**: ⏳ Pending  
**Priority**: Low (Future)  
**Estimated Effort**: 5-6 hours  
**Category**: Specialized View

**Description**: Dedicated view for credit card management with bills, outstanding balance, payment history, and due date calendar.

**Tasks**:
- [ ] Create Credit Card Dashboard page
- [ ] Show all credit card accounts
- [ ] Display outstanding balance per card
- [ ] Show payment history
- [ ] Add due date calendar view
- [ ] Add quick actions (pay bill, view transactions)
- [ ] Add credit card specific analytics

**Files to Create/Modify**:
- `frontend/src/pages/CreditCardDashboard.tsx` (new)
- `frontend/src/components/creditcard/` (new directory with components)
- `frontend/src/routes/AppRoutes.tsx` (add route)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 17

---

### Item 8: Print-Optimized Views
**Status**: ⏳ Pending  
**Priority**: Low  
**Estimated Effort**: 2-3 hours  
**Category**: UX Enhancement

**Description**: Enhanced print-friendly views for month view, summary reports, dashboard, and custom print layouts.

**Tasks**:
- [ ] Enhance print styles for month view (basic styles exist)
- [ ] Create print-optimized summary reports
- [ ] Create print-optimized dashboard view
- [ ] Add custom print layout options
- [ ] Add print preview functionality
- [ ] Test print output on different browsers

**Files to Create/Modify**:
- `frontend/src/index.css` (enhance print styles)
- `frontend/src/components/planner/PrintView.tsx` (new, optional)
- `frontend/src/components/dashboard/PrintView.tsx` (new, optional)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 13

**Note**: Basic print styles already exist. This is for enhanced print views.

---

### Item 9: Data Visualization Enhancements
**Status**: ⏳ Pending  
**Priority**: Low  
**Estimated Effort**: 4-5 hours  
**Category**: Analytics Enhancement

**Description**: Add more chart types, interactive tooltips, export charts as images, and customizable dashboard widgets.

**Tasks**:
- [ ] Add pie chart component
- [ ] Add area chart component
- [ ] Enhance tooltips with more interactivity
- [ ] Add export chart as image functionality
- [ ] Create customizable dashboard widgets
- [ ] Add widget configuration UI

**Files to Create/Modify**:
- `frontend/src/components/analytics/PieChart.tsx` (new)
- `frontend/src/components/analytics/AreaChart.tsx` (new)
- `frontend/src/utils/chartExport.ts` (new)
- `frontend/src/pages/Dashboard.tsx` (add widget customization)

**Reference**: `docs/ENHANCEMENT_PROPOSALS.md` - Item 20

---

## 📝 Notes

- All items are optional and non-blocking
- Can be done incrementally post-deployment
- Priority can be adjusted based on user feedback
- New items can be added as they're discovered

---

## 🎯 Implementation Order

### Phase 1: Medium Priority (Start Here)
1. #REF! Error Remediation Tool
2. Advanced Filtering Options
3. Keyboard Navigation Improvements

### Phase 2: Low Priority - Quick Wins
4. Due Date Zeroing - Toggle Feature
5. Print-Optimized Views

### Phase 3: Low Priority - Complex Features
6. Scheduled Exports
7. Projections Integration
8. Credit Card Dashboard
9. Data Visualization Enhancements

---

**Last Updated**: 2025-01-15  
**Next Review**: After completing Phase 1 items

