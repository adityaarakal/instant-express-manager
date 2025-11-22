# Screen Reader Testing Guide

**Date Created**: 2025-01-20  
**Purpose**: Guide for testing the application with screen readers to ensure accessibility

---

## Overview

This guide provides instructions for testing the Instant Express Manager application with screen readers to ensure it's accessible to users with visual impairments.

---

## Supported Screen Readers

### Desktop
- **NVDA** (Windows) - Free, open-source
- **JAWS** (Windows) - Commercial
- **VoiceOver** (macOS) - Built-in
- **Narrator** (Windows) - Built-in

### Mobile
- **TalkBack** (Android) - Built-in
- **VoiceOver** (iOS) - Built-in

---

## Testing Checklist

### Navigation
- [ ] All pages are accessible via keyboard navigation
- [ ] Focus indicators are visible and clear
- [ ] Tab order is logical and follows visual flow
- [ ] Skip links work correctly
- [ ] Breadcrumbs are announced properly

### Forms
- [ ] All form fields have proper labels
- [ ] Required fields are announced
- [ ] Error messages are announced when they appear
- [ ] Form validation messages are clear
- [ ] Submit buttons are properly labeled

### Tables
- [ ] Table headers are announced
- [ ] Row and column relationships are clear
- [ ] Data cells are associated with headers
- [ ] Sortable columns are announced
- [ ] Pagination controls are accessible

### Buttons and Links
- [ ] All buttons have descriptive labels
- [ ] Icon-only buttons have aria-labels
- [ ] Links have descriptive text (not just "click here")
- [ ] Button states (disabled, loading) are announced

### Dialogs and Modals
- [ ] Dialog titles are announced when opened
- [ ] Focus is trapped within dialogs
- [ ] Close buttons are accessible
- [ ] Dialog content is readable
- [ ] Focus returns to trigger element when closed

### Charts and Visualizations
- [ ] Charts have text alternatives
- [ ] Data tables are provided for charts
- [ ] Chart titles and descriptions are announced
- [ ] Interactive chart elements are keyboard accessible

### Notifications
- [ ] Toast notifications are announced
- [ ] Alert messages are properly marked up
- [ ] Success/error states are clear

---

## Testing Procedures

### 1. Basic Navigation Test

**Steps:**
1. Open the application
2. Navigate through all main pages using only keyboard
3. Verify all interactive elements are reachable
4. Check that focus indicators are visible

**Expected Result:**
- All pages accessible via keyboard
- Clear focus indicators
- Logical tab order

### 2. Form Accessibility Test

**Steps:**
1. Navigate to a form (e.g., Add Transaction)
2. Tab through all form fields
3. Verify labels are announced
4. Submit form with errors
5. Verify error messages are announced

**Expected Result:**
- All fields have labels
- Error messages are clear
- Required fields are indicated

### 3. Table Accessibility Test

**Steps:**
1. Navigate to a table (e.g., Transactions, Planner)
2. Navigate through table cells
3. Verify headers are announced with data
4. Test sorting functionality

**Expected Result:**
- Headers announced with data
- Row/column relationships clear
- Sorting is accessible

### 4. Dialog Accessibility Test

**Steps:**
1. Open a dialog (e.g., Add Transaction, Settings)
2. Verify dialog title is announced
3. Navigate through dialog content
4. Verify focus is trapped
5. Close dialog and verify focus returns

**Expected Result:**
- Dialog title announced
- Focus trapped in dialog
- Focus returns on close

### 5. Chart Accessibility Test

**Steps:**
1. Navigate to Analytics page
2. Navigate through charts
3. Verify text alternatives are available
4. Check data tables for charts

**Expected Result:**
- Charts have text alternatives
- Data tables available
- Chart information is accessible

---

## Common Issues and Solutions

### Issue: Buttons not announced
**Solution:** Add `aria-label` to icon-only buttons

### Issue: Form fields not labeled
**Solution:** Ensure all inputs have associated `<label>` elements or `aria-labelledby`

### Issue: Tables not readable
**Solution:** Use proper `<th>` elements with `scope` attributes

### Issue: Dialogs not announced
**Solution:** Use `role="dialog"` and `aria-labelledby` for dialog titles

### Issue: Focus not visible
**Solution:** Ensure focus styles are visible (not just outline: none)

---

## Keyboard Shortcuts Reference

### Navigation
- **Tab**: Move to next interactive element
- **Shift+Tab**: Move to previous interactive element
- **Arrow Keys**: Navigate within components (tables, lists)
- **Enter/Space**: Activate buttons/links
- **Escape**: Close dialogs/modals

### Screen Reader Specific
- **NVDA**: Insert key for commands
- **JAWS**: Caps Lock for commands
- **VoiceOver (Mac)**: Control+Option for commands
- **VoiceOver (iOS)**: Swipe gestures

---

## Testing Tools

### Browser Extensions
- **WAVE** - Web Accessibility Evaluation Tool
- **axe DevTools** - Accessibility testing
- **Lighthouse** - Includes accessibility audit

### Screen Reader Simulators
- **ChromeVox** - Chrome extension for testing
- **Screen Reader Testing** - Online tool

---

## ARIA Best Practices

### Labels
- Use `aria-label` for icon-only buttons
- Use `aria-labelledby` to reference visible labels
- Use `aria-describedby` for additional descriptions

### States
- Use `aria-disabled` for disabled elements
- Use `aria-expanded` for collapsible content
- Use `aria-selected` for selected items

### Roles
- Use `role="button"` for clickable elements that aren't buttons
- Use `role="dialog"` for modals
- Use `role="alert"` for important messages

### Live Regions
- Use `aria-live="polite"` for non-urgent updates
- Use `aria-live="assertive"` for urgent updates
- Use `role="status"` for status messages

---

## Testing Schedule

### Initial Testing
- Test all major user flows
- Document any issues found
- Prioritize fixes

### Regression Testing
- Test after each major feature addition
- Verify existing functionality still works
- Check for new accessibility issues

### Pre-Release Testing
- Complete full accessibility audit
- Test with multiple screen readers
- Verify all WCAG 2.1 AA compliance

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [NVDA User Guide](https://www.nvaccess.org/about-nvda/)
- [JAWS Documentation](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver Guide](https://www.apple.com/accessibility/vision/)

---

## Notes

- Screen reader testing should be done regularly, not just before release
- Different screen readers may behave differently - test with multiple
- User feedback is valuable - consider reaching out to screen reader users
- Accessibility is an ongoing process, not a one-time check

---

**Last Updated**: 2025-01-20

