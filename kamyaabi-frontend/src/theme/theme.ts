import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8B6914',
      light: '#B8941E',
      dark: '#5C460D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    background: {
      default: '#F5F5F0',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Global scale-down: base font reduced from MUI's default 14px to 13px,
    // with proportionally smaller headings. Visual hierarchy is preserved.
    fontSize: 13,
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      fontSize: 'clamp(1.5rem, 3.8vw, 2.5rem)',
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      fontSize: 'clamp(1.3rem, 3.2vw, 2.1rem)',
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
      fontSize: 'clamp(1.15rem, 2.6vw, 1.8rem)',
    },
    h5: {
      fontWeight: 600,
      fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
    },
    h6: {
      fontWeight: 600,
      fontSize: 'clamp(0.9rem, 1.4vw, 1.1rem)',
    },
    body1: {
      fontSize: '0.9rem',
    },
    body2: {
      fontSize: '0.8rem',
    },
    subtitle1: {
      fontSize: '0.95rem',
    },
    subtitle2: {
      fontSize: '0.82rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          overflowX: 'hidden',
          maxWidth: '100vw',
          WebkitTextSizeAdjust: '100%',
        },
        '#root': { overflowX: 'hidden', maxWidth: '100vw' },
        'img, video': { maxWidth: '100%', height: 'auto' },
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
          [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(1.5),
            width: 'calc(100% - 24px)',
            maxWidth: 'calc(100% - 24px)',
          },
        }),
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          '@media (pointer: coarse)': {
            minHeight: 44,
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(139, 105, 20, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
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
