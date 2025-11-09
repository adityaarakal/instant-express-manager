export type AllocationStatus = 'pending' | 'paid'

export type PlannedBucketKey =
  | 'fixedFactor'
  | 'savings'
  | 'balance'
  | 'investmentA'
  | 'investmentB'
  | 'expense'

export interface PlannedBucketDefinition {
  key: PlannedBucketKey
  label: string
  color: string
  description?: string
}

export interface BucketStatus {
  key: PlannedBucketKey
  status: AllocationStatus
}

export type AccountType = 'bank' | 'wallet' | 'credit-card'

export interface AccountDefinition {
  id: string
  name: string
  type: AccountType
  description?: string
  defaultFixedBalance?: number
}

export interface AllocationAmounts {
  fixedBalance: number
  savings: number
  balance: number
  investmentA: number
  investmentB: number
  expense: number
}

export interface AllocationRecord extends AllocationAmounts {
  id: string
  accountId: string
  notes?: string
}

export interface MonthDueDates {
  fixedFactor?: string
  savings?: string
  balance?: string
  investmentA?: string
  investmentB?: string
  expense?: string
}

export interface PlannedMonth {
  id: string
  monthStart: string // ISO string (YYYY-MM-01)
  salary: number
  fixedFactor: number
  notes?: string
  dueDates: MonthDueDates
  bucketStatuses: BucketStatus[]
  allocations: AllocationRecord[]
}

export interface PlannedExpensesState {
  accounts: AccountDefinition[]
  buckets: PlannedBucketDefinition[]
  months: PlannedMonth[]
  selectedMonthId?: string
}

export interface PlannedExpensesActions {
  seedSampleData: () => void
  selectMonth: (monthId: string) => void
  addMonth: (month: PlannedMonth) => void
  updateMonth: (monthId: string, updater: (month: PlannedMonth) => PlannedMonth) => void
  updateBucketStatus: (monthId: string, bucketKey: PlannedBucketKey, status: AllocationStatus) => void
  updateAllocation: (
    monthId: string,
    allocationId: string,
    updater: (allocation: AllocationRecord) => AllocationRecord
  ) => void
  replaceAccounts: (accounts: AccountDefinition[]) => void
  replaceBuckets: (buckets: PlannedBucketDefinition[]) => void
  reset: () => void
}

export type PlannedExpensesStore = PlannedExpensesState & PlannedExpensesActions
