/**
 * Storage Monitoring Component
 * 
 * Displays IndexedDB storage quota and usage information
 * with warnings when storage is getting full.
 */

import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Stack,
  LinearProgress,
  Alert,
  AlertTitle,
  Button,
  Box,
  Chip,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  getStorageEstimation,
  formatBytes,
  formatPercentage,
  type StorageEstimation,
} from '../../utils/storageMonitoring';

/**
 * StorageMonitoring Component
 * 
 * Displays storage quota, usage, and warnings when storage is getting full.
 * Automatically refreshes storage information on mount and when refresh button is clicked.
 */
export function StorageMonitoring() {
  const [estimation, setEstimation] = useState<StorageEstimation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getStorageEstimation();
      setEstimation(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage information');
      console.error('Error fetching storage info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  if (loading && !estimation) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Storage Usage</Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary">
            Loading storage information...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (error && !estimation) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Storage Usage</Typography>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchStorageInfo}
          >
            Retry
          </Button>
        </Stack>
      </Paper>
    );
  }

  if (!estimation) {
    return null;
  }

  const { quota, warningLevel } = estimation;
  const { usage, available, usagePercentage } = quota;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <StorageIcon />
            <Typography variant="h6">Storage Usage</Typography>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchStorageInfo}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        {warningLevel === 'critical' && (
          <Alert severity="error">
            <AlertTitle>Storage Almost Full</AlertTitle>
            <Typography variant="body2">
              You are using {formatPercentage(usagePercentage)} of available storage.
              Consider clearing old data or exporting backups to free up space.
            </Typography>
          </Alert>
        )}

        {warningLevel === 'warning' && (
          <Alert severity="warning">
            <AlertTitle>Storage Getting Full</AlertTitle>
            <Typography variant="body2">
              You are using {formatPercentage(usagePercentage)} of available storage.
              Consider managing your data to prevent running out of space.
            </Typography>
          </Alert>
        )}

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Usage: {formatBytes(usage)} / {formatBytes(quota.quota)}
            </Typography>
            <Chip
              label={formatPercentage(usagePercentage)}
              color={warningLevel === 'critical' ? 'error' : warningLevel === 'warning' ? 'warning' : 'default'}
              size="small"
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={usagePercentage}
            color={warningLevel === 'critical' ? 'error' : warningLevel === 'warning' ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Used
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatBytes(usage)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Available
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatBytes(available)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Quota
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatBytes(quota.quota)}
            </Typography>
          </Box>
        </Stack>

        {estimation.breakdown && Object.keys(estimation.breakdown).length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Storage Breakdown:
            </Typography>
            <Stack spacing={0.5}>
              {Object.entries(estimation.breakdown).map(([dbName, size]) => (
                <Stack key={dbName} direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {dbName}
                  </Typography>
                  <Typography variant="caption" fontWeight="medium">
                    {formatBytes(size)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {loading && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

