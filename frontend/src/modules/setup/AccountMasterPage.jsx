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

const AccountMasterPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'ASSET',
        groupId: '',
        openingBalance: 0,
        description: ''
    });
    const [editId, setEditId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, groupRes] = await Promise.all([
                api.get('/account-master'),
                api.get('/account-groups')
            ]);
            setAccounts(accRes.data.data.accounts || []);
            setGroups(groupRes.data.data || []);
        } catch (err) {
            setError('Failed to fetch accounts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (acc = null) => {
        if (acc) {
            setFormData({
                name: acc.name,
                code: acc.code || '',
                type: acc.type || 'ASSET',
                groupId: acc.groupId?._id || '',
                openingBalance: acc.openingBalance || 0,
                description: acc.description || ''
            });
            setEditId(acc._id);
        } else {
            setFormData({ name: '', code: '', type: 'ASSET', groupId: '', openingBalance: 0, description: '' });
            setEditId(null);
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editId) {
                await api.patch(`/account-master/${editId}`, formData);
            } else {
                await api.post('/account-master', formData);
            }
            setOpen(false);
            fetchData();
        } catch (err) {
            setError('Save failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this account?')) return;
        try {
            await api.delete(`/account-master/${id}`);
            fetchData();
        } catch (err) {
            setError('Delete failed');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Account Master</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    New Account
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

            <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Balance</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                        ) : accounts.map((acc) => (
                            <TableRow key={acc._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{acc.name}</TableCell>
                                <TableCell>{acc.groupId?.name}</TableCell>
                                <TableCell>{acc.type}</TableCell>
                                <TableCell>{acc.openingBalance}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpen(acc)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(acc._id)}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editId ? 'Edit Account' : 'New Account'}</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Account Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Account Group"
                            value={formData.groupId}
                            onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                        >
                            {groups.map((group) => (
                                <MenuItem key={group._id} value={group._id}>{group.name}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            select
                            label="Account Type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            {['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'].map((t) => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            type="number"
                            label="Opening Balance"
                            value={formData.openingBalance}
                            onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccountMasterPage;
