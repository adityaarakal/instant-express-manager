export type AllocationStatus = 'pending' | 'paid';

export interface Account {
  id: string;
  name: string;
  type: 'salary' | 'savings' | 'credit-card' | 'investment' | 'other';
  defaultFixedBalance?: number;
}

export interface Bucket {
  id: string;
  name: string;
  color: string;
  defaultStatus: AllocationStatus;
}

export interface Allocation {
  id: string;
  plannedMonthId: string;
  accountId: string;
  bucketId: string;
  dueDate: string | null;
  status: AllocationStatus;
  fixedFactor: number;
  fixedBalance: number;
  savingsTarget: number;
  actualBalance: number;
  sip1: number;
  sip2: number;
  billAmount: number;
  remainingCash: number;
}

export interface PlannedMonth {
  id: string;
  monthStartDate: string;
  salary: number;
  notes?: string;
  allocations: Allocation[];
}

export interface Reminder {
  id: string;
  allocationId: string;
  dueDate: string;
  isActive: boolean;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  defaultBuckets: Bucket[];
  fixedFactor: number;
}

