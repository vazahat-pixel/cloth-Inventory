import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
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
    Alert,
    CircularProgress,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const CounterMasterPage = () => {
    const [counters, setCounters] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        storeId: '',
        status: 'Active'
    });
    const [editId, setEditId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [counterRes, storeRes] = await Promise.all([
                api.get('/counters'),
                api.get('/stores')
            ]);
            setCounters(counterRes.data.data || []);
            setStores(storeRes.data.data || []);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (counter = null) => {
        if (counter) {
            setFormData({
                name: counter.name,
                code: counter.code || '',
                storeId: counter.storeId?._id || '',
                status: counter.status || 'Active'
            });
            setEditId(counter._id);
        } else {
            setFormData({ name: '', code: '', storeId: '', status: 'Active' });
            setEditId(null);
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await api.patch(`/counters/${editId}`, formData);
            } else {
                await api.post('/counters', formData);
            }
            setOpen(false);
            fetchData();
        } catch (err) {
            setError('Save failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this counter?')) return;
        try {
            await api.delete(`/counters/${id}`);
            fetchData();
        } catch (err) {
            setError('Delete failed');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Counter Master</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '8px' }}>
                    New Counter
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Counter Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                        ) : counters.map((item) => (
                            <TableRow key={item._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.storeId?.name}</TableCell>
                                <TableCell>{item.status}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpen(item)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(item._id)}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Edit Counter' : 'New Counter'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Counter Name"
                            placeholder="e.g. POS-1"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Counter Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Store"
                            value={formData.storeId}
                            onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                        >
                            {stores.map((store) => (
                                <MenuItem key={store._id} value={store._id}>{store.name}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save Counter</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CounterMasterPage;
