import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../services/api';

const FormulaPage = () => {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    formula: '',
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/setup/formula');
      const data = response.data;
      setFormulas(data.data || data.formulas || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch formulas';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (formula = null) => {
    if (formula) {
      setFormData({
        name: formula.name || '',
        formula: formula.formula || '',
        isActive: formula.isActive !== false,
      });
      setEditId(formula._id);
    } else {
      setFormData({
        name: '',
        formula: '',
        isActive: true,
      });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Formula name is required');
        return;
      }
      if (!formData.formula.trim()) {
        setError('Formula text is required');
        return;
      }

      if (editId) {
        await api.put(`/setup/formula/${editId}`, formData);
      } else {
        await api.post('/setup/formula', formData);
      }

      setOpen(false);
      setError('');
      fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Save failed';
      setError(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this formula?')) return;
    try {
      await api.delete(`/setup/formula/${id}`);
      fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Delete failed';
      setError(message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Formula Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '8px' }}>
          Add Formula
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Formula</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : formulas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No formulas found</TableCell>
              </TableRow>
            ) : (
              formulas.map((formula) => (
                <TableRow key={formula._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{formula.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{formula.formula}</TableCell>
                  <TableCell>{formula.isActive !== false ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleOpen(formula)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(formula._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Edit Formula' : 'Add Formula'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Formula Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Formula Template"
              multiline
              rows={3}
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              helperText="Example: {fabric} {design} {shade} - {itemCode}"
            />
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormulaPage;
