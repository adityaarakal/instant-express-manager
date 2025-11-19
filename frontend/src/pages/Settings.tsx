import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { ThemeModeToggle } from '../components/layout/ThemeModeToggle';
import { DataHealthCheck } from '../components/common/DataHealthCheck';
import { ExportHistory } from '../components/common/ExportHistory';
import { ScheduledExports } from '../components/common/ScheduledExports';
import { ProjectionsIntegration } from '../components/common/ProjectionsIntegration';
import { AccessibilityCheck } from '../components/common/AccessibilityCheck';
import { SecurityCheck } from '../components/common/SecurityCheck';
import { PerformanceMetricsDialog } from '../components/common/PerformanceMetricsDialog';
import { StorageMonitoring } from '../components/common/StorageMonitoring';
import { ErrorTrackingDialog } from '../components/common/ErrorTrackingDialog';
import { StorageCleanupDialog } from '../components/common/StorageCleanupDialog';
import { RefErrorRemediationDialog } from '../components/common/RefErrorRemediationDialog';
import {
  enableAnalytics,
  disableAnalytics,
  updateAnalyticsConfig,
  getAnalyticsConfig,
} from '../utils/analytics';
import {
  getStorageStatistics,
} from '../utils/storageCleanup';
import { downloadBackup, readBackupFile, importBackup, exportBackup } from '../utils/backupService';
import { syncAccountBalancesFromTransactions, type SyncResult } from '../utils/balanceSync';
import { clearAllData } from '../utils/clearAllData';
import { performanceMonitor } from '../utils/performanceMonitoring';
import SyncIcon from '@mui/icons-material/Sync';
import SpeedIcon from '@mui/icons-material/Speed';
import BugReportIcon from '@mui/icons-material/BugReport';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
];

export function Settings() {
  const { settings, updateSettings, reset } = useSettingsStore();
  const { showSuccess, showError, showWarning, showInfo } = useToastStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importReplaceMode, setImportReplaceMode] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<{ version: string; timestamp: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [performanceMetricsDialogOpen, setPerformanceMetricsDialogOpen] = useState(false);
  const [errorTrackingDialogOpen, setErrorTrackingDialogOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [analyticsProvider, setAnalyticsProvider] = useState<'plausible' | 'google-analytics' | null>(null);
  const [plausibleDomain, setPlausibleDomain] = useState('');
  const [gaMeasurementId, setGaMeasurementId] = useState('');
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [refErrorDialogOpen, setRefErrorDialogOpen] = useState(false);
  const [storageStats, setStorageStats] = useState<{
    transactions: number;
    emis: number;
    recurringTemplates: number;
    undoItems: number;
    exportHistoryItems: number;
  } | null>(null);

  // Load analytics config on mount
  useEffect(() => {
    getAnalyticsConfig().then((config) => {
      setAnalyticsEnabled(config.enabled && config.userConsent);
      setAnalyticsProvider(
        config.provider === 'plausible' || config.provider === 'google-analytics' ? config.provider : null
      );
      setPlausibleDomain(config.providerConfig?.domain || '');
      setGaMeasurementId(config.providerConfig?.measurementId || '');
    });
  }, []);

  // Load storage statistics
  useEffect(() => {
    getStorageStatistics()
      .then(setStorageStats)
      .catch((error) => {
        console.error('Failed to load storage statistics:', error);
      });
  }, [cleanupDialogOpen]);
  const [appVersion, setAppVersion] = useState<string>(
    (() => {
      // Try to read from meta tag first (for automatic updates)
      const metaVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
      // Fallback to build-time constant, then default
      return metaVersion || (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0');
    })()
  );

  // Fetch version dynamically at runtime
  // This will automatically pick up version changes when package.json is updated (e.g., after git pull)
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        // Try to fetch from API endpoint (reads package.json at runtime - always fresh)
        // Add timestamp and cache-busting headers to prevent any caching
        const response = await fetch(`/api/version?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.version && data.version !== appVersion) {
            setAppVersion(data.version);
            return;
          }
        }
      } catch (error) {
        // Fallback to version.json if API not available (production builds)
      }
      
      try {
        // Fallback to version.json static file (for production builds)
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.version && data.version !== appVersion) {
            setAppVersion(data.version);
            return;
          }
        }
      } catch (error) {
        // Keep existing version if fetch fails
      }
    };

    // Fetch immediately on mount
    fetchVersion();
    
    // Poll for version changes continuously
    // More frequent in dev mode to catch changes after git pull without restart
    const pollInterval = import.meta.env.DEV ? 2000 : 10000; // 2s in dev, 10s in production
    const interval = setInterval(fetchVersion, pollInterval);
    
    return () => clearInterval(interval);
  }, [appVersion]); // Re-run effect if appVersion changes to continue polling with new value

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleReset = () => {
    reset();
    setLocalSettings(useSettingsStore.getState().settings);
  };

  const handleBucketStatusChange = (bucketId: string, status: 'pending' | 'paid') => {
    setLocalSettings({
      ...localSettings,
      defaultStatusByBucket: {
        ...localSettings.defaultStatusByBucket,
        [bucketId]: status,
      },
    });
  };

  const handleBucketNameChange = (bucketId: string, name: string) => {
    setLocalSettings({
      ...localSettings,
      defaultBuckets: localSettings.defaultBuckets.map((bucket) =>
        bucket.id === bucketId ? { ...bucket, name } : bucket,
      ),
    });
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  const handleExportBackup = () => {
    try {
      downloadBackup();
      showSuccess('Backup exported successfully');
    } catch (error) {
      showError(getUserFriendlyError(error, 'export backup'));
    }
  };

  const handleImportFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backupData = await readBackupFile(file);
      setBackupFile(file);
      setBackupInfo({
        version: backupData.version,
        timestamp: backupData.timestamp,
      });
      setImportDialogOpen(true);
    } catch (error) {
      showError(getUserFriendlyError(error, 'read backup file'));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportConfirm = async () => {
    if (!backupFile) return;

    try {
      const backupData = await readBackupFile(backupFile);
      const importResult = importBackup(backupData, importReplaceMode);
      
      // Show warnings if any
      if (importResult.warnings && importResult.warnings.length > 0) {
        importResult.warnings.forEach((warning) => {
          showWarning(warning);
        });
      }
      
      // Show success message
      let successMessage = importReplaceMode
        ? 'Backup imported successfully. All existing data has been replaced.'
        : 'Backup imported successfully. Data has been merged with existing records.';
      
      if (importResult.migrated) {
        successMessage += ` Data migrated from version ${importResult.backupVersion} to current version.`;
      }
      
      showSuccess(successMessage);
      setImportDialogOpen(false);
      setBackupFile(null);
      setBackupInfo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      showError(getUserFriendlyError(error, 'import backup'));
    }
  };

  const handleImportCancel = () => {
    setImportDialogOpen(false);
    setBackupFile(null);
    setBackupInfo(null);
    setImportReplaceMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSyncBalances = () => {
    try {
      setIsSyncing(true);
      const results = syncAccountBalancesFromTransactions();
      setSyncResults(results);
      setSyncDialogOpen(true);
      
      const updatedCount = results.filter((r) => r.updated).length;
      if (updatedCount > 0) {
        showSuccess(`Account balances synced successfully. ${updatedCount} account(s) updated.`);
      } else {
        showSuccess('All account balances are already in sync.');
      }
    } catch (error) {
      showError(getUserFriendlyError(error, 'sync account balances'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDialogClose = () => {
    setSyncDialogOpen(false);
    setSyncResults([]);
  };

  const handleClearAllData = async () => {
    try {
      setIsClearing(true);
      await clearAllData();
      showSuccess('All data cleared successfully. The app will reload.');
      // Page will reload automatically after clearAllData completes
    } catch (error) {
      showError(getUserFriendlyError(error, 'clear all data'));
      setIsClearing(false);
    }
  };

  const handleClearDataDialogOpen = () => {
    setClearDataDialogOpen(true);
  };

  const handleClearDataDialogClose = () => {
    setClearDataDialogOpen(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const currentBackupInfo = exportBackup();

  return (
    <Stack spacing={3}>
      <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Workspace Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure defaults that align with your Planned Expenses spreadsheet.
            </Typography>
          </Box>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Appearance</Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Theme
              </Typography>
              <ThemeModeToggle />
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Currency & Defaults</Typography>
            <FormControl fullWidth>
              <InputLabel>Base Currency</InputLabel>
              <Select
                value={localSettings.currency}
                label="Base Currency"
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, currency: e.target.value })
                }
              >
                {CURRENCIES.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Default Fixed Factor"
              type="number"
              value={localSettings.fixedFactor}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  fixedFactor: Number(e.target.value) || 0,
                })
              }
              helperText="Default fixed factor applied to new months"
              fullWidth
            />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Reminders</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.enableReminders}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      enableReminders: e.target.checked,
                    })
                  }
                />
              }
              label="Enable due date reminders"
            />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Bucket Definitions</Typography>
            <Typography variant="body2" color="text.secondary">
              Configure bucket names, colors, and default statuses.
            </Typography>
            <Stack spacing={2}>
              {localSettings.defaultBuckets.map((bucket) => (
                <Paper key={bucket.id} elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: bucket.color,
                          border: 1,
                          borderColor: 'divider',
                        }}
                      />
                      <TextField
                        label="Bucket Name"
                        value={bucket.name}
                        onChange={(e) => handleBucketNameChange(bucket.id, e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Default Status</InputLabel>
                        <Select
                          value={localSettings.defaultStatusByBucket[bucket.id] ?? bucket.defaultStatus}
                          label="Default Status"
                          onChange={(e) =>
                            handleBucketStatusChange(
                              bucket.id,
                              e.target.value as 'pending' | 'paid',
                            )
                          }
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Export History</Typography>
            <Typography variant="body2" color="text.secondary">
              Track when you export transactions or backups.
            </Typography>
            <ExportHistory />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Scheduled Exports</Typography>
            <Typography variant="body2" color="text.secondary">
              Automatically export transactions on a schedule. Exports run when the app is open.
            </Typography>
            <ScheduledExports />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Projections Integration</Typography>
            <Typography variant="body2" color="text.secondary">
              Import projections from CSV or Excel files to auto-populate inflow totals and track savings targets.
            </Typography>
            <ProjectionsIntegration />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">#REF! Error Remediation</Typography>
            <Typography variant="body2" color="text.secondary">
              Fix incomplete remaining cash calculations for months affected by #REF! errors.
              This tool recalculates remaining cash from available transaction data.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>About #REF! Errors</AlertTitle>
              <Typography variant="body2">
                Some months may have null or incorrect remaining cash values due to data migration issues.
                This tool can automatically recalculate and fix these values.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={() => setRefErrorDialogOpen(true)}
              fullWidth
            >
              Fix #REF! Errors
            </Button>
            <Typography variant="caption" color="text.secondary">
              Scan for and fix remaining cash calculation errors in your data.
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Data Health</Typography>
            <DataHealthCheck />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Security</Typography>
            <Typography variant="body2" color="text.secondary">
              Check security status including XSS protection, data sanitization, and secure context.
            </Typography>
            <SecurityCheck />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Accessibility</Typography>
            <Typography variant="body2" color="text.secondary">
              Check accessibility compliance including color contrast ratios and WCAG standards.
            </Typography>
            <AccessibilityCheck />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Performance Monitoring</Typography>
            <Typography variant="body2" color="text.secondary">
              View performance metrics and operation timings. Monitoring is enabled automatically in production.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Performance Metrics</AlertTitle>
              <Typography variant="body2">
                Metrics are tracked locally and not sent to any server. This helps identify slow operations.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              startIcon={<SpeedIcon />}
              onClick={() => {
                const metrics = performanceMonitor.getOperationMetrics();
                const allMetrics = performanceMonitor.getMetrics();
                
                if (Object.keys(metrics).length === 0 && allMetrics.length === 0) {
                  showInfo('No performance metrics available yet. Metrics are collected as you use the app.');
                  return;
                }
                
                // Open metrics dialog
                setPerformanceMetricsDialogOpen(true);
              }}
              fullWidth
            >
              View Performance Metrics
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={performanceMonitor.getEnabled()}
                  onChange={(e) => {
                    performanceMonitor.setEnabled(e.target.checked);
                    showSuccess(`Performance monitoring ${e.target.checked ? 'enabled' : 'disabled'}`);
                  }}
                />
              }
              label="Enable Performance Monitoring"
            />
            <Typography variant="caption" color="text.secondary">
              When enabled, performance metrics are stored locally and can be viewed above.
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Storage Usage</Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor IndexedDB storage quota and usage. Warnings will appear when storage is getting full.
            </Typography>
            <StorageMonitoring />
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Storage Cleanup</Typography>
            <Typography variant="body2" color="text.secondary">
              Clean up old data to free up storage space and improve app performance. Configure cleanup options to automatically manage your data.
            </Typography>
            {storageStats && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Current Storage Statistics</AlertTitle>
                <Typography variant="body2">
                  Transactions: {storageStats.transactions} | EMIs: {storageStats.emis} | Recurring Templates: {storageStats.recurringTemplates} | Undo Items: {storageStats.undoItems} | Export History: {storageStats.exportHistoryItems}
                </Typography>
              </Alert>
            )}
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Warning</AlertTitle>
              <Typography variant="body2">
                Storage cleanup is irreversible. Make sure to export a backup before cleaning up data. Deleted data cannot be recovered.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setCleanupDialogOpen(true)}
              fullWidth
            >
              Configure Storage Cleanup
            </Button>
            <Typography variant="caption" color="text.secondary">
              Configure and run storage cleanup to remove old data and optimize storage usage.
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Error Tracking</Typography>
            <Typography variant="body2" color="text.secondary">
              View error logs and track application errors. Errors are stored locally and never sent to external servers unless configured.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Privacy First</AlertTitle>
              <Typography variant="body2">
                All errors are stored locally in your browser. No error data is sent to external services
                unless you explicitly configure an external service (e.g., Sentry). Personal data is automatically
                redacted from error logs.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              startIcon={<BugReportIcon />}
              onClick={() => setErrorTrackingDialogOpen(true)}
              fullWidth
            >
              View Error Logs
            </Button>
            <Typography variant="caption" color="text.secondary">
              View stored error logs and clear them if needed. Errors help identify and fix issues.
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Analytics</Typography>
            <Typography variant="body2" color="text.secondary">
              Optional privacy-friendly analytics to understand how the app is used. Analytics are disabled by default and only enabled when you explicitly configure them.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Privacy First</AlertTitle>
              <Typography variant="body2">
                Analytics are <strong>disabled by default</strong>. No data is tracked or sent to external services
                unless you explicitly enable and configure analytics. We recommend Plausible for privacy-friendly analytics
                (GDPR compliant, no cookies, open-source).
              </Typography>
            </Alert>
            <FormControlLabel
              control={
                <Switch
                  checked={analyticsEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setAnalyticsEnabled(enabled);
                    
                    if (enabled) {
                      // Validate provider configuration
                      if (!analyticsProvider) {
                        showWarning('Please select an analytics provider first.');
                        setAnalyticsEnabled(false);
                        return;
                      }
                      
                      if (analyticsProvider === 'plausible' && !plausibleDomain) {
                        showWarning('Please enter a Plausible domain.');
                        setAnalyticsEnabled(false);
                        return;
                      }
                      
                      if (analyticsProvider === 'google-analytics' && !gaMeasurementId) {
                        showWarning('Please enter a Google Analytics Measurement ID.');
                        setAnalyticsEnabled(false);
                        return;
                      }
                      
                      // Enable analytics
                      updateAnalyticsConfig({
                        enabled: true,
                        provider: analyticsProvider,
                        providerConfig: analyticsProvider === 'plausible'
                          ? { domain: plausibleDomain }
                          : { measurementId: gaMeasurementId },
                        trackPageViews: true,
                        userConsent: true,
                      }).then(() => {
                        enableAnalytics(true).then(() => {
                          showSuccess('Analytics enabled. Page views and events will be tracked.');
                        });
                      });
                    } else {
                      disableAnalytics().then(() => {
                        showSuccess('Analytics disabled. No data will be tracked.');
                      });
                    }
                  }}
                />
              }
              label="Enable Analytics"
            />
            <FormControl fullWidth disabled={analyticsEnabled}>
              <InputLabel>Analytics Provider</InputLabel>
              <Select
                value={analyticsProvider || ''}
                label="Analytics Provider"
                onChange={(e) => {
                  const provider = e.target.value as 'plausible' | 'google-analytics' | '';
                  setAnalyticsProvider(provider === '' ? null : provider);
                  
                  // Clear configuration when changing provider
                  setPlausibleDomain('');
                  setGaMeasurementId('');
                }}
              >
                <MenuItem value="">None (Disabled)</MenuItem>
                <MenuItem value="plausible">Plausible (Privacy-friendly, recommended)</MenuItem>
                <MenuItem value="google-analytics">Google Analytics 4</MenuItem>
              </Select>
            </FormControl>
            {analyticsProvider === 'plausible' && (
              <TextField
                label="Plausible Domain"
                value={plausibleDomain}
                onChange={(e) => setPlausibleDomain(e.target.value)}
                placeholder="yourdomain.com"
                disabled={analyticsEnabled}
                helperText="Enter your Plausible Analytics domain"
                fullWidth
              />
            )}
            {analyticsProvider === 'google-analytics' && (
              <TextField
                label="Google Analytics Measurement ID"
                value={gaMeasurementId}
                onChange={(e) => setGaMeasurementId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                disabled={analyticsEnabled}
                helperText="Enter your Google Analytics 4 Measurement ID"
                fullWidth
              />
            )}
            {analyticsEnabled && (
              <Alert severity="success">
                <AlertTitle>Analytics Active</AlertTitle>
                <Typography variant="body2">
                  Analytics is enabled and tracking page views and events. You can disable it at any time.
                </Typography>
              </Alert>
            )}
            <Typography variant="caption" color="text.secondary">
              {analyticsProvider === 'plausible'
                ? 'Plausible is a privacy-friendly analytics tool that is GDPR compliant, does not use cookies, and is open-source.'
                : analyticsProvider === 'google-analytics'
                ? 'Google Analytics 4 tracks page views and events. IP addresses are anonymized for privacy.'
                : 'Analytics are disabled. No data is tracked or sent to external services.'}
            </Typography>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Balance Sync</Typography>
            <Typography variant="body2" color="text.secondary">
              Sync account balances with existing transactions. This is useful if you have old data created before automatic balance updates were implemented.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>How it works</AlertTitle>
              <Typography variant="body2">
                This tool will recalculate all account balances based on transactions with "Received", "Paid", or "Completed" status.
                Your current balance will be treated as the base, and transaction effects will be applied on top.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleSyncBalances}
              disabled={isSyncing}
              fullWidth
            >
              {isSyncing ? 'Syncing...' : 'Sync Account Balances'}
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Clear All Data</Typography>
            <Typography variant="body2" color="text.secondary">
              Permanently delete all your data and reset the application to a clean state.
              This action cannot be undone. Make sure to export a backup first if you want to keep your data.
            </Typography>
            <Alert severity="error">
              <AlertTitle>Warning: This action is irreversible</AlertTitle>
              <Typography variant="body2">
                This will delete all banks, accounts, transactions, EMIs, recurring items, planner data, and settings.
                The app will automatically reload after clearing all data.
              </Typography>
            </Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={handleClearDataDialogOpen}
              fullWidth
            >
              Clear All Data
            </Button>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h6">Data Backup & Restore</Typography>
            <Typography variant="body2" color="text.secondary">
              Export all your data to a backup file or import from a previous backup.
            </Typography>

            <Stack spacing={2}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Current Backup Info
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip label={`Version ${currentBackupInfo.version}`} size="small" />
                      <Typography variant="caption" color="text.secondary">
                        Last backup: {new Date(currentBackupInfo.timestamp).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportBackup}
                      fullWidth
                    >
                      Export Backup
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      fullWidth
                    >
                      Import Backup
                    </Button>
                  </Stack>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImportFileSelect}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </Stack>
          
          <Divider />
          
          <Stack spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Version: {appVersion}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Instant Express Manager
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={importDialogOpen} onClose={handleImportCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Import Backup</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {backupInfo && (
              <Alert severity="info">
                <AlertTitle>Backup Information</AlertTitle>
                <Typography variant="body2">
                  Version: {backupInfo.version}
                </Typography>
                <Typography variant="body2">
                  Created: {new Date(backupInfo.timestamp).toLocaleString()}
                </Typography>
              </Alert>
            )}

            <Alert severity="warning">
              <AlertTitle>Import Options</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Choose how to import the backup:
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={importReplaceMode}
                    onChange={(e) => setImportReplaceMode(e.target.checked)}
                  />
                }
                label="Replace all existing data"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {importReplaceMode
                  ? '⚠️ This will delete all current data and replace it with the backup.'
                  : 'This will merge backup data with existing records (duplicates by ID will be skipped).'}
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportCancel}>Cancel</Button>
          <Button
            onClick={handleImportConfirm}
            variant="contained"
            color={importReplaceMode ? 'error' : 'primary'}
          >
            {importReplaceMode ? 'Replace All Data' : 'Import & Merge'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={syncDialogOpen} onClose={handleSyncDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Balance Sync Results</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {syncResults.length === 0 ? (
              <Typography>No accounts to sync.</Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  {syncResults.filter((r) => r.updated).length} account(s) updated,{' '}
                  {syncResults.filter((r) => !r.updated).length} account(s) already in sync.
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Account</TableCell>
                        <TableCell align="right">Previous Balance</TableCell>
                        <TableCell align="right">New Balance</TableCell>
                        <TableCell align="right">Difference</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {syncResults.map((result) => (
                        <TableRow key={result.accountId}>
                          <TableCell>{result.accountName}</TableCell>
                          <TableCell align="right">{formatCurrency(result.previousBalance)}</TableCell>
                          <TableCell align="right">{formatCurrency(result.calculatedBalance)}</TableCell>
                          <TableCell align="right">
                            {result.balanceDifference !== 0 && (
                              <Typography
                                variant="body2"
                                color={result.balanceDifference > 0 ? 'success.main' : 'error.main'}
                              >
                                {result.balanceDifference > 0 ? '+' : ''}
                                {formatCurrency(result.balanceDifference)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {result.updated ? (
                              <Chip label="Updated" color="success" size="small" />
                            ) : (
                              <Chip label="In Sync" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSyncDialogClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearDataDialogOpen} onClose={handleClearDataDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Clear All Data</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="error">
              <AlertTitle>⚠️ This action cannot be undone!</AlertTitle>
              <Typography variant="body2">
                This will permanently delete ALL your data including:
              </Typography>
              <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                <li>All banks and bank accounts</li>
                <li>All transactions (income, expense, savings/investment, transfers)</li>
                <li>All EMIs (expense and savings/investment)</li>
                <li>All recurring templates (income, expense, savings/investment)</li>
                <li>All planner data and preferences</li>
                <li>All settings (will reset to defaults)</li>
                <li>All export history and undo data</li>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                The application will automatically reload after clearing all data.
              </Typography>
            </Alert>
            <Alert severity="warning">
              <AlertTitle>Recommendation</AlertTitle>
              <Typography variant="body2">
                Make sure to export a backup before proceeding if you want to keep your data.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearDataDialogClose} disabled={isClearing}>
            Cancel
          </Button>
          <Button
            onClick={handleClearAllData}
            variant="contained"
            color="error"
            disabled={isClearing}
            startIcon={<DeleteForeverIcon />}
          >
            {isClearing ? 'Clearing...' : 'Yes, Clear All Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Performance Metrics Dialog */}
      <PerformanceMetricsDialog
        open={performanceMetricsDialogOpen}
        onClose={() => setPerformanceMetricsDialogOpen(false)}
      />

      {/* Error Tracking Dialog */}
      <ErrorTrackingDialog
        open={errorTrackingDialogOpen}
        onClose={() => setErrorTrackingDialogOpen(false)}
      />

      {/* Storage Cleanup Dialog */}
      <StorageCleanupDialog
        open={cleanupDialogOpen}
        onClose={() => setCleanupDialogOpen(false)}
      />

      {refErrorDialogOpen && (
        <RefErrorRemediationDialog
          open={refErrorDialogOpen}
          onClose={() => setRefErrorDialogOpen(false)}
        />
      )}
    </Stack>
  );
}
