import { type ReactNode, useEffect, useMemo } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import localforage from 'localforage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

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

