# User Guide - Planned Expenses Manager

## Getting Started

### First Launch

When you first open the app, you'll see the Dashboard with summary metrics. The app comes pre-loaded with historical data from your Excel spreadsheet.

### Navigation

- **Dashboard**: Overview of all your financial metrics
- **Planner**: Month-by-month expense planning
- **Settings**: Configure app preferences

## Using the Planner

### Selecting a Month

1. Navigate to the **Planner** page
2. Use the dropdown at the top to select a month
3. The month view will display all account allocations

### Understanding the Month View

- **Month Header**: Shows the month name, total inflow, and fixed factor
- **Status Ribbon**: Displays all buckets with their current status (Pending/Paid)
- **Account Table**: Lists all accounts with their allocations
- **Totals Footer**: Summary of bucket totals

### Editing Allocations

1. **Click any editable cell** (Fixed Balance, Savings, or Bucket amounts)
2. **Enter the new value** (currency symbol is automatic)
3. **Press Enter** to save or **Escape** to cancel
4. **Remaining Cash** is automatically recalculated

### Toggling Status

- **Click a bucket status chip** in the Status Ribbon
- Status toggles between **Pending** (outlined) and **Paid** (filled green)
- Totals automatically update to reflect the change

### Editing Month Metadata

- **Inflow**: Edit the total inflow amount in the month header
- **Fixed Factor**: Edit the fixed factor value
- Changes automatically recalculate remaining cash for all accounts

## Dashboard Overview

### Summary Cards

- **Pending Allocations**: Total amount pending across all buckets and months
- **Total Savings**: Sum of all savings transfers
- **Credit Card Bills**: Total CC bill amounts

### Due Soon Reminders

- Shows upcoming due dates within the next 30 days
- Color-coded by urgency:
  - **Red**: Due within 7 days
  - **Orange**: Due within 14 days
  - **Gray**: Due within 30 days

### Savings Trend

- Displays total savings and monthly average for the last 12 months
- Only shown if you have data for recent months

## Settings

### Appearance

- **Theme**: Choose Light, Dark, or System preference
- Theme applies immediately across the app

### Currency & Defaults

- **Base Currency**: Select your preferred currency
- **Default Fixed Factor**: Set the default fixed factor for new months

### Bucket Definitions

- **Edit bucket names**: Change how buckets are displayed
- **Set default status**: Choose whether buckets default to Pending or Paid
- **Note**: Bucket colors are fixed for visual consistency

### Reminders

- **Enable/Disable**: Toggle due date reminders on/off

### Saving Changes

- Click **Save Changes** to persist your settings
- Click **Reset to Defaults** to restore original values

## Tips & Best Practices

1. **Regular Updates**: Update allocations as you make payments
2. **Status Tracking**: Mark buckets as Paid when you complete payments
3. **Review Dashboard**: Check the dashboard weekly to monitor pending allocations
4. **Due Dates**: Pay attention to the Due Soon reminders to avoid late payments
5. **Data Backup**: Your data is stored locally - consider exporting periodically

## Keyboard Shortcuts

- **Enter**: Save edited cell
- **Escape**: Cancel editing
- **Click**: Edit any editable cell

## Troubleshooting

### Data Not Showing

- Refresh the page
- Check browser console for errors
- Verify IndexedDB is enabled

### Changes Not Saving

- Ensure you click "Save Changes" in Settings
- For Planner edits, changes save automatically on Enter

### Performance Issues

- Clear browser cache if the app feels slow
- Check browser console for errors

