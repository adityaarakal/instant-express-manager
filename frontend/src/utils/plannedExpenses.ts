import { PlannedBucketKey, PlannedMonth } from '../types/plannedExpenses'

export interface BucketSummary {
  key: PlannedBucketKey
  total: number
  status: 'pending' | 'paid'
  pendingAmount: number
  paidAmount: number
}

export interface MonthSummary {
  monthId: string
  monthStart: string
  salary: number
  bucketSummaries: BucketSummary[]
  totalAllocated: number
  totalPending: number
  totalPaid: number
  remainingCash: number
}

const BUCKET_KEYS: PlannedBucketKey[] = [
  'fixedFactor',
  'savings',
  'balance',
  'investmentA',
  'investmentB',
  'expense',
]

const zeroBucketSummary = (key: PlannedBucketKey, status: 'pending' | 'paid'): BucketSummary => ({
  key,
  total: 0,
  status,
  pendingAmount: status === 'pending' ? 0 : 0,
  paidAmount: status === 'paid' ? 0 : 0,
})

export const calculateBucketSummaries = (month: PlannedMonth): BucketSummary[] => {
  const map = new Map<PlannedBucketKey, BucketSummary>()

  BUCKET_KEYS.forEach((key) => {
    const statusEntry = month.bucketStatuses.find((bucket) => bucket.key === key)
    const status = statusEntry?.status ?? 'pending'
    map.set(key, zeroBucketSummary(key, status))
  })

  // Fixed factor is stored at month-level
  const fixedFactor = map.get('fixedFactor')
  if (fixedFactor) {
    fixedFactor.total = month.fixedFactor
    fixedFactor.pendingAmount = fixedFactor.status === 'pending' ? month.fixedFactor : 0
    fixedFactor.paidAmount = fixedFactor.status === 'paid' ? month.fixedFactor : 0
  }

  month.allocations.forEach((allocation) => {
    const update = (key: PlannedBucketKey, amount: number) => {
      const summary = map.get(key)
      if (!summary) return
      summary.total += amount
      if (summary.status === 'pending') {
        summary.pendingAmount += amount
      } else {
        summary.paidAmount += amount
      }
    }

    update('savings', allocation.savings)
    update('balance', allocation.balance)
    update('investmentA', allocation.investmentA)
    update('investmentB', allocation.investmentB)
    update('expense', allocation.expense)
  })

  return BUCKET_KEYS.map((key) => map.get(key) ?? zeroBucketSummary(key, 'pending'))
}

export const calculateMonthSummary = (month: PlannedMonth): MonthSummary => {
  const bucketSummaries = calculateBucketSummaries(month)
  const totalAllocated = bucketSummaries.reduce((acc, bucket) => acc + bucket.total, 0)
  const totalPending = bucketSummaries.reduce((acc, bucket) => acc + bucket.pendingAmount, 0)
  const totalPaid = bucketSummaries.reduce((acc, bucket) => acc + bucket.paidAmount, 0)
  const remainingCash = month.salary - totalAllocated

  return {
    monthId: month.id,
    monthStart: month.monthStart,
    salary: month.salary,
    bucketSummaries,
    totalAllocated,
    totalPending,
    totalPaid,
    remainingCash,
  }
}

