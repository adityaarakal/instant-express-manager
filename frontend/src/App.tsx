import { useMemo } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';

import { AppLayout } from './components/layout/AppLayout';
import { createAppTheme } from './theme';
import { AppRoutes } from './routes/AppRoutes';
import { AppProviders } from './providers/AppProviders';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useSettingsStore } from './store/useSettingsStore';

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppProviders>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </AppProviders>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

