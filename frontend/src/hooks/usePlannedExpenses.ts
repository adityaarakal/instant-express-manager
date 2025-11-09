import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlannedExpensesStore, selectPlannedMonths, selectSelectedMonth } from '../store/usePlannedExpensesStore'
import { calculateMonthSummary } from '../utils/plannedExpenses'

export const usePlannedMonths = () =>
  usePlannedExpensesStore(
    useShallow((state) => ({
      months: selectPlannedMonths(state),
      selectedMonthId: state.selectedMonthId,
    }))
  )

export const useSelectedMonth = () => usePlannedExpensesStore(selectSelectedMonth)

export const usePlannedMonthSummary = () => {
  const month = useSelectedMonth()
  return useMemo(() => (month ? calculateMonthSummary(month) : undefined), [month])
}

export const usePlannedExpensesActions = () =>
  usePlannedExpensesStore(
    useShallow((state) => ({
      seedSampleData: state.seedSampleData,
      selectMonth: state.selectMonth,
      addMonth: state.addMonth,
      updateMonth: state.updateMonth,
      updateBucketStatus: state.updateBucketStatus,
      updateAllocation: state.updateAllocation,
      replaceAccounts: state.replaceAccounts,
      replaceBuckets: state.replaceBuckets,
      reset: state.reset,
    }))
  )

