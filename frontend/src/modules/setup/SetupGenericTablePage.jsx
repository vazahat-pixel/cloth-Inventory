import React, { useState, useMemo } from 'react';
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
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  SaveRounded as SaveIcon,
  CloseRounded as CloseIcon,
  SettingsBackupRestoreRounded as OrderIcon,
  AddRounded as AddIcon,
  DeleteOutlineRounded as DeleteIcon,
  SearchRounded as SearchIcon,
  PrintRounded as PrintIcon,
  FileDownloadRounded as ExportIcon,
} from '@mui/icons-material';
import useAppNavigate from '../../hooks/useAppNavigate';

const SetupGenericTablePage = ({ title, description, columns = [], initialData = [] }) => {
  const theme = useTheme();
  const appNavigate = useAppNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(initialData.length > 0 ? initialData : [
    { id: 1, sno: 1, ...columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}) }
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSnackbar({ open: true, message: `${title} saved successfully`, severity: 'success' });
      console.log(`Saved ${title}:`, data);
    }, 800);
  };

  const handleAddRow = () => {
    const nextSno = data.length + 1;
    setData([
      ...data,
      { 
        id: Date.now(), 
        sno: nextSno, 
        ...columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}) 
      }
    ]);
  };

  const handleChange = (id, key, value) => {
    setData(data.map(row => row.id === id ? { ...row, [key]: value } : row));
  };

  const handleDelete = (id) => {
    if (data.length === 1) {
      setData([{ id: Date.now(), sno: 1, ...columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}) }]);
      return;
    }
    setData(data.filter(row => row.id !== id).map((row, index) => ({ ...row, sno: index + 1 })));
  };

  const filteredData = useMemo(() => {
    return data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  return (
    <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ 
        px: 3, py: 2, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>{title}</Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>{description}</Typography>
        </Box>
        <TextField
          placeholder={`Search ${title}...`}
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 18 }} /> }}
          sx={{ width: 260, '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: '10px', fontSize: 13 } }}
        />
      </Box>

      {/* Toolbar */}
      <Box sx={{ px: 3, py: 0.8, bgcolor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 0.5 }}>
        <Tooltip title="Add New"><IconButton size="small" onClick={handleAddRow} sx={{ color: '#0ea5e9' }}><AddIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Print List"><IconButton size="small"><PrintIcon fontSize="small" sx={{ color: '#6366f1' }} /></IconButton></Tooltip>
        <Tooltip title="Export CSV"><IconButton size="small"><ExportIcon fontSize="small" sx={{ color: '#f59e0b' }} /></IconButton></Tooltip>
      </Box>

      {/* Table */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ height: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60, fontWeight: 700, bgcolor: '#f8fafc' }}>SNO.</TableCell>
                {columns.map(col => (
                  <TableCell key={col.key} sx={{ fontWeight: 700, bgcolor: '#f8fafc', minWidth: col.width || 150 }}>
                    {col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 50, bgcolor: '#f8fafc' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ color: '#64748b' }}>{row.sno}</TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      <TextField
                        fullWidth
                        variant="standard"
                        size="small"
                        value={row[col.key]}
                        onChange={(e) => handleChange(row.id, col.key, e.target.value)}
                        InputProps={{ 
                          disableUnderline: true,
                          sx: { 
                            fontSize: 13, 
                            p: '4px 8px',
                            borderRadius: '4px',
                            bgcolor: row[col.key] ? 'transparent' : '#fff9c4',
                            '&:focus-within': { bgcolor: '#e0f2fe' }
                          } 
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                      <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 1.5, bgcolor: '#0f172a', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button variant="contained" startIcon={<OrderIcon />} sx={{ bgcolor: '#334155', textTransform: 'none', px: 3 }}>Order</Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          sx={{ bgcolor: '#2563eb', textTransform: 'none', px: 3 }}
        >
          Save
        </Button>
        <Button variant="contained" startIcon={<CloseIcon />} onClick={() => appNavigate('/setup/accounts')} sx={{ bgcolor: '#ef4444', textTransform: 'none', px: 3 }}>Close</Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SetupGenericTablePage;
