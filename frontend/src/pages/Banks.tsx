import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useBanksStore } from '../store/useBanksStore';
import { useToastStore } from '../store/useToastStore';
import { getUserFriendlyError } from '../utils/errorHandling';
import { useUndoStore } from '../store/useUndoStore';
import { restoreDeletedItem } from '../utils/undoRestore';
import { TableSkeleton } from '../components/common/TableSkeleton';
import { ButtonWithLoading } from '../components/common/ButtonWithLoading';
import type { Bank } from '../types/banks';

export function Banks() {
  const { banks, createBank, updateBank, deleteBank } = useBanksStore();
  const { showSuccess, showError, showToast } = useToastStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Bank['type'] | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Simulate initial load (since Zustand with localforage loads synchronously, this is just for UX)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Bank' as Bank['type'],
    country: '',
    notes: '',
  });

  const filteredBanks = useMemo(() => {
    return banks.filter((bank) => {
      const matchesSearch = searchTerm === '' || 
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bank.country && bank.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bank.notes && bank.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'All' || bank.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [banks, searchTerm, filterType]);

  const handleOpenDialog = (bank?: Bank) => {
    if (bank) {
      setEditingBank(bank);
      setFormData({
        name: bank.name,
        type: bank.type,
        country: bank.country || '',
        notes: bank.notes || '',
      });
    } else {
      setEditingBank(null);
      setFormData({
        name: '',
        type: 'Bank',
        country: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBank(null);
    setFormData({
      name: '',
      type: 'Bank',
      country: '',
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      // Simulate async operation for better UX
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      if (editingBank) {
        updateBank(editingBank.id, formData);
        showSuccess('Bank updated successfully');
      } else {
        createBank(formData);
        showSuccess('Bank created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      showError(getUserFriendlyError(error, 'save bank'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      setDeletingId(id);
      try {
        // Store the bank data for undo before deleting
        const bank = banks.find((b) => b.id === id);
        if (!bank) {
          showError('Bank not found');
          return;
        }

        // Simulate async operation for better UX
        await new Promise((resolve) => setTimeout(resolve, 200));
        deleteBank(id);

        // Store in undo store and show undo button
        const deletedItemId = useUndoStore.getState().addDeletedItem('Bank', bank);
        
        showToast(
          'Bank deleted successfully',
          'success',
          8000, // Longer duration for undo
          {
            label: 'Undo',
            onClick: () => {
              if (restoreDeletedItem(deletedItemId)) {
                // Item restored, no need to show another toast
              }
            },
          }
        );
      } catch (error) {
        showError(getUserFriendlyError(error, 'delete bank'));
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Banks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          aria-label="Add new bank"
        >
          Add Bank
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            placeholder="Search banks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              label="Type"
              onChange={(e) => setFilterType(e.target.value as Bank['type'] | 'All')}
            >
              <MenuItem value="All">All Types</MenuItem>
              <MenuItem value="Bank">Bank</MenuItem>
              <MenuItem value="CreditCard">Credit Card</MenuItem>
              <MenuItem value="Wallet">Wallet</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table aria-label="Banks table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : filteredBanks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {banks.length === 0
                      ? 'No banks found. Add your first bank to get started.'
                      : 'No banks match the current filters.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBanks.map((bank) => (
                <TableRow key={bank.id} hover>
                  <TableCell>{bank.name}</TableCell>
                  <TableCell>{bank.type}</TableCell>
                  <TableCell>{bank.country || '—'}</TableCell>
                  <TableCell>{bank.notes || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(bank)} 
                      disabled={deletingId !== null}
                      aria-label={`Edit bank ${bank.name}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(bank.id)} 
                      color="error"
                      disabled={deletingId !== null}
                      aria-label={`Delete bank ${bank.name}`}
                    >
                      {deletingId === bank.id ? (
                        <CircularProgress size={16} aria-label="Deleting" />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        aria-labelledby="bank-dialog-title"
        aria-describedby="bank-dialog-description"
      >
        <DialogTitle id="bank-dialog-title">{editingBank ? 'Edit Bank' : 'Add Bank'}</DialogTitle>
        <DialogContent>
          <div id="bank-dialog-description" className="sr-only">
            {editingBank ? `Edit details for ${editingBank.name}` : 'Enter details for a new bank'}
          </div>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Bank Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Bank['type'] })}
              >
                <MenuItem value="Bank">Bank</MenuItem>
                <MenuItem value="CreditCard">Credit Card</MenuItem>
                <MenuItem value="Wallet">Wallet</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              fullWidth
            />
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSaving}>Cancel</Button>
          <ButtonWithLoading
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
            loading={isSaving}
          >
            {editingBank ? 'Update' : 'Create'}
          </ButtonWithLoading>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

