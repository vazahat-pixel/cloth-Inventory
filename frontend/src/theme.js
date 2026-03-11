import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Modern blue
      light: '#60A5FA',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1E293B', // Dark slate
      light: '#334155',
      dark: '#0F172A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    divider: '#E5E7EB',
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    warning: {
      main: '#F59E0B', // Soft amber
    },
  },
  typography: {
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
    h4: {
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0.02,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          borderColor: '#E5E7EB',
        },
        outlined: {
          borderColor: '#E5E7EB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
        containedPrimary: {
          boxShadow: '0 10px 20px rgba(37, 99, 235, 0.25)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#EFF4FF',
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: 13,
            color: '#1E293B',
            borderBottomColor: '#E5E7EB',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#F9FAFB',
          },
          '&:hover': {
            backgroundColor: '#EEF2FF',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          maxHeight: 560,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
          borderBottomColor: '#E5E7EB',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          borderColor: '#E5E7EB',
        },
      },
    },
  },
});

export default theme;

