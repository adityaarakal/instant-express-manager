/**
 * #REF! Error Remediation Dialog
 * 
 * UI for scanning, reviewing, and fixing #REF! errors in remaining cash calculations
 */

import { useState, useEffect, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  Alert,
  AlertTitle,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  scanRefErrors,
  applyRefErrorFixes,
  getRefErrorSummary,
  setRemainingCashOverride,
  type RefErrorIssue,
} from '../../utils/refErrorRemediation';
import { useToastStore } from '../../store/useToastStore';
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

interface RefErrorRemediationDialogProps {
  open: boolean;
  onClose: () => void;
}

export const RefErrorRemediationDialog = memo(function RefErrorRemediationDialog({
  open,
  onClose,
}: RefErrorRemediationDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [issues, setIssues] = useState<RefErrorIssue[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getRefErrorSummary> | null>(null);
  const [editingIssue, setEditingIssue] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [applyOverridesForNonFixable, setApplyOverridesForNonFixable] = useState(false);
  const { showSuccess, showError } = useToastStore();

  useEffect(() => {
    if (open) {
      handleScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleScan = () => {
    setIsScanning(true);
    try {
      const result = scanRefErrors();
      setIssues(result.issues);
      setSummary(getRefErrorSummary());
    } catch (error) {
      showError(`Failed to scan for errors: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFix = async () => {
    if (issues.length === 0) {
      showError('No issues to fix');
      return;
    }

    setIsFixing(true);
    try {
      const result = applyRefErrorFixes(issues, false, applyOverridesForNonFixable);

      if (result.errors.length > 0) {
        showError(`Fixed ${result.fixed} issues, but encountered ${result.errors.length} errors`);
        console.error('Fix errors:', result.errors);
      } else {
        const message = result.fixed > 0
          ? `Successfully fixed ${result.fixed} issue${result.fixed !== 1 ? 's' : ''}`
          : 'No issues were fixed';
        showSuccess(message);
      }

      // Re-scan to update the list
      handleScan();
    } catch (error) {
      showError(`Failed to apply fixes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleStartEdit = (issue: RefErrorIssue) => {
    setEditingIssue(`${issue.monthId}-${issue.accountId}`);
    setEditValue(issue.calculatedRemainingCash.toString());
  };

  const handleSaveEdit = (issue: RefErrorIssue) => {
    const value = parseFloat(editValue);
    if (isNaN(value)) {
      showError('Invalid value');
      return;
    }

    try {
      setRemainingCashOverride(issue.monthId, issue.accountId, value);
      showSuccess(`Manual override set for ${issue.accountName} in ${issue.monthId}`);
      setEditingIssue(null);
      setEditValue('');
      handleScan();
    } catch (error) {
      showError(`Failed to set override: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingIssue(null);
    setEditValue('');
  };

  const fixableCount = issues.filter((i) => i.canAutoFix).length;
  const nonFixableCount = issues.filter((i) => !i.canAutoFix).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>#REF! Error Remediation</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Alert severity="info">
            <AlertTitle>About #REF! Errors</AlertTitle>
            This tool identifies months where remaining cash calculations are missing or incorrect.
            It can automatically recalculate remaining cash from available transaction data.
          </Alert>

          {isScanning ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress />
                <Typography>Scanning for #REF! errors...</Typography>
              </Stack>
            </Box>
          ) : (
            <>
              {summary && (
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="h6">Summary</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Chip label={`Total Months: ${summary.totalMonths}`} color="default" />
                      <Chip
                        label={`Affected Months: ${summary.affectedMonths}`}
                        color={summary.affectedMonths > 0 ? 'warning' : 'success'}
                      />
                      <Chip
                        label={`Total Issues: ${summary.totalIssues}`}
                        color={summary.totalIssues > 0 ? 'error' : 'success'}
                      />
                      <Chip
                        label={`Fixable: ${summary.fixableIssues}`}
                        color={summary.fixableIssues > 0 ? 'info' : 'default'}
                      />
                    </Stack>
                    {summary.dateRange.earliest && summary.dateRange.latest && (
                      <Typography variant="caption" color="text.secondary">
                        Date Range: {summary.dateRange.earliest} to {summary.dateRange.latest}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              )}

              {issues.length === 0 ? (
                <Alert severity="success">
                  <AlertTitle>No Issues Found</AlertTitle>
                  All remaining cash calculations are correct!
                </Alert>
              ) : (
                <>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6">
                      Issues Found: {issues.length}
                    </Typography>
                    <Chip label={`${fixableCount} fixable`} color="info" size="small" />
                    {nonFixableCount > 0 && (
                      <Chip label={`${nonFixableCount} need review`} color="warning" size="small" />
                    )}
                  </Stack>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell>Account</TableCell>
                          <TableCell>Current</TableCell>
                          <TableCell>Calculated</TableCell>
                          <TableCell>Difference</TableCell>
                          <TableCell>Data Status</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {issues.map((issue, index) => {
                          const isEditing = editingIssue === `${issue.monthId}-${issue.accountId}`;
                          const difference = issue.currentRemainingCash !== null && issue.currentRemainingCash !== undefined
                            ? Math.abs(issue.currentRemainingCash - issue.calculatedRemainingCash)
                            : issue.calculatedRemainingCash;

                          return (
                            <TableRow key={`${issue.monthId}-${issue.accountId}-${index}`}>
                              <TableCell>{issue.monthId}</TableCell>
                              <TableCell>{issue.accountName}</TableCell>
                              <TableCell>
                                {issue.currentRemainingCash === null || issue.currentRemainingCash === undefined
                                  ? <Typography color="error" variant="body2">NULL</Typography>
                                  : formatCurrency(issue.currentRemainingCash)}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <TextField
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    size="small"
                                    sx={{ width: 120 }}
                                    inputProps={{ step: 0.01 }}
                                  />
                                ) : (
                                  formatCurrency(issue.calculatedRemainingCash)
                                )}
                              </TableCell>
                              <TableCell>{formatCurrency(difference)}</TableCell>
                              <TableCell>
                                {issue.missingData && (
                                  <Tooltip
                                    title={
                                      `Transactions: ${issue.missingData.transactionCount} | ` +
                                      `Income: ${issue.missingData.hasIncome ? 'Yes' : 'No'} | ` +
                                      `Expenses: ${issue.missingData.hasExpenses ? 'Yes' : 'No'} | ` +
                                      `Savings: ${issue.missingData.hasSavings ? 'Yes' : 'No'}`
                                    }
                                  >
                                    <Chip
                                      label={
                                        issue.missingData.transactionCount > 0
                                          ? `${issue.missingData.transactionCount} txns`
                                          : 'No data'
                                      }
                                      color={issue.missingData.transactionCount > 0 ? 'info' : 'error'}
                                      size="small"
                                    />
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell>
                                {issue.canAutoFix ? (
                                  <Chip label="Fixable" color="success" size="small" />
                                ) : (
                                  <Chip label="Review Needed" color="warning" size="small" />
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleSaveEdit(issue)}
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={handleCancelEdit}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                ) : (
                                  <Tooltip title="Set manual override">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStartEdit(issue)}
                                      disabled={isFixing}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {nonFixableCount > 0 && (
                    <Alert severity="warning">
                      <AlertTitle>Non-Fixable Issues</AlertTitle>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          {nonFixableCount} issue{nonFixableCount !== 1 ? 's' : ''} require manual review.
                          These may be due to missing transaction data or other data inconsistencies.
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={applyOverridesForNonFixable}
                              onChange={(e) => setApplyOverridesForNonFixable(e.target.checked)}
                            />
                          }
                          label="Apply calculated values as overrides for non-fixable issues"
                        />
                        <Typography variant="caption" color="text.secondary">
                          You can also manually edit individual values using the edit icon in the table.
                        </Typography>
                      </Stack>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleScan} disabled={isScanning || isFixing}>
          Re-scan
        </Button>
        {(fixableCount > 0 || (nonFixableCount > 0 && applyOverridesForNonFixable)) && (
          <Button
            onClick={handleFix}
            variant="contained"
            color="primary"
            disabled={isScanning || isFixing || (fixableCount === 0 && !applyOverridesForNonFixable)}
          >
            {isFixing ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Fixing...
              </>
            ) : (
              `Fix ${fixableCount + (applyOverridesForNonFixable ? nonFixableCount : 0)} Issue${(fixableCount + (applyOverridesForNonFixable ? nonFixableCount : 0)) !== 1 ? 's' : ''}`
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

