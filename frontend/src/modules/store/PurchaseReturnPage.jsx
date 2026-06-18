import { useEffect, useMemo, useState, useRef } from 'react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
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
    InputAdornment,
    Chip,
    CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { initiateStockReturn, fetchStockReturns } from '../inventory/stockReturnSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchStockOverview } from '../inventory/inventorySlice';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationProvider';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function PurchaseReturnPage() {
    const dispatch = useDispatch();
    const navigate = useAppNavigate();
    const { showNotification } = useNotification();

    const warehouses = useSelector((state) => state.masters.warehouses || []);
    const stockRows = useSelector((state) => state.inventory.storeStock || state.inventory.stock || []);
    const user = useSelector((state) => state.auth.user);
    const returns = useSelector((state) => state.stockReturn.returns || []);
    const returnsLoading = useSelector((state) => state.stockReturn.loading);

    const [date, setDate] = useState(getTodayDate());
    const [targetId, setTargetId] = useState(''); // The warehouse/factory returning to
    const [lines, setLines] = useState([]);
    const [variantPickerValue, setVariantPickerValue] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const barcodeInputRef = useRef(null);
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');
    const [qtyDraft, setQtyDraft] = useState({});

    useEffect(() => {
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchStockOverview());
        dispatch(fetchStockReturns());
    }, [dispatch]);

    const activeWarehouses = useMemo(
        () => (warehouses || []).filter((w) => String(w.status).toLowerCase() === 'active'),
        [warehouses],
    );

    const myStoreStock = useMemo(() => {
        if (!user?.shopId) return stockRows;
        return stockRows.filter(s => String(s.storeId) === String(user.shopId) || String(s.warehouseId) === String(user.shopId));
    }, [stockRows, user]);

    const variantOptions = useMemo(() => {
        return myStoreStock.map((s) => ({
            productId: s.productId || s.itemId?._id || s.itemId?.id,
            variantId: s.variantId || s.productId,
            itemName: s.itemName || s.itemId?.itemName || 'Item',
            itemCode: s.itemCode || s.styleCode || s.sku || '',
            sku: s.itemCode || s.sku || s.barcode || '',
            barcode: s.barcode || s.itemCode || s.sku || '',
            size: s.size,
            color: s.color,
            available: s.available ?? s.quantity ?? s.availableStock ?? 0,
        })).filter((o) => o.variantId && o.available > 0);
    }, [myStoreStock]);

    const filteredOptions = useMemo(() => {
        const ids = new Set(lines.map((l) => l.variantId));
        return variantOptions.filter((o) => !ids.has(o.variantId));
    }, [lines, variantOptions]);

    const addLine = (val) => {
        const item = val || variantPickerValue;
        if (!item) return;
        setLines((prev) => {
            const existing = prev.find((line) => line.variantId === item.variantId);
            if (existing) {
                const nextQty = Math.min(existing.quantity + 1, item.available);
                if (nextQty === existing.quantity) {
                    setError(`Cannot add more than available stock (${item.available}) for ${item.itemName}.`);
                }
                return prev.map((line) =>
                    line.variantId === item.variantId ? { ...line, quantity: nextQty } : line
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        setVariantPickerValue(null);
    };

    const handleBarcodeAdd = async (scannedValue) => {
        const rawCode = typeof scannedValue === 'string' ? scannedValue : barcodeInput;
        const scannedCode = (rawCode || '').trim().toLowerCase();
        if (!scannedCode) return;

        setError('');

        let matched = variantOptions.find(
            (o) =>
                (o.barcode && String(o.barcode).toLowerCase() === scannedCode) ||
                (o.sku && String(o.sku).toLowerCase() === scannedCode) ||
                (o.itemCode && String(o.itemCode).toLowerCase() === scannedCode)
        );

        if (!matched && user?.shopId) {
            // API Fallback for fetching item from backend directly
            try {
                const response = await api.get(`/sales/barcode/${scannedCode}?storeId=${user.shopId}`);
                const product = response.data.product || response.data.data;
                if (product) {
                    matched = {
                        productId: product.productId || product._id,
                        variantId: product.variantId || product._id,
                        itemName: product.name || 'Unknown Item',
                        itemCode: product.sku || '',
                        size: product.size || '',
                        color: product.color || '',
                        sku: product.sku || '',
                        barcode: product.barcode || '',
                        available: product.available || 0,
                    };
                }
            } catch (err) {
                console.warn('API fallback error for barcode:', err);
            }
        }

        if (!matched) {
            setError(`Item with barcode/SKU "${rawCode}" not found or has no available stock in this store.`);
            showNotification(`Item "${rawCode}" not found or no stock available.`, 'error');
            return;
        }

        setLines((prev) => {
            const existing = prev.find((line) => line.variantId === matched.variantId);
            if (existing) {
                const nextQty = Math.min(existing.quantity + 1, matched.available);
                if (nextQty === existing.quantity) {
                    setError(`Cannot add more than available stock (${matched.available}) for ${matched.itemName}.`);
                }
                return prev.map((line) =>
                    line.variantId === matched.variantId ? { ...line, quantity: nextQty } : line
                );
            }
            return [...prev, { ...matched, quantity: 1 }];
        });

        setBarcodeInput('');
        setTimeout(() => {
            barcodeInputRef.current?.focus();
        }, 10);
    };

    const updateQuantity = (variantId, val) => {
        if (val === '' || val === '-') {
            setQtyDraft((prev) => ({ ...prev, [variantId]: val }));
            return;
        }
        const parsed = Number(val);
        if (!Number.isFinite(parsed)) return;
        setQtyDraft((prev) => {
            const next = { ...prev };
            delete next[variantId];
            return next;
        });
        setLines((prev) => prev.map((l) => {
            if (l.variantId !== variantId) return l;
            const q = Math.max(1, Math.min(parsed, l.available));
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

        const payload = {
            sourceStoreId: user.shopId,
            destinationWarehouseId: targetId,
            items: lines.map(line => ({
                variantId: line.variantId,
                qty: line.quantity
            })),
            reason: remarks
        };

        dispatch(initiateStockReturn(payload))
            .unwrap()
            .then(() => {
                setLines([]);
                setRemarks('');
                setTargetId('');
                setError('');
                dispatch(fetchStockReturns());
                dispatch(fetchStockOverview());
            })
            .catch(err => setError(err || 'Failed to initiate return'));
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
                            value={activeWarehouses.find((w) => (w.id || w._id) === targetId) || null}
                            onChange={(_, v) => setTargetId(v?.id || v?._id || '')}
                            renderInput={(params) => <TextField {...params} label="Return to Warehouse" required />}
                            sx={{ minWidth: 250 }}
                        />
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            size="small"
                            label="Barcode / SKU"
                            inputRef={barcodeInputRef}
                            autoFocus
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleBarcodeAdd(e.target.value);
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <QrCodeScannerIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ flex: 1 }}
                            placeholder="Scan or type barcode/SKU and press Enter"
                        />
                        <Button variant="contained" onClick={() => handleBarcodeAdd(barcodeInput)} sx={{ minWidth: 120 }}>
                            Scan Add
                        </Button>
                    </Stack>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Autocomplete
                            size="small"
                            options={filteredOptions}
                            getOptionLabel={(o) => `${o.sku} | ${o.itemName} (${o.size}/${o.color}) - Avail: ${o.available}`}
                            value={variantPickerValue}
                            onChange={(_, v) => {
                                setVariantPickerValue(v);
                                if (v) {
                                    addLine(v);
                                }
                            }}
                            sx={{ flex: 1 }}
                            renderInput={(params) => <TextField {...params} label="Select Item from Stock Manually" />}
                        />
                        <Button variant="outlined" onClick={() => addLine()} disabled={!variantPickerValue} sx={{ minWidth: 120 }}>
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
                                                value={qtyDraft[line.variantId] ?? line.quantity}
                                                onChange={(e) => updateQuantity(line.variantId, e.target.value)}
                                                onBlur={() => setQtyDraft((prev) => {
                                                    const next = { ...prev };
                                                    delete next[line.variantId];
                                                    return next;
                                                })}
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

            {/* Returns History Section */}
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 4, mb: 2 }}>
                Recent Returns History
            </Typography>
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                {returnsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : returns.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Return Number</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Destination Warehouse</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Items Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {returns.map((row) => {
                                    const totalQty = row.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
                                    return (
                                        <TableRow key={row._id || row.id} hover>
                                            <TableCell>
                                                {row.initiatedAt ? formatDateDDMMYYYY(row.initiatedAt) : formatDateDDMMYYYY(row.createdAt)}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>
                                                {row.returnNumber}
                                            </TableCell>
                                            <TableCell>
                                                {row.destinationWarehouseId?.name || 'Warehouse'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                {totalQty} Pcs
                                            </TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>
                                                {row.reason || '--'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.status === 'DISPATCHED' ? 'IN TRANSIT' : row.status}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: row.status === 'RECEIVED' ? '#dcfce7' : '#eff6ff', 
                                                        color: row.status === 'RECEIVED' ? '#166534' : '#1e40af', 
                                                        fontWeight: 700, 
                                                        fontSize: 10 
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography align="center" color="textSecondary" sx={{ py: 2 }}>
                        No stock returns initiated yet.
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}

export default PurchaseReturnPage;
