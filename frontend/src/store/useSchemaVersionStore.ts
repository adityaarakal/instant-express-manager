import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getLocalforageStorage } from '../utils/storage';

// Current schema version (update this when schema changes)
export const CURRENT_SCHEMA_VERSION = '1.0.0';

type SchemaVersionState = {
  schemaVersion: string;
  setSchemaVersion: (version: string) => void;
  needsMigration: () => boolean;
};

const storage = getLocalforageStorage('schema-version');

export const useSchemaVersionStore = create<SchemaVersionState>()(
  devtools(
    persist(
      (set, get) => ({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        setSchemaVersion: (version: string) => {
          set({ schemaVersion: version });
        },
        needsMigration: () => {
          return get().schemaVersion !== CURRENT_SCHEMA_VERSION;
        },
      }),
      {
        name: 'schema-version',
        storage,
      }
    ),
    { name: 'SchemaVersionStore' }
  )
);

