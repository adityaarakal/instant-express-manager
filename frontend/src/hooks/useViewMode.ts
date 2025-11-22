import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

type ViewMode = 'table' | 'card';

/**
 * Hook to manage view mode (table/card) with localStorage persistence
 * 
 * @param storageKey - Unique key for localStorage (e.g., 'transactions-view-mode')
 * @returns Object with viewMode, setViewMode, toggleViewMode, and isDefault
 */
export function useViewMode(storageKey: string) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // ≥900px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px-900px
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // <600px

  // Determine default view based on screen size
  // Desktop: table default, Mobile/Tablet: card default
  const getDefaultView = (): ViewMode => {
    return isDesktop ? 'table' : 'card';
  };

  // Initialize state from localStorage or default
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'table' || stored === 'card') {
      return stored;
    }
    return getDefaultView();
  });

  // Update view mode when screen size changes (only if no preference is stored)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      // No preference stored, use default based on screen size
      const defaultView = isDesktop ? 'table' : 'card';
      setViewModeState(defaultView);
    }
  }, [isDesktop, storageKey]);

  // Persist to localStorage
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(storageKey, mode);
  }, [storageKey]);

  // Toggle between table and card
  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  }, [viewMode, setViewMode]);

  // Check if current view is the default for current screen size
  const isDefault = viewMode === getDefaultView();

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    isDefault,
    isDesktop,
    isTablet,
    isMobile,
  };
}

