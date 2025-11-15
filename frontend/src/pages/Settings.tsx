import { useState, useRef } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { ThemeModeToggle } from '../components/layout/ThemeModeToggle';
import { DataHealthCheck } from '../components/common/DataHealthCheck';
import { ExportHistory } from '../components/common/ExportHistory';
import { downloadBackup, readBackupFile, importBackup, exportBackup } from '../utils/backupService';

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
];

export function Settings() {
  const { settings, updateSettings, reset } = useSettingsStore();
  const { showSuccess, showError } = useToastStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importReplaceMode, setImportReplaceMode] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<{ version: string; timestamp: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      importBackup(backupData, importReplaceMode);
      showSuccess(
        importReplaceMode
          ? 'Backup imported successfully. All existing data has been replaced.'
          : 'Backup imported successfully. Data has been merged with existing records.'
      );
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            <Typography variant="h6">Data Health</Typography>
            <DataHealthCheck />
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
    </Stack>
  );
}
