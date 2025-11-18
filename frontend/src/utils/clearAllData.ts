import localforage from 'localforage';

/**
 * List of all storage keys used by the application
 */
const STORAGE_KEYS = [
  'banks',
  'bank-accounts',
  'income-transactions',
  'expense-transactions',
  'savings-investment-transactions',
  'transfer-transactions',
  'expense-emis',
  'savings-investment-emis',
  'recurring-incomes',
  'recurring-expenses',
  'recurring-savings-investments',
  'planner-preferences',
  'planner-settings',
  'aggregated-planned-months',
  'allocation-templates',
  'undo',
  'export-history',
] as const;

/**
 * Clears all data from IndexedDB storage
 * This will delete all stores and reset the application to a clean state
 * Errors are propagated to caller for handling
 */
export async function clearAllData(): Promise<void> {
  // Clear each storage store
  const clearPromises = STORAGE_KEYS.map(async (key) => {
    const store = localforage.createInstance({
      name: 'instant-express-manager',
      storeName: key,
    });
    return store.clear();
  });

  await Promise.all(clearPromises);

  // Also clear the main database instance
  const mainStore = localforage.createInstance({
    name: 'instant-express-manager',
  });
  await mainStore.clear();

  // Force reset all Zustand stores to their initial state
  // Import stores dynamically to avoid circular dependencies
  const { useBanksStore } = await import('../store/useBanksStore');
  const { useBankAccountsStore } = await import('../store/useBankAccountsStore');
  const { useIncomeTransactionsStore } = await import('../store/useIncomeTransactionsStore');
  const { useExpenseTransactionsStore } = await import('../store/useExpenseTransactionsStore');
  const { useSavingsInvestmentTransactionsStore } = await import('../store/useSavingsInvestmentTransactionsStore');
  const { useTransferTransactionsStore } = await import('../store/useTransferTransactionsStore');
  const { useExpenseEMIsStore } = await import('../store/useExpenseEMIsStore');
  const { useSavingsInvestmentEMIsStore } = await import('../store/useSavingsInvestmentEMIsStore');
  const { useRecurringIncomesStore } = await import('../store/useRecurringIncomesStore');
  const { useRecurringExpensesStore } = await import('../store/useRecurringExpensesStore');
  const { useRecurringSavingsInvestmentsStore } = await import('../store/useRecurringSavingsInvestmentsStore');
  const { usePlannerStore } = await import('../store/usePlannerStore');
  const { useSettingsStore } = await import('../store/useSettingsStore');
  const { useAggregatedPlannedMonthsStore } = await import('../store/useAggregatedPlannedMonthsStore');
  const { useTemplatesStore } = await import('../store/useTemplatesStore');
  const { useUndoStore } = await import('../store/useUndoStore');
  const { useExportHistoryStore } = await import('../store/useExportHistoryStore');

  // Reset all stores to their initial state
  useBanksStore.getState().banks = [];
  useBankAccountsStore.getState().accounts = [];
  useIncomeTransactionsStore.getState().transactions = [];
  useExpenseTransactionsStore.getState().transactions = [];
  useSavingsInvestmentTransactionsStore.getState().transactions = [];
  useTransferTransactionsStore.getState().transfers = [];
  useExpenseEMIsStore.getState().emis = [];
  useSavingsInvestmentEMIsStore.getState().emis = [];
  useRecurringIncomesStore.getState().templates = [];
  useRecurringExpensesStore.getState().templates = [];
  useRecurringSavingsInvestmentsStore.getState().templates = [];
  useAggregatedPlannedMonthsStore.setState({ statusByBucket: {} });
  useTemplatesStore.getState().templates = [];
  useUndoStore.getState().deletedItems = [];
  useExportHistoryStore.getState().history = [];

  // Reset settings to defaults (this will persist)
  useSettingsStore.getState().reset();
  
  // Reset planner to initial state
  usePlannerStore.setState({
    activeMonthId: null,
    view: 'dashboard',
    bucketFilter: 'all',
    searchTerm: '',
  });

  // Clear persisted data by removing items from storage
  // This ensures Zustand persistence middleware also clears
  for (const key of STORAGE_KEYS) {
    const store = localforage.createInstance({
      name: 'instant-express-manager',
      storeName: key,
    });
    await store.removeItem('state');
  }

  // Reload the page to ensure a clean state
  window.location.reload();
}

