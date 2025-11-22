# Table/Card View Toggle Implementation Tracker

## Overview
Implement toggle between table and card views for all tables in the application.

## Requirements
- **Desktop (≥900px)**: Table view is default, with option to toggle to card view
- **Tablet (600px-900px)**: Card view is default, with option to toggle to table view
- **Mobile (<600px)**: Card view is default, with option to toggle to table view
- View preference should be persisted (localStorage)
- Toggle button should be visible and accessible

## Pages with Tables

### Phase 1: Create Reusable Components ✅ COMPLETE
- [x] Create ViewToggle component
- [x] Create useViewMode hook for state management
- Status: Complete

### Phase 2: Transactions Page ✅ COMPLETE
- [x] Add view toggle button
- [x] Update conditional rendering to use view state instead of just isMobile
- [x] Ensure card view works for all transaction types
- [x] Test toggle functionality
- Status: Complete
- **Note**: Already had TransactionCard component

### Phase 3: EMIs Page ✅ COMPLETE
- [x] Create EMICard component
- [x] Add view toggle button
- [x] Implement card view rendering
- [x] Update table rendering to respect view toggle
- [x] Test toggle functionality
- Status: Complete

### Phase 4: Recurring Page ✅ COMPLETE
- [x] Create RecurringCard component
- [x] Add view toggle button
- [x] Implement card view rendering
- [x] Update table rendering to respect view toggle
- [x] Test toggle functionality
- Status: Complete

### Phase 5: Banks Page ✅ COMPLETE
- [x] Create BankCard component
- [x] Add view toggle button
- [x] Implement card view rendering
- [x] Update table rendering to respect view toggle
- [x] Test toggle functionality
- Status: Complete

### Phase 6: Bank Accounts Page ✅ COMPLETE
- [x] Create BankAccountCard component
- [x] Add view toggle button
- [x] Implement card view rendering
- [x] Update table rendering to respect view toggle
- [x] Test toggle functionality
- Status: Complete

### Phase 7: Credit Card Dashboard ✅ COMPLETE
- [x] Create CreditCardCard component (for credit cards table)
- [x] Create PaymentHistoryCard component (for payment history table)
- [x] Add view toggle buttons for both tables
- [x] Implement card view rendering for both tables
- [x] Update table rendering to respect view toggle
- [x] Test toggle functionality
- Status: Complete

### Phase 8: Settings Page
- [ ] Identify tables in Settings page
- [ ] Create card components for each table
- [ ] Add view toggle buttons
- [ ] Implement card view rendering
- [ ] Update table rendering to respect view toggle
- [ ] Test toggle functionality
- Status: Pending

### Phase 9: Planner Page (AccountTable)
- [ ] Create AccountCard component for planner
- [ ] Add view toggle button
- [ ] Implement card view rendering
- [ ] Update table rendering to respect view toggle
- [ ] Test toggle functionality
- Status: Pending

### Phase 10: Testing & Validation
- [ ] Test all pages on desktop (table default, toggle to card)
- [ ] Test all pages on tablet (card default, toggle to table)
- [ ] Test all pages on mobile (card default, toggle to table)
- [ ] Test view preference persistence
- [ ] Test responsive behavior
- [ ] Verify accessibility
- Status: Pending

## Implementation Details

### ViewToggle Component
- Icon buttons: TableViewIcon and ViewModuleIcon
- Tooltip for accessibility
- Responsive sizing
- Accessible labels

### useViewMode Hook
- Manages view state (table/card)
- Persists to localStorage with page-specific keys
- Returns default based on screen size
- Provides toggle function

### Card Components
- Should display all relevant information
- Should have action buttons (Edit, Delete, etc.)
- Should be responsive
- Should match table functionality

## Notes
- View preference should be page-specific (e.g., transactions-view-mode, emis-view-mode)
- Default view should respect screen size on first visit
- Toggle should be visible in header/action area
- Cards should support pagination same as tables

