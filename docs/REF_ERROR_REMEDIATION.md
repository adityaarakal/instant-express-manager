# #REF! Error Remediation Feature

## Overview

The #REF! Error Remediation feature helps identify and fix months where remaining cash calculations are missing or incorrect. This is particularly useful for fixing data migration issues where remaining cash couldn't be calculated from available transaction data.

## Problem Statement

During data migration from Excel, some months (up to 18 months) had incomplete remaining cash calculations due to #REF! errors. These errors occurred when:
- Transaction data was missing for certain months
- Account data was incomplete
- Calculation dependencies were broken

## Solution

The remediation tool provides:
1. **Automatic scanning** - Identifies all months with #REF! errors
2. **Auto-calculation** - Recalculates remaining cash from available transaction data
3. **Manual overrides** - Allows setting manual remaining cash values when auto-calculation isn't possible
4. **Validation report** - Shows detailed information about affected months and missing data

## Features

### 1. Error Scanning

The tool scans all available months and identifies:
- Accounts with null/undefined remaining cash
- Accounts with discrepancies between stored and calculated values
- Missing transaction data that prevents calculation

### 2. Auto-Fix Capability

For issues that can be auto-fixed:
- System recalculates remaining cash from available transactions
- Automatically applies correct values
- Verifies calculation accuracy

### 3. Manual Overrides

For issues that cannot be auto-fixed (due to missing transaction data):
- Users can set manual override values
- Overrides are stored separately and take precedence over calculations
- Individual overrides can be edited or cleared

### 4. Validation Report

The report shows:
- Total months scanned
- Affected months count
- Total issues found
- Fixable vs non-fixable issues
- Date range of affected months
- Transaction data availability for each issue

## Implementation Details

### Store: `useRemainingCashOverridesStore`

Stores manual overrides for remaining cash values:
- `overrides`: Record of monthId -> accountId -> remainingCash
- `setOverride()`: Set or update an override
- `getOverride()`: Get override value for a month/account
- `clearOverride()`: Remove a specific override
- `clearAllOverrides()`: Clear all overrides
- `clearOverridesForMonth()`: Clear all overrides for a month

### Utility: `refErrorRemediation.ts`

Core functions:
- `scanRefErrors()`: Scans and identifies all #REF! errors
- `applyRefErrorFixes()`: Applies fixes (auto-calculate or set overrides)
- `getRefErrorSummary()`: Gets summary statistics
- `setRemainingCashOverride()`: Sets a manual override
- `getRemainingCashOverride()`: Gets a manual override

### Integration: `aggregation.ts`

The aggregation function checks for manual overrides before calculating remaining cash:
1. First checks if a manual override exists
2. If override exists, uses that value
3. Otherwise, calculates from transactions

## Usage

### Accessing the Tool

1. Navigate to **Settings** page
2. Scroll to **Data Management** section
3. Click **"Fix #REF! Errors"** button

### Using the Tool

1. **Scan for Errors**
   - Click "Re-scan" to scan all months
   - Review the summary statistics
   - Review the detailed issues table

2. **Auto-Fix Issues**
   - Click "Fix X Issues" button
   - System will auto-calculate and fix fixable issues
   - Results will be shown in a toast notification

3. **Manual Override**
   - For non-fixable issues, click the edit icon
   - Enter the desired remaining cash value
   - Click save to apply the override

4. **Apply Overrides for Non-Fixable**
   - Check "Apply calculated values as overrides for non-fixable issues"
   - Click "Fix X Issues" to apply calculated values as overrides

## Data Flow

```
User clicks "Fix #REF! Errors"
    ↓
Dialog opens and auto-scans
    ↓
Shows summary and issues table
    ↓
User clicks "Fix X Issues"
    ↓
For fixable issues:
    - System recalculates from transactions
    - Values are automatically correct
    ↓
For non-fixable issues (if override option checked):
    - Calculated values are stored as overrides
    - Overrides take precedence in aggregation
    ↓
Re-scan to verify fixes
```

## Technical Notes

### Override Precedence

When calculating remaining cash in `aggregation.ts`:
1. Check for manual override first
2. If override exists (including null), use it
3. Otherwise, calculate from transactions

### Storage

- Overrides are stored in IndexedDB via Zustand persist
- Storage key: `remaining-cash-overrides`
- Version: 1

### Performance

- Scanning is done synchronously but is fast
- Only scans months that have transaction data
- Re-aggregation is done on-demand

## Future Enhancements

Potential improvements:
1. Bulk edit mode for multiple overrides
2. Export/import override data
3. Validation rules for override values
4. History tracking for override changes
5. Automatic detection of when overrides are no longer needed

## Related Files

- `frontend/src/store/useRemainingCashOverridesStore.ts` - Override storage
- `frontend/src/utils/refErrorRemediation.ts` - Core remediation logic
- `frontend/src/utils/aggregation.ts` - Integration with aggregation
- `frontend/src/components/common/RefErrorRemediationDialog.tsx` - UI component
- `frontend/src/pages/Settings.tsx` - Settings page integration

