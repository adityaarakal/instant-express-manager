import type {
  AllocationStatus,
  BucketDefinition,
} from '../types/plannedExpenses';

export const DEFAULT_BUCKETS: BucketDefinition[] = [
  {
    id: 'savings',
    name: 'Savings',
    color: '#0ea5e9', // sky-500
    defaultStatus: 'pending',
    icon: 'PiggyBank',
  },
  {
    id: 'balance',
    name: 'Balance',
    color: '#2563eb', // blue-600
    defaultStatus: 'pending',
    icon: 'Wallet',
  },
  {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    color: '#6366f1', // indigo-500
    defaultStatus: 'paid',
    icon: 'TrendingUp',
  },
  {
    id: 'mutual-funds-h',
    name: 'Mutual Funds (H)',
    color: '#8b5cf6', // violet-500
    defaultStatus: 'paid',
    icon: 'TrendingUp',
  },
  {
    id: 'cc-bill',
    name: 'CC Bill',
    color: '#f97316', // orange-500
    defaultStatus: 'paid',
    icon: 'CreditCard',
  },
  {
    id: 'cc-bill-h',
    name: 'CC Bill (H)',
    color: '#fb923c', // orange-400
    defaultStatus: 'paid',
    icon: 'CreditCard',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    color: '#facc15', // yellow-400
    defaultStatus: 'paid',
    icon: 'Home',
  },
];

export const DEFAULT_BUCKET_ORDER: string[] = DEFAULT_BUCKETS.map((bucket) => bucket.id);

export const BUCKET_NAME_TO_ID: Record<string, string> = DEFAULT_BUCKETS.reduce(
  (acc, bucket) => {
    acc[bucket.name] = bucket.id;
    return acc;
  },
  {} as Record<string, string>,
);

export const DEFAULT_STATUS_BY_BUCKET: Record<string, AllocationStatus> = DEFAULT_BUCKETS.reduce(
  (acc, bucket) => {
    acc[bucket.id] = bucket.defaultStatus;
    return acc;
  },
  {} as Record<string, AllocationStatus>,
);

