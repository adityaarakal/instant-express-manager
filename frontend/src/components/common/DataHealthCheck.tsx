import { useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CleanupIcon from '@mui/icons-material/CleaningServices';
import SyncIcon from '@mui/icons-material/Sync';
import { useBanksStore } from '../../store/useBanksStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { useExpenseEMIsStore } from '../../store/useExpenseEMIsStore';
import { useSavingsInvestmentEMIsStore } from '../../store/useSavingsInvestmentEMIsStore';
import { useRecurringIncomesStore } from '../../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../../store/useRecurringSavingsInvestmentsStore';
import { checkDataInconsistencies } from '../../utils/validation';
import { findOrphanedData, cleanupOrphanedData } from '../../utils/orphanedDataCleanup';
import { validateAllAccountBalances, recalculateAllAccountBalances } from '../../utils/balanceRecalculation';
import { validateDataIntegrity } from '../../utils/dataMigration';
import { useToastStore } from '../../store/useToastStore';

export function DataHealthCheck() {
  const { showSuccess, showError, showWarning } = useToastStore();
  const banks = useBanksStore((state) => state.banks);
  const accounts = useBankAccountsStore((state) => state.accounts);
  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const expenseEMIs = useExpenseEMIsStore((state) => state.emis);
  const savingsEMIs = useSavingsInvestmentEMIsStore((state) => state.emis);
  const recurringIncomes = useRecurringIncomesStore((state) => state.templates);
  const recurringExpenses = useRecurringExpensesStore((state) => state.templates);
  const recurringSavings = useRecurringSavingsInvestmentsStore((state) => state.templates);
  
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const healthCheck = useMemo(() => {
    return checkDataInconsistencies(
      accounts,
      incomeTransactions,
      expenseTransactions,
      savingsTransactions,
      expenseEMIs,
      savingsEMIs,
      recurringIncomes,
      recurringExpenses,
      recurringSavings,
      banks,
    );
  }, [
    accounts,
    incomeTransactions,
    expenseTransactions,
    savingsTransactions,
    expenseEMIs,
    savingsEMIs,
    recurringIncomes,
    recurringExpenses,
    recurringSavings,
    banks,
  ]);

  // Check for orphaned data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const orphanedData = useMemo(() => findOrphanedData(), [
    accounts,
    banks,
    incomeTransactions,
    expenseTransactions,
    savingsTransactions,
  ]);

  // Check for balance discrepancies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const balanceDiscrepancies = useMemo(() => validateAllAccountBalances(), [
    accounts,
    incomeTransactions,
    expenseTransactions,
    savingsTransactions,
  ]);

  // Check data integrity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const integrityCheck = useMemo(() => validateDataIntegrity(), [
    accounts,
    banks,
    incomeTransactions,
    expenseTransactions,
    savingsTransactions,
  ]);

  const handleCleanupOrphanedData = async () => {
    setIsCleaning(true);
    try {
      const result = cleanupOrphanedData(orphanedData);
      if (result.cleaned > 0) {
        showSuccess(`Cleaned up ${result.cleaned} orphaned record(s)`);
        setCleanupDialogOpen(false);
        // Refresh page to update health check
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showWarning('No orphaned data to clean up');
        setCleanupDialogOpen(false);
      }
      if (result.errors.length > 0) {
        showError(`Some errors occurred: ${result.errors.length} error(s)`);
      }
    } catch (error) {
      showError(`Failed to cleanup orphaned data: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRecalculateBalances = async () => {
    setIsRecalculating(true);
    try {
      recalculateAllAccountBalances();
      showSuccess(`Recalculated balances for all accounts`);
      setBalanceDialogOpen(false);
      // Refresh page to update health check
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showError(`Failed to recalculate balances: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRecalculating(false);
    }
  };

  const hasIssues =
    healthCheck.errors.length > 0 ||
    healthCheck.warnings.length > 0 ||
    orphanedData.totalOrphaned > 0 ||
    balanceDiscrepancies.length > 0 ||
    !integrityCheck.isValid;

  if (!hasIssues) {
    return (
      <Alert severity="success">
        <AlertTitle>Data Health Check</AlertTitle>
        All data looks good! No inconsistencies found.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6">Data Health Check</Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
        {orphanedData.totalOrphaned > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<CleanupIcon />}
            onClick={() => setCleanupDialogOpen(true)}
          >
            Cleanup Orphaned Data ({orphanedData.totalOrphaned})
          </Button>
        )}
        {balanceDiscrepancies.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<SyncIcon />}
            onClick={() => setBalanceDialogOpen(true)}
          >
            Recalculate Balances ({balanceDiscrepancies.length})
          </Button>
        )}
      </Stack>

      {!integrityCheck.isValid && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Data Integrity Issues ({integrityCheck.errors.length})</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {integrityCheck.errors.slice(0, 10).map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
            {integrityCheck.errors.length > 10 && (
              <li>... and {integrityCheck.errors.length - 10} more</li>
            )}
          </ul>
        </Alert>
      )}

      {orphanedData.totalOrphaned > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Orphaned Data ({orphanedData.totalOrphaned})</AlertTitle>
          <Typography variant="body2">
            Found orphaned records:
            {orphanedData.orphanedIncomeTransactions.length > 0 && ` ${orphanedData.orphanedIncomeTransactions.length} income transaction(s)`}
            {orphanedData.orphanedExpenseTransactions.length > 0 && ` ${orphanedData.orphanedExpenseTransactions.length} expense transaction(s)`}
            {orphanedData.orphanedSavingsTransactions.length > 0 && ` ${orphanedData.orphanedSavingsTransactions.length} savings transaction(s)`}
            {orphanedData.orphanedTransferTransactions.length > 0 && ` ${orphanedData.orphanedTransferTransactions.length} transfer(s)`}
            {orphanedData.orphanedAccounts.length > 0 && ` ${orphanedData.orphanedAccounts.length} account(s)`}
            {orphanedData.orphanedEMIs.length > 0 && ` ${orphanedData.orphanedEMIs.length} EMI(s)`}
            {orphanedData.orphanedRecurringTemplates.length > 0 && ` ${orphanedData.orphanedRecurringTemplates.length} recurring template(s)`}
          </Typography>
        </Alert>
      )}

      {balanceDiscrepancies.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Balance Discrepancies ({balanceDiscrepancies.length})</AlertTitle>
          <Typography variant="body2">
            Found {balanceDiscrepancies.length} account(s) with balance discrepancies. Click "Recalculate Balances" to fix.
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            {balanceDiscrepancies.slice(0, 5).map((disc, idx) => (
              <li key={idx}>
                {disc.accountName}: Current ₹{disc.currentBalance.toFixed(2)} vs Calculated ₹{disc.calculatedBalance.toFixed(2)} (Difference: ₹{disc.difference.toFixed(2)})
              </li>
            ))}
            {balanceDiscrepancies.length > 5 && (
              <li>... and {balanceDiscrepancies.length - 5} more</li>
            )}
          </Box>
        </Alert>
      )}

      {healthCheck.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Errors ({healthCheck.errors.length})</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {healthCheck.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {healthCheck.warnings.length > 0 && (
        <Alert severity="warning">
          <AlertTitle>Warnings ({healthCheck.warnings.length})</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {healthCheck.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Cleanup Orphaned Data Dialog */}
      <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cleanup Orphaned Data</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              <AlertTitle>Warning</AlertTitle>
              <Typography variant="body2">
                This will permanently delete {orphanedData.totalOrphaned} orphaned record(s) that reference non-existent accounts or banks.
                This action cannot be undone.
              </Typography>
            </Alert>
            <Typography variant="body2">
              Orphaned records found:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {orphanedData.orphanedIncomeTransactions.length > 0 && (
                <li>{orphanedData.orphanedIncomeTransactions.length} income transaction(s)</li>
              )}
              {orphanedData.orphanedExpenseTransactions.length > 0 && (
                <li>{orphanedData.orphanedExpenseTransactions.length} expense transaction(s)</li>
              )}
              {orphanedData.orphanedSavingsTransactions.length > 0 && (
                <li>{orphanedData.orphanedSavingsTransactions.length} savings transaction(s)</li>
              )}
              {orphanedData.orphanedTransferTransactions.length > 0 && (
                <li>{orphanedData.orphanedTransferTransactions.length} transfer(s)</li>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)} disabled={isCleaning}>
            Cancel
          </Button>
          <Button
            onClick={handleCleanupOrphanedData}
            variant="contained"
            color="warning"
            disabled={isCleaning}
            startIcon={isCleaning ? <CircularProgress size={16} /> : <CleanupIcon />}
          >
            {isCleaning ? 'Cleaning...' : 'Cleanup Orphaned Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recalculate Balances Dialog */}
      <Dialog open={balanceDialogOpen} onClose={() => setBalanceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Recalculate Account Balances</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              <AlertTitle>Recalculate Balances</AlertTitle>
              <Typography variant="body2">
                This will recalculate all account balances from transactions to ensure data consistency.
                This fixes any discrepancies between stored balances and calculated balances.
              </Typography>
            </Alert>
            <Typography variant="body2">
              Found {balanceDiscrepancies.length} account(s) with balance discrepancies:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {balanceDiscrepancies.slice(0, 10).map((disc, idx) => (
                <li key={idx}>
                  {disc.accountName}: Difference of ₹{disc.difference.toFixed(2)}
                </li>
              ))}
              {balanceDiscrepancies.length > 10 && (
                <li>... and {balanceDiscrepancies.length - 10} more</li>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBalanceDialogOpen(false)} disabled={isRecalculating}>
            Cancel
          </Button>
          <Button
            onClick={handleRecalculateBalances}
            variant="contained"
            color="primary"
            disabled={isRecalculating}
            startIcon={isRecalculating ? <CircularProgress size={16} /> : <SyncIcon />}
          >
            {isRecalculating ? 'Recalculating...' : 'Recalculate All Balances'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

