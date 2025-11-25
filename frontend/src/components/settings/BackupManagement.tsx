import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Stack,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import DownloadIcon from '@mui/icons-material/Download';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useBackupStore } from '../../store/useBackupStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { exportBackup, importBackup, readBackupFile } from '../../utils/backupService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatBytes } from '../../utils/formatBytes';

export function BackupManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError, showWarning } = useToastStore();
  const { backups, addBackup, deleteBackup, getBackup, clearAllBackups, getTotalBackupSize } = useBackupStore();
  const { settings, updateSettings } = useSettingsStore();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreReplaceMode, setRestoreReplaceMode] = useState(false);
  const [totalSize, setTotalSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total size
  useEffect(() => {
    const calculateTotalSize = async () => {
      const size = await getTotalBackupSize();
      setTotalSize(size);
    };
    calculateTotalSize();
  }, [backups, getTotalBackupSize]);

  const sortedBackups = useMemo(() => {
    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [backups]);

  const handleCreateManualBackup = async () => {
    try {
      const backup = exportBackup();
      await addBackup(
        backup,
        'manual',
        `Manual Backup - ${new Date().toLocaleString()}`,
        'Created manually by user'
      );
      showSuccess('Backup created successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to create backup');
    }
  };

  const handleRestore = async () => {
    if (!selectedBackupId) return;

    try {
      setIsRestoring(true);
      const backupData = await getBackup(selectedBackupId);
      
      if (!backupData) {
        showError('Backup not found');
        return;
      }

      const result = importBackup(backupData, restoreReplaceMode);

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => showWarning(warning));
      }

      let message = restoreReplaceMode
        ? 'Backup restored successfully. All existing data has been replaced.'
        : 'Backup restored successfully. Data has been merged with existing records.';

      if (result.migrated) {
        message += ` Data migrated from version ${result.backupVersion} to current version.`;
      }

      showSuccess(message);
      setRestoreDialogOpen(false);
      setSelectedBackupId(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBackupId) return;

    try {
      setIsDeleting(true);
      await deleteBackup(selectedBackupId);
      showSuccess('Backup deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedBackupId(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete backup');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllBackups();
      showSuccess('All backups cleared successfully');
      setClearAllDialogOpen(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to clear backups');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backupData = await readBackupFile(file);
      const result = importBackup(backupData, restoreReplaceMode);

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => showWarning(warning));
      }

      let message = restoreReplaceMode
        ? 'Backup imported successfully. All existing data has been replaced.'
        : 'Backup imported successfully. Data has been merged with existing records.';

      if (result.migrated) {
        message += ` Data migrated from version ${result.backupVersion} to current version.`;
      }

      showSuccess(message);

      // Also add to backup history
      await addBackup(
        backupData,
        'manual',
        `Imported Backup - ${new Date(backupData.timestamp).toLocaleString()}`,
        `Imported from file: ${file.name}`
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to import backup');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadBackup = async (id: string) => {
    try {
      const backupData = await getBackup(id);
      if (!backupData) {
        showError('Backup not found');
        return;
      }

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const backup = backups.find((b) => b.id === id);
      const filename = backup 
        ? `${backup.name.replace(/\s+/g, '-')}.json`
        : `backup-${id}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('Backup downloaded successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to download backup');
    }
  };

  return (
    <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Backup & Recovery
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={handleCreateManualBackup}
              size={isMobile ? 'medium' : 'large'}
              sx={{ minHeight: 44 }}
            >
              Create Backup
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => fileInputRef.current?.click()}
              size={isMobile ? 'medium' : 'large'}
              sx={{ minHeight: 44 }}
            >
              Import from File
            </Button>
            {backups.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setClearAllDialogOpen(true)}
                size={isMobile ? 'medium' : 'large'}
                sx={{ minHeight: 44 }}
              >
                Clear All
              </Button>
            )}
          </Stack>
        </Box>

        {/* Automatic Backups Settings */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={settings.automaticBackups || false}
                onChange={(e) => updateSettings({ automaticBackups: e.target.checked })}
              />
            }
            label="Enable Automatic Daily Backups"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Automatically create a backup every day at midnight
          </Typography>
        </Box>

        {settings.automaticBackups && (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Backup Retention</InputLabel>
              <Select
                value={settings.backupRetentionDays || 30}
                onChange={(e) => updateSettings({ backupRetentionDays: Number(e.target.value) })}
                label="Backup Retention"
              >
                <MenuItem value={7}>7 days</MenuItem>
                <MenuItem value={14}>14 days</MenuItem>
                <MenuItem value={30}>30 days</MenuItem>
                <MenuItem value={60}>60 days</MenuItem>
                <MenuItem value={90}>90 days</MenuItem>
                <MenuItem value={0}>Keep forever</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Backups older than the retention period will be automatically deleted
            </Typography>
          </Box>
        )}

        {/* Backup Summary */}
        {backups.length > 0 && (
          <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <Typography variant="body2">
              <strong>{backups.length}</strong> backup(s) stored • Total size: <strong>{formatBytes(totalSize)}</strong>
            </Typography>
          </Alert>
        )}

        {/* Backup History */}
        {backups.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">No backups found. Create your first backup to get started.</Typography>
          </Alert>
        ) : (
          <TableContainer>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Type</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Date</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Version</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Size</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBackups.map((backup) => (
                  <TableRow key={backup.id} hover>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {backup.name}
                      </Typography>
                      {backup.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                          {backup.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={backup.type === 'automatic' ? 'Automatic' : 'Manual'}
                        size="small"
                        color={backup.type === 'automatic' ? 'primary' : 'default'}
                        sx={{ height: { xs: 20, sm: 24 }, fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {new Date(backup.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {backup.version}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {formatBytes(backup.size)}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Restore">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBackupId(backup.id);
                              setRestoreDialogOpen(true);
                            }}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadBackup(backup.id)}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedBackupId(backup.id);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Restore Dialog */}
        <Dialog
          open={restoreDialogOpen}
          onClose={() => !isRestoring && setRestoreDialogOpen(false)}
          fullScreen={isMobile}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
            Restore Backup
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  Restoring a backup will replace or merge your current data. This action cannot be undone.
                </Typography>
              </Alert>
              <FormControlLabel
                control={
                  <Switch
                    checked={restoreReplaceMode}
                    onChange={(e) => setRestoreReplaceMode(e.target.checked)}
                    disabled={isRestoring}
                  />
                }
                label="Replace existing data (instead of merging)"
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {restoreReplaceMode
                  ? 'All existing data will be replaced with the backup data.'
                  : 'Backup data will be merged with existing data, avoiding duplicates.'}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
            <Button
              onClick={() => setRestoreDialogOpen(false)}
              disabled={isRestoring}
              fullWidth={isMobile}
              sx={{ minHeight: 44 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              variant="contained"
              color="primary"
              disabled={isRestoring}
              fullWidth={isMobile}
              sx={{ minHeight: 44 }}
            >
              {isRestoring ? 'Restoring...' : 'Restore'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onCancel={() => !isDeleting && setDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Backup"
          message="Are you sure you want to delete this backup? This action cannot be undone."
          confirmText="Delete"
          severity="error"
        />

        {/* Clear All Confirmation Dialog */}
        <ConfirmDialog
          open={clearAllDialogOpen}
          onCancel={() => setClearAllDialogOpen(false)}
          onConfirm={handleClearAll}
          title="Clear All Backups"
          message={`Are you sure you want to delete all ${backups.length} backup(s)? This action cannot be undone.`}
          confirmText="Clear All"
          severity="error"
        />
      </Stack>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </Paper>
  );
}

