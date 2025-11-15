# Instant Express Manager

A comprehensive standalone financial management Progressive Web App (PWA) built with React and TypeScript. Manage your banks, accounts, transactions, EMIs, recurring payments, and financial planning all in one place - **no Excel required**.

## 🚀 Features

### Core Financial Management
- 🏦 **Banks & Accounts**: Manage multiple banks and bank accounts with full CRUD operations
- 💰 **Transactions**: Track income, expenses, and savings/investment transactions
- 📅 **EMIs**: Manage expense and savings/investment EMIs with installment tracking
- 🔄 **Recurring Transactions**: Set up recurring income, expenses, and savings/investments
- 📊 **Planner**: Monthly financial planning with bucket-based allocations (defaults to current/latest month)
- 📈 **Analytics**: Comprehensive financial analytics and insights
- 📱 **Dashboard**: Overview of your financial health with monthly and overall metrics (defaults to current month)

### User Experience
- ✅ **Toast Notifications**: Real-time feedback for all operations
- ⏳ **Loading States**: Skeleton loaders and spinners for better UX
- ↩️ **Undo Functionality**: Restore deleted items within 10 minutes
- 💾 **Data Backup/Restore**: Full backup and restore functionality
- ⌨️ **Keyboard Shortcuts**: Power user shortcuts for faster navigation
- 🎨 **Dark/Light Theme**: System-aware theme switching
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### Data Management
- 🔒 **Local Storage**: All data stored locally using IndexedDB (via localforage)
- 🔄 **Auto-Generation**: Automatic EMI and recurring transaction generation (all recurring transactions generated upfront)
- ✅ **Data Validation**: Comprehensive validation and business rules
- 🔍 **Data Health Checks**: Identify and fix data inconsistencies
- 📤 **CSV Export**: Export transactions to CSV
- 💰 **Automatic Balance Updates**: Account balances automatically update when transactions are received/paid/completed
- 🔄 **Balance Sync**: Sync existing account balances with transactions (useful for old data)
- 🗑️ **Clear All Data**: Reset the app to a clean state by clearing all storage (irreversible)

## 🛠️ Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for build tooling and dev server
- **Material UI (MUI)** for UI components
- **Zustand** for state management with persistence
- **React Router** for navigation
- **localforage** for IndexedDB persistence

### PWA Features
- Service Worker for offline support
- Web App Manifest
- Installable on mobile/desktop
- Offline-first architecture

## 🔒 Strict Code Quality Enforcement

This repository enforces strict code quality checks that **cannot be bypassed**:

- ✅ **Git Hooks**: Pre-commit validation (ESLint, TypeScript, Build)
- ✅ **Git Wrapper**: Blocks `--no-verify` bypass attempts
- ✅ **GitHub Actions**: Server-side enforcement on all PRs
- ✅ **Branch Protection**: Requires status checks before merge
- ✅ **Enforcement Lock System**: Checksum-based protection for enforcement files
- ✅ **TypeScript**: Production code only (test files excluded from compilation)

### Protection Setup (Required)

After cloning, install protections:

```bash
npm install
npm run install-protection
source ~/.bashrc  # or ~/.zshrc (or restart terminal)
```

**Important**: Run `npm run install-protection` after `npm install` to enable strict local enforcement.

**Zero Tolerance Policy**:
- ❌ `--no-verify` is **ABSOLUTELY FORBIDDEN**
- ❌ Direct commits to `main` are **BLOCKED**
- ❌ Bypass attempts are **DETECTED AND BLOCKED**
- ✅ All checks must pass before commit
- ✅ Server-side checks provide ultimate enforcement

For detailed documentation, see:
- `docs/GIT_HOOKS_SETUP.md` - Setup and configuration
- `docs/STRICT_ENFORCEMENT.md` - How protection layers work
- `docs/HOOK_LIMITATIONS.md` - Known limitations

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd instant-express-manager
```

2. Install dependencies and protections:
```bash
npm install
npm run install-protection
source ~/.bashrc  # or ~/.zshrc (or restart terminal)
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:7001`

## 🏗️ Project Structure

```
instant-express-manager/
├── frontend/                    # React PWA TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── analytics/      # Analytics chart components
│   │   │   ├── common/         # Common components (ErrorBoundary, Toast, etc.)
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── layout/         # Layout components (AppBar, Navigation)
│   │   │   ├── planner/        # Planner components
│   │   │   └── transactions/   # Transaction components
│   │   ├── pages/              # Page components
│   │   │   ├── Banks.tsx       # Banks management
│   │   │   ├── BankAccounts.tsx # Bank accounts management
│   │   │   ├── Transactions.tsx # Transactions management
│   │   │   ├── EMIs.tsx        # EMIs management
│   │   │   ├── Recurring.tsx   # Recurring templates management
│   │   │   ├── Planner.tsx     # Monthly planner view
│   │   │   ├── Dashboard.tsx   # Dashboard overview
│   │   │   ├── Analytics.tsx   # Analytics page
│   │   │   └── Settings.tsx    # Settings page
│   │   ├── store/              # Zustand stores
│   │   │   ├── useBanksStore.ts
│   │   │   ├── useBankAccountsStore.ts
│   │   │   ├── useIncomeTransactionsStore.ts
│   │   │   ├── useExpenseTransactionsStore.ts
│   │   │   ├── useSavingsInvestmentTransactionsStore.ts
│   │   │   ├── useExpenseEMIsStore.ts
│   │   │   ├── useSavingsInvestmentEMIsStore.ts
│   │   │   ├── useRecurringIncomesStore.ts
│   │   │   ├── useRecurringExpensesStore.ts
│   │   │   ├── useRecurringSavingsInvestmentsStore.ts
│   │   │   ├── usePlannerStore.ts
│   │   │   ├── useSettingsStore.ts
│   │   │   ├── useToastStore.ts
│   │   │   └── useUndoStore.ts
│   │   ├── services/            # Business logic services
│   │   │   └── autoGenerationService.ts # EMI/Recurring auto-generation
│   │   ├── utils/              # Utility functions
│   │   │   ├── accountBalanceUpdates.ts # Automatic balance updates
│   │   │   ├── aggregation.ts  # Planner aggregation logic
│   │   │   ├── backupService.ts # Backup/restore functionality
│   │   │   ├── errorHandling.ts # Error message formatting
│   │   │   ├── entityRelationships.ts # Entity relationship utilities
│   │   │   ├── transactionExport.ts # CSV export
│   │   │   ├── undoRestore.ts  # Undo functionality
│   │   │   └── validation.ts   # Data validation
│   │   ├── types/              # TypeScript type definitions
│   │   ├── routes/             # React Router routes
│   │   └── providers/          # React context providers
│   ├── public/                 # Static assets
│   └── package.json
├── docs/                       # Documentation
│   ├── REQUIREMENTS.md         # Complete requirements
│   ├── NEW_ARCHITECTURE.md     # Architecture documentation
│   ├── USER_GUIDE.md           # User guide
│   ├── DEVELOPER_GUIDE.md      # Developer guide
│   ├── ENTITY_RELATIONSHIPS.md # Entity relationships
│   ├── IMPLEMENTATION_REVIEW.md # Implementation review
│   ├── GAP_ANALYSIS.md         # Gap analysis
│   └── tasks.md                # Task tracker
└── README.md
```

## 🎯 Key Features

### Banks & Accounts
- Create and manage multiple banks (Bank, Credit Card, Wallet)
- Create and manage bank accounts with balance tracking
- Support for credit cards with credit limits and due dates
- Account balance validation and tracking

### Transactions
- **Income Transactions**: Track salary, bonuses, freelancing, etc.
- **Expense Transactions**: Track utilities, responsibilities, CC bills, etc.
- **Savings/Investment Transactions**: Track SIPs, lump sums, withdrawals, returns
- **Internal Account Transfers**: Track money movements between your own accounts (paying off credit cards, fund rebalancing, etc.)
- **Automatic Balance Updates**: Account balances automatically update when transactions are marked as "Received" (income), "Paid" (expense), or "Completed" (savings/investment), or when transfers are marked as "Completed" (from account decreases, to account increases)
- Filter by date range, account, category, and status
- Bulk operations (delete, status update) - Note: Transfers don't support bulk status update
- CSV export functionality
- Pagination for large lists

### EMIs
- **Expense EMIs**: Track loan EMIs, credit card EMIs
- **Savings/Investment EMIs**: Track SIP EMIs, investment installments
- Installment tracking with progress indicators
- Pause/Resume functionality
- Auto-generation of EMI transactions
- **Deduction Date**: Separate field for actual transaction date (independent of start/end dates)
- **Update Deduction Date**: Update deduction date with options (this date only, all future, reset schedule)
- **Convert to Recurring**: Convert EMIs to Recurring Templates if you realize the payment doesn't have a fixed end date

### Recurring Transactions
- **Recurring Income**: Set up recurring income streams (e.g., monthly salary)
- **Recurring Expenses**: Set up recurring bills and payments (e.g., subscriptions, utilities)
- **Recurring Savings/Investments**: Set up recurring savings plans (e.g., SIP investments)
- Multiple frequency options (Monthly, Weekly, Quarterly, Yearly, Custom)
- **Day of Month Input**: Specify day of month (1-31) when transaction occurs (e.g., 1 for 1st of every month)
- **Context-Aware Labels**: "Payment Date" for income, "Deduction Date" for expenses
- All transactions generated upfront when template is created (entire recurring period or 12 months)
- Transactions default to "Pending" status (mark as "Received"/"Paid"/"Completed" when they actually occur)
- Pause/Resume functionality
- **Update Day of Month**: Update day of month with options (this date only, all future, reset schedule)
- **Convert to EMI**: Convert Recurring Templates to EMIs if you realize the payment has a fixed number of installments

### Planner
- Monthly financial planning view
- Bucket-based expense allocation
- Account-wise breakdown
- Status tracking (Pending/Paid)
- Aggregated view of all transactions

### Analytics
- Income trends over time
- Expense breakdown by category
- Budget vs actual comparisons
- Credit card analysis
- Savings progress tracking
- Investment performance

## 🎮 Keyboard Shortcuts

- `Ctrl/Cmd + N`: Create new item (transaction/EMI/recurring)
- `Ctrl/Cmd + K`: Focus search/filter (Transactions page)
- `Ctrl/Cmd + S`: Save form (when in a dialog)
- `Esc`: Close dialog
- `?`: Show keyboard shortcuts help

## 💾 Data Storage

All data is stored locally in the browser using:
- **IndexedDB** (via localforage): For all entity data
- **Storage Keys**:
  - `banks`: Banks data
  - `bank-accounts`: Bank accounts data
  - `income-transactions`: Income transactions
  - `expense-transactions`: Expense transactions
  - `savings-investment-transactions`: Savings/investment transactions
  - `expense-emis`: Expense EMIs
  - `savings-investment-emis`: Savings/investment EMIs
  - `recurring-incomes`: Recurring income templates
  - `recurring-expenses`: Recurring expense templates
  - `recurring-savings-investments`: Recurring savings/investment templates
  - `planner-preferences`: Planner UI preferences
  - `settings`: User settings

Data persists across page refreshes and browser sessions. No backend required.

## 🔧 Development

### Running the App

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`.

### Running Tests

```bash
cd frontend
npm test
```

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete user guide with feature walkthroughs
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Developer documentation and architecture
- **[Requirements](docs/REQUIREMENTS.md)**: Complete requirements specification
- **[Architecture](docs/NEW_ARCHITECTURE.md)**: Application architecture documentation
- **[Entity Relationships](docs/ENTITY_RELATIONSHIPS.md)**: Entity relationship documentation

## 🐛 Troubleshooting

### Build Issues

If you encounter build failures:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf frontend/node_modules/.vite`

### Data Not Loading

- Check browser console for errors
- Verify IndexedDB is enabled in browser settings
- Use Data Health Check in Settings page to identify issues
- Clear browser storage and reload if data appears corrupted

### Performance Issues

- Use pagination for large transaction lists
- Enable data health checks to identify orphaned records
- Use backup/restore to clean up data if needed

## 🚀 Deployment

### GitHub Pages

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Copy `dist/` contents to `docs/` folder:
```bash
cp -r frontend/dist/* docs/
```

3. Configure GitHub Pages to serve from `/docs` folder

4. Commit and push:
```bash
git add docs/
git commit -m "Deploy to GitHub Pages"
git push
```

## 📝 License

MIT

## 🤝 Contributing

1. Check `docs/tasks.md` for current task status
2. Follow the existing code structure and patterns
3. Add tests for new features
4. Update documentation as needed

## 🎉 Recent Updates

- ✅ User feedback system with toast notifications
- ✅ Loading states across all pages
- ✅ Undo functionality for deletions
- ✅ Full data backup/restore
- ✅ Pagination for large lists
- ✅ Improved navigation with React Router
- ✅ Keyboard shortcuts
- ✅ Enhanced error handling with user-friendly messages
- ✅ Latest/current month prioritization across all monthly views for present/future-focused experience
- ✅ Dashboard monthly and overall metrics with month selector (defaults to current month)
- ✅ Automatic account balance updates based on transaction status
- ✅ Internal account transfers feature to track money movements between your own accounts
- ✅ Strict code quality enforcement with Git hooks and GitHub Actions
- ✅ Enforcement lock system to protect enforcement files from modification
- ✅ All TypeScript and ESLint errors resolved in production code
- ✅ Clear all data functionality to reset the app to a clean state
