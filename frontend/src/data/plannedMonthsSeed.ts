/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { PlannedMonthSnapshot } from '../types/plannedExpenses';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const months: PlannedMonthSnapshot[] = require('../../../data/seeds/planned-expenses.json');

export const plannedMonthsSeed = months;

