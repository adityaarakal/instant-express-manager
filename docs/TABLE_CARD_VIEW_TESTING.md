# Table/Card View Toggle - Testing & Validation Guide

## Overview
This document provides a comprehensive testing checklist for the table/card view toggle feature across all pages.

## Testing Checklist

### Phase 1: Desktop Testing (≥900px)
**Default View**: Table view  
**Toggle Action**: Switch to card view

#### Pages to Test:
- [ ] **Transactions Page** (`/transactions`)
  - [ ] Table view displays by default
  - [ ] ViewToggle button is visible and accessible
  - [ ] Clicking toggle switches to card view
  - [ ] Card view displays all transaction types correctly
  - [ ] Toggling back to table view works
  - [ ] View preference persists after page refresh

- [ ] **EMIs Page** (`/emis`)
  - [ ] Table view displays by default
  - [ ] ViewToggle button is visible
  - [ ] Card view displays EMI details correctly
  - [ ] Progress bars and status chips display properly
  - [ ] View preference persists

- [ ] **Recurring Page** (`/recurring`)
  - [ ] Table view displays by default
  - [ ] Card view displays recurring template details
  - [ ] Status chips and action buttons work
  - [ ] View preference persists

- [ ] **Banks Page** (`/banks`)
  - [ ] Table view displays by default
  - [ ] Card view displays bank information
  - [ ] Action buttons work correctly
  - [ ] View preference persists

- [ ] **Bank Accounts Page** (`/accounts`)
  - [ ] Table view displays by default
  - [ ] Card view displays account details
  - [ ] Credit card accounts show correct fields
  - [ ] View preference persists

- [ ] **Credit Card Dashboard** (`/credit-cards`)
  - [ ] Credit Cards table: Table view default
  - [ ] Payment History table: Table view default
  - [ ] Both toggles work independently
  - [ ] Card views display correctly
  - [ ] View preferences persist separately

- [ ] **Settings Page** (`/settings`)
  - [ ] Balance Sync Results dialog: Table view default
  - [ ] Card view displays sync results correctly
  - [ ] View preference persists

- [ ] **Planner Page** (`/planner`)
  - [ ] AccountTable: Table view default
  - [ ] Card view displays all account details
  - [ ] Bucket overrides work in card view
  - [ ] View preference persists

### Phase 2: Tablet Testing (600px-900px)
**Default View**: Card view  
**Toggle Action**: Switch to table view

#### Pages to Test:
- [ ] **Transactions Page**
  - [ ] Card view displays by default
  - [ ] Table view is accessible via toggle
  - [ ] Horizontal scrolling works in table view
  - [ ] View preference persists

- [ ] **EMIs Page**
  - [ ] Card view displays by default
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Recurring Page**
  - [ ] Card view displays by default
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Banks Page**
  - [ ] Card view displays by default
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Bank Accounts Page**
  - [ ] Card view displays by default
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Credit Card Dashboard**
  - [ ] Both tables default to card view
  - [ ] Both toggles work independently
  - [ ] View preferences persist separately

- [ ] **Settings Page**
  - [ ] Balance Sync Results defaults to card view
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Planner Page**
  - [ ] AccountTable defaults to card view
  - [ ] Table view is accessible
  - [ ] View preference persists

### Phase 3: Mobile Testing (<600px)
**Default View**: Card view  
**Toggle Action**: Switch to table view

#### Pages to Test:
- [ ] **Transactions Page**
  - [ ] Card view displays by default
  - [ ] Cards are properly sized for mobile
  - [ ] Table view is accessible with horizontal scroll
  - [ ] Touch targets are adequate (≥44px)
  - [ ] View preference persists

- [ ] **EMIs Page**
  - [ ] Card view displays by default
  - [ ] Cards are responsive
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Recurring Page**
  - [ ] Card view displays by default
  - [ ] Cards are responsive
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Banks Page**
  - [ ] Card view displays by default
  - [ ] Cards are responsive
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Bank Accounts Page**
  - [ ] Card view displays by default
  - [ ] Cards are responsive
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Credit Card Dashboard**
  - [ ] Both tables default to card view
  - [ ] Cards are responsive
  - [ ] Table views are accessible
  - [ ] View preferences persist separately

- [ ] **Settings Page**
  - [ ] Balance Sync Results defaults to card view
  - [ ] Cards are responsive
  - [ ] Table view is accessible
  - [ ] View preference persists

- [ ] **Planner Page**
  - [ ] AccountTable defaults to card view
  - [ ] Cards are responsive
  - [ ] Bucket overrides work in card view
  - [ ] Table view is accessible
  - [ ] View preference persists

### Phase 4: View Preference Persistence
**Test**: localStorage persistence across sessions

- [ ] Set view to card on desktop, refresh page → Should remain card
- [ ] Set view to table on mobile, refresh page → Should remain table
- [ ] Clear localStorage, visit page → Should use default for screen size
- [ ] Switch between pages → Each page maintains its own preference
- [ ] Credit Card Dashboard → Two separate preferences persist independently

### Phase 5: Responsive Behavior
**Test**: Screen size changes and view adaptation

- [ ] Start on desktop (table view), resize to mobile → Should switch to card (if no preference)
- [ ] Start on mobile (card view), resize to desktop → Should switch to table (if no preference)
- [ ] With preference set → Should maintain preference across resize
- [ ] Without preference → Should adapt to new screen size

### Phase 6: Accessibility Testing
**Test**: Keyboard navigation and screen readers

- [ ] ViewToggle button is keyboard accessible (Tab navigation)
- [ ] ViewToggle button has proper aria-label
- [ ] Tooltip provides clear description
- [ ] Focus indicators are visible
- [ ] Screen reader announces view mode changes
- [ ] All interactive elements in cards are keyboard accessible
- [ ] Table view maintains keyboard navigation

### Phase 7: Functional Testing
**Test**: All features work in both views

- [ ] **Transactions Page**
  - [ ] Filtering works in both views
  - [ ] Pagination works in both views
  - [ ] Bulk actions work in both views
  - [ ] Edit/Delete actions work in card view

- [ ] **EMIs Page**
  - [ ] Filtering works in both views
  - [ ] Pagination works in both views
  - [ ] Edit/Delete actions work in card view

- [ ] **Recurring Page**
  - [ ] Filtering works in both views
  - [ ] Pagination works in both views
  - [ ] Edit/Delete actions work in card view

- [ ] **Banks Page**
  - [ ] Filtering works in both views
  - [ ] Edit/Delete actions work in card view

- [ ] **Bank Accounts Page**
  - [ ] Filtering works in both views
  - [ ] Edit/Delete actions work in card view
  - [ ] Credit card fields display correctly

- [ ] **Credit Card Dashboard**
  - [ ] All card details display correctly
  - [ ] Payment history displays correctly
  - [ ] Actions work in card view

- [ ] **Settings Page**
  - [ ] Balance sync results display correctly
  - [ ] All information is visible in card view

- [ ] **Planner Page**
  - [ ] All account details display correctly
  - [ ] Bucket overrides work in card view
  - [ ] Checkboxes work correctly
  - [ ] Add Transaction button works

### Phase 8: Performance Testing
**Test**: Performance impact of view toggles

- [ ] Toggle between views is smooth (no lag)
- [ ] Card view renders quickly with many items
- [ ] Table view renders quickly with many items
- [ ] No memory leaks when toggling views
- [ ] localStorage operations don't block UI

### Phase 9: Edge Cases
**Test**: Unusual scenarios

- [ ] Empty state displays correctly in both views
- [ ] Single item displays correctly in both views
- [ ] Very long text truncates properly in cards
- [ ] Very long lists paginate correctly
- [ ] View toggle works when data is loading
- [ ] View toggle works when data is empty

## Browser Compatibility
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Issues
_List any issues found during testing_

## Test Results Summary
- **Total Tests**: ___
- **Passed**: ___
- **Failed**: ___
- **Status**: ___

## Notes
- All view preferences are stored in localStorage with page-specific keys
- Default view respects screen size on first visit
- View toggle is always visible and accessible
- Cards maintain all functionality of tables

