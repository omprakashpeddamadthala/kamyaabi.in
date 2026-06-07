/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves MUI provider integration, all existing Redux/Auth/API behavior, and responsive overflow safeguards.
 * - Replaces only visual primitives with design-token-backed palette, typography, spacing, radii, shadows, and states.
 * - Keeps current page routes, role guards, form handling, and backend request contracts untouched.
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
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
      main: '#16A34A',
      light: '#22C55E',
      dark: '#15803D',
    },
    warning: {
      main: '#D97706',
    },
    error: {
      main: '#DC2626',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      disabled: '#94A3B8',
    },
    divider: 'rgba(29, 78, 216, 0.12)',
  },
  typography: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    h1: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
    },
    h2: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.12,
      fontSize: 'clamp(2rem, 5vw, 3rem)',
    },
    h3: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.16,
      fontSize: 'clamp(1.75rem, 4vw, 2rem)',
    },
    h4: {
      fontFamily: 'var(--font-display)',
      fontWeight: 750,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      fontSize: 'clamp(1.5rem, 3vw, 1.75rem)',
    },
    h5: {
      fontWeight: 750,
      lineHeight: 1.25,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 750,
      lineHeight: 1.3,
      fontSize: '1rem',
    },
    body1: {
      lineHeight: 1.65,
      fontSize: '1rem',
    },
    body2: {
      lineHeight: 1.6,
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 750,
      letterSpacing: 0,
    },
    overline: {
      fontWeight: 800,
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 10,
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
        },
        '#root': {
          overflowX: 'hidden',
          maxWidth: '100vw',
          minHeight: '100vh',
        },
        'img, video': {
          maxWidth: '100%',
          height: 'auto',
        },
        'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible': {
          outline: '3px solid rgba(29,78,216,0.45)',
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
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(1.5),
            width: 'calc(100% - 24px)',
            maxWidth: 'calc(100% - 24px)',
          },
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: '#0F172A',
          backgroundColor: '#F1F5F9',
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
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-full)',
          padding: '10px 24px',
          minHeight: 42,
          transition: 'transform var(--transition-base), box-shadow var(--transition-base), background-color var(--transition-base)',
          '&:active': {
            transform: 'translateY(1px)',
          },
          '@media (pointer: coarse)': {
            minHeight: 44,
          },
        },
        contained: {
          boxShadow: '0 10px 24px rgba(29,78,216,0.22)',
          '&:hover': {
            boxShadow: 'var(--shadow-hover)',
          },
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(29,78,216,0.08)',
          transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 'var(--shadow-hover)',
            borderColor: 'rgba(29,78,216,0.18)',
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
          backgroundColor: 'rgba(255,255,255,0.86)',
          color: '#0F172A',
          boxShadow: '0 1px 0 rgba(29,78,216,0.12)',
          backdropFilter: 'blur(18px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-full)',
          fontWeight: 750,
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
          transition: 'box-shadow var(--transition-base), border-color var(--transition-base)',
          '&.Mui-focused': {
            boxShadow: '0 0 0 4px rgba(29,78,216,0.10)',
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
          transition: 'transform var(--transition-base), background-color var(--transition-base)',
          '&:active': {
            transform: 'scale(0.96)',
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
