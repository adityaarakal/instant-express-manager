import type { PlannedMonthSnapshot } from '../types/plannedExpenses';

export const exportToJSON = (months: PlannedMonthSnapshot[]): string => {
  return JSON.stringify(months, null, 2);
};

export const exportToCSV = (months: PlannedMonthSnapshot[]): string => {
  if (months.length === 0) {
    return '';
  }

  const headers = [
    'Month Start',
    'Inflow Total',
    'Fixed Factor',
    'Account Name',
    'Fixed Balance',
    'Savings Transfer',
    'Remaining Cash',
  ];

  // Get all unique bucket IDs
  const bucketIds = new Set<string>();
  months.forEach((month) => {
    month.bucketOrder.forEach((id) => bucketIds.add(id));
    month.accounts.forEach((account) => {
      Object.keys(account.bucketAmounts).forEach((id) => bucketIds.add(id));
    });
  });

  const bucketHeaders = Array.from(bucketIds).sort();
  const allHeaders = [...headers, ...bucketHeaders.map((id) => `Bucket: ${id}`)];

  const rows: string[][] = [allHeaders];

  months.forEach((month) => {
    if (month.accounts.length === 0) {
      // Month row with no accounts
      const row = [
        month.monthStart,
        String(month.inflowTotal ?? ''),
        String(month.fixedFactor ?? ''),
        '',
        '',
        '',
        '',
        ...bucketIds.map(() => ''),
      ];
      rows.push(row);
    } else {
      month.accounts.forEach((account, accountIdx) => {
        const row = [
          accountIdx === 0 ? month.monthStart : '', // Only show month in first account row
          accountIdx === 0 ? String(month.inflowTotal ?? '') : '',
          accountIdx === 0 ? String(month.fixedFactor ?? '') : '',
          account.accountName,
          String(account.fixedBalance ?? ''),
          String(account.savingsTransfer ?? ''),
          String(account.remainingCash ?? ''),
          ...bucketIds.map((bucketId) => String(account.bucketAmounts[bucketId] ?? '')),
        ];
        rows.push(row);
      });
    }
  });

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

