/**
 * Export Template Dialog
 * Allows users to customize which columns to include in exports
 */

import { useState, useEffect, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Divider,
} from '@mui/material';

export interface ExportColumn {
  id: string;
  label: string;
  default: boolean;
}

interface ExportTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (selectedColumns: string[]) => void;
  columns: ExportColumn[];
  title: string;
}

export const ExportTemplateDialog = memo(function ExportTemplateDialog({
  open,
  onClose,
  onSave,
  columns,
  title,
}: ExportTemplateDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      // Initialize with default columns
      const defaults = new Set(columns.filter((col) => col.default).map((col) => col.id));
      setSelectedColumns(defaults);
    }
  }, [open, columns]);

  const handleToggleColumn = (columnId: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnId)) {
      newSelected.delete(columnId);
    } else {
      newSelected.add(columnId);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedColumns.size === columns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(columns.map((col) => col.id)));
    }
  };

  const handleSave = () => {
    if (selectedColumns.size > 0) {
      onSave(Array.from(selectedColumns));
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Select columns to include in export
            </Typography>
            <Button size="small" onClick={handleSelectAll}>
              {selectedColumns.size === columns.length ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
          <Divider />
          <Stack spacing={1}>
            {columns.map((column) => (
              <FormControlLabel
                key={column.id}
                control={
                  <Checkbox
                    checked={selectedColumns.has(column.id)}
                    onChange={() => handleToggleColumn(column.id)}
                  />
                }
                label={column.label}
              />
            ))}
          </Stack>
          {selectedColumns.size === 0 && (
            <Typography variant="caption" color="error">
              At least one column must be selected
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={selectedColumns.size === 0}>
          Apply Template
        </Button>
      </DialogActions>
    </Dialog>
  );
});

