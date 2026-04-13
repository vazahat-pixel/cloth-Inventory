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
    fontFamily: `'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 500 },
    body2: { fontWeight: 500 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
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
    MuiSelect: {
      styleOverrides: {
        select: {
          paddingTop: '8px !important',
          paddingBottom: '8px !important',
          minHeight: '1.4375em', // Default MUI height for alignment
          display: 'flex',
          alignItems: 'center',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        listbox: {
          '& .MuiAutocomplete-option': {
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1E293B',
          },
        },
        inputRoot: {
          '&.MuiInputBase-sizeSmall': {
            paddingTop: '2px',
            paddingBottom: '2px',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 40,
          fontSize: '14px',
          fontWeight: 500,
          padding: '10px 16px',
          color: '#1E293B',
          '&:hover': {
            backgroundColor: '#F1F5F9',
          },
          '&.Mui-selected': {
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#DBEAFE',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.MuiInputBase-sizeSmall': {
            minHeight: 40,
          },
        },
        input: {
          padding: '10px 14px',
          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 14px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 500,
          '&.MuiInputLabel-sizeSmall': {
            transform: 'translate(14px, 10px) scale(1)',
          },
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -6px) scale(0.75)',
          },
        },
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

