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
    MenuItem,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const StoreMasterPage = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        gstNumber: '',
        type: 'STORE',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contactNumber: '',
        status: 'Active',
        invoicePrefix: '',
        invoiceFooterText: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [editId, setEditId] = useState(null);

    const validateField = (name, value) => {
        let error = '';
        if (name === 'name' && !value.trim()) error = 'Store Name is required';
        if (name === 'contactNumber' && value && !/^\d{10}$/.test(value)) error = 'Phone must be exactly 10 digits';
        if (name === 'gstNumber' && value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value)) error = 'Invalid GST format';
        if (name === 'pincode' && value && !/^\d{6}$/.test(value)) error = 'Pincode must be 6 digits';
        if ((name === 'city' || name === 'state') && value && !/^[A-Za-z\s]+$/.test(value)) error = 'Only letters allowed';
        
        setFormErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/stores');
            setStores(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch stores');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (store = null) => {
        if (store) {
            setFormData({
                name: store.name,
                code: store.code || '',
                gstNumber: store.gstNumber || '',
                type: store.type || 'STORE',
                address: store.location?.address || store.address || '',
                city: store.location?.city || store.city || '',
                state: store.location?.state || store.state || '',
                pincode: store.location?.pincode || store.pincode || '',
                contactNumber: store.contactNumber || '',
                status: store.status || 'Active',
                invoicePrefix: store.invoicePrefix || '',
                invoiceFooterText: store.invoiceFooterText || ''
            });
            setEditId(store._id);
        } else {
            setFormData({ 
                name: '', code: '', gstNumber: '', type: 'STORE', address: '', 
                city: '', state: '', pincode: '', contactNumber: '', status: 'Active',
                invoicePrefix: '', invoiceFooterText: ''
            });
            setEditId(null);
        }
        setFormErrors({});
        setOpen(true);
    };

    const handleSave = async () => {
        // Final validation
        const errors = {};
        Object.keys(formData).forEach(key => {
            const err = validateField(key, formData[key]);
            if (err) errors[key] = err;
        });

        if (Object.values(errors).some(e => e)) {
            setFormErrors(errors);
            return;
        }

        const payload = {
            ...formData,
            location: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode
            }
        };

        try {
            if (editId) {
                await api.patch(`/stores/${editId}`, payload);
            } else {
                await api.post('/stores', payload);
            }
            setOpen(false);
            fetchData();
        } catch (err) {
            setError('Save failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this store?')) return;
        try {
            await api.delete(`/stores/${id}`);
            fetchData();
        } catch (err) {
            setError('Delete failed');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Store (Shop) Master</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} sx={{ borderRadius: '8px' }}>
                    New Store
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Store Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                        ) : stores.map((item) => (
                            <TableRow key={item._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.location?.city || item.city || '-'}</TableCell>
                                <TableCell>{item.contactNumber}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.status}
                                        size="small"
                                        color={item.status === 'Active' ? 'success' : 'default'}
                                        variant="outlined"
                                    />
                                </TableCell>
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
                <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Edit Store' : 'New Store'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Store Name *"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onBlur={(e) => validateField('name', e.target.value)}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                fullWidth
                                label="Store Code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="GST Number"
                                value={formData.gstNumber}
                                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                                onBlur={(e) => validateField('gstNumber', e.target.value)}
                                error={!!formErrors.gstNumber}
                                helperText={formErrors.gstNumber}
                            />
                        </Stack>
                        <TextField
                            fullWidth
                            select
                            label="Type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <MenuItem value="STORE">Retail Store</MenuItem>
                            <MenuItem value="WAREHOUSE">Warehouse</MenuItem>
                            <MenuItem value="FACTORY">Factory / Production</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            label="Contact Number"
                            value={formData.contactNumber}
                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                            onBlur={(e) => validateField('contactNumber', e.target.value)}
                            error={!!formErrors.contactNumber}
                            helperText={formErrors.contactNumber}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                fullWidth
                                label="City"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                onBlur={(e) => validateField('city', e.target.value)}
                                error={!!formErrors.city}
                                helperText={formErrors.city}
                            />
                            <TextField
                                fullWidth
                                label="State"
                                value={formData.state || ''}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                onBlur={(e) => validateField('state', e.target.value)}
                                error={!!formErrors.state}
                                helperText={formErrors.state}
                            />
                            <TextField
                                fullWidth
                                label="Pincode"
                                value={formData.pincode || ''}
                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                onBlur={(e) => validateField('pincode', e.target.value)}
                                error={!!formErrors.pincode}
                                helperText={formErrors.pincode}
                            />
                        </Stack>
                        <TextField
                            fullWidth
                            label="Complete Address"
                            multiline
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
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

                        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700, color: '#475569' }}>
                            Invoice Settings
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                fullWidth
                                label="Invoice Prefix (e.g. BPL)"
                                value={formData.invoicePrefix}
                                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                                placeholder="3 characters recommended"
                            />
                        </Stack>
                        <TextField
                            fullWidth
                            label="Invoice Footer Text"
                            multiline
                            rows={2}
                            value={formData.invoiceFooterText}
                            onChange={(e) => setFormData({ ...formData, invoiceFooterText: e.target.value })}
                            placeholder="e.g. Thank you for shopping with us!"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save Store</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StoreMasterPage;
