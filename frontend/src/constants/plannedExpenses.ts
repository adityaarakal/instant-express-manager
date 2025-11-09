import { AccountDefinition, PlannedBucketDefinition } from '../types/plannedExpenses'

export const DEFAULT_BUCKETS: PlannedBucketDefinition[] = [
  {
    key: 'fixedFactor',
    label: 'Fixed Factor',
    color: '#6366f1',
    description: 'Monthly buffer kept aside at the beginning of each month',
  },
  {
    key: 'savings',
    label: 'Savings',
    color: '#10b981',
    description: 'Transfers allocated to long-term savings goals',
  },
  {
    key: 'balance',
    label: 'Operating Balance',
    color: '#3b82f6',
    description: 'Amount retained in the account after allocations',
  },
  {
    key: 'investmentA',
    label: 'Mutual Fund A',
    color: '#8b5cf6',
    description: 'SIP or recurring investment bucket A',
  },
  {
    key: 'investmentB',
    label: 'Mutual Fund B',
    color: '#a855f7',
    description: 'SIP or recurring investment bucket B',
  },
  {
    key: 'expense',
    label: 'Planned Expense',
    color: '#f97316',
    description: 'Upcoming planned expenses such as credit card bills or maintenance',
  },
]

export const DEFAULT_ACCOUNTS: AccountDefinition[] = [
  { id: 'axis-2009', name: 'Axis 2009', type: 'credit-card' },
  { id: 'icici-3945', name: 'ICICI 3945', type: 'bank', defaultFixedBalance: 1000 },
  { id: 'axis-0370', name: 'Axis 0370', type: 'bank', defaultFixedBalance: 1000 },
  { id: 'axis-7503', name: 'Axis 7503', type: 'bank', defaultFixedBalance: 500 },
  { id: 'hsbc-9006', name: 'HSBC 9006', type: 'bank', defaultFixedBalance: 500 },
  { id: 'paytm-4366', name: 'Paytm 4366', type: 'wallet', defaultFixedBalance: 200 },
  { id: 'sbi-5825', name: 'SBI 5825', type: 'bank', defaultFixedBalance: 200 },
  { id: 'phonepe-wallet', name: 'PhonePe Wallet', type: 'wallet', defaultFixedBalance: 0 },
  { id: 'cash', name: 'Cash', type: 'wallet', defaultFixedBalance: 0 },
]
