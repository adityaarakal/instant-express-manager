import type { AccountAllocationSnapshot } from './plannedExpenses';

export interface AllocationTemplate {
  id: string;
  name: string;
  description?: string;
  accounts: AccountAllocationSnapshot[];
  createdAt: string;
  lastUsed?: string;
  useCount: number;
}

