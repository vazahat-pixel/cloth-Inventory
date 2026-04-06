import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { updateChallan } from './dispatchSlice';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
    Autocomplete,
    Box,
    Button,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { addChallan } from './dispatchSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchWarehouseStock } from '../inventory/inventorySlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function DeliveryChallanForm({
    listPath = '/orders/delivery-challan',
    pageTitle = 'New Delivery Challan',
    saveLabel = 'Save Challan',
}) {
    const dispatch = useDispatch();
    const navigate = useAppNavigate();

    const [date, setDate] = useState(getTodayDate());
    const [sourceId, setSourceId] = useState('');
    const [storeId, setStoreId] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [lines, setLines] = useState([]);
    const [variantPickerValue, setVariantPickerValue] = useState(null);
    const [error, setError] = useState('');

    const warehouses = useSelector((state) => state.masters.warehouses || []);
    const stores = useSelector((state) => state.masters.stores || []);
    const stockRows = useSelector((state) => state.inventory.stock || []);


    useEffect(() => {
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchMasters('stores'));
    }, [dispatch]);

    useEffect(() => {
        if (sourceId) {
            dispatch(fetchWarehouseStock(sourceId));
        }
    }, [dispatch, sourceId]);


    const activeLocations = useMemo(
        () => [...warehouses, ...stores].filter((w) => String(w.status || w.isActive).toLowerCase() !== 'false'),
        [warehouses, stores],
    );


    const warehouseStock = useMemo(() => {
        if (!sourceId) return [];
        // When using fetchWarehouseStock, stockRows already contains normalized items for that specific warehouse
        return stockRows;
    }, [stockRows, sourceId]);

    const variantOptions = useMemo(() => {
        const flattened = [];
        const items = Array.isArray(stockRows) ? stockRows : (Array.isArray(stockRows?.items) ? stockRows.items : []);
        
        items.forEach(item => {
            if (item.type === 'FABRIC') return;

            if (item.sizes && Array.isArray(item.sizes)) {
                item.sizes.forEach(sz => {
                    if (Number(sz.stock || 0) > 0) {
                        flattened.push({
                            variantId: sz._id,
                            itemId: item._id || item.id,
                            itemName: item.itemName,
                            itemCode: item.itemCode,
                            itemType: item.type,
                            sku: sz.sku || sz.barcode || item.itemCode,
                            barcode: sz.barcode || sz.sku || '',
                            size: sz.size || '-',
                            color: item.shade || sz.color || '-',
                            available: Number(sz.stock),
                            mrp: Number(sz.mrp || item.salePrice || 0),
                            gstPercent: Number(item.hsCodeId?.gstPercent || item.gstPercent || 0)
                        });
                    }
                });
            }
        });

        return flattened;
    }, [stockRows]);

    const filteredOptions = useMemo(() => {
        const ids = new Set(lines.map((l) => l.variantId));
        return variantOptions.filter((o) => !ids.has(o.variantId));
    }, [lines, variantOptions]);

    const handleScanner = async (code) => {
        if (!code) return;
        if (!sourceId) { setError("Select source warehouse first"); return; }
        
        // 1. LOCAL SEARCH FIRST (for immediate performance)
        const localMatch = variantOptions.find(o => 
            String(o.sku).toLowerCase() === String(code).toLowerCase() || 
            String(o.barcode).toLowerCase() === String(code).toLowerCase() ||
            String(o.variantId).toLowerCase() === String(code).toLowerCase()
        );

        if (localMatch) {
            const existing = lines.find(l => l.variantId === localMatch.variantId);
            if (existing) {
                updateQuantity(existing.variantId, existing.quantity + 1);
            } else {
                setLines(prev => [...prev, { ...localMatch, quantity: 1, barcode: localMatch.sku }]);
            }
            setError(''); // Clear error if was previously shown
            return;
        }

        // 2. REMOTE FALLBACK (in case inventory wasn't fully pre-loaded/refreshed)
        try {
            const res = await api.get(`/inventory/warehouse/${sourceId}/scan/${code}`);
            const item = res.data.data || res.data;
            
            if (item) {
                if (item.itemId?.type === 'FABRIC' || item.itemType === 'FABRIC') {
                    setError("Fabric items cannot be transferred to store. They are for production use only.");
                    return;
                }
                const newLine = {
                    itemId: item.itemId?._id || item.itemId,
                    variantId: item.variantId,
                    barcode: item.barcode,
                    itemName: item.itemId?.itemName || 'Item',
                    itemCode: item.itemId?.itemCode || '',
                    sku: item.barcode,
                    size: item.size || item.variantId?.size || '-',
                    color: item.color || item.variantId?.color || '-',
                    available: item.quantity,
                    quantity: 1,
                    mrp: item.rate || item.mrp || 0,
                    gstPercent: Number(item.gstPercent || item.itemId?.hsCodeId?.gstPercent || 0)
                };
                setLines(prev => [...prev, newLine]);
                setError('');
            }
        } catch (err) {
            setError("Item not found in source warehouse or invalid barcode");
        }
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

    const dispatchMode = useMemo(() => {
        if (!sourceId || !storeId) return null;
        const src = activeLocations.find(l => l.id === sourceId);
        const dst = activeLocations.find(l => l.id === storeId);
        
        if (!src || !dst) return null;
        
        const srcGst = (src.gstNumber || '').trim().toUpperCase();
        const dstGst = (dst.gstNumber || '').trim().toUpperCase();
        
        if (srcGst === dstGst) {
            return { type: 'CHALLAN', label: 'Delivery Challan', color: 'info.main', description: 'Same GSTIN: Internal Stock Transfer.' };
        } else {
            return { type: 'INVOICE', label: 'Tax Invoice', color: 'success.main', description: 'Different GSTIN: Inter-Entity Sale (Taxable).' };
        }
    }, [activeLocations, sourceId, storeId]);

    const activeStore = useMemo(() => stores.find(s => s.id === storeId || s._id === storeId), [stores, storeId]);
    const discountPct = activeStore?.transferDiscountPct || 0;

    const totals = useMemo(() => {
        const grossSubtotal = lines.reduce((acc, l) => acc + ((l.mrp || 0) * l.quantity), 0);
        const discountAmount = (grossSubtotal * discountPct) / 100;
        const taxableValue = grossSubtotal - discountAmount;
        
        const isInvoice = dispatchMode?.type === 'INVOICE';
        
        // Exact Tax Calculation: Summing up item-wise tax after discount
        const taxAmount = lines.reduce((acc, l) => {
            if (!isInvoice) return 0;
            const itemGross = (l.mrp || 0) * l.quantity;
            const itemDiscount = (itemGross * discountPct) / 100;
            const itemTaxable = itemGross - itemDiscount;
            const itemTax = (itemTaxable * (l.gstPercent || 0)) / 100;
            return acc + itemTax;
        }, 0);
        
        return {
            grossSubtotal,
            discountAmount,
            taxableValue,
            taxAmount,
            grandTotal: taxableValue + taxAmount
        };
    }, [lines, dispatchMode, discountPct]);

    const { id } = useParams();
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            api.get(`/dispatch/${id}`).then(res => {
                const data = res.data.dispatch || res.data.data;
                if (data) {
                    setDate(data.dispatchedAt ? new Date(data.dispatchedAt).toISOString().slice(0, 10) : getTodayDate());
                    setSourceId(data.sourceWarehouseId?._id || data.sourceWarehouseId || '');
                    setStoreId(data.destinationStoreId?._id || data.destinationStoreId || '');
                    setVehicleNumber(data.vehicleNumber || '');
                    setDriverName(data.driverName || '');
                    
                    if (data.items && Array.isArray(data.items)) {
                        const prefilledLines = data.items.map(item => ({
                            variantId: item.variantId?._id || item.variantId,
                            itemName: item.variantId?.name || '-',
                            sku: item.variantId?.sku || item.variantId?.barcode || '-',
                            size: item.variantId?.size || '-',
                            color: item.variantId?.color || '-',
                            available: Number(item.qty), // Treat currently booked qty as available for editing
                            quantity: Number(item.qty),
                            rate: Number(item.variantId?.salePrice || item.rate || 0)
                        }));
                        setLines(prefilledLines);
                    }
                }
            }).catch(err => {
                setError("Failed to load dispatch details for editing.");
            });
        }
    }, [id]);

    const handleSave = (status = 'SENT') => {
        setError('');
        if (!sourceId) { setError("Please select a source warehouse"); return; }
        if (!storeId) { setError("Please select a destination store"); return; }
        if (sourceId === storeId) { setError("Source and destination cannot be same"); return; }
        if (!lines.length) { setError("Add at least one item to dispatch"); return; }

        const payload = {
            dcDate: date,
            sourceId: sourceId,
            destinationStoreId: storeId,
            vehicleNumber,
            driverName,
            items: lines.map(l => ({
                itemId: l.itemId,
                variantId: l.variantId,
                barcode: l.barcode,
                quantity: l.quantity,
                rate: l.rate
            })),
            status: status, // DRAFT or SENT
            type: 'WAREHOUSE_TO_STORE',
            notes: `Dispatch of ${lines.length} items to store.`
        };

        const action = isEditMode ? updateChallan({ id, data: payload }) : addChallan(payload);
        
        dispatch(action)
            .unwrap()
            .then((res) => {
                alert(`Successfully ${isEditMode ? 'updated' : 'generated'} Challan (#${res.dcNumber || res.data?.dcNumber || ''})`);
                navigate(listPath);
            })
            .catch(err => setError(err || "Failed to save challan"));
    };

    return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listPath)}>
                    Back
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', flex: 1 }}>
                    {pageTitle}
                </Typography>
            </Stack>

            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        size="small"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <FormControl fullWidth size="small">
                        <InputLabel>Source Warehouse</InputLabel>
                        <Select
                            value={sourceId}
                            label="Source Warehouse"
                            onChange={(e) => {
                                setSourceId(e.target.value);
                                setLines([]);
                            }}
                        >
                            <MenuItem value="">Select Warehouse</MenuItem>
                            {warehouses.filter(w => String(w.status || w.isActive).toLowerCase() !== 'false').map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name || s.warehouseName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Destination Store</InputLabel>
                        <Select
                            value={storeId}
                            label="Destination Store"
                            onChange={(e) => setStoreId(e.target.value)}
                        >
                            <MenuItem value="">Select Store</MenuItem>
                            {stores.filter(s => String(s.status || s.isActive).toLowerCase() !== 'false').map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name || s.storeName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

                {dispatchMode && (
                    <Box sx={{ p: 2, bgcolor: `${dispatchMode.color}05`, border: `1px solid ${dispatchMode.color}`, borderRadius: 2 }}>
                        <Typography sx={{ color: dispatchMode.color, fontWeight: 700, fontSize: '0.85rem' }}>
                            {dispatchMode.label.toUpperCase()} MODE DETECTED
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569' }}>
                            {dispatchMode.description}
                        </Typography>
                    </Box>
                )}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        label="Vehicle Number"
                        fullWidth
                        size="small"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                    />
                    <TextField
                        label="Driver Name"
                        fullWidth
                        size="small"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                    />
                </Stack>

                <Divider />

                <Typography variant="h6">Items to Dispatch</Typography>
                <Stack direction="row" spacing={2}>
                    <TextField 
                        fullWidth size="small"
                        placeholder="⚡ Fast Scan: Scan item barcode or type SKU..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleScanner(e.target.value);
                                e.target.value = '';
                            }
                        }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1, color: '#3b82f6', fontWeight: 700 }}>🔍</Typography>,
                            sx: { bgcolor: '#eff6ff', border: '1px dashed #3b82f6' }
                        }}
                        helperText="Press Enter after scanning or typing."
                    />
                    <Autocomplete
                        size="small"
                        options={filteredOptions}
                        getOptionLabel={(o) => `${o.sku} | ${o.itemName} (${o.size}/${o.color}) - Stock: ${o.available}`}
                        value={variantPickerValue}
                        onChange={(_, v) => v && handleScanner(v.sku)}
                        sx={{ flex: 1.5 }}
                        renderInput={(params) => <TextField {...params} label="Manual Search" />}
                        isOptionEqualToValue={(option, value) => option.variantId === value.variantId}
                    />
                </Stack>

                {error && <Typography color="error">{error}</Typography>}

                <TableContainer border="1px solid #e2e8f0" borderRadius={1}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell align="right">MRP</TableCell>
                                <TableCell align="right">Available</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lines.map((l) => (
                                <TableRow key={l.variantId}>
                                    <TableCell>{l.itemName} ({l.size}/{l.color})</TableCell>
                                    <TableCell>{l.sku}</TableCell>
                                    <TableCell align="right">₹{(l.mrp || 0).toLocaleString()}</TableCell>
                                    <TableCell align="right">{l.available}</TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={l.quantity}
                                            onChange={(e) => updateQuantity(l.variantId, e.target.value)}
                                            inputProps={{ style: { textAlign: 'right', width: 80 } }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="error" onClick={() => removeLine(l.variantId)}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {lines.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        No items added.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {(dispatchMode?.type === 'INVOICE' || lines.length > 0) && (
                    <Box sx={{ alignSelf: 'flex-end', width: { xs: '100%', md: 300 }, textAlign: 'right' }}>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography color="text.secondary">Gross Subtotal:</Typography>
                                <Typography sx={{ fontWeight: 600 }}>₹{totals.grossSubtotal.toLocaleString()}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography color="text.secondary">Discount ({discountPct}%):</Typography>
                                <Typography sx={{ fontWeight: 600, color: '#ec4899' }}>-₹{totals.discountAmount.toLocaleString()}</Typography>
                            </Stack>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography color="text.secondary">Taxable Value:</Typography>
                                <Typography sx={{ fontWeight: 600 }}>₹{totals.taxableValue.toLocaleString()}</Typography>
                            </Stack>
                            {dispatchMode?.type === 'INVOICE' && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Total GST (Item-wise):</Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#10b981' }}>+₹{totals.taxAmount.toLocaleString()}</Typography>
                                </Stack>
                            )}
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Total Value:</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                    ₹{totals.grandTotal.toLocaleString()}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                )}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate(listPath)}>Cancel</Button>
                
                {/* Dual Mode Buttons: Save as Draft vs Save & Dispatch */}
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => handleSave('DRAFT')}
                    sx={{ borderColor: 'secondary.main', color: 'secondary.main', fontWeight: 700 }}
                >
                    Save as Draft
                </Button>

                <Button 
                    variant="contained" 
                    startIcon={<SaveOutlinedIcon />} 
                    onClick={() => handleSave('SENT')}
                    sx={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', fontWeight: 700 }}
                >
                    Save & Send (Issue DC)
                </Button>
            </Stack>
        </Paper>
    );
}

const Divider = () => <Box sx={{ borderBottom: '1px dashed #e2e8f0', my: 1 }} />;

export default DeliveryChallanForm;
