# Data Backup & Recovery Feature

## Overview

The Data Backup & Recovery feature provides comprehensive backup management for the Instant Expense Manager application. It includes automatic daily backups, manual backup creation, backup history tracking, and restore functionality.

## Features

### 1. Automatic Daily Backups
- **Enabled/Disabled**: Users can enable or disable automatic backups in Settings
- **Schedule**: Backups are created automatically once per day (at midnight)
- **Storage**: Backups are stored locally in IndexedDB
- **Retention**: Configurable retention period (7, 14, 30, 60, 90 days, or forever)

### 2. Manual Backup Creation
- **On-Demand**: Users can create backups manually at any time
- **Metadata**: Each backup includes:
  - Name (auto-generated or custom)
  - Timestamp
  - Version (app version when backup was created)
  - Type (manual or automatic)
  - Description (optional)
  - Size

### 3. Backup History
- **Storage**: Up to 50 backups are kept in history
- **View**: Users can view all backups in a table with:
  - Name and description
  - Type (manual/automatic)
  - Date and time
  - App version
  - File size
- **Sorting**: Backups are sorted by timestamp (newest first)

### 4. Restore Functionality
- **Select Backup**: Users can restore from any backup in history
- **Restore Modes**:
  - **Replace Mode**: Replaces all existing data with backup data
  - **Merge Mode**: Merges backup data with existing data (avoids duplicates by ID)
- **Version Migration**: Automatically handles version differences and shows warnings if needed

### 5. Backup Management
- **Download**: Export any backup as a JSON file
- **Delete**: Remove individual backups
- **Clear All**: Delete all backups at once
- **Size Tracking**: Shows total size of all backups

### 6. Automatic Cleanup
- **Retention Policy**: Old backups are automatically deleted based on retention settings
- **Configurable**: Users can set retention period (7-90 days or forever)
- **Background Process**: Cleanup runs automatically when retention settings change

## Implementation Details

### Files Created/Modified

#### New Files
1. **`frontend/src/store/useBackupStore.ts`**
   - Zustand store for managing backup metadata
   - Stores backup entries in Zustand persist
   - Stores backup data in IndexedDB via localforage

2. **`frontend/src/hooks/useAutomaticBackups.ts`**
   - Hook to manage automatic daily backups
   - Checks if backups are enabled
   - Creates backup once per day
   - Tracks last backup date in localStorage

3. **`frontend/src/hooks/useBackupCleanup.ts`**
   - Hook to automatically clean up old backups
   - Runs when retention settings change
   - Deletes backups older than retention period

4. **`frontend/src/components/settings/BackupManagement.tsx`**
   - Main UI component for backup management
   - Displays backup history table
   - Handles create, restore, delete, and download actions
   - Shows automatic backup settings

5. **`frontend/src/utils/formatBytes.ts`**
   - Utility function to format bytes to human-readable size

#### Modified Files
1. **`frontend/src/types/plannedExpenses.ts`**
   - Added `automaticBackups?: boolean` to Settings interface
   - Added `backupRetentionDays?: number` to Settings interface

2. **`frontend/src/store/useSettingsStore.ts`**
   - Added default values for `automaticBackups` (false) and `backupRetentionDays` (30)

3. **`frontend/src/pages/Settings.tsx`**
   - Replaced old backup section with `BackupManagement` component
   - Removed unused `currentBackupInfo` variable

4. **`frontend/src/App.tsx`**
   - Added `useAutomaticBackups()` hook initialization
   - Added `useBackupCleanup()` hook initialization

## Usage

### Enabling Automatic Backups

1. Navigate to **Settings** page
2. Scroll to **Data Backup & Recovery** section
3. Toggle **"Enable Automatic Daily Backups"** switch
4. (Optional) Select **Backup Retention** period
5. Backups will be created automatically once per day

### Creating Manual Backup

1. Navigate to **Settings** page
2. Scroll to **Data Backup & Recovery** section
3. Click **"Create Backup"** button
4. Backup will be created and added to history

### Restoring from Backup

1. Navigate to **Settings** page
2. Scroll to **Data Backup & Recovery** section
3. Find the backup you want to restore in the table
4. Click the **Restore** icon (↩️)
5. Choose restore mode:
   - **Replace existing data**: Replaces all current data
   - **Merge with existing data**: Merges backup data (default)
6. Click **"Restore"** button

### Downloading Backup

1. Navigate to **Settings** page
2. Scroll to **Data Backup & Recovery** section
3. Find the backup you want to download
4. Click the **Download** icon (⬇️)
5. Backup will be downloaded as a JSON file

### Deleting Backup

1. Navigate to **Settings** page
2. Scroll to **Data Backup & Recovery** section
3. Find the backup you want to delete
4. Click the **Delete** icon (🗑️)
5. Confirm deletion in the dialog

## Storage

### Backup Metadata
- Stored in Zustand persist (localStorage via localforage)
- Maximum 50 backups in history
- Each entry includes: id, name, timestamp, version, size, type, description

### Backup Data
- Stored in IndexedDB via localforage
- Key format: `backup_{id}`
- Contains complete application state:
  - Banks
  - Bank Accounts
  - Income Transactions
  - Expense Transactions
  - Savings/Investment Transactions
  - Expense EMIs
  - Savings/Investment EMIs
  - Recurring Incomes
  - Recurring Expenses
  - Recurring Savings/Investments

## Technical Notes

### Backup Format
Backups are stored as JSON files with the following structure:
```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "data": {
    "banks": [...],
    "bankAccounts": [...],
    "incomeTransactions": [...],
    "expenseTransactions": [...],
    "savingsInvestmentTransactions": [...],
    "expenseEMIs": [...],
    "savingsInvestmentEMIs": [...],
    "recurringIncomes": [...],
    "recurringExpenses": [...],
    "recurringSavingsInvestments": [...]
  }
}
```

### Automatic Backup Timing
- Automatic backups are created once per day
- The hook checks every hour if a backup needs to be created
- Backup is created if:
  - Automatic backups are enabled
  - No backup was created today
  - Last backup date is not today

### Cleanup Process
- Runs automatically when:
  - Component mounts
  - Retention settings change
  - Backups list changes
- Deletes backups older than retention period
- If retention is set to 0, all backups are kept forever

## Future Enhancements

Potential improvements:
1. **Cloud Backup**: Sync backups to cloud storage (Google Drive, Dropbox, etc.)
2. **Backup Encryption**: Encrypt sensitive backup data
3. **Scheduled Backups**: Allow users to schedule backups at specific times
4. **Backup Compression**: Compress backups to save storage space
5. **Backup Verification**: Verify backup integrity before restore
6. **Incremental Backups**: Only backup changes since last backup
7. **Backup Notifications**: Notify users when automatic backups are created
8. **Backup Analytics**: Show backup frequency and size trends

## Related Features

- **Export History**: Tracks when backups are exported (separate from backup history)
- **Data Integrity**: Ensures backup data is valid before restore
- **Version Migration**: Handles version differences during restore

