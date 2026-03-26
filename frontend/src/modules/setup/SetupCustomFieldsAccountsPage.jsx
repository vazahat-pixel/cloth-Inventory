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
  Select,
  MenuItem,
  Checkbox,
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
  SettingsBackupRestoreRounded as SetOrderIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  FileDownloadRounded as ExportIcon,
  PrintRounded as PrintIcon,
  SearchRounded as SearchIcon,
  FileUploadRounded as ImportIcon,
  ContentCopyRounded as CopyIcon,
} from '@mui/icons-material';
import useAppNavigate from '../../hooks/useAppNavigate';

const SetupCustomFieldsAccountsPage = () => {
  const theme = useTheme();
  const appNavigate = useAppNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fields, setFields] = useState([
    { 
      id: 1, 
      sno: 1, 
      columnName: 'PAN Number', 
      columnType: 'TEXT', 
      isRequired: 'NO', 
      isVisible: 'YES', 
      defaultValue: '',
      isActive: true 
    },
    { 
      id: 2, 
      sno: 2, 
      columnName: 'GST Registration Date', 
      columnType: 'DATE', 
      isRequired: 'NO', 
      isVisible: 'YES', 
      defaultValue: '',
      isActive: true 
    }
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columnTypes = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN'];
  const yesNoOptions = ['YES', 'NO'];

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API fetch
    setTimeout(() => {
      setLoading(false);
      setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
    }, 800);
  };

  const handleSave = () => {
    setLoading(true);
    // Simulate API save
    setTimeout(() => {
      setLoading(false);
      setSnackbar({ open: true, message: 'Custom fields saved successfully', severity: 'success' });
      console.log('Saved Fields:', fields);
    }, 1000);
  };

  const handleAddField = () => {
    const nextSno = fields.length + 1;
    setFields([
      ...fields,
      { 
        id: Date.now(), 
        sno: nextSno, 
        columnName: '', 
        columnType: 'TEXT', 
        isRequired: 'NO', 
        isVisible: 'YES', 
        defaultValue: '',
        isActive: true 
      }
    ]);
  };

  const handleFieldChange = (id, property, value) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, [property]: value } : field
    ));
  };

  const handleDeleteField = (id) => {
    if (fields.length === 1) {
      setFields([{ id: Date.now(), sno: 1, columnName: '', columnType: 'TEXT', isRequired: 'NO', isVisible: 'YES', defaultValue: '', isActive: true }]);
      return;
    }
    const updatedFields = fields.filter(f => f.id !== id).map((f, index) => ({ ...f, sno: index + 1 }));
    setFields(updatedFields);
  };

  const handleClose = () => {
    appNavigate('/setup/accounts');
  };

  const filteredFields = fields.filter(f => 
    f.columnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.columnType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ 
      p: 0, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f8fafc',
      position: 'relative'
    }}>
      {/* Header Section */}
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
            Setup Custom Fields for Accounts Master
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
            Configure additional attributes and metadata for account records
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            placeholder="Search fields..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} />,
            }}
            sx={{ 
              width: 240,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
                borderRadius: '10px',
                fontSize: 13,
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#3b82f6' },
              }
            }}
          />
        </Stack>
      </Box>

      {/* Toolbar Section - Modernized version of Image 2 top icons */}
      <Box sx={{ 
        px: 3, 
        py: 1, 
        bgcolor: '#f1f5f9', 
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: 0.5
      }}>
        <Tooltip title="Add New Field">
          <IconButton size="small" onClick={handleAddField} sx={{ color: '#0ea5e9' }}><AddIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Copy Field">
          <IconButton size="small"><CopyIcon fontSize="small" sx={{ color: '#64748b' }} /></IconButton>
        </Tooltip>
        <Tooltip title="Import from Excel">
          <IconButton size="small"><ImportIcon fontSize="small" sx={{ color: '#10b981' }} /></IconButton>
        </Tooltip>
        <Tooltip title="Export to CSV">
          <IconButton size="small"><ExportIcon fontSize="small" sx={{ color: '#f59e0b' }} /></IconButton>
        </Tooltip>
        <Tooltip title="Print List">
          <IconButton size="small"><PrintIcon fontSize="small" sx={{ color: '#6366f1' }} /></IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
      </Box>

      {/* Table Section */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ 
          height: '100%', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          '&::-webkit-scrollbar': { width: 8, height: 8 },
          '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 },
        }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }}>SNO.</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }}>COLUMN NAME</TableCell>
                <TableCell sx={{ width: 160, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }}>COLUMN TYPE</TableCell>
                <TableCell sx={{ width: 120, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }}>IS REQUIRED</TableCell>
                <TableCell sx={{ width: 120, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }}>IS VISIBLE</TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }}>DEFAULT VALUE</TableCell>
                <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#f8fafc', color: '#475569' }} align="center">DEL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFields.map((field) => (
                <TableRow key={field.id} hover sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                  <TableCell sx={{ py: 0.5, color: '#64748b', fontWeight: 600 }}>{field.sno}</TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      size="small"
                      value={field.columnName}
                      onChange={(e) => handleFieldChange(field.id, 'columnName', e.target.value)}
                      placeholder="Enter field name..."
                      InputProps={{ 
                        disableUnderline: true,
                        sx: { 
                          fontSize: 13, 
                          fontWeight: 500,
                          p: '4px 8px',
                          borderRadius: '4px',
                          bgcolor: field.columnName ? 'transparent' : '#fff9c4', // Match the yellow highlight from Image 2
                          '&:focus-within': { bgcolor: '#e0f2fe', outline: '1px solid #3b82f6' }
                        } 
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Select
                      fullWidth
                      variant="standard"
                      size="small"
                      value={field.columnType}
                      onChange={(e) => handleFieldChange(field.id, 'columnType', e.target.value)}
                      disableUnderline
                      sx={{ 
                        fontSize: 13,
                        fontWeight: 500,
                        '& .MuiSelect-select': { p: '4px 8px' }
                      }}
                    >
                      {columnTypes.map(type => (
                        <MenuItem key={type} value={type} sx={{ fontSize: 13 }}>{type}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Select
                      fullWidth
                      variant="standard"
                      size="small"
                      value={field.isRequired}
                      onChange={(e) => handleFieldChange(field.id, 'isRequired', e.target.value)}
                      disableUnderline
                      sx={{ 
                        fontSize: 13,
                        fontWeight: 700,
                        color: field.isRequired === 'YES' ? '#ef4444' : '#64748b',
                        '& .MuiSelect-select': { p: '4px 8px' }
                      }}
                    >
                      {yesNoOptions.map(option => (
                        <MenuItem key={option} value={option} sx={{ fontSize: 13 }}>{option}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Select
                      fullWidth
                      variant="standard"
                      size="small"
                      value={field.isVisible}
                      onChange={(e) => handleFieldChange(field.id, 'isVisible', e.target.value)}
                      disableUnderline
                      sx={{ 
                        fontSize: 13,
                        fontWeight: 700,
                        color: field.isVisible === 'YES' ? '#22c55e' : '#64748b',
                        '& .MuiSelect-select': { p: '4px 8px' }
                      }}
                    >
                      {yesNoOptions.map(option => (
                        <MenuItem key={option} value={option} sx={{ fontSize: 13 }}>{option}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      size="small"
                      value={field.defaultValue}
                      onChange={(e) => handleFieldChange(field.id, 'defaultValue', e.target.value)}
                      placeholder="Optional..."
                      InputProps={{ 
                        disableUnderline: true,
                        sx: { 
                          fontSize: 13, 
                          p: '4px 8px',
                          borderRadius: '4px',
                          '&:focus-within': { bgcolor: '#e0f2fe' }
                        } 
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }} align="center">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteField(field.id)}
                      sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {/* Add row button at bottom of table */}
              <TableRow>
                <TableCell colSpan={7} sx={{ p: 0 }}>
                  <Button
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={handleAddField}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 0, 
                      color: '#64748b',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6' }
                    }}
                  >
                    Add Another Custom Field
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Footer Info Bar */}
      <Box sx={{ px: 3, py: 0.5, bgcolor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
          Press F2 : User Define Column
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {new Date().toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}
        </Typography>
      </Box>

      {/* Bottom Actions Bar - Fixed to bottom */}
      <Box sx={{ 
        px: 3, 
        py: 1.5, 
        bgcolor: '#0f172a', 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 1.5,
        boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ 
            bgcolor: '#334155', 
            '&:hover': { bgcolor: '#475569' },
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 700,
            px: 3,
            borderRadius: '8px'
          }}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          sx={{ 
            bgcolor: '#2563eb', 
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 700,
            px: 3,
            borderRadius: '8px'
          }}
        >
          Save
        </Button>
        <Button
          variant="contained"
          startIcon={<SetOrderIcon />}
          sx={{ 
            bgcolor: '#334155', 
            '&:hover': { bgcolor: '#475569' },
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 700,
            px: 3,
            borderRadius: '8px'
          }}
        >
          Set Order
        </Button>
        <Button
          variant="contained"
          startIcon={<CloseIcon />}
          onClick={handleClose}
          sx={{ 
            bgcolor: '#ef4444', 
            '&:hover': { bgcolor: '#dc2626' },
            textTransform: 'none',
            fontSize: 13,
            fontWeight: 700,
            px: 3,
            borderRadius: '8px'
          }}
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SetupCustomFieldsAccountsPage;
