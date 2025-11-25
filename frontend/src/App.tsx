import { useMemo } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';

import { AppLayout } from './components/layout/AppLayout';
import { createAppTheme } from './theme';
import { AppRoutes } from './routes/AppRoutes';
import { AppProviders } from './providers/AppProviders';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useSettingsStore } from './store/useSettingsStore';
import { useScheduledExports } from './hooks/useScheduledExports';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useNotifications } from './hooks/useNotifications';
import { useDataIntegrity } from './hooks/useDataIntegrity';
import { OnboardingDialog } from './components/onboarding/OnboardingDialog';

function App() {
  const themeSetting = useSettingsStore((state) => state.settings.theme);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const paletteMode =
    themeSetting === 'system'
      ? prefersDarkMode
        ? 'dark'
        : 'light'
      : themeSetting;
  const theme = useMemo(() => createAppTheme(paletteMode), [paletteMode]);
  
  // Initialize scheduled exports
  useScheduledExports();
  
  // Initialize undo/redo keyboard shortcuts
  useUndoRedo();
  
  // Initialize browser notifications
  useNotifications();
  
  // Initialize data integrity checks (runs in development mode)
  // Auto-fix enabled to automatically recalculate balances after initialBalance migration
  useDataIntegrity(process.env.NODE_ENV === 'development'); // Auto-fix in development mode

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppProviders>
          <OnboardingDialog />
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </AppProviders>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

