import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Modern color palette for expense management app
const lightColors = {
  primary: {
    main: '#0ea5e9', // Sky blue - modern, trustworthy
    light: '#38bdf8',
    dark: '#0284c7',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#8b5cf6', // Violet - modern, creative
    light: '#a78bfa',
    dark: '#7c3aed',
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
    main: '#3b82f6', // Blue - information
    light: '#60a5fa',
    dark: '#2563eb',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f0f9ff', // Sky blue 50 - soft, modern background
    paper: '#e0f2fe', // Sky blue 100 - colorful background instead of white
  },
  text: {
    primary: '#0f172a', // Slate 900
    secondary: '#475569', // Slate 600
  },
};

const darkColors = {
  primary: {
    main: '#38bdf8', // Sky blue - lighter for dark mode
    light: '#7dd3fc',
    dark: '#0ea5e9',
    contrastText: '#0f172a',
  },
  secondary: {
    main: '#a78bfa', // Violet - lighter for dark mode
    light: '#c4b5fd',
    dark: '#8b5cf6',
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
    main: '#60a5fa', // Blue
    light: '#93c5fd',
    dark: '#3b82f6',
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
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)',
            borderBottom: `1px solid ${mode === 'dark' ? alpha('#ffffff', 0.1) : alpha('#ffffff', 0.2)}`,
            backdropFilter: 'blur(10px)',
            backgroundColor: mode === 'dark' ? alpha('#1e293b', 0.8) : alpha('#0ea5e9', 0.9),
            color: mode === 'dark' ? undefined : '#ffffff',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(180deg, #8b5cf6 0%, #3b82f6 50%, #0ea5e9 100%)',
            borderRight: `1px solid ${mode === 'dark' ? alpha('#ffffff', 0.1) : alpha('#ffffff', 0.2)}`,
            color: mode === 'dark' ? undefined : '#ffffff',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(219, 234, 254, 0.95) 50%, rgba(237, 233, 254, 0.95) 100%)',
            transition: 'all 0.3s ease-in-out',
            border: mode === 'dark' 
              ? `1px solid ${alpha('#ffffff', 0.1)}`
              : `1px solid ${alpha('#0ea5e9', 0.2)}`,
            '&:hover': {
              transition: 'all 0.3s ease-in-out',
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(240, 249, 255, 0.98) 0%, rgba(219, 234, 254, 0.98) 50%, rgba(237, 233, 254, 0.98) 100%)',
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
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(219, 234, 254, 0.95) 50%, rgba(237, 233, 254, 0.95) 100%)',
            border: mode === 'dark' 
              ? `1px solid ${alpha('#ffffff', 0.1)}`
              : `1px solid ${alpha('#0ea5e9', 0.3)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(139, 92, 246, 0.1) 100%)',
              boxShadow: mode === 'dark'
                ? '0 20px 30px 0 rgba(0, 0, 0, 0.4), 0 8px 10px 0 rgba(0, 0, 0, 0.24)'
                : `0 20px 30px 0 ${alpha('#0ea5e9', 0.2)}, 0 8px 10px 0 ${alpha('#8b5cf6', 0.15)}`,
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
            backgroundImage: mode === 'dark'
              ? `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`
              : `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
            '&:hover': {
              backgroundImage: mode === 'dark'
                ? `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`
                : `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`,
            },
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              backgroundImage: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.1)} 0%, ${alpha(colors.primary.dark, 0.1)} 100%)`,
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
              backgroundImage: mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.15)} 0%, ${alpha(colors.secondary.main, 0.1)} 100%)`
                : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.08)} 0%, ${alpha(colors.secondary.main, 0.05)} 100%)`,
              transform: 'translateX(4px)',
            },
            '&.Mui-selected': {
              backgroundImage: mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.25)} 0%, ${alpha(colors.secondary.main, 0.15)} 100%)`
                : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.12)} 0%, ${alpha(colors.secondary.main, 0.08)} 100%)`,
              borderLeft: `3px solid ${colors.primary.main}`,
              '&:hover': {
                backgroundImage: mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.3)} 0%, ${alpha(colors.secondary.main, 0.2)} 100%)`
                  : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.15)} 0%, ${alpha(colors.secondary.main, 0.1)} 100%)`,
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.2)} 0%, ${alpha(colors.secondary.main, 0.15)} 100%)`
              : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.15)} 0%, ${alpha(colors.secondary.main, 0.1)} 100%)`,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(219, 234, 254, 0.95) 50%, rgba(237, 233, 254, 0.95) 100%)',
            borderRadius: 12,
            border: mode === 'dark' 
              ? `1px solid ${alpha('#ffffff', 0.1)}`
              : `1px solid ${alpha('#0ea5e9', 0.2)}`,
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
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.success.main, 0.1)} 0%, ${alpha(colors.success.light, 0.05)} 100%)`,
            borderColor: alpha(colors.success.main, 0.3),
          },
          standardError: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.error.main, 0.1)} 0%, ${alpha(colors.error.light, 0.05)} 100%)`,
            borderColor: alpha(colors.error.main, 0.3),
          },
          standardWarning: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.warning.main, 0.1)} 0%, ${alpha(colors.warning.light, 0.05)} 100%)`,
            borderColor: alpha(colors.warning.main, 0.3),
          },
          standardInfo: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.info.main, 0.1)} 0%, ${alpha(colors.info.light, 0.05)} 100%)`,
            borderColor: alpha(colors.info.main, 0.3),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, rgba(240, 249, 255, 0.98) 0%, rgba(219, 234, 254, 0.98) 50%, rgba(237, 233, 254, 0.98) 100%)',
            borderRadius: 16,
            border: mode === 'dark' 
              ? `1px solid ${alpha('#ffffff', 0.1)}`
              : `1px solid ${alpha('#0ea5e9', 0.3)}`,
          },
        },
      },
    },
  });
};
