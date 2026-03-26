import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Stack,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  RefreshRounded as RefreshIcon,
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  SettingsBackupRestoreRounded as OrderIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  FileDownloadRounded as ExportIcon,
  PrintRounded as PrintIcon,
  SearchRounded as SearchIcon,
  FileUploadRounded as ImportIcon,
  ContentCopyRounded as CopyIcon,
} from '@mui/icons-material';
import useAppNavigate from '../../hooks/useAppNavigate';

const SetupCountryPage = () => {
  const theme = useTheme();
  const appNavigate = useAppNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countries, setCountries] = useState([
    { 
      id: 1, 
      sno: 1, 
      countryName: '(NIL)', 
      countryShortName: '(NIL)', 
      countryUnion: '', 
      countryCode: '' 
    },
    { 
      id: 2, 
      sno: 2, 
      countryName: 'India', 
      countryShortName: 'India', 
      countryUnion: '', 
      countryCode: '+91' 
    }
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSnackbar({ open: true, message: 'Countries refreshed', severity: 'success' });
    }, 600);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSnackbar({ open: true, message: 'Settings saved locally', severity: 'success' });
      console.log('Saved Countries:', countries);
    }, 800);
  };

  const handleAddCountry = () => {
    const nextSno = countries.length + 1;
    setCountries([
      ...countries,
      { 
        id: Date.now(), 
        sno: nextSno, 
        countryName: '', 
        countryShortName: '', 
        countryUnion: '', 
        countryCode: '' 
      }
    ]);
  };

  const handleChange = (id, property, value) => {
    setCountries(countries.map(country => 
      country.id === id ? { ...country, [property]: value } : country
    ));
  };

  const handleDelete = (id) => {
    if (countries.length === 1) return;
    const updated = countries.filter(c => c.id !== id).map((c, index) => ({ ...c, sno: index + 1 }));
    setCountries(updated);
  };

  const handleClose = () => {
    appNavigate('/setup/accounts');
  };

  const filteredCountries = countries.filter(c => 
    c.countryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.countryShortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ 
      p: 0, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f8fafc',
    }}>
      {/* Header */}
      <Box sx={{ 
        px: 3, 
        py: 2, 
        bgcolor: '#fff', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(90deg, #fff 0%, #f8fafc 100%)'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
            Setup Country
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
            Manage international country codes and names for shipping and taxation
          </Typography>
        </Box>

        <TextField
          placeholder="Search countries..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
          }}
          sx={{ 
            width: 260,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fff',
              borderRadius: '10px',
              fontSize: 13,
              '& fieldset': { borderColor: '#e2e8f0' },
            }
          }}
        />
      </Box>

      {/* Toolbar */}
      <Box sx={{ 
        px: 3, 
        py: 0.8, 
        bgcolor: '#f1f5f9', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: 0.5
      }}>
        <Tooltip title="Add New"><IconButton size="small" onClick={handleAddCountry} sx={{ color: '#0ea5e9' }}><AddIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="CSV Export"><IconButton size="small"><ExportIcon fontSize="small" sx={{ color: '#f59e0b' }} /></IconButton></Tooltip>
        <Tooltip title="Excel Import"><IconButton size="small"><ImportIcon fontSize="small" sx={{ color: '#10b981' }} /></IconButton></Tooltip>
        <Tooltip title="Print List"><IconButton size="small"><PrintIcon fontSize="small" sx={{ color: '#6366f1' }} /></IconButton></Tooltip>
      </Box>

      {/* Table */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ 
          height: '100%', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#f8fafc' }}>SNO.</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#f8fafc' }}>COUNTRY NAME</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 700, bgcolor: '#f8fafc' }}>COUNTRY SHORT NAME</TableCell>
                <TableCell sx={{ width: 150, fontWeight: 700, bgcolor: '#f8fafc' }}>COUNTRY UNION</TableCell>
                <TableCell sx={{ width: 120, fontWeight: 700, bgcolor: '#f8fafc' }}>COUNTRY CODE</TableCell>
                <TableCell sx={{ width: 50, bgcolor: '#f8fafc' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCountries.map((country) => (
                <TableRow key={country.id} hover>
                  <TableCell sx={{ color: '#64748b' }}>{country.sno}</TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="standard"
                      size="small"
                      value={country.countryName}
                      onChange={(e) => handleChange(country.id, 'countryName', e.target.value)}
                      InputProps={{ 
                        disableUnderline: true,
                        sx: { 
                          fontSize: 13, 
                          p: '4px 8px',
                          borderRadius: '4px',
                          bgcolor: country.countryName ? 'transparent' : '#fff9c4',
                          '&:focus-within': { bgcolor: '#e0f2fe' }
                        } 
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="standard"
                      size="small"
                      value={country.countryShortName}
                      onChange={(e) => handleChange(country.id, 'countryShortName', e.target.value)}
                      InputProps={{ 
                        disableUnderline: true,
                        sx: { fontSize: 13, p: '4px 8px', borderRadius: '4px', '&:focus-within': { bgcolor: '#e0f2fe' } } 
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="standard"
                      size="small"
                      value={country.countryUnion}
                      onChange={(e) => handleChange(country.id, 'countryUnion', e.target.value)}
                      InputProps={{ 
                        disableUnderline: true,
                        sx: { fontSize: 13, p: '4px 8px', borderRadius: '4px', '&:focus-within': { bgcolor: '#e0f2fe' } } 
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      variant="standard"
                      size="small"
                      value={country.countryCode}
                      onChange={(e) => handleChange(country.id, 'countryCode', e.target.value)}
                      InputProps={{ 
                        disableUnderline: true,
                        sx: { fontSize: 13, p: '4px 8px', borderRadius: '4px', '&:focus-within': { bgcolor: '#e0f2fe' } } 
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDelete(country.id)}>
                      <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Footer Controls */}
      <Box sx={{ 
        px: 3, 
        py: 1.5, 
        bgcolor: '#0f172a', 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 1.5 
      }}>
        <Button
          variant="contained"
          startIcon={<OrderIcon />}
          sx={{ bgcolor: '#334155', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#475569' } }}
        >
          Order
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          sx={{ bgcolor: '#2563eb', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          Save
        </Button>
        <Button
          variant="contained"
          startIcon={<CloseIcon />}
          onClick={handleClose}
          sx={{ bgcolor: '#ef4444', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#dc2626' } }}
        >
          Close
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SetupCountryPage;
