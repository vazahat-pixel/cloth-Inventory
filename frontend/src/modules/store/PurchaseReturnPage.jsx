import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
    Autocomplete,
    Box,
    Button,
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { addPurchaseReturn } from '../purchase/purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchStockOverview } from '../inventory/inventorySlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function PurchaseReturnPage() {
    const dispatch = useDispatch();
    const navigate = useAppNavigate();

    const warehouses = useSelector((state) => state.masters.warehouses || []);
    const stockRows = useSelector((state) => state.inventory.stock || []);
    const user = useSelector((state) => state.auth.user);

    const [date, setDate] = useState(getTodayDate());
    const [targetId, setTargetId] = useState(''); // The warehouse/factory returning to
    const [lines, setLines] = useState([]);
    const [variantPickerValue, setVariantPickerValue] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchStockOverview());
    }, [dispatch]);

    const activeWarehouses = useMemo(
        () => (warehouses || []).filter((w) => String(w.status).toLowerCase() === 'active'),
        [warehouses],
    );

    const myStoreStock = useMemo(() => {
        if (!user?.shopId) return stockRows;
        return stockRows.filter(s => s.storeId === user.shopId);
    }, [stockRows, user]);

    const variantOptions = useMemo(() => {
        return myStoreStock.map((s) => ({
            variantId: s.productId || s.variantId,
            itemName: s.itemName,
            sku: s.sku,
            barcode: s.barcode,
            size: s.size,
            color: s.color,
            available: s.quantity,
        })).filter(o => o.available > 0);
    }, [myStoreStock]);

    const filteredOptions = useMemo(() => {
        const ids = new Set(lines.map((l) => l.variantId));
        return variantOptions.filter((o) => !ids.has(o.variantId));
    }, [lines, variantOptions]);

    const addLine = () => {
        if (!variantPickerValue) return;
        const line = {
            ...variantPickerValue,
            quantity: 1,
        };
        setLines((prev) => [...prev, line]);
        setVariantPickerValue(null);
    };

    const updateQuantity = (variantId, val) => {
        setLines(prev => prev.map(l => {
            if (l.variantId !== variantId) return l;
            const q = Math.max(1, Math.min(Number(val), l.available));
            return { ...l, quantity: q };
        }));
    };

    const removeLine = (variantId) => {
        setLines(prev => prev.filter(l => l.variantId !== variantId));
    };

    const handleSave = () => {
        setError('');
        if (!targetId) {
            setError('Select target warehouse/factory.');
            return;
        }
        if (!lines.length) {
            setError('Add at least one item.');
            return;
        }

        const promises = lines.map(line => {
            const payload = {
                type: 'STORE_TO_FACTORY',
                storeId: user.shopId,
                productId: line.variantId,
                quantity: line.quantity,
                reason: remarks,
                destinationId: targetId
            };
            return dispatch(addPurchaseReturn(payload)).unwrap();
        });

        Promise.all(promises)
            .then(() => navigate('/inventory/stock-overview'))
            .catch(err => setError(err || 'Failed to process returns'));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
                    Back
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Store to Factory Return
                </Typography>
            </Stack>

            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Stack spacing={3}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            size="small"
                            label="Date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 200 }}
                        />
                        <Autocomplete
                            size="small"
                            options={activeWarehouses}
                            getOptionLabel={(o) => o.name || ''}
                            value={activeWarehouses.find((w) => w.id === targetId) || null}
                            onChange={(_, v) => setTargetId(v?.id || '')}
                            renderInput={(params) => <TextField {...params} label="Return to Warehouse" required />}
                            sx={{ minWidth: 250 }}
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <Autocomplete
                            size="small"
                            options={filteredOptions}
                            getOptionLabel={(o) => `${o.sku} | ${o.itemName} (${o.size}/${o.color}) - Avail: ${o.available}`}
                            value={variantPickerValue}
                            onChange={(_, v) => setVariantPickerValue(v)}
                            sx={{ flex: 1 }}
                            renderInput={(params) => <TextField {...params} label="Select Item from Stock" />}
                        />
                        <Button variant="contained" onClick={addLine} disabled={!variantPickerValue}>
                            Add Item
                        </Button>
                    </Stack>

                    {error && <Typography color="error">{error}</Typography>}

                    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell>Item Details</TableCell>
                                    <TableCell align="right">Available</TableCell>
                                    <TableCell align="right">Return Qty</TableCell>
                                    <TableCell align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lines.map((line) => (
                                    <TableRow key={line.variantId}>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.itemName}</Typography>
                                            <Typography variant="caption" color="textSecondary">{line.sku} | {line.size}/{line.color}</Typography>
                                        </TableCell>
                                        <TableCell align="right">{line.available}</TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={line.quantity}
                                                onChange={(e) => updateQuantity(line.variantId, e.target.value)}
                                                inputProps={{ style: { textAlign: 'right', width: 80 } }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton color="error" onClick={() => removeLine(line.variantId)}>
                                                <DeleteOutlineIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {lines.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            No items added yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TextField
                        label="Reason for Return"
                        multiline
                        rows={2}
                        fullWidth
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />

                    <Stack direction="row" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            startIcon={<SaveOutlinedIcon />}
                            onClick={handleSave}
                            sx={{ px: 4 }}
                        >
                            Submit Return
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}

export default PurchaseReturnPage;
