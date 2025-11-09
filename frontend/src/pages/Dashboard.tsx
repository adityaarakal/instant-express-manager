import { Card, CardContent, Stack, Typography } from '@mui/material';

const summaryCards = [
  {
    label: 'Pending Allocations',
    value: '₹0',
    description: 'Start by importing or creating your first month.',
  },
  {
    label: 'Saved vs Target',
    value: '0%',
    description: 'Targets update after you seed planned months.',
  },
  {
    label: 'Upcoming Reminders',
    value: 'No reminders yet',
    description: 'Due dates appear once allocations are defined.',
  },
];

export function Dashboard() {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={3}
      sx={{ alignItems: 'stretch', width: '100%' }}
    >
      {summaryCards.map((card) => (
        <Card
          key={card.label}
          elevation={1}
          sx={{ borderRadius: 3, flex: 1, minWidth: 0 }}
        >
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {card.label}
            </Typography>
            <Typography variant="h4" color="text.primary" sx={{ mb: 1 }}>
              {card.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

