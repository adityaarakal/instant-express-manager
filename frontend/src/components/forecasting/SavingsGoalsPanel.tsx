import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Box,
  LinearProgress,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SavingsGoal } from '../../store/useForecastingStore';
import type { SavingsInvestmentTransaction } from '../../types/transactions';
import { calculateSavingsGoalProgress } from '../../utils/forecasting';
import { formatCurrency } from '../../utils/financialPrecision';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SavingsGoalsPanelProps {
  goals: SavingsGoal[];
  savingsTransactions: SavingsInvestmentTransaction[];
  onAdd: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'status'>) => string;
  onUpdate: (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

export function SavingsGoalsPanel({
  goals,
  savingsTransactions,
  onAdd,
  onUpdate,
  onDelete,
}: SavingsGoalsPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    monthlyContribution: '',
  });

  const handleOpenDialog = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingId(goal.id);
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        targetDate: goal.targetDate.split('T')[0],
        monthlyContribution: goal.monthlyContribution?.toString() || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        targetAmount: '',
        targetDate: '',
        monthlyContribution: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      targetAmount: '',
      targetDate: '',
      monthlyContribution: '',
    });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.targetAmount || !formData.targetDate) return;

    const goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount' | 'status'> = {
      name: formData.name.trim(),
      targetAmount: parseFloat(formData.targetAmount),
      targetDate: new Date(formData.targetDate).toISOString(),
      monthlyContribution: formData.monthlyContribution ? parseFloat(formData.monthlyContribution) : undefined,
    };

    if (editingId) {
      onUpdate(editingId, goal);
    } else {
      onAdd(goal);
    }

    handleCloseDialog();
  };

  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Savings Goals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? 'medium' : 'large'}
          sx={{ minHeight: 44 }}
        >
          Add Goal
        </Button>
      </Box>

      <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        <Typography variant="body2">
          Track your savings goals and monitor progress. Set target amounts and dates to stay on track.
        </Typography>
      </Alert>

      {activeGoals.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">No active savings goals. Create your first goal to get started.</Typography>
        </Alert>
      ) : (
        <Stack spacing={2}>
          {activeGoals.map((goal) => {
            const progress = calculateSavingsGoalProgress(
              goal.id,
              savingsTransactions,
              goal.targetAmount,
              goal.targetDate
            );

            return (
              <Card key={goal.id} elevation={1}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: 600 }}>
                          {goal.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Target: {formatCurrency(goal.targetAmount)} by{' '}
                          {new Date(goal.targetDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(goal)}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedId(goal.id);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ minWidth: 40, minHeight: 40 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Progress: {formatCurrency(progress.current)} / {formatCurrency(goal.targetAmount)}
                        </Typography>
                        <Chip
                          label={`${progress.progress.toFixed(1)}%`}
                          size="small"
                          color={progress.progress >= 100 ? 'success' : progress.onTrack ? 'primary' : 'warning'}
                          sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress.progress}
                        color={progress.progress >= 100 ? 'success' : progress.onTrack ? 'primary' : 'warning'}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                          Monthly Needed
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                          {formatCurrency(progress.monthlyNeeded)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                          Status
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                          {progress.onTrack ? (
                            <Chip label="On Track" size="small" color="success" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }} />
                          ) : (
                            <Chip label="Behind" size="small" color="warning" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }} />
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
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
          {editingId ? 'Edit Savings Goal' : 'Create Savings Goal'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Goal Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={{ minHeight: 44 }}
            />
            <TextField
              label="Target Amount"
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              fullWidth
              required
              inputProps={{ step: '1000', min: '0' }}
              sx={{ minHeight: 44 }}
            />
            <TextField
              label="Target Date"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              sx={{ minHeight: 44 }}
            />
            <TextField
              label="Monthly Contribution (Optional)"
              type="number"
              value={formData.monthlyContribution}
              onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
              fullWidth
              helperText="Expected monthly contribution towards this goal"
              inputProps={{ step: '1000', min: '0' }}
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
            disabled={!formData.name.trim() || !formData.targetAmount || !formData.targetDate}
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
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? This action cannot be undone."
        confirmText="Delete"
        severity="error"
      />
    </Stack>
  );
}

