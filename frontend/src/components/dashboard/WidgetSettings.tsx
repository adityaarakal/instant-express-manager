import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SettingsIcon from '@mui/icons-material/Settings';
import RestoreIcon from '@mui/icons-material/Restore';
import { useDashboardWidgetsStore, type WidgetId, type DashboardWidget } from '../../store/useDashboardWidgetsStore';

interface WidgetSettingsProps {
  open: boolean;
  onClose: () => void;
}

const widgetLabels: Record<WidgetId, string> = {
  'summary-cards': 'Summary Cards',
  'due-soon-reminders': 'Due Soon Reminders',
  'savings-trend-chart': 'Savings Trend Chart',
  'budget-vs-actual': 'Budget vs Actual',
  'income-expense-chart': 'Income vs Expense Chart',
  'category-breakdown': 'Category Breakdown',
};

const widgetDescriptions: Record<WidgetId, string> = {
  'summary-cards': 'Overview cards showing income, expenses, savings, and balance',
  'due-soon-reminders': 'List of upcoming payment due dates',
  'savings-trend-chart': 'Chart showing savings trends over time',
  'budget-vs-actual': 'Comparison of budgeted vs actual spending',
  'income-expense-chart': 'Chart comparing income and expenses',
  'category-breakdown': 'Breakdown of expenses by category',
};

export function WidgetSettings({ open, onClose }: WidgetSettingsProps) {
  const { widgets, toggleWidget, updateWidgetOrder, updateWidgetSize, resetToDefaults, initializeWidgets } =
    useDashboardWidgetsStore();
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>([]);

  useEffect(() => {
    if (open) {
      initializeWidgets();
      setLocalWidgets(widgets);
    }
  }, [open, widgets, initializeWidgets]);

  const handleToggle = (id: WidgetId) => {
    toggleWidget(id);
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newWidgets = [...localWidgets];
    [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
    const reordered = newWidgets.map((w, i) => ({ ...w, order: i }));
    setLocalWidgets(reordered);
    reordered.forEach((w) => updateWidgetOrder(w.id, w.order));
  };

  const handleMoveDown = (index: number) => {
    if (index === localWidgets.length - 1) return;
    const newWidgets = [...localWidgets];
    [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    const reordered = newWidgets.map((w, i) => ({ ...w, order: i }));
    setLocalWidgets(reordered);
    reordered.forEach((w) => updateWidgetOrder(w.id, w.order));
  };

  const handleSizeChange = (id: WidgetId, size: DashboardWidget['size']) => {
    updateWidgetSize(id, size);
    setLocalWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all widget settings to defaults?')) {
      resetToDefaults();
      initializeWidgets();
      setLocalWidgets(widgets);
    }
  };

  const sortedWidgets = [...localWidgets].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <SettingsIcon />
            <Typography variant="h6">Dashboard Widget Settings</Typography>
          </Stack>
          <Button
            size="small"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            variant="outlined"
            color="secondary"
          >
            Reset
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customize which widgets appear on your dashboard and their order. Drag to reorder or use the arrow buttons.
        </Typography>
        <List>
          {sortedWidgets.map((widget, index) => (
            <Box key={widget.id}>
              <ListItem>
                <DragIndicatorIcon sx={{ color: 'text.disabled', mr: 1, cursor: 'grab' }} />
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1" fontWeight="medium">
                        {widgetLabels[widget.id]}
                      </Typography>
                      {!widget.enabled && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          (Hidden)
                        </Typography>
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {widgetDescriptions[widget.id]}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Size</InputLabel>
                          <Select
                            value={widget.size || 'medium'}
                            label="Size"
                            onChange={(e) => handleSizeChange(widget.id, e.target.value as DashboardWidget['size'])}
                            disabled={!widget.enabled}
                          >
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="large">Large</MenuItem>
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            aria-label="Move up"
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === sortedWidgets.length - 1}
                            aria-label="Move down"
                          >
                            ↓
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={widget.enabled}
                    onChange={() => handleToggle(widget.id)}
                    aria-label={`Toggle ${widgetLabels[widget.id]}`}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {index < sortedWidgets.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

