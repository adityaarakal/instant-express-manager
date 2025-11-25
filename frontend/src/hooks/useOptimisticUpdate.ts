import { useState, useCallback } from 'react';

/**
 * Hook for optimistic UI updates
 * Updates UI immediately, then reverts if operation fails
 */
export function useOptimisticUpdate<T>(
  initialData: T[],
  updateFn: (item: T) => Promise<void> | void,
  deleteFn?: (id: string) => Promise<void> | void,
) {
  const [optimisticData, setOptimisticData] = useState<T[]>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addOptimistic = useCallback(
    (item: T) => {
      setOptimisticData((prev) => [...prev, item]);
    },
    [],
  );

  const updateOptimistic = useCallback(
    (id: string, updates: Partial<T>) => {
      setOptimisticData((prev) =>
        prev.map((item) => {
          const itemWithId = item as T & { id: string };
          if (itemWithId.id === id) {
            return { ...item, ...updates };
          }
          return item;
        }),
      );
    },
    [],
  );

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticData((prev) => prev.filter((item) => {
      const itemWithId = item as T & { id: string };
      return itemWithId.id !== id;
    }));
  }, []);

  const performUpdate = useCallback(
    async (item: T) => {
      setIsUpdating(true);
      setError(null);
      
      // Optimistic update
      const originalData = optimisticData;
      const itemWithId = item as T & { id: string };
      const itemId = itemWithId.id;
      updateOptimistic(itemId, item);

      try {
        await updateFn(item);
      } catch (err) {
        // Revert on error
        setOptimisticData(originalData);
        setError(err as Error);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [optimisticData, updateFn, updateOptimistic],
  );

  const performDelete = useCallback(
    async (id: string) => {
      if (!deleteFn) return;

      setIsUpdating(true);
      setError(null);

      // Optimistic delete
      const originalData = optimisticData;
      removeOptimistic(id);

      try {
        await deleteFn(id);
      } catch (err) {
        // Revert on error
        setOptimisticData(originalData);
        setError(err as Error);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [optimisticData, deleteFn, removeOptimistic],
  );

  return {
    data: optimisticData,
    isUpdating,
    error,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    performUpdate,
    performDelete,
    setData: setOptimisticData,
  };
}

