import { type ReactNode, useEffect, useMemo } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import localforage from 'localforage';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

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
  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        storage: localforage.createInstance({
          name: 'instant-express-manager',
          storeName: 'react-query-cache',
        }),
      }),
    [],
  );

  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: { retry: false, refetchOnWindowFocus: false },
    });
  }, [queryClient]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        queryClient.resumePausedMutations().catch(() => undefined);
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

