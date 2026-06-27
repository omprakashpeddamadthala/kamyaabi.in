/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves MUI provider integration, all existing Redux/Auth/API behavior, and responsive overflow safeguards.
 * - Replaces only visual primitives with design-token-backed palette, typography, spacing, radii, shadows, and states.
 * - Keeps current page routes, role guards, form handling, and backend request contracts untouched.
 * - Updated to Zepto/Blinkit premium mobile-first aesthetic.
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1440,
    },
  },
  palette: {
    primary: {
      main: '#1D4ED8',
      light: '#3B82F6',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#B45309',
      contrastText: '#0F172A',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#EF4444',
    },
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      disabled: '#94A3B8',
    },
    divider: 'rgba(15, 23, 42, 0.08)',
  },
  typography: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    h1: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
      fontSize: 'var(--text-5xl)',
    },
    h2: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.12,
      fontSize: 'var(--text-4xl)',
    },
    h3: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.16,
      fontSize: 'var(--text-3xl)',
    },
    h4: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      fontSize: 'var(--text-2xl)',
    },
    h5: {
      fontWeight: 700,
      lineHeight: 1.25,
      fontSize: 'var(--text-xl)',
    },
    h6: {
      fontWeight: 700,
      lineHeight: 1.3,
      fontSize: 'var(--text-lg)',
    },
    subtitle1: {
      fontSize: 'var(--text-base)',
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.5,
      fontSize: 'var(--text-base)',
    },
    body2: {
      lineHeight: 1.5,
      fontSize: 'var(--text-sm)',
    },
    caption: {
      fontSize: 'var(--text-xs)',
    },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.05em',
      fontSize: 'var(--text-xs)',
      textTransform: 'uppercase',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0,
      fontSize: 'var(--text-sm)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    'var(--shadow-card)',
    'var(--shadow-card)',
    'var(--shadow-card)',
    'var(--shadow-hover)',
    'var(--shadow-hover)',
    'var(--shadow-hover)',
    'var(--shadow-hover)',
    'var(--shadow-hover)',
    'var(--shadow-hover)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
    'var(--shadow-modal)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          overflowX: 'hidden',
          maxWidth: '100vw',
          WebkitTextSizeAdjust: '100%',
          backgroundColor: 'var(--color-surface-bg)',
        },
        '#root': {
          overflowX: 'hidden',
          maxWidth: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
        'img, video': {
          maxWidth: '100%',
          height: 'auto',
        },
        'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible': {
          outline: '2px solid rgba(29,78,216,0.5)',
          outlineOffset: 2,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          [theme.breakpoints.up('sm')]: {
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
          },
        }),
        maxWidthLg: {
          maxWidth: '1200px !important',
        },
        maxWidthXl: {
          maxWidth: '1440px !important',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(2),
            width: 'calc(100% - 32px)',
            maxWidth: 'calc(100% - 32px)',
          },
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#475569',
          backgroundColor: '#F8FAFC',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-border)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-lg)',
          padding: '10px 24px',
          minHeight: 44,
          transition: 'all var(--transition-fast)',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(29,78,216,0.15)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(29,78,216,0.2)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          '&:hover': {
            borderWidth: 1.5,
            backgroundColor: 'var(--color-surface-hover)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-border)',
          transition: 'all var(--transition-normal)',
          '&:hover': {
            boxShadow: 'var(--shadow-hover)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 'var(--radius-lg)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: '#0F172A',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          backdropFilter: 'blur(12px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#FFFFFF',
          transition: 'all var(--transition-fast)',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(29,78,216,0.15)',
          },
        },
        input: {
          minHeight: 24,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all var(--transition-fast)',
          '&:active': {
            transform: 'scale(0.92)',
          },
          '@media (pointer: coarse)': {
            minWidth: 44,
            minHeight: 44,
          },
        },
      },
    },
  },
});

export default theme;
