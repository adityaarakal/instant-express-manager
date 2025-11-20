/**
 * Notification Settings Component
 * UI for managing browser notification preferences
 */

import { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import {
  requestNotificationPermission,
  canSendNotifications,
} from '../../utils/notificationService';
import type { NotificationSettings as NotificationSettingsType } from '../../types/plannedExpenses';

export function NotificationSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const { showSuccess, showError, showWarning } = useToastStore();
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [localSettings, setLocalSettings] = useState<NotificationSettingsType>(
    settings.notifications || {
      enabled: false,
      daysBeforeDue: 7,
      dailySummary: false,
      weeklySummary: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    },
  );

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermissionStatus('granted');
      showSuccess('Notification permission granted');
    } else {
      setPermissionStatus('denied');
      showWarning('Notification permission denied. Please enable it in your browser settings.');
    }
  };

  const handleSave = () => {
    if (localSettings.enabled && !canSendNotifications()) {
      showError('Please grant notification permission first');
      return;
    }

    updateSettings({ notifications: localSettings });
    showSuccess('Notification settings saved');
  };

  const canEnable = permissionStatus === 'granted' || !localSettings.enabled;

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsIcon color="action" />
          <Typography variant="subtitle2" fontWeight="bold">
            Browser Notifications
          </Typography>
        </Stack>

        {permissionStatus === 'default' && (
          <Alert severity="info">
            <Typography variant="body2" sx={{ mb: 1 }}>
              Enable browser notifications to receive reminders for upcoming due dates.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRequestPermission}
              startIcon={<NotificationsIcon />}
            >
              Request Permission
            </Button>
          </Alert>
        )}

        {permissionStatus === 'denied' && (
          <Alert severity="warning">
            <Typography variant="body2">
              Notification permission is denied. Please enable it in your browser settings to receive
              notifications.
            </Typography>
          </Alert>
        )}

        {permissionStatus === 'granted' && (
          <Alert severity="success">
            <Typography variant="body2">Notification permission granted ✓</Typography>
          </Alert>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={localSettings.enabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, enabled: e.target.checked })
              }
              disabled={!canEnable}
            />
          }
          label="Enable Notifications"
        />

        {localSettings.enabled && (
          <>
            <Divider />
            <TextField
              label="Days Before Due Date"
              type="number"
              value={localSettings.daysBeforeDue}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  daysBeforeDue: Math.max(1, parseInt(e.target.value) || 7),
                })
              }
              inputProps={{ min: 1, max: 30 }}
              helperText="Notify when payments are due within this many days"
              size="small"
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.dailySummary}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, dailySummary: e.target.checked })
                  }
                />
              }
              label="Daily Summary"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.weeklySummary}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, weeklySummary: e.target.checked })
                  }
                />
              }
              label="Weekly Summary"
            />

            <Divider />

            <Typography variant="subtitle2" fontWeight="medium">
              Quiet Hours
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.quietHours.enabled}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      quietHours: {
                        ...localSettings.quietHours,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
              }
              label="Enable Quiet Hours"
            />

            {localSettings.quietHours.enabled && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={localSettings.quietHours.start}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      quietHours: {
                        ...localSettings.quietHours,
                        start: e.target.value,
                      },
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={localSettings.quietHours.end}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      quietHours: {
                        ...localSettings.quietHours,
                        end: e.target.value,
                      },
                    })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            )}
          </>
        )}

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={localSettings.enabled && !canSendNotifications()}
          size="small"
        >
          Save Settings
        </Button>
      </Stack>
    </Paper>
  );
}

