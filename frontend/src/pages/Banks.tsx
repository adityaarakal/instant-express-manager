import { useState, useMemo } from 'react';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useBanksStore } from '../store/useBanksStore';
import { useToastStore } from '../store/useToastStore';
import type { Bank } from '../types/banks';

export function Banks() {
  const { banks, createBank, updateBank, deleteBank } = useBanksStore();
  const { showSuccess, showError } = useToastStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Bank['type'] | 'All'>('All');
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

  const handleSave = () => {
    if (!formData.name.trim()) return;

    try {
      if (editingBank) {
        updateBank(editingBank.id, formData);
        showSuccess('Bank updated successfully');
      } else {
        createBank(formData);
        showSuccess('Bank created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save bank');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      try {
        deleteBank(id);
        showSuccess('Bank deleted successfully');
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to delete bank');
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
        <Table>
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
            {filteredBanks.length === 0 ? (
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
                    <IconButton size="small" onClick={() => handleOpenDialog(bank)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(bank.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBank ? 'Edit Bank' : 'Add Bank'}</DialogTitle>
        <DialogContent>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name.trim()}>
            {editingBank ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

