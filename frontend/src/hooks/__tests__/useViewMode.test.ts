import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useViewMode } from '../useViewMode';

// Mock useMediaQuery and useTheme
const mockUseMediaQuery = vi.fn();
const mockUseTheme = vi.fn(() => ({
  breakpoints: {
    up: () => '@media (min-width:900px)',
    between: () => '@media (min-width:600px) and (max-width:899px)',
    down: () => '@media (max-width:599px)',
  },
}));

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material') as any;
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
    useTheme: () => mockUseTheme(),
  };
});

describe('useViewMode', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    // Clear localStorage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
    // Default to desktop (table view)
    mockUseMediaQuery.mockReturnValue(true);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(ThemeProvider, { theme: createTheme() }, children);
  };

  it('should default to table view on desktop', () => {
    mockUseMediaQuery.mockReturnValue(true); // Desktop
    const { result } = renderHook(() => useViewMode('test-view-mode'), { wrapper });

    expect(result.current.viewMode).toBe('table');
    expect(result.current.isDesktop).toBe(true);
  });

  it('should default to card view on mobile', () => {
    mockUseMediaQuery.mockReturnValue(false); // Mobile
    const { result } = renderHook(() => useViewMode('test-view-mode'), { wrapper });

    expect(result.current.viewMode).toBe('card');
    expect(result.current.isDesktop).toBe(false);
  });

  it('should persist view mode to localStorage', () => {
    const { result } = renderHook(() => useViewMode('test-view-mode'), { wrapper });

    act(() => {
      result.current.setViewMode('card');
    });

    expect(result.current.viewMode).toBe('card');
    expect(localStorage.getItem('test-view-mode')).toBe('card');
  });

  it('should restore view mode from localStorage', () => {
    localStorage.setItem('test-view-mode', 'card');
    const { result } = renderHook(() => useViewMode('test-view-mode'), { wrapper });

    expect(result.current.viewMode).toBe('card');
  });

  it('should toggle between table and card view', () => {
    const { result } = renderHook(() => useViewMode('test-view-mode'), { wrapper });

    expect(result.current.viewMode).toBe('table');

    act(() => {
      result.current.toggleViewMode();
    });

    expect(result.current.viewMode).toBe('card');

    act(() => {
      result.current.toggleViewMode();
    });

    expect(result.current.viewMode).toBe('table');
  });

  it('should indicate if current view is default', () => {
    mockUseMediaQuery.mockReturnValue(true); // Desktop (table default)
    const { result } = renderHook(() => useViewMode('test-view-mode'), { wrapper });

    expect(result.current.isDefault).toBe(true);

    act(() => {
      result.current.setViewMode('card');
    });

    expect(result.current.isDefault).toBe(false);
  });

  it('should handle different storage keys independently', () => {
    const { result: result1 } = renderHook(() => useViewMode('key1'), { wrapper });
    const { result: result2 } = renderHook(() => useViewMode('key2'), { wrapper });

    act(() => {
      result1.current.setViewMode('card');
    });

    expect(result1.current.viewMode).toBe('card');
    expect(result2.current.viewMode).toBe('table'); // Independent
  });
});

