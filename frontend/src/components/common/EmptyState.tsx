import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center', border: 1, borderColor: 'divider' }}>
      <Stack spacing={2} alignItems="center">
        {icon && <Box sx={{ color: 'text.secondary' }}>{icon}</Box>}
        <Typography variant="h6" color="text.primary">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {description}
          </Typography>
        )}
        {action && (
          <Button
            variant="contained"
            startIcon={action.icon}
            onClick={action.onClick}
            sx={{ mt: 1 }}
          >
            {action.label}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

