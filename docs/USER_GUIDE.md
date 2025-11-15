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
- **Search**: Search by description (and account names for transfers)
- **Date Range**: Filter by date from/to
- **Account**: Filter by account (for transfers, matches From or To account)
- **Category**: Filter by category/type
- **Status**: Filter by status

### Internal Account Transfers

The **Transfers** tab allows you to track money movements between your own accounts. This is different from income (money coming in from external sources) or expenses (money going out to external parties).

**Creating a Transfer:**
1. Navigate to the **Transactions** page
2. Click the **Transfers** tab
3. Click **Add Transfer**
4. Fill in the form:
   - **Date**: Transfer date
   - **From Account**: Source account (cannot be a Credit Card)
   - **To Account**: Destination account
   - **Amount**: Transfer amount
   - **Category**: Account Maintenance, Credit Card Payment, Fund Rebalancing, Loan Repayment, or Other
   - **Description**: Description of the transfer
   - **Status**: Pending or Completed
   - **Notes**: Optional notes
5. Click **Save**

**Transfer Rules:**
- **From Account** cannot be a Credit Card (credit cards receive payments, not send)
- **To Account** can be any account type, including Credit Cards (for paying off debt)
- From and To accounts must be different
- Transfers do NOT appear in income or expense calculations
- Transfers DO affect account balances when status is "Completed"

**Transfer Balance Updates:**
- When status changes from "Pending" to "Completed":
  - **From Account**: Balance decreases by transfer amount
  - **To Account**: Balance increases by transfer amount
- When status changes from "Completed" to "Pending":
  - Balance changes are automatically reversed
- When transfer is deleted:
  - If status was "Completed", balance changes are reversed
  - If status was "Pending", no balance change needed

**Use Cases:**
- **Credit Card Payment**: Transfer from Savings to Credit Card to pay off debt
- **Account Maintenance**: Move money between savings accounts
- **Fund Rebalancing**: Reallocate funds across accounts
- **Loan Repayment**: Pay off a loan from another account

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

**Transfer Transactions:**
- **"Completed"**: From account balance decreases, To account balance increases
- **"Pending"**: No balance change on either account

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

**Syncing Existing Data:**
- If you have old data created before automatic balance updates were implemented, you can sync account balances
- Go to **Settings** → **Balance Sync** section
- Click **"Sync Account Balances"** to recalculate all account balances based on existing transactions
- This will update account balances to reflect all transactions with "Received", "Paid", or "Completed" status
- The sync tool shows a detailed report of which accounts were updated and by how much

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

**When to Use EMIs**: EMIs are for **fixed-term commitments with a known end date**. Use EMIs when you have a payment with a fixed number of installments (e.g., 12, 24, 36) that tracks progress toward completion. Examples: Home loans, car loans, credit card EMIs, personal loans.

> 💡 **Note**: If your payment is ongoing without a fixed end date, use **Recurring Templates** instead (for subscriptions, utility bills, salary, etc.)

### Creating an EMI

1. Navigate to the **EMIs** page
2. An informational alert at the top explains when to use EMIs vs Recurring Templates
3. Select the appropriate tab (Expense or Savings/Investment)
4. Click the **Add EMI** button
5. Fill in the form:
   - **Name**: EMI name (e.g., "Home Loan EMI")
   - **Start Date**: EMI start date
   - **End Date**: EMI end date (required for EMIs)
   - **Amount**: EMI amount per installment
   - **Account**: Select the account
   - **Frequency**: Monthly or Quarterly
   - **Total Installments**: Total number of installments (e.g., 12, 24, 36)
   - **Category**: For expense EMIs (CCEMI, Loan, Other)
   - **Credit Card**: For credit card EMIs (optional)
   - **Destination**: For savings/investment EMIs
   - **Notes**: Optional notes
6. Click **Save**

### Managing EMIs

- **Pause/Resume**: Click the pause/resume button to pause or resume an EMI
- **View Transactions**: Click the transaction count to view generated transactions
- **Progress Tracking**: See "X / Y installments" progress bar showing completion status
- **Edit**: Click the edit icon to modify the EMI
- **Delete**: Click the delete icon to remove the EMI (only if no transactions are linked)

### Auto-Generation

EMIs automatically generate transactions based on their schedule until all installments are completed. Generated transactions appear in the Transactions page with status "Pending" by default.

**Key Features**:
- Tracks progress: Shows "X of Y installments" completed
- Fixed term: Requires an end date
- Progress indicator: Visual progress bar shows completion percentage

## Recurring Transactions

**When to Use Recurring Templates**: Recurring Templates are for **ongoing/repeating transactions** that may or may not have an end date. Use Recurring Templates when you have regular income, subscriptions, bills, or investments that repeat on a schedule. Examples: Monthly salary, Netflix subscription, utility bills, SIP investments, insurance premiums.

> 💡 **Note**: If your payment has a fixed number of installments with a known end date, use **EMIs** instead (for loans, credit card EMIs, etc.)

### Creating a Recurring Template

1. Navigate to the **Recurring** page
2. An informational alert at the top explains when to use Recurring Templates vs EMIs
3. Select the appropriate tab (Income, Expense, or Savings/Investment)
4. Click the **Add Recurring** button
5. Fill in the form:
   - **Name**: Template name (e.g., "Monthly Salary")
   - **Amount**: Transaction amount
   - **Account**: Select the account
   - **Frequency**: Monthly, Weekly, Quarterly, Yearly, or Custom (more flexible than EMIs)
   - **Start Date**: Start date
   - **End Date**: End date (optional - can continue indefinitely)
   - **Category/Type**: Select category or type
   - Additional fields based on type
   - **Notes**: Optional notes
6. Click **Save**

### Managing Recurring Templates

- **Pause/Resume**: Click the pause/resume button to pause or resume generation
- **View Transactions**: Click the transaction count to view generated transactions
- **Next Due Date**: See when the next transaction will be generated
- **Edit**: Click the edit icon to modify the template
- **Delete**: Click the delete icon to remove the template (only if no transactions are linked)

### Auto-Generation

Recurring templates automatically generate transactions based on their frequency. Generated transactions appear in the Transactions page with status "Pending" by default.

**Key Features**:
- No fixed term: End date is optional (can continue indefinitely)
- Flexible frequencies: Monthly, Weekly, Quarterly, Yearly, or Custom
- Next due date tracking: Shows when the next transaction will be generated
- No progress tracking: Just tracks the next occurrence (no installment count)

## Settings

### Balance Sync

If you have existing data created before automatic balance updates were implemented, you can sync account balances:

1. Navigate to the **Settings** page
2. Scroll to the **Balance Sync** section
3. Click the **"Sync Account Balances"** button
4. The sync will:
   - Calculate what each account balance should be based on all transactions
   - Update accounts that need adjustment
   - Show a detailed report of changes

**How it works:**
- Treats your current account balance as the "base balance" (starting point)
- Applies transaction effects: adds income received, subtracts expenses paid, subtracts savings completed
- Sets new balance = base balance + (income - expenses - savings)

This ensures your account balances are in sync with all your existing transactions.

### Data Backup & Restore

1. Navigate to the **Settings** page
2. Scroll to the **Data Backup & Restore** section
3. Click **"Export Backup"** to download all your data
4. Click **"Import Backup"** to restore from a backup file
5. Choose to either merge with existing data or replace all data

## Planner

### Using the Planner

1. Navigate to the **Planner** page
2. The planner **automatically defaults to the current month** (or the latest month with data if current month has no transactions)
3. Select a different month from the dropdown if needed
4. View the aggregated financial data for the selected month:
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

### Month Selector

- The Dashboard **automatically defaults to the current month** for monthly metrics
- Use the month selector at the top to view data for a different month
- The month selector shows current and future months first, followed by past months (prioritizing latest/future-focused view)

### Overview Metrics

The Dashboard shows both **Monthly Metrics** (for the selected month) and **Overall Metrics (All Time)**:

**Monthly Metrics:**
- **Monthly Income**: Income for the selected month
- **Monthly Expenses**: Expenses for the selected month
- **Monthly Savings**: Savings for the selected month
- **Monthly Investments**: Investments for the selected month

**Overall Metrics (All Time):**
- **Total Income**: Sum of all income transactions
- **Total Expenses**: Sum of all expense transactions
- **Total Savings**: Sum of all savings/investment transactions
- **Upcoming Due Dates**: Credit card due dates within 30 days

**Important**: The Dashboard prioritizes the latest and current month by default. All monthly views throughout the app default to the current month (or latest available month) to keep you focused on the present and future.

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
