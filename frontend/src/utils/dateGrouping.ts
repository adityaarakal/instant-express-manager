// Utility functions for grouping transactions by month

export interface MonthGroup<T> {
  monthKey: string // Format: "YYYY-MM"
  monthLabel: string // Format: "January 2024"
  year: number
  month: number
  items: T[]
  total: number
}

/**
 * Group transactions by month
 * @param items Array of transactions (expenses or income)
 * @param getDate Function to extract date from transaction
 * @param getAmount Function to extract amount from transaction
 */
export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string,
  getAmount: (item: T) => number
): MonthGroup<T>[] {
  const monthMap = new Map<string, T[]>()

  // Group items by month
  items.forEach(item => {
    const date = new Date(getDate(item))
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, [])
    }
    monthMap.get(monthKey)!.push(item)
  })

  // Convert to array and sort by month (oldest first)
  const groups: MonthGroup<T>[] = Array.from(monthMap.entries())
    .map(([monthKey, items]) => {
      const [year, month] = monthKey.split('-').map(Number)
      const date = new Date(year, month - 1, 1)
      const monthLabel = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })

      return {
        monthKey,
        monthLabel,
        year,
        month,
        items: items.sort((a, b) => {
          // Sort items within month by date (newest first)
          const dateA = new Date(getDate(a)).getTime()
          const dateB = new Date(getDate(b)).getTime()
          return dateB - dateA
        }),
        total: items.reduce((sum, item) => sum + getAmount(item), 0)
      }
    })
    .sort((a, b) => {
      // Sort groups by month (oldest first)
      if (a.year !== b.year) {
        return a.year - b.year
      }
      return a.month - b.month
    })

  return groups
}

/**
 * Format month label for display
 */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const now = new Date()
  
  // Check if it's the current month
  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    }) + ' (This Month)'
  }
  
  // Check if it's the previous month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  if (year === lastMonth.getFullYear() && month === lastMonth.getMonth() + 1) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    }) + ' (Last Month)'
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}

