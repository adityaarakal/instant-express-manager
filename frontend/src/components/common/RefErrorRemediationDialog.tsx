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
} from '@mui/material';
import {
  scanRefErrors,
  applyRefErrorFixes,
  getRefErrorSummary,
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
      const fixableIssues = issues.filter((i) => i.canAutoFix);
      
      if (fixableIssues.length === 0) {
        showError('No fixable issues found');
        setIsFixing(false);
        return;
      }

      const result = applyRefErrorFixes(fixableIssues, false);

      if (result.errors.length > 0) {
        showError(`Fixed ${result.fixed} issues, but encountered ${result.errors.length} errors`);
        console.error('Fix errors:', result.errors);
      } else {
        showSuccess(`Successfully fixed ${result.fixed} issue${result.fixed !== 1 ? 's' : ''}`);
      }

      // Re-scan to update the list
      handleScan();
    } catch (error) {
      showError(`Failed to apply fixes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFixing(false);
    }
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
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {issues.map((issue, index) => (
                          <TableRow key={`${issue.monthId}-${issue.accountId}-${index}`}>
                            <TableCell>{issue.monthId}</TableCell>
                            <TableCell>{issue.accountName}</TableCell>
                            <TableCell>
                              {issue.currentRemainingCash === null || issue.currentRemainingCash === undefined
                                ? <Typography color="error" variant="body2">NULL</Typography>
                                : formatCurrency(issue.currentRemainingCash)}
                            </TableCell>
                            <TableCell>{formatCurrency(issue.calculatedRemainingCash)}</TableCell>
                            <TableCell>
                              {issue.currentRemainingCash !== null && issue.currentRemainingCash !== undefined
                                ? formatCurrency(
                                    Math.abs(issue.currentRemainingCash - issue.calculatedRemainingCash),
                                  )
                                : formatCurrency(issue.calculatedRemainingCash)}
                            </TableCell>
                            <TableCell>
                              {issue.canAutoFix ? (
                                <Chip label="Fixable" color="success" size="small" />
                              ) : (
                                <Chip label="Review Needed" color="warning" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {nonFixableCount > 0 && (
                    <Alert severity="warning">
                      <AlertTitle>Non-Fixable Issues</AlertTitle>
                      {nonFixableCount} issue{nonFixableCount !== 1 ? 's' : ''} require manual review.
                      These may be due to missing transaction data or other data inconsistencies.
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
        {fixableCount > 0 && (
          <Button
            onClick={handleFix}
            variant="contained"
            color="primary"
            disabled={isScanning || isFixing || fixableCount === 0}
          >
            {isFixing ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Fixing...
              </>
            ) : (
              `Fix ${fixableCount} Issue${fixableCount !== 1 ? 's' : ''}`
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

