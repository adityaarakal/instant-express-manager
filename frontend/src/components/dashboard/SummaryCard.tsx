import { Card, CardContent, Typography } from '@mui/material';

interface SummaryCardProps {
  label: string;
  value: string | number;
  description?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
}

const formatCurrency = (value: number | string): string => {
  if (typeof value === 'string') {
    return value;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function SummaryCard({
  label,
  value,
  description,
  color = 'primary',
  icon,
}: SummaryCardProps) {
  return (
    <Card 
      elevation={1} 
      sx={{ 
        borderRadius: 3, 
        flex: 1, 
        minWidth: 0, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1.5, sm: 2 },
          '&:last-child': {
            pb: { xs: 1.5, sm: 2 },
          },
        }}
      >
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: { xs: 0.75, sm: 1 }, 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.75, sm: 1 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            flexWrap: 'wrap',
          }}
        >
          {icon}
          {label}
        </Typography>
        <Typography
          variant="h4"
          color={`${color}.main`}
          sx={{ 
            mb: description ? { xs: 0.75, sm: 1 } : 0, 
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {typeof value === 'number' ? formatCurrency(value) : value}
        </Typography>
        {description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

