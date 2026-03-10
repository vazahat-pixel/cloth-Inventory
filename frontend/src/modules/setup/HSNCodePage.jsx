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
    Tooltip,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const HSNCodePage = () => {
    const [hsns, setHsns] = useState([]);
    const [gstSlabs, setGstSlabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        gstSlabId: ''
    });
    const [editId, setEditId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [hsnRes, gstRes] = await Promise.all([
                api.get('/hsn-codes'),
                api.get('/gst')
            ]);
            setHsns(hsnRes.data.data.hsns || []);
            setGstSlabs(gstRes.data.data.slabs || []);
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (hsn = null) => {
        if (hsn) {
            setFormData({
                code: hsn.code,
                description: hsn.description || '',
                gstSlabId: hsn.gstSlabId?._id || ''
            });
            setEditId(hsn._id);
        } else {
            setFormData({ code: '', description: '', gstSlabId: '' });
            setEditId(null);
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await api.patch(`/hsn-codes/${editId}`, formData);
            } else {
                await api.post('/hsn-codes', formData);
            }
            setOpen(false);
            fetchData();
        } catch (err) {
            setError('Save failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/hsn-codes/${id}`);
            fetchData();
        } catch (err) {
            setError('Delete failed');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>HSN Code Master</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '8px' }}>
                    Add HSN Code
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>HSN Code</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>GST %</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                        ) : hsns.length === 0 ? (
                            <TableRow><TableCell colSpan={4} align="center">No records found</TableCell></TableRow>
                        ) : hsns.map((hsn) => (
                            <TableRow key={hsn._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{hsn.code}</TableCell>
                                <TableCell>{hsn.description}</TableCell>
                                <TableCell>{hsn.gstSlabId?.percentage}% ({hsn.gstSlabId?.name})</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" color="primary" onClick={() => handleOpen(hsn)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(hsn._id)}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editId ? 'Edit HSN Code' : 'Add New HSN Code'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="HSN Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            select
                            label="GST Slab"
                            value={formData.gstSlabId}
                            onChange={(e) => setFormData({ ...formData, gstSlabId: e.target.value })}
                        >
                            {gstSlabs.map((slab) => (
                                <MenuItem key={slab._id} value={slab._id}>
                                    {slab.name} ({slab.percentage}%)
                                </MenuItem>
                            ))}
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

export default HSNCodePage;
