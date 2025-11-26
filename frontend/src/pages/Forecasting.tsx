import { useState, useMemo, useEffect } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useForecastingStore, type CashFlowProjection, type ForecastScenario } from '../store/useForecastingStore';
import { useIncomeTransactionsStore } from '../store/useIncomeTransactionsStore';
import { useExpenseTransactionsStore } from '../store/useExpenseTransactionsStore';
import { useSavingsInvestmentTransactionsStore } from '../store/useSavingsInvestmentTransactionsStore';
import { useRecurringIncomesStore } from '../store/useRecurringIncomesStore';
import { useRecurringExpensesStore } from '../store/useRecurringExpensesStore';
import { useRecurringSavingsInvestmentsStore } from '../store/useRecurringSavingsInvestmentsStore';
import {
  calculateAverageMonthlyIncome,
  calculateAverageMonthlyExpenses,
  calculateAverageMonthlySavings,
  generateCashFlowProjections,
  generateBudgetRecommendations,
  getCurrentTotalBalance,
} from '../utils/forecasting';
import { formatCurrency } from '../utils/financialPrecision';
import { CashFlowProjectionChart } from '../components/forecasting/CashFlowProjectionChart';
import { ScenariosPanel } from '../components/forecasting/ScenariosPanel';
import { SavingsGoalsPanel } from '../components/forecasting/SavingsGoalsPanel';
import { BudgetRecommendationsPanel } from '../components/forecasting/BudgetRecommendationsPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`forecast-tabpanel-${index}`}
      aria-labelledby={`forecast-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function Forecasting() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [projectionsMonths, setProjectionsMonths] = useState(12);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Stores
  const {
    savingsGoals,
    scenarios,
    projections,
    budgetRecommendations,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    setProjections,
    setBudgetRecommendations,
  } = useForecastingStore();

  const incomeTransactions = useIncomeTransactionsStore((state) => state.transactions);
  const expenseTransactions = useExpenseTransactionsStore((state) => state.transactions);
  const savingsTransactions = useSavingsInvestmentTransactionsStore((state) => state.transactions);
  const recurringIncomes = useRecurringIncomesStore((state) => state.templates);
  const recurringExpenses = useRecurringExpensesStore((state) => state.templates);
  const recurringSavings = useRecurringSavingsInvestmentsStore((state) => state.templates);

  // Calculate averages
  const avgIncome = useMemo(
    () => calculateAverageMonthlyIncome(incomeTransactions),
    [incomeTransactions]
  );
  const avgExpenses = useMemo(
    () => calculateAverageMonthlyExpenses(expenseTransactions),
    [expenseTransactions]
  );
  const avgSavings = useMemo(
    () => calculateAverageMonthlySavings(savingsTransactions),
    [savingsTransactions]
  );
  const currentBalance = useMemo(() => getCurrentTotalBalance(), []);

  // Generate projections
  useEffect(() => {
    const selectedScenario = selectedScenarioId
      ? scenarios.find((s) => s.id === selectedScenarioId)
      : undefined;

    const newProjections = generateCashFlowProjections(
      projectionsMonths,
      avgIncome,
      avgExpenses,
      avgSavings,
      recurringIncomes,
      recurringExpenses,
      recurringSavings,
      currentBalance,
      selectedScenario
    );

    setProjections(newProjections);
  }, [
    projectionsMonths,
    avgIncome,
    avgExpenses,
    avgSavings,
    recurringIncomes,
    recurringExpenses,
    recurringSavings,
    currentBalance,
    selectedScenarioId,
    scenarios,
    setProjections,
  ]);

  // Generate budget recommendations
  useEffect(() => {
    const recommendations = generateBudgetRecommendations(expenseTransactions);
    setBudgetRecommendations(recommendations);
  }, [expenseTransactions, setBudgetRecommendations]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 700 }}>
              Forecasting & Projections
            </Typography>
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Months Ahead</InputLabel>
                <Select
                  value={projectionsMonths}
                  label="Months Ahead"
                  onChange={(e) => setProjectionsMonths(Number(e.target.value))}
                >
                  <MenuItem value={3}>3 months</MenuItem>
                  <MenuItem value={6}>6 months</MenuItem>
                  <MenuItem value={12}>12 months</MenuItem>
                  <MenuItem value={24}>24 months</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Cash Flow" icon={<TrendingUpIcon />} iconPosition="start" />
            <Tab label="Scenarios" icon={<AccountBalanceIcon />} iconPosition="start" />
            <Tab label="Savings Goals" icon={<SavingsIcon />} iconPosition="start" />
            <Tab label="Budget Tips" icon={<LightbulbIcon />} iconPosition="start" />
          </Tabs>

          {/* Cash Flow Projections Tab */}
          <TabPanel value={activeTab} index={0}>
            <CashFlowProjectionsPanel
              projections={projections}
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onScenarioChange={setSelectedScenarioId}
            />
          </TabPanel>

          {/* Scenarios Tab */}
          <TabPanel value={activeTab} index={1}>
            <ScenariosPanel
              scenarios={scenarios}
              onAdd={addScenario}
              onUpdate={updateScenario}
              onDelete={deleteScenario}
              onDuplicate={duplicateScenario}
            />
          </TabPanel>

          {/* Savings Goals Tab */}
          <TabPanel value={activeTab} index={2}>
            <SavingsGoalsPanel
              goals={savingsGoals}
              savingsTransactions={savingsTransactions}
              onAdd={addSavingsGoal}
              onUpdate={updateSavingsGoal}
              onDelete={deleteSavingsGoal}
            />
          </TabPanel>

          {/* Budget Recommendations Tab */}
          <TabPanel value={activeTab} index={3}>
            <BudgetRecommendationsPanel recommendations={budgetRecommendations} />
          </TabPanel>
        </Stack>
      </Paper>
    </Stack>
  );
}

// Cash Flow Projections Panel Component
function CashFlowProjectionsPanel({
  projections,
  scenarios,
  selectedScenarioId,
  onScenarioChange,
}: {
  projections: CashFlowProjection[];
  scenarios: ForecastScenario[];
  selectedScenarioId: string | null;
  onScenarioChange: (id: string | null) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Cash Flow Projections
        </Typography>
        {scenarios.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Apply Scenario</InputLabel>
            <Select
              value={selectedScenarioId || ''}
              label="Apply Scenario"
              onChange={(e) => onScenarioChange(e.target.value || null)}
            >
              <MenuItem value="">Base Case</MenuItem>
              {scenarios.map((scenario: ForecastScenario) => (
                <MenuItem key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {projections.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">
            No projections available. Add some transactions to generate cash flow projections.
          </Typography>
        </Alert>
      ) : (
        <>
          <CashFlowProjectionChart projections={projections} />
          
          <TableContainer>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Month</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Income</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Expenses</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Savings</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Net Flow</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Balance</TableCell>
                  <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projections.map((projection: CashFlowProjection) => {
                  const [year, month] = projection.monthId.split('-');
                  const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  });
                  const netFlow = projection.projectedIncome - projection.projectedExpenses - projection.projectedSavings;

                  return (
                    <TableRow key={projection.monthId} hover>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{monthName}</TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {formatCurrency(projection.projectedIncome)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {formatCurrency(projection.projectedExpenses)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {formatCurrency(projection.projectedSavings)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          color: netFlow >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(netFlow)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          color: projection.projectedBalance >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(projection.projectedBalance)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={projection.confidence}
                          size="small"
                          color={
                            projection.confidence === 'high'
                              ? 'success'
                              : projection.confidence === 'medium'
                              ? 'warning'
                              : 'error'
                          }
                          sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Stack>
  );
}


