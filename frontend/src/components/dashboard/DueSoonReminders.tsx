import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

interface DueDateReminder {
  id: string;
  type: 'transaction' | 'emi' | 'recurring';
  description: string;
  dueDate: string;
  amount: number;
}

interface DueSoonRemindersProps {
  reminders: DueDateReminder[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export function DueSoonReminders({ reminders }: DueSoonRemindersProps) {
  if (reminders.length === 0) {
    return (
      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <EventIcon color="primary" />
            <Typography variant="h6">Upcoming Due Dates</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            No upcoming due dates in the next 30 days.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <EventIcon color="primary" />
          <Typography variant="h6">Upcoming Due Dates</Typography>
          <Chip label={`${reminders.length}`} size="small" color="primary" />
        </Stack>
        <Stack spacing={2}>
          {reminders.slice(0, 5).map((reminder, index) => {
            const daysUntil = getDaysUntilDue(reminder.dueDate);
            const isUrgent = daysUntil <= 7;
            const isWarning = daysUntil <= 14;

            return (
              <Box
                key={`${reminder.id}-${reminder.type}-${index}`}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isUrgent ? 'error.light' : isWarning ? 'warning.light' : 'action.hover',
                  border: 1,
                  borderColor: isUrgent ? 'error.main' : isWarning ? 'warning.main' : 'divider',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {reminder.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(reminder.dueDate)}
                    </Typography>
                    <Chip
                      label={reminder.type}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(reminder.amount)}
                    </Typography>
                    <Chip
                      label={daysUntil === 0 ? 'Due today' : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}
                      size="small"
                      color={isUrgent ? 'error' : isWarning ? 'warning' : 'default'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Stack>
              </Box>
            );
          })}
          {reminders.length > 5 && (
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              +{reminders.length - 5} more due date{reminders.length - 5 > 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

