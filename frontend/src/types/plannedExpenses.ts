export type AllocationStatus = 'pending' | 'paid';

export type AccountType =
  | 'salary'
  | 'savings'
  | 'credit-card'
  | 'investment'
  | 'loan'
  | 'wallet'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  displayOrder?: number;
  defaultFixedBalance?: number;
  defaultStatus?: AllocationStatus;
}

export interface BucketDefinition {
  id: string;
  name: string;
  color: string;
  defaultStatus: AllocationStatus;
  icon?: string;
}

export interface BucketAmounts {
  [bucketId: string]: number | null;
}

export interface BucketFormulas {
  [bucketId: string]: string | null;
}

export interface AccountAllocationSnapshot {
  id: string;
  accountId: string;
  accountName: string;
  remainingCash: number | null;
  fixedBalance: number | null;
  savingsTransfer: number | null;
  bucketAmounts: BucketAmounts;
  bucketFormulas?: BucketFormulas;
  formulas?: {
    remainingCash?: string | null;
    fixedBalance?: string | null;
    savingsTransfer?: string | null;
  };
  notes?: string;
}

export interface MonthRefError {
  cell: string;
  value: string | null;
  formula: string | null;
}

export interface ManualAdjustment {
  id: string;
  accountId?: string;
  bucketId?: string;
  description: string;
  amount: number;
  createdAt: string;
  createdBy?: string;
}

export interface PlannedMonthSnapshot {
  id: string;
  monthStart: string;
  fixedFactor: number | null;
  fixedFactorFormula?: string | null;
  inflowTotal: number | null;
  inflowFormula?: string | null;
  statusByBucket: Record<string, AllocationStatus>;
  dueDates: Record<string, string | null>;
  bucketOrder: string[];
  accounts: AccountAllocationSnapshot[];
  refErrors: MonthRefError[];
  manualAdjustments?: ManualAdjustment[];
  sourceRows?: {
    start: number;
    end: number;
  };
  importedAt: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  allocationId: string;
  dueDate: string;
  isActive: boolean;
  message?: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  defaultBuckets: BucketDefinition[];
  fixedFactor: number;
  defaultStatusByBucket: Record<string, AllocationStatus>;
  enableReminders: boolean;
}

