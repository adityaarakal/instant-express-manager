import { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  AlertTitle,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { ExpenseEMI, SavingsInvestmentEMI } from '../../types/emis';
import type { RecurringExpense, RecurringSavingsInvestment } from '../../types/recurring';
import {
  convertExpenseEMIToRecurring,
  convertSavingsEMIToRecurring,
  convertRecurringExpenseToEMI,
  convertRecurringSavingsToEMI,
  getNextDueDateFromEMI,
} from '../../utils/emiRecurringConversion';

type ConversionType = 'emi-to-recurring' | 'recurring-to-emi';

interface ConversionWizardProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conversionType: ConversionType;
  // For EMI → Recurring
  emi?: ExpenseEMI | SavingsInvestmentEMI;
  // For Recurring → EMI
  recurringExpense?: RecurringExpense;
  recurringSavings?: RecurringSavingsInvestment;
  isConverting: boolean;
}

export function ConversionWizard({
  open,
  onClose,
  onConfirm,
  conversionType,
  emi,
  recurringExpense,
  recurringSavings,
  isConverting,
}: ConversionWizardProps) {
  const convertedData = useMemo(() => {
    if (conversionType === 'emi-to-recurring' && emi) {
      if ('category' in emi) {
        // ExpenseEMI
        const converted = convertExpenseEMIToRecurring(emi);
        const nextDueDate = getNextDueDateFromEMI(emi);
        return {
          type: 'recurring-expense' as const,
          data: { ...converted, nextDueDate },
          original: emi,
        };
      } else {
        // SavingsInvestmentEMI
        const converted = convertSavingsEMIToRecurring(emi);
        const nextDueDate = getNextDueDateFromEMI(emi);
        return {
          type: 'recurring-savings' as const,
          data: { ...converted, nextDueDate },
          original: emi,
        };
      }
    } else if (conversionType === 'recurring-to-emi') {
      if (recurringExpense) {
        const converted = convertRecurringExpenseToEMI(recurringExpense);
        return {
          type: 'expense-emi' as const,
          data: converted,
          original: recurringExpense,
        };
      } else if (recurringSavings) {
        const converted = convertRecurringSavingsToEMI(recurringSavings);
        return {
          type: 'savings-emi' as const,
          data: converted,
          original: recurringSavings,
        };
      }
    }
    return null;
  }, [conversionType, emi, recurringExpense, recurringSavings]);

  if (!convertedData) {
    return null;
  }

  const { data, original } = convertedData;

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      name: 'Name',
      amount: 'Amount',
      accountId: 'Account',
      category: 'Category',
      bucket: 'Bucket',
      destination: 'Destination',
      type: 'Type',
      frequency: 'Frequency',
      startDate: 'Start Date',
      endDate: 'End Date',
      nextDueDate: 'Next Due Date',
      totalInstallments: 'Total Installments',
      completedInstallments: 'Completed Installments',
      status: 'Status',
      notes: 'Notes',
    };
    return labels[key] || key;
  };

  const getFieldValue = (key: string, value: unknown): string => {
    if (value === undefined || value === null) return '—';
    if (key === 'accountId') return 'Account (same)';
    if (key === 'status') return String(value);
    if (key === 'frequency') return String(value);
    if (key === 'amount') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
    if (key.includes('Date')) return new Date(value).toLocaleDateString('en-IN');
    return String(value);
  };

  const originalFields = Object.keys(original).filter((key) => !['id', 'createdAt', 'updatedAt', 'nextDueDate', 'completedInstallments', 'totalInstallments'].includes(key));
  const convertedFields = Object.keys(data).filter((key) => !['id', 'createdAt', 'updatedAt'].includes(key));

  const getChanges = () => {
    const changes: Array<{ field: string; from: string; to: string }> = [];
    
    // Compare common fields
    const commonFields = originalFields.filter((key) => convertedFields.includes(key));
    commonFields.forEach((key) => {
      const originalValue = (original as Record<string, unknown>)[key];
      const convertedValue = (data as Record<string, unknown>)[key];
      if (String(originalValue) !== String(convertedValue)) {
        changes.push({
          field: getFieldLabel(key),
          from: getFieldValue(key, originalValue),
          to: getFieldValue(key, convertedValue),
        });
      }
    });

    // Check for removed fields
    originalFields.forEach((key) => {
      if (!convertedFields.includes(key) && key !== 'nextDueDate') {
        changes.push({
          field: getFieldLabel(key),
          from: getFieldValue(key, (original as Record<string, unknown>)[key]),
          to: 'Removed',
        });
      }
    });

    // Check for added fields
    convertedFields.forEach((key) => {
      if (!originalFields.includes(key) && key !== 'nextDueDate') {
        changes.push({
          field: getFieldLabel(key),
          from: 'N/A',
          to: getFieldValue(key, (data as Record<string, unknown>)[key]),
        });
      }
    });

    return changes;
  };

  const changes = getChanges();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <SwapHorizIcon color="primary" />
          <Typography variant="h6">
            {conversionType === 'emi-to-recurring' ? 'Convert EMI to Recurring Template' : 'Convert Recurring Template to EMI'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            <AlertTitle>What will happen?</AlertTitle>
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>A new {conversionType === 'emi-to-recurring' ? 'Recurring Template' : 'EMI'} will be created</li>
                <li>All existing transactions will be updated to reference the new entity</li>
                <li>The old {conversionType === 'emi-to-recurring' ? 'EMI' : 'Recurring Template'} will be deleted</li>
                <li>Progress tracking {conversionType === 'emi-to-recurring' ? 'will be removed' : 'will be added'}</li>
              </ul>
            </Typography>
          </Alert>

          {changes.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Changes Summary:
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Field</strong></TableCell>
                      <TableCell><strong>From</strong></TableCell>
                      <TableCell><strong>To</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {changes.map((change, index) => (
                      <TableRow key={index}>
                        <TableCell>{change.field}</TableCell>
                        <TableCell>{change.from}</TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            sx={{
                              color: change.to === 'Removed' ? 'error.main' : change.from === 'N/A' ? 'success.main' : 'primary.main',
                              fontWeight: 'medium',
                            }}
                          >
                            {change.to}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {conversionType === 'emi-to-recurring' && (
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Note:</strong> Converting to Recurring Template will remove installment tracking. 
                The end date will become optional, and you'll track the next due date instead of progress.
              </Typography>
            </Alert>
          )}

          {conversionType === 'recurring-to-emi' && (
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Note:</strong> Converting to EMI requires an end date. 
                If your Recurring Template doesn't have one, we'll set it to 1 year from the start date. 
                Total installments will be calculated from the date range.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isConverting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isConverting}
          startIcon={isConverting ? <CircularProgress size={16} /> : <SwapHorizIcon />}
        >
          {isConverting ? 'Converting...' : 'Confirm Conversion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

