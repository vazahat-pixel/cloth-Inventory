import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { applyStockAdjustment } from './inventorySlice';
import api from '../../services/api';

const StockInPage = ({
    pageTitle = 'Manual Stock IN',
    pageDescription = 'Scan variants and post inward quantity updates into the selected warehouse.',
    submitLabel = 'Record Stock IN',
    defaultNotes = 'Manual Stock IN',
    successMessage = 'Stock updated successfully',
}) => {
    const dispatch = useDispatch();
    const [storeId, setStoreId] = useState('');
    const [stores, setStores] = useState([]);
    const [barcode, setBarcode] = useState('');
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await api.get('/warehouses');
                const loaded = res.data.warehouses || res.data.data || [];
                setStores(loaded);
                if (!storeId && loaded.length > 0) {
                    setStoreId(loaded[0]._id || loaded[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch stores', err);
            }
        };
        fetchStores();
    }, []);

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        if (!barcode) return;

        try {
            const res = await api.get(`/products/barcode/${barcode}`);
            const product = res.data.product || res.data.data;

            if (product) {
                const existing = items.find(i => i._id === product._id);
                if (existing) {
                    setItems(items.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i));
                } else {
                    setItems([...items, { ...product, quantity: 1 }]);
                }
                setBarcode('');
                setError(null);
            }
        } catch (err) {
            setError('Product not found with this barcode');
        }
    };

    const handleSave = async () => {
        if (!storeId || items.length === 0) {
            setError('Please select a store and add at least one item');
            return;
        }

        try {
            for (const item of items) {
                await dispatch(applyStockAdjustment({
                    storeId,
                    productId: item._id,
                    quantityChange: item.quantity,
                    notes: notes || defaultNotes
                })).unwrap();
            }
            setSuccess(successMessage);
            setItems([]);
            setNotes('');
        } catch (err) {
            setError(err || 'Failed to update stock');
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom fontWeight="bold">{pageTitle}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                {pageDescription}
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select Warehouse / Store</InputLabel>
                                    <Select
                                        value={storeId}
                                        onChange={(e) => setStoreId(e.target.value)}
                                        label="Select Warehouse / Store"
                                    >
                                        {stores.map(s => (
                                            <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <form onSubmit={handleBarcodeSubmit}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Scan Barcode"
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        autoFocus
                                    />
                                </form>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />

                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSave}
                                    disabled={items.length === 0}
                                >
                                    {submitLabel}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>SKU</TableCell>
                                    <TableCell>Barcode</TableCell>
                                    <TableCell align="center">Quantity</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell>{item.barcode}</TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={item.quantity}
                                                onChange={(e) => setItems(items.map(i => i._id === item._id ? { ...i, quantity: parseInt(e.target.value) || 0 } : i))}
                                                sx={{ width: 80 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton color="error" onClick={() => setItems(items.filter(i => i._id !== item._id))}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            No items added. Scan a barcode to begin.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
};

// Simple Stack component since I used it above
const Stack = ({ children, spacing = 2 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing * 8}px` }}>
        {children}
    </div>
);

export default StockInPage;
