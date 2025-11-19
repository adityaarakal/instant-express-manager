/**
 * Auto-save hook with debouncing
 * Provides save state tracking and "last saved" timestamp
 * 
 * Note: Zustand stores already persist automatically via persist middleware.
 * This hook provides UI feedback for save state.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutoSaveState {
  isSaving: boolean;
  isSaved: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

export interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave?: () => Promise<void> | void;
  enabled?: boolean;
}

/**
 * Hook for tracking auto-save state with debouncing
 * 
 * @param options - Configuration options
 * @returns Auto-save state and control functions
 */
export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    debounceMs = 500,
    onSave,
    enabled = true,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    isSaved: false,
    lastSaved: null,
    error: null,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback(async () => {
    if (!enabled || !onSave) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set saving state
    setState((prev) => ({
      ...prev,
      isSaving: true,
      isSaved: false,
      error: null,
    }));

    // Debounce the save operation
    debounceTimerRef.current = setTimeout(async () => {
      try {
        await onSave();
        
        // Show "saved" state briefly
        setState((prev) => ({
          ...prev,
          isSaving: false,
          isSaved: true,
          lastSaved: new Date(),
          error: null,
        }));

        // Clear "saved" indicator after 2 seconds
        saveTimeoutRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isSaved: false,
          }));
        }, 2000);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          isSaved: false,
          error: error instanceof Error ? error : new Error('Save failed'),
        }));
      }
    }, debounceMs);
  }, [debounceMs, onSave, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setState({
      isSaving: false,
      isSaved: false,
      lastSaved: null,
      error: null,
    });
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    ...state,
    triggerSave,
    reset,
  };
}

