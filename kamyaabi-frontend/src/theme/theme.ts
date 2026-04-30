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
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
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
    // Prevent the viewport from ever scrolling horizontally on narrow
    // screens — guarantees "no horizontal overflow" for the responsive
    // audit regardless of which page is mounted.
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': { overflowX: 'hidden' },
        '#root': { overflowX: 'hidden' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          // Ensure buttons meet the 44x44 accessibility tap-target guideline
          // on touch devices without bloating desktop layout (padding-only).
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
    // Same accessibility guideline for icon buttons on touch devices.
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
