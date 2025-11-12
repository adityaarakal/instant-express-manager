# Planned Expenses Manager

A React PWA (Progressive Web App) that replicates and enhances the functionality of the "Planned Expenses" Excel spreadsheet. This application serves as the primary system for managing monthly expense allocations, tracking savings, and monitoring bucket-based financial planning.

## Features

- 📅 **Monthly Planning**: Plan and manage expenses across multiple months with full historical data
- 💰 **Account Allocations**: Allocate funds across multiple accounts (salary, savings, credit cards)
- 🪣 **Bucket System**: Organize expenses by buckets (Balance, Savings, Mutual Funds, CC Bills, Maintenance)
- ✅ **Status Tracking**: Track pending vs paid status for each allocation
- 📊 **Dashboard Metrics**: View aggregated metrics including pending allocations, savings progress, and CC bills
- 🔔 **Due Date Reminders**: Get reminders for upcoming due dates within 30 days
- ⚙️ **Configurable Settings**: Customize currency, fixed factor, bucket definitions, and theme
- 💾 **Offline Support**: Full PWA capabilities with offline data persistence using IndexedDB
- 🎨 **Modern UI**: Material UI components with dark/light theme support

## Project Structure

```
instant-express-manager/
├── frontend/                    # React PWA TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── layout/         # Layout components (AppBar, ThemeToggle)
│   │   │   └── planner/        # Planner components (MonthView, AccountTable, etc.)
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx   # Dashboard with metrics
│   │   │   ├── Planner.tsx     # Month planner view
│   │   │   └── Settings.tsx    # Settings page
│   │   ├── store/              # Zustand stores
│   │   │   ├── usePlannedMonthsStore.ts
│   │   │   ├── usePlannerStore.ts
│   │   │   └── useSettingsStore.ts
│   │   ├── utils/              # Utility functions
│   │   │   ├── formulas.ts     # Excel formula translations
│   │   │   ├── totals.ts       # Bucket totals calculations
│   │   │   └── dashboard.ts    # Dashboard metrics
│   │   ├── types/              # TypeScript types
│   │   ├── config/             # Configuration (buckets, etc.)
│   │   └── data/               # Seed data
│   ├── public/                 # Static assets
│   └── package.json
├── scripts/                    # Python scripts for data migration
│   └── export_planned_expenses.py
├── data/                       # Seed data
│   └── seeds/
│       └── planned-expenses.json
├── docs/                       # Documentation
│   ├── tasks.md                # Task tracker
│   └── planned-expenses-analysis/
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (optional, for data export scripts)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd instant-express-manager
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`. For GitHub Pages deployment, copy the contents to the `docs/` folder in the repo root.

## Data Import

### Initial Data Migration

The app comes pre-seeded with data exported from the Excel spreadsheet. The seed data is located in:
- `data/seeds/planned-expenses.json`
- Loaded automatically via `frontend/src/data/plannedMonthsSeed.ts`

### Exporting from Excel

To export new data from the Excel spreadsheet:

```bash
cd scripts
python3 export_planned_expenses.py
```

This will generate/update `data/seeds/planned-expenses.json` with all months from the spreadsheet.

## Usage

### Dashboard

The Dashboard provides an overview of your financial planning:
- **Pending Allocations**: Total pending amounts across all buckets
- **Total Savings**: Aggregated savings transfers across all months
- **Credit Card Bills**: Total CC bill amounts
- **Upcoming Due Dates**: Reminders for due dates within the next 30 days
- **Savings Trend**: Monthly savings summary for the last 12 months

### Planner

The Planner allows you to:
- **Select a Month**: Use the dropdown to navigate between months
- **View Month Details**: See month header with inflow and fixed factor
- **Toggle Status**: Click bucket status chips to toggle between Pending/Paid
- **Edit Allocations**: Click on any editable cell (Fixed, Savings, Bucket amounts) to edit inline
- **View Totals**: See bucket totals broken down by pending/paid status

### Settings

Configure your preferences:
- **Theme**: Light, Dark, or System preference
- **Currency**: Select base currency (INR, USD, EUR, GBP)
- **Default Fixed Factor**: Set default fixed factor for new months
- **Bucket Definitions**: Customize bucket names and default statuses
- **Reminders**: Enable/disable due date reminders

## Data Storage

All data is stored locally in the browser using:
- **IndexedDB** (via localforage): For planned months, planner state, and settings
- **Storage Keys**:
  - `planned-months`: Planned months data
  - `planner-preferences`: UI preferences (active month, filters)
  - `planner-settings`: User settings (theme, currency, etc.)

Data persists across page refreshes and browser sessions. No backend required.

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for build tooling
- **Material UI (MUI)** for UI components
- **Zustand** for state management
- **localforage** for IndexedDB persistence
- **React Router** for navigation
- **Vitest** for testing

### PWA Features
- Service Worker for offline support
- Web App Manifest
- Installable on mobile/desktop
- Offline-first architecture

## Development

### Running Tests

```bash
cd frontend
npm test
```

### Code Structure

- **Components**: Reusable UI components in `src/components/`
- **Pages**: Page-level components in `src/pages/`
- **Stores**: Zustand stores for state management in `src/store/`
- **Utils**: Utility functions and helpers in `src/utils/`
- **Types**: TypeScript type definitions in `src/types/`

### Key Concepts

- **Planned Month**: Represents a single month's planned expenses
- **Account Allocation**: Per-account allocations (fixed balance, savings, bucket amounts)
- **Bucket**: Category for organizing expenses (Balance, Savings, Mutual Funds, etc.)
- **Status**: Pending or Paid status for each bucket
- **Remaining Cash**: Calculated field = Inflow - Fixed Balance - Savings Transfer

## Troubleshooting

### Build Issues

If you encounter PWA service-worker build failures:
- PWA is disabled in dev mode by default
- Service worker is only generated in production builds
- Check `vite.config.ts` for PWA configuration

### Data Not Loading

- Check browser console for errors
- Verify IndexedDB is enabled in browser settings
- Clear browser storage and reload if data appears corrupted

### npm Install Issues

If you encounter permission errors:
```bash
sudo chown -R "$USER" ~/.npm
sudo chown -R "$USER" node_modules
```

## Deployment

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

3. Configure GitHub Pages to serve from `/docs` folder on `main` branch

4. Commit and push:
```bash
git add docs/
git commit -m "Deploy to GitHub Pages"
git push
```

## Known Issues

- **#REF! Errors**: Some months (Apr 2023 - Sep 2024) have `#REF!` errors in the original Excel. These are documented and deferred to post-MVP cleanup.
- **Remaining Cash**: For REF-affected months, remaining cash calculations may be incomplete.

## Roadmap

- [x] Visual charts for savings trends (using recharts) ✅
- [x] Export functionality (JSON/CSV) ✅
- [x] Import flow for Excel workbooks ✅
- [ ] Manual adjustments UI
- [ ] Recurring allocations
- [ ] Budget vs actual comparisons

## License

MIT

## Contributing

1. Check `docs/tasks.md` for current task status
2. Follow the existing code structure and patterns
3. Add tests for new features
4. Update documentation as needed
