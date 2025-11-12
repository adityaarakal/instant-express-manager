# Developer Guide - Planned Expenses Manager

## Project Overview

This is a React PWA built with TypeScript, Material UI, and Zustand for state management. The app replicates Excel spreadsheet functionality for managing planned expenses.

## Architecture

### State Management

- **Zustand Stores**: Three main stores
  - `usePlannedMonthsStore`: Manages planned months data
  - `usePlannerStore`: UI state (active month, filters)
  - `useSettingsStore`: User preferences
- **Persistence**: All stores use `localforage` for IndexedDB persistence

### Data Flow

1. **Seed Data**: Loaded from `data/seeds/planned-expenses.json`
2. **Store Initialization**: Stores initialize with seed data
3. **User Edits**: Updates flow through store actions
4. **Persistence**: Changes automatically saved to IndexedDB
5. **UI Updates**: React components subscribe to store changes

### Component Structure

```
components/
├── dashboard/        # Dashboard-specific components
├── layout/          # Shared layout components
└── planner/         # Planner-specific components
```

## Key Files

### Stores

- `src/store/usePlannedMonthsStore.ts`: Core data store
  - `upsertMonth`: Add/update month
  - `updateAccountAllocation`: Update account values
  - `updateBucketStatus`: Toggle bucket status
  - `getBucketTotals`: Calculate totals

### Utilities

- `src/utils/formulas.ts`: Excel formula translations
  - `calculateRemainingCash`: Remaining cash calculation
  - `sumBucketByStatus`: Sum by status
  - `convertExcelSerialToIso`: Date conversion

- `src/utils/totals.ts`: Bucket totals
  - `calculateBucketTotals`: Aggregate bucket amounts

- `src/utils/dashboard.ts`: Dashboard metrics
  - `calculateDashboardMetrics`: Aggregate across months

### Types

- `src/types/plannedExpenses.ts`: Core type definitions
  - `PlannedMonthSnapshot`: Month data structure
  - `AccountAllocationSnapshot`: Account allocation
  - `BucketDefinition`: Bucket metadata

## Development Workflow

### Adding a New Feature

1. **Update Types**: Add types in `src/types/plannedExpenses.ts`
2. **Update Store**: Add actions/selectors in relevant store
3. **Create Components**: Build UI components
4. **Add Tests**: Write tests for new functionality
5. **Update Docs**: Update relevant documentation

### Testing

Run tests:
```bash
cd frontend
npm test
```

Test files follow pattern: `*.test.ts` or `*.test.tsx`

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prefer functional components with hooks
- Use Material UI for UI components

## Data Model

### PlannedMonthSnapshot

```typescript
{
  id: string;
  monthStart: string; // ISO date
  fixedFactor: number | null;
  inflowTotal: number | null;
  statusByBucket: Record<string, 'pending' | 'paid'>;
  dueDates: Record<string, string | null>;
  bucketOrder: string[];
  accounts: AccountAllocationSnapshot[];
  refErrors: MonthRefError[];
  manualAdjustments?: ManualAdjustment[];
}
```

### AccountAllocationSnapshot

```typescript
{
  id: string;
  accountId: string;
  accountName: string;
  remainingCash: number | null; // Calculated
  fixedBalance: number | null;
  savingsTransfer: number | null;
  bucketAmounts: Record<string, number | null>;
}
```

## Build & Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Output: `frontend/dist/`

### PWA Configuration

- PWA disabled in dev mode (see `vite.config.ts`)
- Service worker generated only in production
- Manifest configured for installability

## Common Tasks

### Adding a New Bucket

1. Update `src/config/plannedExpenses.ts`:
   ```typescript
   {
     id: 'new-bucket',
     name: 'New Bucket',
     color: '#hex-color',
     defaultStatus: 'pending',
   }
   ```

2. Update seed data if needed
3. Bucket will appear automatically in UI

### Adding a New Calculation

1. Add utility function in `src/utils/formulas.ts`
2. Add test in `src/utils/__tests__/formulas.test.ts`
3. Use in store actions or components

### Debugging

- Use Zustand DevTools (enabled in dev)
- Check browser IndexedDB via DevTools
- Check console for errors
- Use React DevTools for component debugging

## Known Issues

- **#REF! Errors**: Some months have broken Excel references (documented)
- **PWA Build**: Service worker may fail in some environments (disabled in dev)

## Contributing

1. Check `docs/tasks.md` for current status
2. Create feature branch
3. Write tests
4. Update documentation
5. Submit PR

## Resources

- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Material UI Docs](https://mui.com/)
- [Vite Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)

