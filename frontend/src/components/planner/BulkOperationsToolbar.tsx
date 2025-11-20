/**
 * Bulk Operations Toolbar
 * Provides UI for bulk operations on selected months
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearIcon from '@mui/icons-material/Clear';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PendingIcon from '@mui/icons-material/Pending';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useBulkOperationsStore } from '../../store/useBulkOperationsStore';
import { useAggregatedPlannedMonthsStore } from '../../store/useAggregatedPlannedMonthsStore';
import {
  bulkMarkAllAsPaid,
  bulkMarkAllAsPending,
  bulkExportMonths,
} from '../../utils/bulkOperations';
import { useToastStore } from '../../store/useToastStore';

interface BulkOperationsToolbarProps {
  availableMonthIds: string[];
}

export function BulkOperationsToolbar({ availableMonthIds }: BulkOperationsToolbarProps) {
  const {
    selectedMonthIds,
    isBulkMode,
    selectAllMonths,
    clearSelection,
    setBulkMode,
    getSelectedCount,
  } = useBulkOperationsStore();
  const { getAvailableMonths } = useAggregatedPlannedMonthsStore();
  const { showWarning } = useToastStore();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [actionDescription, setActionDescription] = useState<string>('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const selectedCount = getSelectedCount();
  const allMonths = getAvailableMonths();
  const monthsToUse = availableMonthIds.length > 0 ? availableMonthIds : allMonths;

  const handleToggleBulkMode = () => {
    setBulkMode(!isBulkMode);
    if (isBulkMode) {
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    selectAllMonths(monthsToUse);
  };

  const handleBulkAction = (action: () => void, description: string) => {
    if (selectedCount === 0) {
      showWarning('Please select at least one month');
      return;
    }
    setPendingAction(() => action);
    setActionDescription(description);
    setConfirmDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction();
      setConfirmDialogOpen(false);
      setPendingAction(null);
      setActionDescription('');
    }
  };

  const handleMarkAllPaid = () => {
    handleBulkAction(
      () => bulkMarkAllAsPaid(Array.from(selectedMonthIds)),
      `Mark all buckets as "Paid" for ${selectedCount} month${selectedCount !== 1 ? 's' : ''}?`,
    );
  };

  const handleMarkAllPending = () => {
    handleBulkAction(
      () => bulkMarkAllAsPending(Array.from(selectedMonthIds)),
      `Mark all buckets as "Pending" for ${selectedCount} month${selectedCount !== 1 ? 's' : ''}?`,
    );
  };

  const handleExport = () => {
    handleBulkAction(
      () => bulkExportMonths(Array.from(selectedMonthIds)),
      `Export ${selectedCount} month${selectedCount !== 1 ? 's' : ''}?`,
    );
  };

  if (!isBulkMode) {
    return (
      <Button
        variant="outlined"
        startIcon={<SelectAllIcon />}
        onClick={handleToggleBulkMode}
        size="small"
      >
        Bulk Operations
      </Button>
    );
  }

  return (
    <>
      <Box
        sx={{
          p: 2,
          bgcolor: 'action.selected',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${selectedCount} selected`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Button
              variant="text"
              size="small"
              onClick={handleSelectAll}
              disabled={selectedCount === monthsToUse.length}
            >
              Select All
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={clearSelection}
              disabled={selectedCount === 0}
              startIcon={<ClearIcon />}
            >
              Clear
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllPaid}
              disabled={selectedCount === 0}
              color="success"
            >
              Mark All Paid
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PendingIcon />}
              onClick={handleMarkAllPending}
              disabled={selectedCount === 0}
              color="warning"
            >
              Mark All Pending
            </Button>
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              disabled={selectedCount === 0}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              onClick={handleToggleBulkMode}
              color="inherit"
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={handleExport}>
          <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export Selected Months
        </MenuItem>
      </Menu>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Action</DialogTitle>
        <DialogContent>
          <Typography>{actionDescription}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

