import { Stack, Typography, Card, CardContent, Chip, Box, Alert } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import type { BudgetRecommendation } from '../../store/useForecastingStore';
import { formatCurrency } from '../../utils/financialPrecision';

interface BudgetRecommendationsPanelProps {
  recommendations: BudgetRecommendation[];
}

export function BudgetRecommendationsPanel({ recommendations }: BudgetRecommendationsPanelProps) {

  if (recommendations.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Budget Recommendations
        </Typography>
        <Alert severity="info">
          <Typography variant="body2">
            No budget recommendations available yet. Add more expense transactions to get personalized recommendations.
          </Typography>
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LightbulbIcon color="primary" />
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Budget Recommendations
        </Typography>
      </Box>

      <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        <Typography variant="body2">
          Based on your spending patterns, here are personalized recommendations to optimize your budget and increase savings.
        </Typography>
      </Alert>

      <Stack spacing={2}>
        {recommendations.map((rec, index) => (
          <Card key={index} elevation={1}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' }, fontWeight: 600 }}>
                      {rec.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mt: 0.5 }}>
                      {rec.reasoning}
                    </Typography>
                  </Box>
                  <Chip
                    label={rec.priority}
                    size="small"
                    color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                    sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                    pt: 1,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                      Current Spending
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                      {formatCurrency(rec.currentSpending)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                      Recommended
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(rec.recommendedSpending)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}>
                      Savings Potential
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(rec.savingsPotential)}/month
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}

