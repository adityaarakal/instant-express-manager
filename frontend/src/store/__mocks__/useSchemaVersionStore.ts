/**
 * Manual mock for useSchemaVersionStore
 * Used for testing backupService which requires this module dynamically
 */

import { vi } from 'vitest';

export const useSchemaVersionStore = {
  getState: () => ({
    setSchemaVersion: vi.fn(),
    schemaVersion: '1.0.0',
    needsMigration: () => false,
  }),
};

