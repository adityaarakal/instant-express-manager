# Storage Cleanup Guide

**Purpose**: Storage cleanup strategies and utilities for managing data retention  
**Created**: 2025-01-15  
**Status**: ✅ **IMPLEMENTED**

---

## 🎯 Overview

The Instant Express Manager application includes comprehensive storage cleanup utilities to help manage IndexedDB storage usage over time. These utilities allow users to delete old data, implement data retention policies, and optimize storage usage while maintaining data integrity.

---

## ✅ Features

### 1. Data Retention Policies
- **Delete old transactions**: Remove transactions older than a specified date
- **Delete old completed EMIs**: Remove completed EMIs with end date older than a specified date
- **Delete expired recurring templates**: Remove recurring templates with end date in the past
- **Delete old undo history**: Remove undo history items older than a specified date or limit to max items
- **Delete old export history**: Remove export history items older than a specified date or limit to max items

### 2. Storage Statistics
- **Item counts**: View counts of all data types (transactions, EMIs, templates, undo items, export history)
- **Real-time statistics**: Statistics update automatically after cleanup operations

### 3. Safe Cleanup
- **Warning alerts**: Users are warned about data loss before cleanup
- **Detailed results**: Cleanup results show exactly what was deleted
- **Error handling**: Errors are captured and reported without stopping cleanup
- **Validation**: Options are validated before cleanup runs

### 4. Configuration UI
- **Date pickers**: Easy date selection for transaction/EMI cleanup
- **Max items limits**: Configure maximum items to keep for undo/export history
- **Toggle options**: Enable/disable expired template deletion
- **Results display**: Show cleanup results with item counts

---

## 🔧 Implementation

### Files Created
- `frontend/src/utils/storageCleanup.ts` - Core storage cleanup utility
- `frontend/src/components/common/StorageCleanupDialog.tsx` - Cleanup configuration UI

### Files Updated
- `frontend/src/pages/Settings.tsx` - Added Storage Cleanup section

---

## 📊 Usage

### Configure Storage Cleanup (Settings Page)

1. Navigate to **Settings** page
2. Scroll to **Storage Cleanup** section
3. View current storage statistics (transactions, EMIs, templates, undo items, export history)
4. Click **"Configure Storage Cleanup"** button
5. Configure cleanup options:
   - **Delete Transactions Older Than**: Select a date to delete all transactions older than this date
   - **Delete Completed EMIs Older Than**: Select a date to delete completed EMIs with end date older than this date
   - **Delete Expired Recurring Templates**: Toggle to delete recurring templates with end date in the past
   - **Maximum Undo Items**: Set maximum number of undo items to keep (default: 50)
   - **Maximum Export History Items**: Set maximum number of export history items to keep (default: 100)
6. Click **"Run Cleanup"** button
7. Review cleanup results

### Storage Cleanup Options

```typescript
interface CleanupOptions {
  /** Delete transactions older than this date (ISO string or Date) */
  deleteTransactionsOlderThan?: string | Date;
  /** Delete completed EMIs older than this date (ISO string or Date) */
  deleteCompletedEMIsOlderThan?: string | Date;
  /** Delete expired recurring templates (templates with endDate in the past) */
  deleteExpiredRecurringTemplates?: boolean;
  /** Delete undo history older than this date (ISO string or Date) */
  deleteUndoHistoryOlderThan?: string | Date;
  /** Delete export history older than this date (ISO string or Date) */
  deleteExportHistoryOlderThan?: string | Date;
  /** Maximum number of undo items to keep (delete oldest if exceeded) */
  maxUndoItems?: number;
  /** Maximum number of export history items to keep (delete oldest if exceeded) */
  maxExportHistoryItems?: number;
}
```

### Example Usage

```typescript
import { cleanupStorage, getStorageStatistics } from '../utils/storageCleanup';

// Get current storage statistics
const stats = await getStorageStatistics();
console.log('Transactions:', stats.transactions);
console.log('EMIs:', stats.emis);
console.log('Recurring Templates:', stats.recurringTemplates);
console.log('Undo Items:', stats.undoItems);
console.log('Export History:', stats.exportHistoryItems);

// Clean up old data
const result = await cleanupStorage({
  deleteTransactionsOlderThan: new Date('2020-01-01'),
  deleteCompletedEMIsOlderThan: new Date('2023-01-01'),
  deleteExpiredRecurringTemplates: true,
  maxUndoItems: 50,
  maxExportHistoryItems: 100,
});

console.log('Total deleted:', result.totalDeleted);
console.log('Transactions deleted:', result.transactionsDeleted);
console.log('EMIs deleted:', result.emisDeleted);
console.log('Errors:', result.errors);
```

---

## 🔒 Data Safety

### Warning System
- **Irreversible operations**: Users are warned that cleanup is irreversible
- **Backup recommendation**: Users are advised to export backups before cleanup
- **Data loss warnings**: Clear warnings about what data will be deleted

### Error Handling
- **Partial failures**: If one item fails to delete, cleanup continues with other items
- **Error reporting**: All errors are captured and reported to the user
- **Safe defaults**: Default options are conservative (only expired templates, max items limits)

### Data Integrity
- **Transaction safety**: Deletes go through store methods to maintain data integrity
- **Balance updates**: Account balances are automatically updated when transactions are deleted
- **Relationship checks**: Related data (e.g., transactions from recurring templates) are handled appropriately

---

## 📝 Cleanup Strategies

### 1. Transaction Cleanup
- **Use case**: Remove old transactions that are no longer needed
- **Safety**: Only delete transactions older than a specific date
- **Impact**: Account balances are automatically recalculated
- **Recommendation**: Keep at least 1-2 years of transaction history

### 2. EMI Cleanup
- **Use case**: Remove completed EMIs that are no longer needed
- **Safety**: Only delete completed EMIs with end date older than a specific date
- **Impact**: Completed EMIs are historical records, safe to delete
- **Recommendation**: Keep completed EMIs for 1 year after completion

### 3. Recurring Template Cleanup
- **Use case**: Remove expired recurring templates (templates with end date in the past)
- **Safety**: Only delete templates with end date in the past
- **Impact**: Historical templates are removed, but generated transactions remain
- **Recommendation**: Delete expired templates regularly to reduce clutter

### 4. Undo History Cleanup
- **Use case**: Limit undo history to prevent storage bloat
- **Safety**: Keep only the newest N items, delete oldest if exceeded
- **Impact**: Old undo history is removed (items can't be restored after 10 minutes anyway)
- **Recommendation**: Keep 50-100 undo items maximum

### 5. Export History Cleanup
- **Use case**: Limit export history to prevent storage bloat
- **Safety**: Keep only the newest N items, delete oldest if exceeded
- **Impact**: Old export history is removed (this is just metadata)
- **Recommendation**: Keep 100-200 export history items maximum

---

## 🎯 API Reference

### Functions

#### `cleanupStorage(options: CleanupOptions): Promise<CleanupResult>`
Run storage cleanup with specified options. Returns results including counts of deleted items and any errors.

#### `getStorageStatistics(): Promise<StorageStatistics>`
Get current storage statistics (counts of all data types).

---

## ✅ Task Completion

### Task 3.5.2: Storage Cleanup Strategies ✅
- ✅ Created `storageCleanup.ts` utility
- ✅ Data retention policies (delete old transactions, completed EMIs by date)
- ✅ Expired recurring templates deletion (templates with endDate in past)
- ✅ Undo history limits (max items, oldest deleted first)
- ✅ Export history limits (max items, oldest deleted first)
- ✅ Storage statistics (counts of all data types)
- ✅ StorageCleanupDialog component (configuration UI, cleanup results)
- ✅ Integrated into Settings page (statistics display, cleanup button)

---

## 🎯 Benefits

1. **Storage Management**: Free up storage space by removing old data
2. **Performance**: Improve app performance by reducing data size
3. **Flexibility**: Configurable cleanup options for different use cases
4. **Safety**: Warning system and error handling protect against data loss
5. **Statistics**: Real-time view of storage usage
6. **User-Friendly**: Simple UI in Settings page

---

## 📝 Notes

- Cleanup operations are **irreversible** - make sure to export backups before cleanup
- Account balances are automatically updated when transactions are deleted
- Completed EMIs can be safely deleted as they are historical records
- Expired recurring templates are safe to delete (generated transactions remain)
- Undo history is limited to 10 minutes anyway, so old items can be safely deleted
- Export history is just metadata, safe to delete old entries

---

**Last Updated**: 2025-01-15  
**Status**: ✅ **COMPLETED**

