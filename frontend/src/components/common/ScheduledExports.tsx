import { useState, useMemo, useEffect } from 'react';
import {
  Paper,
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
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useExportSchedulesStore, type ExportSchedule, type ExportScheduleFrequency, type ExportScheduleType } from '../../store/useExportSchedulesStore';
import { useToastStore } from '../../store/useToastStore';
import { requestNotificationPermission } from '../../utils/scheduledExports';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getFrequencyLabel = (frequency: ExportScheduleFrequency, dayOfWeek?: number, dayOfMonth?: number): string => {
  switch (frequency) {
    case 'daily': {
      return 'Daily';
    }
    case 'weekly': {
      const dayLabel = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || 'Sunday';
      return `Weekly (${dayLabel})`;
    }
    case 'monthly': {
      return `Monthly (Day ${dayOfMonth || 1})`;
    }
    default:
      return frequency;
  }
};

const getTypeLabel = (type: ExportScheduleType): string => {
  switch (type) {
    case 'income':
      return 'Income';
    case 'expense':
      return 'Expense';
    case 'savings':
      return 'Savings';
    case 'transfers':
      return 'Transfers';
    case 'all':
      return 'All Transactions';
    default:
      return type;
  }
};

export function ScheduledExports() {
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useExportSchedulesStore();
  const { showSuccess, showError } = useToastStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExportSchedule | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [formData, setFormData] = useState({
    name: '',
    type: 'all' as ExportScheduleType,
    frequency: 'daily' as ExportScheduleFrequency,
    time: '09:00',
    dayOfWeek: 0,
    dayOfMonth: 1,
    enabled: true,
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
      showSuccess('Notification permission granted');
    } else {
      setNotificationPermission('denied');
      showError('Notification permission denied');
    }
  };

  const handleOpenDialog = (schedule?: ExportSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        name: schedule.name,
        type: schedule.type,
        frequency: schedule.frequency,
        time: schedule.time,
        dayOfWeek: schedule.dayOfWeek ?? 0,
        dayOfMonth: schedule.dayOfMonth ?? 1,
        enabled: schedule.enabled,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        name: '',
        type: 'all',
        frequency: 'daily',
        time: '09:00',
        dayOfWeek: 0,
        dayOfMonth: 1,
        enabled: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSchedule(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showError('Please enter a schedule name');
      return;
    }

    try {
      if (editingSchedule) {
        updateSchedule(editingSchedule.id, {
          name: formData.name,
          type: formData.type,
          frequency: formData.frequency,
          time: formData.time,
          dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
          dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
          enabled: formData.enabled,
        });
        showSuccess('Schedule updated successfully');
      } else {
        addSchedule({
          name: formData.name,
          type: formData.type,
          frequency: formData.frequency,
          time: formData.time,
          dayOfWeek: formData.frequency === 'weekly' ? formData.dayOfWeek : undefined,
          dayOfMonth: formData.frequency === 'monthly' ? formData.dayOfMonth : undefined,
          enabled: formData.enabled,
        });
        showSuccess('Schedule created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      showError('Failed to save schedule');
      console.error(error);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(id);
      showSuccess('Schedule deleted');
    }
  };

  const handleToggleEnabled = (schedule: ExportSchedule) => {
    updateSchedule(schedule.id, { enabled: !schedule.enabled });
    showSuccess(`Schedule ${schedule.enabled ? 'disabled' : 'enabled'}`);
  };

  const enabledCount = useMemo(() => schedules.filter((s) => s.enabled).length, [schedules]);

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
      <Stack spacing={2}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1.5, sm: 2 }} 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: { xs: 0.5, sm: 1 } }}>
            <ScheduleIcon color="action" />
            <Typography variant="subtitle2" fontWeight="bold">
              Scheduled Exports
            </Typography>
            <Chip 
              label={`${enabledCount} active`} 
              size="small" 
              variant="outlined" 
              color={enabledCount > 0 ? 'success' : 'default'}
              sx={{ flexShrink: 0 }}
            />
          </Stack>
          <Stack 
            direction="row" 
            spacing={1} 
            alignItems="center"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            }}
          >
            {notificationPermission !== 'granted' && (
              <Tooltip title="Enable notifications for export completion alerts">
                <IconButton
                  size="small"
                  onClick={handleRequestNotificationPermission}
                  aria-label="Request notification permission"
                  color={notificationPermission === 'denied' ? 'error' : 'default'}
                  sx={{
                    minWidth: { xs: 48, sm: 40 },
                    minHeight: { xs: 48, sm: 40 },
                  }}
                >
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              fullWidth={isMobile}
              sx={{
                minHeight: { xs: 44, sm: 36 },
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
              }}
            >
              Add Schedule
            </Button>
          </Stack>
        </Stack>

        {notificationPermission === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Notifications are disabled. Enable them in your browser settings to receive export completion alerts.
          </Alert>
        )}

        {schedules.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No scheduled exports
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create a schedule to automatically export transactions
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {schedule.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={getTypeLabel(schedule.type)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getFrequencyLabel(schedule.frequency, schedule.dayOfWeek, schedule.dayOfMonth)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{schedule.time}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(schedule.nextRun)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={schedule.enabled ? 'Active' : 'Disabled'}
                        size="small"
                        color={schedule.enabled ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={schedule.enabled ? 'Disable' : 'Enable'}>
                        <span>
                          <Switch
                            checked={schedule.enabled}
                            size="small"
                            onChange={() => handleToggleEnabled(schedule)}
                            aria-label={schedule.enabled ? 'Disable' : 'Enable'}
                          />
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(schedule)}
                          aria-label="Edit schedule"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(schedule.id)}
                          aria-label="Delete schedule"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Scheduled exports run automatically when the app is open. Exports are checked every 5 minutes and when the app loads.
            {notificationPermission === 'granted' && ' You will receive a notification when exports complete.'}
          </Typography>
        </Alert>
      </Stack>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Schedule Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                value={formData.type}
                label="Transaction Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ExportScheduleType })}
              >
                <MenuItem value="all">All Transactions</MenuItem>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="transfers">Transfers</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={formData.frequency}
                label="Frequency"
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as ExportScheduleFrequency })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>

            {formData.frequency === 'weekly' && (
              <FormControl fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={formData.dayOfWeek}
                  label="Day of Week"
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as number })}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.frequency === 'monthly' && (
              <TextField
                label="Day of Month"
                type="number"
                value={formData.dayOfMonth}
                onChange={(e) => setFormData({ ...formData, dayOfMonth: Math.max(1, Math.min(31, Number(e.target.value))) })}
                fullWidth
                inputProps={{ min: 1, max: 31 }}
              />
            )}

            <TextField
              label="Time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

