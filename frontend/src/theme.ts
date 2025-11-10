import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

export const createAppTheme = (mode: PaletteMode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb',
      },
      secondary: {
        main: '#9333ea',
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc',
        paper: mode === 'dark' ? '#111827' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        defaultProps: {
          color: 'default',
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.75rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
  });
