import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Professional, sophisticated color palette for expense management app
const lightColors = {
  primary: {
    main: '#6366f1', // Indigo - professional, trustworthy
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#14b8a6', // Teal - modern accent
    light: '#5eead4',
    dark: '#0d9488',
    contrastText: '#ffffff',
  },
  success: {
    main: '#10b981', // Emerald green - income, positive
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ef4444', // Red - expenses, negative
    light: '#f87171',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f59e0b', // Amber - warnings
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#ffffff',
  },
  info: {
    main: '#0ea5e9', // Sky blue - information
    light: '#38bdf8',
    dark: '#0284c7',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f8fafc', // Slate 50 - clean, light background
    paper: '#ffffff', // White - clean paper
  },
  text: {
    primary: '#0f172a', // Slate 900
    secondary: '#475569', // Slate 600
  },
};

const darkColors = {
  primary: {
    main: '#818cf8', // Indigo - lighter for dark mode
    light: '#a5b4fc',
    dark: '#6366f1',
    contrastText: '#0f172a',
  },
  secondary: {
    main: '#5eead4', // Teal - lighter for dark mode
    light: '#99f6e4',
    dark: '#14b8a6',
    contrastText: '#0f172a',
  },
  success: {
    main: '#34d399', // Emerald green
    light: '#6ee7b7',
    dark: '#10b981',
    contrastText: '#0f172a',
  },
  error: {
    main: '#f87171', // Red - lighter for dark mode
    light: '#fca5a5',
    dark: '#ef4444',
    contrastText: '#0f172a',
  },
  warning: {
    main: '#fbbf24', // Amber
    light: '#fcd34d',
    dark: '#f59e0b',
    contrastText: '#0f172a',
  },
  info: {
    main: '#38bdf8', // Sky blue
    light: '#7dd3fc',
    dark: '#0ea5e9',
    contrastText: '#0f172a',
  },
  background: {
    default: '#0f172a', // Slate 900
    paper: '#1e293b', // Slate 800
  },
  text: {
    primary: '#f1f5f9', // Slate 100
    secondary: '#cbd5e1', // Slate 300
  },
};

export const createAppTheme = (mode: PaletteMode = 'light') => {
  const colors = mode === 'dark' ? darkColors : lightColors;

  return createTheme({
    palette: {
      mode,
      ...colors,
      divider: mode === 'dark' ? alpha('#ffffff', 0.12) : alpha('#000000', 0.12),
    },
    typography: {
      fontFamily: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.75rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      mode === 'dark'
        ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
        : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      mode === 'dark'
        ? '0 3px 6px 0 rgba(0, 0, 0, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.24)'
        : '0 3px 6px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      mode === 'dark'
        ? '0 10px 20px 0 rgba(0, 0, 0, 0.3), 0 3px 6px 0 rgba(0, 0, 0, 0.24)'
        : '0 10px 20px 0 rgba(0, 0, 0, 0.1), 0 3px 6px 0 rgba(0, 0, 0, 0.06)',
      mode === 'dark'
        ? '0 15px 25px 0 rgba(0, 0, 0, 0.35), 0 5px 10px 0 rgba(0, 0, 0, 0.24)'
        : '0 15px 25px 0 rgba(0, 0, 0, 0.12), 0 5px 10px 0 rgba(0, 0, 0, 0.08)',
      mode === 'dark'
        ? '0 20px 30px 0 rgba(0, 0, 0, 0.4), 0 8px 10px 0 rgba(0, 0, 0, 0.24)'
        : '0 20px 30px 0 rgba(0, 0, 0, 0.15), 0 8px 10px 0 rgba(0, 0, 0, 0.1)',
      'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none',
      'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none',
    ],
    components: {
      MuiAppBar: {
        defaultProps: {
          color: 'default',
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            borderBottom: `1px solid ${mode === 'dark' ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)}`,
            backdropFilter: 'blur(10px)',
            color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRight: `1px solid ${mode === 'dark' ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)}`,
            color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transition: 'all 0.2s ease-in-out',
            },
          },
          elevation1: {
            boxShadow: mode === 'dark'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
          elevation2: {
            boxShadow: mode === 'dark'
              ? '0 3px 6px 0 rgba(0, 0, 0, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.24)'
              : '0 3px 6px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
          },
          elevation3: {
            boxShadow: mode === 'dark'
              ? '0 10px 20px 0 rgba(0, 0, 0, 0.3), 0 3px 6px 0 rgba(0, 0, 0, 0.24)'
              : '0 10px 20px 0 rgba(0, 0, 0, 0.1), 0 3px 6px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark'
                ? '0 20px 30px 0 rgba(0, 0, 0, 0.4), 0 8px 10px 0 rgba(0, 0, 0, 0.24)'
                : '0 20px 30px 0 rgba(0, 0, 0, 0.15), 0 8px 10px 0 rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s ease-in-out',
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: mode === 'dark'
                ? `0 4px 12px 0 ${alpha(colors.primary.main, 0.4)}`
                : `0 4px 12px 0 ${alpha(colors.primary.main, 0.3)}`,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
            '&:hover': {
              backgroundColor: colors.primary.dark,
            },
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              backgroundColor: alpha(colors.primary.main, 0.08),
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? alpha(colors.primary.main, 0.1)
                : alpha(colors.primary.main, 0.08),
              transform: 'translateX(4px)',
            },
            '&.Mui-selected': {
              backgroundColor: mode === 'dark'
                ? alpha(colors.primary.main, 0.2)
                : alpha(colors.primary.main, 0.12),
              borderLeft: `3px solid ${colors.primary.main}`,
              '&:hover': {
                backgroundColor: mode === 'dark'
                  ? alpha(colors.primary.main, 0.25)
                  : alpha(colors.primary.main, 0.15),
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark'
              ? alpha(colors.primary.main, 0.1)
              : alpha(colors.primary.main, 0.05),
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: 12,
            border: mode === 'dark' 
              ? `1px solid ${alpha('#ffffff', 0.1)}`
              : `1px solid ${alpha('#000000', 0.08)}`,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${alpha(colors.info.main, 0.2)}`,
          },
          standardSuccess: {
            backgroundColor: alpha(colors.success.main, 0.1),
            borderColor: alpha(colors.success.main, 0.3),
          },
          standardError: {
            backgroundColor: alpha(colors.error.main, 0.1),
            borderColor: alpha(colors.error.main, 0.3),
          },
          standardWarning: {
            backgroundColor: alpha(colors.warning.main, 0.1),
            borderColor: alpha(colors.warning.main, 0.3),
          },
          standardInfo: {
            backgroundColor: alpha(colors.info.main, 0.1),
            borderColor: alpha(colors.info.main, 0.3),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: 16,
            border: mode === 'dark' 
              ? `1px solid ${alpha('#ffffff', 0.1)}`
              : `1px solid ${alpha('#000000', 0.08)}`,
          },
        },
      },
    },
  });
};
