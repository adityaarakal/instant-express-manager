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
    <Card elevation={1} sx={{ borderRadius: 3, flex: 1, minWidth: 0, height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          {label}
        </Typography>
        <Typography
          variant="h4"
          color={`${color}.main`}
          sx={{ mb: description ? 1 : 0, fontWeight: 'bold' }}
        >
          {typeof value === 'number' ? formatCurrency(value) : value}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

