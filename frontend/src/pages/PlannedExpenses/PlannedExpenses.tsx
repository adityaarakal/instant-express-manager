import React, { useEffect, useMemo } from 'react'
import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { format, parseISO } from 'date-fns'
import { usePlannedExpensesStore } from '../../store/usePlannedExpensesStore'
import {
  usePlannedExpensesActions,
  usePlannedMonthSummary,
  usePlannedMonths,
  useSelectedMonth,
} from '../../hooks/usePlannedExpenses'
import { formatCurrency } from '../../utils/currency'
import { PlannedBucketKey } from '../../types/plannedExpenses'
import './PlannedExpenses.css'

const PlannedExpenses: React.FC = () => {
  const { months, selectedMonthId } = usePlannedMonths()
  const selectedMonth = useSelectedMonth()
  const summary = usePlannedMonthSummary()
  const bucketDefinitions = usePlannedExpensesStore((state) => state.buckets)
  const accounts = usePlannedExpensesStore((state) => state.accounts)
  const { seedSampleData, selectMonth } = usePlannedExpensesActions()

  useEffect(() => {
    if (months.length > 0 && !selectedMonthId) {
      selectMonth(months[0].id)
    }
  }, [months, selectedMonthId, selectMonth])

  const bucketDefinitionMap = useMemo(() => {
    const map = new Map(bucketDefinitions.map((bucket) => [bucket.key, bucket]))
    return map
  }, [bucketDefinitions])

  const accountMap = useMemo(() => {
    const map = new Map(accounts.map((account) => [account.id, account]))
    return map
  }, [accounts])

  const monthOptions = useMemo(
    () =>
      months.map((month) => ({
        id: month.id,
        label: format(parseISO(month.monthStart), 'MMMM yyyy'),
      })),
    [months]
  )

  const dueDateEntries = useMemo(() => {
    if (!selectedMonth) return []
    return (Object.entries(selectedMonth.dueDates) as Array<[PlannedBucketKey, string | undefined]>).filter(
      (entry): entry is [PlannedBucketKey, string] => Boolean(entry[1])
    )
  }, [selectedMonth])

  const handleMonthChange = (event: SelectChangeEvent<string>) => {
    selectMonth(event.target.value as string)
  }

  if (!months.length) {
    return (
      <div className="planned-expenses-page">
        <div className="planned-expenses-shell">
          <Card className="planned-expenses-empty-card">
            <CardContent>
              <Stack spacing={3} alignItems="center">
                <Typography variant="h5" align="center" fontWeight={700}>
                  Plan your months like the spreadsheet dashboard
                </Typography>
                <Typography align="center" color="text.secondary">
                  Load the sample dataset extracted from the Excel workbook to explore the experience, or
                  start adding your own months.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="primary" onClick={seedSampleData}>
                    Load sample plan
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="planned-expenses-page">
      <div className="planned-expenses-shell">
        <div className="planned-expenses-header">
          <div>
            <Typography variant="h4" component="h2" fontWeight={800} gutterBottom>
              Planned Expenses
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Track upcoming allocations, bucket statuses, and see how much cash stays free after commitments.
            </Typography>
          </div>
          <FormControl size="small" className="planned-expenses-month-select">
            <InputLabel id="planned-month-select-label">Month</InputLabel>
            <Select
              labelId="planned-month-select-label"
              value={selectedMonthId ?? monthOptions[0]?.id ?? ''}
              label="Month"
              onChange={handleMonthChange}
            >
              {monthOptions.map((option) => (
                <MenuItem value={option.id} key={option.id}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {summary && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card className="summary-card">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Salary Inflow
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(summary.salary)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on the master sheet values
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card className="summary-card">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Allocated Buckets
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(summary.totalAllocated)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Includes fixed factor and all bucket splits
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card className="summary-card">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Pending Buckets
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {formatCurrency(summary.totalPending)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Waiting to be actioned this cycle
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card className="summary-card">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Free Cash After Plans
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color={summary.remainingCash >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(summary.remainingCash)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Money left after all planned allocations
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Card className="planned-expenses-card">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Bucket Status Overview
              </Typography>
              {selectedMonth?.notes && (
                <Typography variant="body2" color="text.secondary">
                  {selectedMonth.notes}
                </Typography>
              )}
            </Stack>
            <Table size="small" className="planned-expenses-table">
              <TableHead>
                <TableRow>
                  <TableCell>Bucket</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell align="right">Cleared</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary?.bucketSummaries.map((bucket) => {
                  const definition = bucketDefinitionMap.get(bucket.key)
                  const label = definition?.label ?? bucket.key
                  const statusColor = bucket.status === 'paid' ? 'success' : 'warning'
                  return (
                    <TableRow key={bucket.key}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <span className="bucket-indicator" style={{ backgroundColor: definition?.color }}></span>
                          <span>{label}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={bucket.status === 'paid' ? 'Paid' : 'Pending'}
                          color={statusColor}
                          variant="outlined"
                          className="bucket-status-chip"
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(bucket.total)}</TableCell>
                      <TableCell align="right">{formatCurrency(bucket.pendingAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(bucket.paidAmount)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="planned-expenses-card">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>
                Account Allocations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Breakup sourced from the workbook&apos;s account-level distribution
              </Typography>
            </Stack>
            <Table size="small" className="planned-expenses-table">
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Fixed Factor</TableCell>
                  <TableCell align="right">Savings</TableCell>
                  <TableCell align="right">Operating Balance</TableCell>
                  <TableCell align="right">Investment A</TableCell>
                  <TableCell align="right">Investment B</TableCell>
                  <TableCell align="right">Planned Expense</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedMonth?.allocations.map((allocation) => {
                  const account = accountMap.get(allocation.accountId)
                  return (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {account?.name ?? allocation.accountId}
                          </Typography>
                          {account?.type && (
                            <Typography variant="caption" color="text.secondary">
                              {account.type.replace('-', ' ')}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(allocation.fixedBalance)}</TableCell>
                      <TableCell align="right">{formatCurrency(allocation.savings)}</TableCell>
                      <TableCell align="right">{formatCurrency(allocation.balance)}</TableCell>
                      <TableCell align="right">{formatCurrency(allocation.investmentA)}</TableCell>
                      <TableCell align="right">{formatCurrency(allocation.investmentB)}</TableCell>
                      <TableCell align="right">{formatCurrency(allocation.expense)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {allocation.notes ?? '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              {selectedMonth && (
                <TableBody>
                  <TableRow className="planned-expenses-total-row">
                    <TableCell>Total</TableCell>
                    <TableCell align="right">
                      {formatCurrency(
                        selectedMonth.allocations.reduce((sum, allocation) => sum + allocation.fixedBalance, 0)
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(
                        selectedMonth.allocations.reduce((sum, allocation) => sum + allocation.savings, 0)
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(
                        selectedMonth.allocations.reduce((sum, allocation) => sum + allocation.balance, 0)
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(
                        selectedMonth.allocations.reduce((sum, allocation) => sum + allocation.investmentA, 0)
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(
                        selectedMonth.allocations.reduce((sum, allocation) => sum + allocation.investmentB, 0)
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(
                        selectedMonth.allocations.reduce((sum, allocation) => sum + allocation.expense, 0)
                      )}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </CardContent>
        </Card>

        {!!dueDateEntries.length && (
          <Card className="planned-expenses-card">
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Key Due Dates
              </Typography>
              <Divider className="planned-expenses-divider" />
              <Grid container spacing={2}>
                {dueDateEntries.map(([bucketKey, dateValue]) => {
                  const definition = bucketDefinitionMap.get(bucketKey)
                  const label = definition?.label ?? bucketKey
                  return (
                    <Grid item xs={12} sm={6} md={4} key={bucketKey}>
                      <Card variant="outlined" className="due-date-card">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            {label}
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {format(parseISO(dateValue), 'dd MMM yyyy')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              const latestMonthId = months[months.length - 1]?.id
              if (latestMonthId) {
                selectMonth(latestMonthId)
              }
            }}
          >
            Jump to Latest Month
          </Button>
        </Stack>
      </div>
    </div>
  )
}

export default PlannedExpenses

