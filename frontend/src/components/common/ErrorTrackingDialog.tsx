/**
 * Error Tracking Dialog Component
 * 
 * Displays stored errors from error tracking system.
 * Allows users to view error logs and clear stored errors.
 * 
 * @component
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Stack,
  Alert,
  AlertTitle,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getStoredErrors, clearStoredErrors, type TrackedError } from '../../utils/errorTracking';
import { useToastStore } from '../../store/useToastStore';

interface ErrorTrackingDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Get severity color
 */
function getSeverityColor(severity: string): 'default' | 'primary' | 'warning' | 'error' {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'primary';
    default:
      return 'default';
  }
}

export function ErrorTrackingDialog({ open, onClose }: ErrorTrackingDialogProps) {
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { showSuccess, showError } = useToastStore();

  const loadErrors = async () => {
    setLoading(true);
    try {
      const storedErrors = await getStoredErrors();
      setErrors(storedErrors);
    } catch (error) {
      showError('Failed to load error logs.');
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClearErrors = async () => {
    try {
      await clearStoredErrors();
      setErrors([]);
      showSuccess('Error logs cleared successfully.');
    } catch (error) {
      showError('Failed to clear error logs.');
      console.error('Failed to clear errors:', error);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Error Logs</Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearErrors}
            disabled={errors.length === 0}
            size="small"
          >
            Clear All
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading error logs...
          </Typography>
        ) : errors.length === 0 ? (
          <Alert severity="info">
            <AlertTitle>No Errors</AlertTitle>
            <Typography variant="body2">
              No errors have been logged yet. Errors will appear here when they occur.
            </Typography>
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell>Component</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errors.map((error) => {
                  const isExpanded = expandedIds.has(error.id);
                  return (
                    <>
                      <TableRow key={error.id}>
                        <TableCell>
                          <Chip
                            label={error.severity}
                            color={getSeverityColor(error.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {error.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {error.message.substring(0, 50)}
                            {error.message.length > 50 ? '...' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {error.context?.component || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(error.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(error.id)}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 2, bgcolor: 'grey.50' }}>
                            <Stack spacing={2}>
                              <Box>
                                <Typography variant="caption" fontWeight="bold">
                                  Full Message:
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {error.message}
                                </Typography>
                              </Box>
                              {error.stack && (
                                <Box>
                                  <Typography variant="caption" fontWeight="bold">
                                    Stack Trace:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    component="pre"
                                    sx={{
                                      mt: 0.5,
                                      p: 1,
                                      bgcolor: 'grey.100',
                                      borderRadius: 1,
                                      fontSize: '0.75rem',
                                      overflow: 'auto',
                                      maxHeight: '200px',
                                    }}
                                  >
                                    {error.stack}
                                  </Typography>
                                </Box>
                              )}
                              {error.context && (
                                <Box>
                                  <Typography variant="caption" fontWeight="bold">
                                    Context:
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    component="pre"
                                    sx={{
                                      mt: 0.5,
                                      p: 1,
                                      bgcolor: 'grey.100',
                                      borderRadius: 1,
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    {JSON.stringify(error.context, null, 2)}
                                  </Typography>
                                </Box>
                              )}
                              {error.reported && (
                                <Chip label="Reported to external service" size="small" color="success" />
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {errors.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Note</AlertTitle>
            <Typography variant="body2">
              Only the most recent {errors.length} errors are stored. Older errors are automatically removed.
              Errors are stored locally and never sent to external servers unless configured.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

