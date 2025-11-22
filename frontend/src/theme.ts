import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Artistic, vibrant color palette for expense management app
const lightColors = {
  primary: {
    main: '#6366f1', // Indigo - sophisticated, modern
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ec4899', // Pink - vibrant, creative
    light: '#f472b6',
    dark: '#db2777',
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
    default: '#0f172a', // Deep slate - rich background
    paper: '#1e293b', // Slate 800
  },
  text: {
    primary: '#f1f5f9', // Slate 100
    secondary: '#cbd5e1', // Slate 300
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
    main: '#f472b6', // Pink - lighter for dark mode
    light: '#f9a8d4',
    dark: '#ec4899',
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
    default: '#0a0e27', // Very dark blue
    paper: '#1a1f3a', // Dark blue-gray
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
      divider: mode === 'dark' ? alpha('#ffffff', 0.12) : alpha('#ffffff', 0.2),
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
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #818cf8 0%, #f472b6 50%, #38bdf8 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #0ea5e9 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        background: mode === 'dark'
          ? 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 700,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 700,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 700,
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 700,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: [
      'none',
      mode === 'dark'
        ? '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)'
        : '0 1px 3px 0 rgba(99, 102, 241, 0.2), 0 1px 2px 0 rgba(99, 102, 241, 0.15)',
      mode === 'dark'
        ? '0 3px 6px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
        : '0 3px 6px 0 rgba(99, 102, 241, 0.25), 0 2px 4px 0 rgba(236, 72, 153, 0.2)',
      mode === 'dark'
        ? '0 10px 20px 0 rgba(0, 0, 0, 0.5), 0 3px 6px 0 rgba(0, 0, 0, 0.3)'
        : '0 10px 20px 0 rgba(99, 102, 241, 0.3), 0 3px 6px 0 rgba(236, 72, 153, 0.25)',
      mode === 'dark'
        ? '0 15px 25px 0 rgba(0, 0, 0, 0.6), 0 5px 10px 0 rgba(0, 0, 0, 0.4)'
        : '0 15px 25px 0 rgba(99, 102, 241, 0.35), 0 5px 10px 0 rgba(236, 72, 153, 0.3)',
      mode === 'dark'
        ? '0 20px 30px 0 rgba(0, 0, 0, 0.7), 0 8px 10px 0 rgba(0, 0, 0, 0.5)'
        : '0 20px 30px 0 rgba(99, 102, 241, 0.4), 0 8px 10px 0 rgba(236, 72, 153, 0.35)',
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
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1a1f3a 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #ec4899 50%, #f472b6 75%, #6366f1 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradientShift 15s ease infinite',
            borderBottom: `2px solid ${mode === 'dark' ? alpha('#818cf8', 0.3) : alpha('#ffffff', 0.3)}`,
            backdropFilter: 'blur(20px) saturate(180%)',
            backgroundColor: mode === 'dark' ? alpha('#1e293b', 0.9) : alpha('#6366f1', 0.95),
            color: '#ffffff',
            boxShadow: mode === 'dark'
              ? '0 8px 32px 0 rgba(129, 140, 248, 0.3)'
              : '0 8px 32px 0 rgba(99, 102, 241, 0.4)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #1a1f3a 100%)'
              : 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 25%, #ec4899 50%, #f472b6 75%, #8b5cf6 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 20s ease infinite',
            borderRight: `2px solid ${mode === 'dark' ? alpha('#818cf8', 0.3) : alpha('#ffffff', 0.3)}`,
            color: '#ffffff',
            boxShadow: mode === 'dark'
              ? '4px 0 24px 0 rgba(129, 140, 248, 0.3)'
              : '4px 0 24px 0 rgba(99, 102, 241, 0.4)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(26, 31, 58, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.12) 25%, rgba(236, 72, 153, 0.1) 50%, rgba(14, 165, 233, 0.08) 75%, rgba(99, 102, 241, 0.15) 100%)',
            backgroundSize: '200% 200%',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            border: mode === 'dark' 
              ? `2px solid ${alpha('#818cf8', 0.3)}`
              : `2px solid ${alpha('#6366f1', 0.4)}`,
            backdropFilter: 'blur(10px) saturate(150%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: mode === 'dark'
                ? 'radial-gradient(circle at 50% 0%, rgba(129, 140, 248, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            },
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
            '&:hover': {
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(244, 114, 182, 0.15) 50%, rgba(56, 189, 248, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 25%, rgba(236, 72, 153, 0.15) 50%, rgba(14, 165, 233, 0.12) 75%, rgba(99, 102, 241, 0.25) 100%)',
              transform: 'translateY(-4px) scale(1.01)',
              boxShadow: mode === 'dark'
                ? '0 24px 48px 0 rgba(129, 140, 248, 0.4), 0 12px 24px 0 rgba(244, 114, 182, 0.3)'
                : '0 24px 48px 0 rgba(99, 102, 241, 0.5), 0 12px 24px 0 rgba(236, 72, 153, 0.4)',
            },
          },
          elevation1: {
            boxShadow: mode === 'dark'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)'
              : '0 1px 3px 0 rgba(99, 102, 241, 0.2), 0 1px 2px 0 rgba(99, 102, 241, 0.15)',
          },
          elevation2: {
            boxShadow: mode === 'dark'
              ? '0 3px 6px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
              : '0 3px 6px 0 rgba(99, 102, 241, 0.25), 0 2px 4px 0 rgba(236, 72, 153, 0.2)',
          },
          elevation3: {
            boxShadow: mode === 'dark'
              ? '0 10px 20px 0 rgba(0, 0, 0, 0.5), 0 3px 6px 0 rgba(0, 0, 0, 0.3)'
              : '0 10px 20px 0 rgba(99, 102, 241, 0.3), 0 3px 6px 0 rgba(236, 72, 153, 0.25)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(26, 31, 58, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 25%, rgba(236, 72, 153, 0.12) 50%, rgba(14, 165, 233, 0.1) 75%, rgba(99, 102, 241, 0.2) 100%)',
            backgroundSize: '200% 200%',
            border: mode === 'dark' 
              ? `2px solid ${alpha('#818cf8', 0.4)}`
              : `2px solid ${alpha('#6366f1', 0.5)}`,
            backdropFilter: 'blur(12px) saturate(150%)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: mode === 'dark'
                ? 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
              opacity: 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              zIndex: 0,
            },
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.25) 0%, rgba(244, 114, 182, 0.2) 50%, rgba(56, 189, 248, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.25) 25%, rgba(236, 72, 153, 0.2) 50%, rgba(14, 165, 233, 0.15) 75%, rgba(99, 102, 241, 0.3) 100%)',
              boxShadow: mode === 'dark'
                ? '0 32px 64px 0 rgba(129, 140, 248, 0.5), 0 16px 32px 0 rgba(244, 114, 182, 0.4)'
                : '0 32px 64px 0 rgba(99, 102, 241, 0.6), 0 16px 32px 0 rgba(236, 72, 153, 0.5)',
              '&::before': {
                opacity: 1,
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 28px',
            fontWeight: 700,
            textTransform: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              transition: 'left 0.5s ease',
            },
            '&:hover::before': {
              left: '100%',
            },
            '&:hover': {
              transform: 'translateY(-2px) scale(1.05)',
              boxShadow: mode === 'dark'
                ? `0 8px 24px 0 ${alpha(colors.primary.main, 0.5)}`
                : `0 8px 24px 0 ${alpha(colors.primary.main, 0.6)}`,
            },
            '&:active': {
              transform: 'translateY(0) scale(1)',
            },
          },
          contained: {
            backgroundImage: mode === 'dark'
              ? `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 50%, ${colors.primary.light} 100%)`
              : `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 50%, ${colors.primary.light} 100%)`,
            backgroundSize: '200% 200%',
            color: '#ffffff',
            boxShadow: mode === 'dark'
              ? `0 4px 16px 0 ${alpha(colors.primary.main, 0.4)}`
              : `0 4px 16px 0 ${alpha(colors.primary.main, 0.5)}`,
            '&:hover': {
              backgroundImage: mode === 'dark'
                ? `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.secondary.light} 50%, ${colors.primary.main} 100%)`
                : `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.secondary.light} 50%, ${colors.primary.main} 100%)`,
              boxShadow: mode === 'dark'
                ? `0 12px 32px 0 ${alpha(colors.primary.main, 0.6)}`
                : `0 12px 32px 0 ${alpha(colors.primary.main, 0.7)}`,
            },
          },
          outlined: {
            borderWidth: 2,
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.1)} 0%, ${alpha(colors.secondary.main, 0.1)} 100%)`,
            '&:hover': {
              borderWidth: 2,
              backgroundImage: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.2)} 0%, ${alpha(colors.secondary.main, 0.2)} 100%)`,
              borderColor: colors.primary.main,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 10,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              transform: 'scale(1.1) translateY(-2px)',
              boxShadow: mode === 'dark'
                ? `0 4px 12px 0 ${alpha('#818cf8', 0.4)}`
                : `0 4px 12px 0 ${alpha('#6366f1', 0.5)}`,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: mode === 'dark'
                ? `linear-gradient(180deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`
                : `linear-gradient(180deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
              transform: 'scaleY(0)',
              transition: 'transform 0.3s ease',
            },
            '&:hover': {
              backgroundImage: mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.2)} 0%, ${alpha(colors.secondary.main, 0.15)} 100%)`
                : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.15)} 0%, ${alpha(colors.secondary.main, 0.12)} 100%)`,
              transform: 'translateX(8px)',
              '&::before': {
                transform: 'scaleY(1)',
              },
            },
            '&.Mui-selected': {
              backgroundImage: mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.3)} 0%, ${alpha(colors.secondary.main, 0.25)} 100%)`
                : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.2)} 0%, ${alpha(colors.secondary.main, 0.18)} 100%)`,
              borderLeft: `4px solid ${colors.primary.main}`,
              '&::before': {
                transform: 'scaleY(1)',
              },
              '&:hover': {
                backgroundImage: mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.35)} 0%, ${alpha(colors.secondary.main, 0.3)} 100%)`
                  : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.25)} 0%, ${alpha(colors.secondary.main, 0.22)} 100%)`,
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(colors.primary.main, 0.25)} 0%, ${alpha(colors.secondary.main, 0.2)} 100%)`
              : `linear-gradient(135deg, ${alpha(colors.primary.main, 0.2)} 0%, ${alpha(colors.secondary.main, 0.15)} 100%)`,
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(26, 31, 58, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.12) 25%, rgba(236, 72, 153, 0.1) 50%, rgba(14, 165, 233, 0.08) 75%, rgba(99, 102, 241, 0.15) 100%)',
            backgroundSize: '200% 200%',
            borderRadius: 16,
            border: mode === 'dark' 
              ? `2px solid ${alpha('#818cf8', 0.4)}`
              : `2px solid ${alpha('#6366f1', 0.5)}`,
            backdropFilter: 'blur(10px) saturate(150%)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `2px solid ${alpha(colors.info.main, 0.3)}`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: mode === 'dark'
                ? `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`
                : `linear-gradient(90deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
            },
          },
          standardSuccess: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.success.main, 0.15)} 0%, ${alpha(colors.success.light, 0.1)} 100%)`,
            borderColor: alpha(colors.success.main, 0.4),
          },
          standardError: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.error.main, 0.15)} 0%, ${alpha(colors.error.light, 0.1)} 100%)`,
            borderColor: alpha(colors.error.main, 0.4),
          },
          standardWarning: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.warning.main, 0.15)} 0%, ${alpha(colors.warning.light, 0.1)} 100%)`,
            borderColor: alpha(colors.warning.main, 0.4),
          },
          standardInfo: {
            backgroundImage: `linear-gradient(135deg, ${alpha(colors.info.main, 0.15)} 0%, ${alpha(colors.info.light, 0.1)} 100%)`,
            borderColor: alpha(colors.info.main, 0.4),
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(26, 31, 58, 0.98) 50%, rgba(15, 23, 42, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.18) 25%, rgba(236, 72, 153, 0.15) 50%, rgba(14, 165, 233, 0.12) 75%, rgba(99, 102, 241, 0.2) 100%)',
            backgroundSize: '200% 200%',
            borderRadius: 24,
            border: mode === 'dark' 
              ? `2px solid ${alpha('#818cf8', 0.4)}`
              : `2px solid ${alpha('#6366f1', 0.5)}`,
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: mode === 'dark'
              ? '0 32px 64px 0 rgba(129, 140, 248, 0.4), 0 16px 32px 0 rgba(244, 114, 182, 0.3)'
              : '0 32px 64px 0 rgba(99, 102, 241, 0.5), 0 16px 32px 0 rgba(236, 72, 153, 0.4)',
          },
        },
      },
    },
  });
};
