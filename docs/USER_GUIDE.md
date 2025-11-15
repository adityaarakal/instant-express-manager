# User Guide - Instant Express Manager

## Getting Started

### First Launch

When you first open the app, you'll see the Dashboard with summary metrics. Start by creating your first bank and bank account to begin managing your finances.

### Navigation

The app has the following main pages:
- **Dashboard**: Overview of your financial health
- **Banks**: Manage your banks
- **Accounts**: Manage your bank accounts
- **Transactions**: Track income, expenses, and savings/investments
- **EMIs**: Manage your EMIs
- **Recurring**: Set up recurring transactions
- **Planner**: Monthly financial planning
- **Analytics**: Financial analytics and insights
- **Settings**: Configure app preferences

## Banks

### Creating a Bank

1. Navigate to the **Banks** page
2. Click the **Add Bank** button
3. Fill in the form:
   - **Name**: Bank name (e.g., "ICICI Bank", "HDFC Bank")
   - **Type**: Bank, Credit Card, or Wallet
   - **Country**: Optional country name
   - **Notes**: Optional notes
4. Click **Save**

### Editing a Bank

1. Click the **Edit** icon next to the bank you want to edit
2. Modify the fields
3. Click **Save**

### Deleting a Bank

1. Click the **Delete** icon next to the bank
2. Confirm the deletion
3. **Note**: You cannot delete a bank if it has associated accounts

## Bank Accounts

### Creating a Bank Account

1. Navigate to the **Accounts** page
2. Click the **Add Account** button
3. Fill in the form:
   - **Account Name**: Name for this account (e.g., "ICICI 3945")
   - **Bank**: Select the bank from the dropdown
   - **Account Type**: Savings, Current, Credit Card, or Wallet
   - **Account Number**: Optional account number
   - **Current Balance**: Starting account balance (will be updated automatically as you add transactions)
   - **Credit Limit**: For credit cards only
   - **Outstanding Balance**: For credit cards only
   - **Statement Date**: For credit cards
   - **Due Date**: For credit cards
   - **Notes**: Optional notes
4. Click **Save**

**Note**: Account balances automatically update when you mark transactions as "Received", "Paid", or "Completed". You can also manually update the balance if needed.

### Editing an Account

1. Click the **Edit** icon next to the account
2. Modify the fields
3. Click **Save**

### Deleting an Account

1. Click the **Delete** icon next to the account
2. Confirm the deletion
3. **Note**: You cannot delete an account if it has associated transactions

## Transactions

### Creating a Transaction

1. Navigate to the **Transactions** page
2. Select the appropriate tab (Income, Expense, or Savings/Investment)
3. Click the **Add Transaction** button
4. Fill in the form:
   - **Date**: Transaction date
   - **Amount**: Transaction amount
   - **Account**: Select the account
   - **Category/Type**: Select the category or type
   - **Description**: Optional description
   - **Status**: Pending or Received/Paid/Completed
     - **Income**: Default status is "Received" (can change to "Pending")
     - **Expense**: Default status is "Pending" (can change to "Paid")
     - **Savings/Investment**: Default status is "Pending" (can change to "Completed")
   - **Recurring Template**: If part of a recurring transaction
   - **EMI**: If part of an EMI
   - Additional fields based on transaction type
5. Click **Save**

**Automatic Balance Updates**: When you mark a transaction as:
- **"Received"** (Income): The account balance **increases** by the transaction amount
- **"Paid"** (Expense): The account balance **decreases** by the transaction amount
- **"Completed"** (Savings/Investment): The account balance **decreases** by the transaction amount

If you change a transaction's status back to "Pending", the balance change is automatically reversed. When you delete a transaction that was marked as "Received", "Paid", or "Completed", the balance change is also reversed.

### Filtering Transactions

Use the filter bar to:
- **Search**: Search by description
- **Date Range**: Filter by date from/to
- **Account**: Filter by account
- **Category**: Filter by category
- **Status**: Filter by status

### Understanding Transaction Status and Balance Updates

The app automatically updates account balances based on transaction status:

**Income Transactions:**
- **"Received"**: Account balance increases by the transaction amount
- **"Pending"**: No balance change (transaction planned but not yet received)

**Expense Transactions:**
- **"Paid"**: Account balance decreases by the transaction amount
- **"Pending"**: No balance change (expense planned but not yet paid)

**Savings/Investment Transactions:**
- **"Completed"**: Account balance decreases by the transaction amount (money moved out of account)
- **"Pending"**: No balance change (savings/investment planned but not yet completed)

**Important Notes:**
- Balance updates happen automatically when you create, update, or delete transactions
- If you change a transaction's status (e.g., "Received" to "Pending"), the balance change is automatically reversed
- If you change a transaction's amount, the balance adjusts by the difference
- If you move a transaction to a different account, both accounts' balances are updated correctly
- You can always manually update an account's balance in the Accounts page if needed

**Auto-Generated Transactions (EMIs & Recurring Templates):**
- Auto-generated transactions from EMIs and Recurring templates are created with status "Pending" by default
- This is intentional - they represent planned transactions that haven't been confirmed yet
- When you mark an auto-generated transaction as "Received" (income), "Paid" (expense), or "Completed" (savings/investment), the balance will update automatically
- Until then, the balance remains unchanged because the transaction is still "Pending"

### Bulk Operations

1. Select multiple transactions using checkboxes
2. Use the bulk action buttons:
   - **Mark as Received/Paid/Completed**: Update status for all selected
   - **Delete**: Delete all selected transactions

### Exporting Transactions

1. Apply any filters you want
2. Click the **Export CSV** button
3. The filtered transactions will be exported to a CSV file

## EMIs

### Creating an EMI

1. Navigate to the **EMIs** page
2. Select the appropriate tab (Expense or Savings/Investment)
3. Click the **Add EMI** button
4. Fill in the form:
   - **Name**: EMI name (e.g., "Home Loan EMI")
   - **Start Date**: EMI start date
   - **End Date**: EMI end date (optional)
   - **Amount**: EMI amount
   - **Account**: Select the account
   - **Frequency**: Monthly or Quarterly
   - **Total Installments**: Total number of installments
   - **Category**: For expense EMIs
   - **Credit Card**: For credit card EMIs
   - **Destination**: For savings/investment EMIs
   - **Notes**: Optional notes
5. Click **Save**

### Managing EMIs

- **Pause/Resume**: Click the pause/resume button to pause or resume an EMI
- **View Transactions**: Click the transaction count to view generated transactions
- **Edit**: Click the edit icon to modify the EMI
- **Delete**: Click the delete icon to remove the EMI (only if no transactions are linked)

### Auto-Generation

EMIs automatically generate transactions based on their schedule. Generated transactions appear in the Transactions page.

## Recurring Transactions

### Creating a Recurring Template

1. Navigate to the **Recurring** page
2. Select the appropriate tab (Income, Expense, or Savings/Investment)
3. Click the **Add Recurring** button
4. Fill in the form:
   - **Name**: Template name (e.g., "Monthly Salary")
   - **Amount**: Transaction amount
   - **Account**: Select the account
   - **Frequency**: Monthly, Weekly, Quarterly, Yearly, or Custom
   - **Start Date**: Start date
   - **End Date**: End date (optional)
   - **Category/Type**: Select category or type
   - Additional fields based on type
   - **Notes**: Optional notes
5. Click **Save**

### Managing Recurring Templates

- **Pause/Resume**: Click the pause/resume button to pause or resume generation
- **View Transactions**: Click the transaction count to view generated transactions
- **Edit**: Click the edit icon to modify the template
- **Delete**: Click the delete icon to remove the template (only if no transactions are linked)

### Auto-Generation

Recurring templates automatically generate transactions based on their frequency. Generated transactions appear in the Transactions page.

## Planner

### Using the Planner

1. Navigate to the **Planner** page
2. Select a month from the dropdown
3. View the aggregated financial data for that month:
   - **Account Breakdown**: See allocations per account
   - **Bucket Totals**: See totals by expense bucket
   - **Status Tracking**: Track pending vs paid status

### Understanding the Planner

The Planner aggregates data from your transactions, EMIs, and recurring templates to show:
- Total income for the month
- Total expenses by category
- Total savings/investments
- Account-wise breakdown

## Dashboard

### Overview Metrics

- **Total Income**: Sum of all income transactions
- **Total Expenses**: Sum of all expense transactions
- **Total Savings**: Sum of all savings/investment transactions
- **Upcoming Due Dates**: Credit card due dates within 30 days

### Charts

- **Savings Trend**: Monthly savings over time
- **Expense Breakdown**: Expenses by category
- **Income Trends**: Income over time

## Analytics

### Available Analytics

- **Income Trends**: Track income over time
- **Expense Breakdown**: See expenses by category
- **Budget vs Actual**: Compare planned vs actual spending
- **Credit Card Analysis**: Analyze credit card usage
- **Savings Progress**: Track savings goals
- **Investment Performance**: Track investment returns

## Settings

### Appearance

- **Theme**: Choose Light, Dark, or System preference
- Theme applies immediately across the app

### Currency & Defaults

- **Base Currency**: Select your preferred currency
- **Default Fixed Factor**: Set the default fixed factor for new months

### Data Management

- **Data Backup**: Export all your data to a JSON file
- **Data Restore**: Import data from a backup file (replace or merge)
- **Data Health Check**: Identify and fix data inconsistencies

### Saving Changes

- Click **Save Changes** to persist your settings
- Click **Reset to Defaults** to restore original values

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: Create new item (transaction/EMI/recurring)
- `Ctrl/Cmd + K`: Focus search/filter (Transactions page)
- `Ctrl/Cmd + S`: Save form (when in a dialog)
- `Esc`: Close dialog
- `?`: Show keyboard shortcuts help

## Tips & Best Practices

1. **Start with Banks**: Create your banks first, then accounts
2. **Regular Updates**: Update transactions regularly for accurate tracking
3. **Use Recurring Templates**: Set up recurring transactions to save time
4. **EMI Management**: Create EMIs to automatically track installment payments
5. **Data Backup**: Regularly backup your data using the Settings page
6. **Data Health**: Use Data Health Check to identify and fix issues
7. **Filters**: Use filters to find specific transactions quickly
8. **Bulk Operations**: Use bulk operations for efficient transaction management

## Troubleshooting

### Data Not Showing

- Refresh the page
- Check browser console for errors
- Verify IndexedDB is enabled in browser settings
- Use Data Health Check in Settings to identify issues

### Changes Not Saving

- Ensure you click "Save" in dialogs
- Check for validation errors (red text)
- Verify you have at least one bank account created

### Performance Issues

- Use pagination for large transaction lists
- Clear browser cache if the app feels slow
- Check browser console for errors
- Use Data Health Check to identify orphaned records

### Can't Delete Item

- Ensure no other entities reference the item you're trying to delete
- Check the error message for specific details
- Use Data Health Check to identify relationships

### Undo Functionality

- Deleted items can be restored within 10 minutes
- Click the "Undo" button in the toast notification
- After 10 minutes, items are permanently deleted

## Data Backup & Restore

### Exporting Data

1. Navigate to **Settings**
2. Scroll to **Data Backup & Restore**
3. Click **Export Backup**
4. A JSON file will be downloaded with all your data

### Importing Data

1. Navigate to **Settings**
2. Scroll to **Data Backup & Restore**
3. Click **Import Backup**
4. Select your backup file
5. Choose **Replace** (replace all data) or **Merge** (add new data)
6. Click **Confirm Import**

**Warning**: Replace mode will delete all existing data!
