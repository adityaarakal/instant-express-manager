import { CssBaseline, ThemeProvider } from '@mui/material';

import { AppLayout } from './components/layout/AppLayout';
import { appTheme } from './theme';
import { AppRoutes } from './routes/AppRoutes';
import { AppProviders } from './providers/AppProviders';

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppProviders>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </AppProviders>
    </ThemeProvider>
  );
}

export default App;

