import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import localforage from 'localforage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { setupAutoGeneration } from '../services/autoGenerationService';
import { ToastProvider } from '../components/common/ToastProvider';
import { PWAUpdateNotification } from '../components/pwa/PWAUpdateNotification';
import { PWAInstallPrompt } from '../components/pwa/PWAInstallPrompt';
import { initializeSchemaVersion, migrateData, validateDataIntegrity } from '../utils/dataMigration';
import { useToastStore } from '../store/useToastStore';

type AppProvidersProps = {
  children: ReactNode;
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = useMemo(() => createQueryClient(), []);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const { showWarning, showError } = useToastStore();
  
  const persister = useMemo(() => {
    const store = localforage.createInstance({
      name: 'instant-express-manager',
      storeName: 'react-query-cache',
    });

    return createAsyncStoragePersister({
      storage: {
        removeItem: (key) => store.removeItem(key),
        getItem: (key) => store.getItem<string | null>(key),
        setItem: (key, value) => store.setItem(key, value),
      },
    });
  }, []);

  // Initialize schema version and run migrations on app startup
  useEffect(() => {
    const runStartupChecks = async () => {
      try {
        // Initialize schema version for new installations
        initializeSchemaVersion();

        // Run data migration if needed
        const migrationResult = await migrateData();
        
        if (migrationResult.migrated) {
          // Data was migrated successfully
          // Optionally show a toast to user (can be disabled if too noisy)
          // showSuccess(`Data migrated from version ${migrationResult.fromVersion} to ${migrationResult.toVersion}`);
        }
        
        if (migrationResult.errors && migrationResult.errors.length > 0) {
          // Show warnings about migration issues
          migrationResult.errors.forEach((error) => {
            showWarning(error);
          });
        }

        // Validate data integrity
        const validationResult = validateDataIntegrity();
        
        if (!validationResult.isValid && validationResult.errors.length > 0) {
          // Log integrity errors but don't block the app
          // In production, these could be sent to error tracking
          console.warn('Data integrity issues found:', validationResult.errors);
          
          // Optionally show critical errors to user
          const criticalErrors = validationResult.errors.filter(
            (error) => error.includes('non-existent') || error.includes('broken reference')
          );
          
          if (criticalErrors.length > 0) {
            showWarning(
              `Found ${criticalErrors.length} data integrity issue(s). ` +
              `Some data may not display correctly. Consider using data health checks in Settings.`
            );
          }
        }

        setMigrationComplete(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Startup checks failed:', error);
        showError(`Startup initialization error: ${errorMessage}`);
        // Still allow app to continue even if migration fails
        setMigrationComplete(true);
      }
    };

    runStartupChecks();
  }, [showWarning, showError]);

  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: { retry: false, refetchOnWindowFocus: false },
    });
    
    // Setup auto-generation for EMIs and Recurring templates (after migration completes)
    if (migrationComplete) {
      const cleanup = setupAutoGeneration();
      return cleanup;
    }
  }, [queryClient, migrationComplete]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        queryClient.resumePausedMutations().catch(() => undefined);
      }}
    >
      {children}
      <ToastProvider />
      <PWAUpdateNotification />
      <PWAInstallPrompt />
    </PersistQueryClientProvider>
  );
}

