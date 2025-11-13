import { useMemo } from 'react';
import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useBanksStore } from '../../store/useBanksStore';
import { useBankAccountsStore } from '../../store/useBankAccountsStore';
import { useIncomeTransactionsStore } from '../../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../../store/useSavingsInvestmentTransactionsStore';
import { checkDataInconsistencies } from '../../utils/validation';

export function DataHealthCheck() {
  const banks = useBanksStore((state) => state.banks);
  const accounts = useBankAccountsStore((state) => state.accounts);
  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);

  const healthCheck = useMemo(() => {
    return checkDataInconsistencies(
      accounts,
      incomeTransactions,
      expenseTransactions,
      savingsTransactions,
    );
  }, [accounts, incomeTransactions, expenseTransactions, savingsTransactions]);

  if (healthCheck.errors.length === 0 && healthCheck.warnings.length === 0) {
    return (
      <Alert severity="success">
        <AlertTitle>Data Health Check</AlertTitle>
        All data looks good! No inconsistencies found.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">Data Health Check</Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Stack>

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
    </Box>
  );
}

