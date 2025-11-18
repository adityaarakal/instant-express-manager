/**
 * Performance Metrics Dialog Component
 * 
 * Displays performance metrics including Web Vitals and operation timings
 * in a user-friendly dialog interface.
 *
 * @component
 * @example
 * ```tsx
 * <PerformanceMetricsDialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import { performanceMonitor, type PerformanceMetric, getBundleInfo, type BundleInfo } from '../../utils/performanceMonitoring';

/**
 * Props for PerformanceMetricsDialog component
 * @interface
 */
interface PerformanceMetricsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback function called when dialog is closed */
  onClose: () => void;
}

/**
 * Format a time value in milliseconds
 */
const formatTime = (ms: number): string => {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)} μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
};

/**
 * Get Web Vital score color
 */
const getWebVitalColor = (name: string, value: number): 'success' | 'warning' | 'error' => {
  // Web Vitals thresholds based on Google's recommendations
  if (name === 'LCP') {
    // LCP: Good < 2.5s, Needs Improvement 2.5s-4s, Poor > 4s
    if (value < 2500) return 'success';
    if (value < 4000) return 'warning';
    return 'error';
  }
  if (name === 'FID') {
    // FID: Good < 100ms, Needs Improvement 100ms-300ms, Poor > 300ms
    if (value < 100) return 'success';
    if (value < 300) return 'warning';
    return 'error';
  }
  if (name === 'CLS') {
    // CLS: Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
    if (value < 0.1) return 'success';
    if (value < 0.25) return 'warning';
    return 'error';
  }
  if (name === 'FCP') {
    // FCP: Good < 1.8s, Needs Improvement 1.8s-3s, Poor > 3s
    if (value < 1800) return 'success';
    if (value < 3000) return 'warning';
    return 'error';
  }
  if (name === 'TTFB') {
    // TTFB: Good < 800ms, Needs Improvement 800ms-1.8s, Poor > 1.8s
    if (value < 800) return 'success';
    if (value < 1800) return 'warning';
    return 'error';
  }
  return 'success';
};

/**
 * Get Web Vital score label
 */
const getWebVitalScore = (name: string, value: number): string => {
  const color = getWebVitalColor(name, value);
  if (color === 'success') return 'Good';
  if (color === 'warning') return 'Needs Improvement';
  return 'Poor';
};

/**
 * Performance Metrics Dialog component
 * Displays Web Vitals and operation metrics in a tabulated format
 *
 * @param props - PerformanceMetricsDialogProps
 * @returns Dialog component with performance metrics
 */
export function PerformanceMetricsDialog({ open, onClose }: PerformanceMetricsDialogProps) {
  const operationMetrics = performanceMonitor.getOperationMetrics();
  const allMetrics = performanceMonitor.getMetrics();
  const webVitals = allMetrics.filter((m) => m.type === 'web-vital');
  const slowOperations = allMetrics.filter((m) => m.type === 'operation' && m.value > 100);
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null);

  useEffect(() => {
    if (open) {
      getBundleInfo().then(setBundleInfo).catch(() => setBundleInfo(null));
    }
  }, [open]);

  // Get latest Web Vital for each type
  const latestWebVitals: Record<string, PerformanceMetric> = {};
  webVitals.forEach((metric) => {
    const existing = latestWebVitals[metric.name];
    if (!existing || metric.timestamp > existing.timestamp) {
      latestWebVitals[metric.name] = metric;
    }
  });

  const handleRefresh = () => {
    // Force re-render by closing and reopening (React will re-read metrics)
    // This is a simple approach - in a real app, you might use state management
    window.location.reload();
  };

  const handleClear = () => {
    performanceMonitor.clearMetrics();
    window.location.reload();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Typography variant="h6">Performance Metrics</Typography>
          </Box>
          <IconButton aria-label="close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity="info">
            <AlertTitle>About Performance Metrics</AlertTitle>
            <Typography variant="body2">
              Metrics are tracked locally and not sent to any server. This helps identify slow operations and monitor app performance.
            </Typography>
          </Alert>

          {/* Web Vitals */}
          {Object.keys(latestWebVitals).length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Web Vitals
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Core Web Vitals measure real-world user experience for loading, interactivity, and visual stability.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell>Recorded At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.values(latestWebVitals).map((metric) => {
                      const score = getWebVitalScore(metric.name, metric.value);
                      const color = getWebVitalColor(metric.name, metric.value);
                      return (
                        <TableRow key={metric.name}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {metric.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace">
                              {formatTime(metric.value)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={score}
                              color={color}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(metric.timestamp).toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Bundle Size Information */}
          {bundleInfo && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Bundle Size
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                JavaScript bundle sizes from the last build. Helps identify large dependencies and optimize loading.
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Bundle Summary</AlertTitle>
                <Typography variant="body2">
                  Total Size: <strong>{bundleInfo.totalSizeFormatted}</strong> ({bundleInfo.chunksCount} chunks)
                </Typography>
              </Alert>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Chunk Name</TableCell>
                      <TableCell align="right">Size</TableCell>
                      <TableCell align="center">Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bundleInfo.chunks.slice(0, 15).map((chunk) => (
                      <TableRow key={chunk.name}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {chunk.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontFamily="monospace">
                            {chunk.sizeFormatted}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={chunk.type}
                            size="small"
                            variant="outlined"
                            color={chunk.type === 'vendor' ? 'primary' : chunk.type === 'main' ? 'secondary' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {bundleInfo.chunks.length > 15 && (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="caption" color="text.secondary">
                            ... and {bundleInfo.chunks.length - 15} more chunks
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Operation Metrics */}
          {Object.keys(operationMetrics).length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Operation Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tracked operations with timing statistics. Operations over 100ms are flagged as slow.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Operation</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Avg Time</TableCell>
                      <TableCell align="right">Min Time</TableCell>
                      <TableCell align="right">Max Time</TableCell>
                      <TableCell align="right">Total Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(operationMetrics)
                      .sort(([, a], [, b]) => b.averageTime - a.averageTime)
                      .map(([operationName, stats]) => (
                        <TableRow
                          key={operationName}
                          sx={{
                            bgcolor: stats.averageTime > 100 ? 'error.light' : undefined,
                            opacity: stats.averageTime > 100 ? 0.1 : undefined,
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {operationName}
                              {stats.averageTime > 100 && (
                                <Chip
                                  label="Slow"
                                  color="error"
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{stats.count}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace">
                              {formatTime(stats.averageTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                              {formatTime(stats.minTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                              {formatTime(stats.maxTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace">
                              {formatTime(stats.totalTime)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Slow Operations */}
          {slowOperations.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Slow Operations ({slowOperations.length})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Operations that took longer than 100ms to complete.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Operation</TableCell>
                      <TableCell align="right">Duration</TableCell>
                      <TableCell>Recorded At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slowOperations
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 20)
                      .map((metric, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {metric.name.replace('slow-operation:', '')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontFamily="monospace" color="error.main">
                              {formatTime(metric.value)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(metric.timestamp).toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Empty State */}
          {Object.keys(latestWebVitals).length === 0 &&
            Object.keys(operationMetrics).length === 0 &&
            slowOperations.length === 0 &&
            !bundleInfo && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No performance metrics available yet.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Metrics are collected as you use the app. Make sure performance monitoring is enabled.
                </Typography>
              </Box>
            )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClear}
          startIcon={<DeleteIcon />}
          color="error"
          disabled={Object.keys(operationMetrics).length === 0 && allMetrics.length === 0}
        >
          Clear Metrics
        </Button>
        <Button onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

