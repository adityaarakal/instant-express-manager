import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stack,
  Typography,
  Menu,
  Chip,
  Box,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { useFilterPresetsStore, type FilterPreset } from '../../store/useFilterPresetsStore';

interface FilterPresetsManagerProps {
  currentFilters: FilterPreset['filters'];
  onLoadPreset: (filters: FilterPreset['filters']) => void;
  anchorEl?: HTMLElement | null;
  onClose: () => void;
}

export function FilterPresetsManager({
  currentFilters,
  onLoadPreset,
  anchorEl,
  onClose,
}: FilterPresetsManagerProps) {
  const { presets, addPreset, updatePreset, deletePreset } = useFilterPresetsStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);

  const hasActiveFilters = useMemo(() => {
    return (
      currentFilters.selectedAccount !== null ||
      currentFilters.selectedBucket !== null ||
      currentFilters.selectedAccountType !== null ||
      currentFilters.selectedStatus !== null ||
      currentFilters.minAmount !== null ||
      currentFilters.maxAmount !== null ||
      currentFilters.showNegativeOnly
    );
  }, [currentFilters]);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    addPreset(presetName.trim(), currentFilters);
    setPresetName('');
    setSaveDialogOpen(false);
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset.filters);
    onClose();
  };

  const handleEditPreset = (preset: FilterPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setEditDialogOpen(true);
  };

  const handleUpdatePreset = () => {
    if (!editingPreset || !presetName.trim()) return;
    updatePreset(editingPreset.id, presetName.trim(), currentFilters);
    setPresetName('');
    setEditingPreset(null);
    setEditDialogOpen(false);
  };

  const handleDeletePreset = (id: string) => {
    if (window.confirm('Are you sure you want to delete this filter preset?')) {
      deletePreset(id);
    }
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: 300, maxWidth: 400 },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            Filter Presets
          </Typography>
        </Box>
        {presets.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <BookmarkBorderIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No saved presets
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Save your current filters as a preset for quick access
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {presets.map((preset) => (
              <ListItem
                key={preset.id}
                component="button"
                onClick={() => handleLoadPreset(preset)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <BookmarkIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <ListItemText
                  primary={preset.name}
                  secondary={
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      {preset.filters.selectedAccount && <Chip label="Account" size="small" />}
                      {preset.filters.selectedBucket && <Chip label="Bucket" size="small" />}
                      {preset.filters.selectedAccountType && <Chip label="Type" size="small" />}
                      {preset.filters.selectedStatus && <Chip label="Status" size="small" />}
                      {preset.filters.minAmount !== null && <Chip label="Min" size="small" />}
                      {preset.filters.maxAmount !== null && <Chip label="Max" size="small" />}
                      {preset.filters.showNegativeOnly && <Chip label="Negative" size="small" color="warning" />}
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPreset(preset);
                    }}
                    aria-label="edit preset"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(preset.id);
                    }}
                    aria-label="delete preset"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => {
              onClose();
              setSaveDialogOpen(true);
            }}
            disabled={!hasActiveFilters}
            size="small"
          >
            Save Current Filters
          </Button>
        </Box>
      </Menu>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            variant="outlined"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && presetName.trim()) {
                handleSavePreset();
              }
            }}
            placeholder="e.g., High Priority Items"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} variant="contained" disabled={!presetName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            variant="outlined"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && presetName.trim()) {
                handleUpdatePreset();
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This will update the preset with your current filter settings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdatePreset} variant="contained" disabled={!presetName.trim()}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

