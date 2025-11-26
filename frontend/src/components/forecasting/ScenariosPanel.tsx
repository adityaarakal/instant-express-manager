import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Box,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { ForecastScenario } from '../../store/useForecastingStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ScenariosPanelProps {
  scenarios: ForecastScenario[];
  onAdd: (scenario: Omit<ForecastScenario, 'id' | 'createdAt' | 'updatedAt'>) => string;
  onUpdate: (id: string, updates: Partial<Omit<ForecastScenario, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string, newName: string) => string;
}

export function ScenariosPanel({
  scenarios,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
}: ScenariosPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    incomeMultiplier: '',
    expenseMultiplier: '',
    savingsMultiplier: '',
  });

  const handleOpenDialog = (scenario?: ForecastScenario) => {
    if (scenario) {
      setEditingId(scenario.id);
      setFormData({
        name: scenario.name,
        description: scenario.description || '',
        incomeMultiplier: scenario.assumptions.incomeMultiplier?.toString() || '',
        expenseMultiplier: scenario.assumptions.expenseMultiplier?.toString() || '',
        savingsMultiplier: scenario.assumptions.savingsMultiplier?.toString() || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        incomeMultiplier: '',
        expenseMultiplier: '',
        savingsMultiplier: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      incomeMultiplier: '',
      expenseMultiplier: '',
      savingsMultiplier: '',
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const scenario: Omit<ForecastScenario, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      assumptions: {
        incomeMultiplier: formData.incomeMultiplier ? parseFloat(formData.incomeMultiplier) : undefined,
        expenseMultiplier: formData.expenseMultiplier ? parseFloat(formData.expenseMultiplier) : undefined,
        savingsMultiplier: formData.savingsMultiplier ? parseFloat(formData.savingsMultiplier) : undefined,
      },
    };

    if (editingId) {
      onUpdate(editingId, scenario);
    } else {
      onAdd(scenario);
    }

    handleCloseDialog();
  };

  const handleDuplicate = (scenario: ForecastScenario) => {
    const newName = `${scenario.name} (Copy)`;
    onDuplicate(scenario.id, newName);
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Scenario Planning (What-If Analysis)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? 'medium' : 'large'}
          sx={{ minHeight: 44 }}
        >
          Create Scenario
        </Button>
      </Box>

      <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        <Typography variant="body2">
          Create scenarios to model different financial situations. Adjust income, expenses, or savings multipliers
          to see how they affect your cash flow projections.
        </Typography>
      </Alert>

      {scenarios.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">No scenarios created yet. Create your first scenario to get started.</Typography>
        </Alert>
      ) : (
        <TableContainer>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Description</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Income</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Expenses</TableCell>
                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Savings</TableCell>
                <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scenarios.map((scenario) => (
                <TableRow key={scenario.id} hover>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Typography variant="body2" fontWeight={500}>
                      {scenario.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Typography variant="body2" color="text.secondary">
                      {scenario.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {scenario.assumptions.incomeMultiplier
                      ? `${(scenario.assumptions.incomeMultiplier * 100).toFixed(0)}%`
                      : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {scenario.assumptions.expenseMultiplier
                      ? `${(scenario.assumptions.expenseMultiplier * 100).toFixed(0)}%`
                      : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {scenario.assumptions.savingsMultiplier
                      ? `${(scenario.assumptions.savingsMultiplier * 100).toFixed(0)}%`
                      : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(scenario)}
                          sx={{ minWidth: 40, minHeight: 40 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicate">
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicate(scenario)}
                          sx={{ minWidth: 40, minHeight: 40 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedId(scenario.id);
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          {editingId ? 'Edit Scenario' : 'Create Scenario'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Scenario Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={{ minHeight: 44 }}
            />
            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
              Assumptions (Multipliers)
            </Typography>
            <TextField
              label="Income Multiplier (e.g., 1.1 for 10% increase)"
              type="number"
              value={formData.incomeMultiplier}
              onChange={(e) => setFormData({ ...formData, incomeMultiplier: e.target.value })}
              fullWidth
              helperText="Leave empty to use base income"
              inputProps={{ step: '0.1', min: '0' }}
            />
            <TextField
              label="Expense Multiplier (e.g., 0.9 for 10% decrease)"
              type="number"
              value={formData.expenseMultiplier}
              onChange={(e) => setFormData({ ...formData, expenseMultiplier: e.target.value })}
              fullWidth
              helperText="Leave empty to use base expenses"
              inputProps={{ step: '0.1', min: '0' }}
            />
            <TextField
              label="Savings Multiplier (e.g., 1.2 for 20% increase)"
              type="number"
              value={formData.savingsMultiplier}
              onChange={(e) => setFormData({ ...formData, savingsMultiplier: e.target.value })}
              fullWidth
              helperText="Leave empty to use base savings"
              inputProps={{ step: '0.1', min: '0' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
          <Button onClick={handleCloseDialog} fullWidth={isMobile} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
            fullWidth={isMobile}
            sx={{ minHeight: 44 }}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          if (selectedId) {
            onDelete(selectedId);
            setSelectedId(null);
          }
          setDeleteDialogOpen(false);
        }}
        title="Delete Scenario"
        message="Are you sure you want to delete this scenario? This action cannot be undone."
        confirmText="Delete"
        severity="error"
      />
    </Stack>
  );
}

