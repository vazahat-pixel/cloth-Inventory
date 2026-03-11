import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
    Autocomplete,
    Box,
    Button,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { addPurchaseOrder, updatePurchaseOrder } from './purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const calculateLine = (line) => {
    const qty = toNumber(line.quantity);
    const rate = toNumber(line.rate);
    const disc = toNumber(line.discount);
    const tax = toNumber(line.tax);
    const gross = qty * rate;
    const discAmt = (gross * disc) / 100;
    const taxable = gross - discAmt;
    const taxAmt = (taxable * tax) / 100;
    return { gross, discAmt, taxAmt, amount: taxable + taxAmt };
};

const calculateTotals = (items) => {
    const s = items.reduce(
        (acc, l) => {
            const lt = calculateLine(l);
            acc.totalQuantity += toNumber(l.quantity);
            acc.grossAmount += lt.gross;
            acc.lineDiscount += lt.discAmt;
            acc.taxAmount += lt.taxAmt;
            return acc;
        },
        { totalQuantity: 0, grossAmount: 0, lineDiscount: 0, taxAmount: 0 },
    );
    s.netAmount = s.grossAmount - s.lineDiscount + s.taxAmount;
    return s;
};

function PurchaseOrderFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useAppNavigate();

    const purchaseOrders = useSelector((state) => state.purchase.orders || []);
    const suppliers = useSelector((state) => state.masters.suppliers || []);
    const warehouses = useSelector((state) => state.masters.warehouses || []);
    const items = useSelector((state) => state.items.records || []);

    const existing = useMemo(
        () => (isEdit ? purchaseOrders.find((o) => o.id === id) : null),
        [id, isEdit, purchaseOrders],
    );

    const [date, setDate] = useState(getTodayDate());
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [lines, setLines] = useState([]);
    const [variantPickerValue, setVariantPickerValue] = useState(null);
    const [formError, setFormError] = useState('');

    const activeSuppliers = useMemo(
        () => (suppliers || []).filter((s) => String(s.status).toLowerCase() === 'active'),
        [suppliers],
    );

    const activeWarehouses = useMemo(
        () => (warehouses || []).filter((w) => String(w.status).toLowerCase() === 'active'),
        [warehouses],
    );

    const variantOptions = useMemo(() => {
        return (items || []).map((v) => ({
            variantId: v.id,
            itemName: v.name,
            styleCode: v.sku || '',
            size: v.size || '',
            color: v.color || '',
            sku: v.barcode || v.sku || '',
            itemId: v.id,
            category: v.category,
            baseRate: v.salePrice ?? v.sellingPrice ?? v.mrp ?? 0
        }));
    }, [items]);

    const filteredOptions = useMemo(() => {
        const ids = new Set(lines.map((l) => l.variantId));
        return variantOptions.filter((o) => !ids.has(o.variantId));
    }, [lines, variantOptions]);

    const totals = useMemo(() => calculateTotals(lines), [lines]);

    useEffect(() => {
        dispatch(fetchMasters('suppliers'));
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchItems());
    }, [dispatch]);

    useEffect(() => {
        if (!existing) {
            setDate(getTodayDate());
            setSupplierId('');
            setWarehouseId(activeWarehouses.length === 1 ? activeWarehouses[0].id : (activeWarehouses.length > 0 ? activeWarehouses[0].id : ''));
            setLines([]);
            return;
        }
        setDate(existing.orderDate || existing.date || getTodayDate());
        setSupplierId(existing.supplierId || '');
        setWarehouseId(existing.warehouseId || '');
        setLines(
            (existing.items || []).map((it, idx) => ({
                id: `${it.variantId}-${idx}`,
                ...it,
            })),
        );
    }, [existing, activeWarehouses]);

    const addLine = () => {
        if (!variantPickerValue) return;
        const rate = toNumber(variantPickerValue.baseRate);
        const line = {
            id: `${variantPickerValue.variantId}-${Date.now()}`,
            variantId: variantPickerValue.variantId,
            itemName: variantPickerValue.itemName,
            styleCode: variantPickerValue.styleCode,
            size: variantPickerValue.size,
            color: variantPickerValue.color,
            sku: variantPickerValue.sku,
            quantity: 1,
            rate,
            discount: 0,
            tax: 0,
            amount: rate,
        };
        setLines((prev) => [...prev, line]);
        setVariantPickerValue(null);
    };

    const updateLineField = (lineId, field, value) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l.id !== lineId) return l;
                return { ...l, [field]: value };
            }),
        );
    };

    const removeLine = (lineId) => {
        setLines((prev) => prev.filter((l) => l.id !== lineId));
    };

    const handleSave = () => {
        setFormError('');
        if (!supplierId) {
            setFormError('Select a supplier.');
            return;
        }
        if (!warehouseId) {
            setFormError('Select a warehouse.');
            return;
        }
        if (!lines.length) {
            setFormError('Add at least one item.');
            return;
        }

        const payload = {
            poDate: date,
            supplierId,
            storeId: warehouseId,
            items: lines.map((l) => ({
                productId: l.variantId,
                quantity: toNumber(l.quantity),
                rate: toNumber(l.rate),
            })),
            notes: '', // Optional notes
            status: existing?.status || 'DRAFT',
        };

        if (isEdit) {
            dispatch(updatePurchaseOrder({ id, orderData: payload }));
            navigate('/purchase/orders');
        } else {
            dispatch(addPurchaseOrder(payload));
            navigate('/purchase/orders');
        }
    };

    return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchase/orders')}>
                    Back
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', flex: 1 }}>
                    {isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
                </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                    size="small"
                    label="Order Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                />
                <Autocomplete
                    size="small"
                    options={activeSuppliers}
                    getOptionLabel={(o) => o.supplierName || o.name || ''}
                    value={activeSuppliers.find((s) => s.id === supplierId) || null}
                    onChange={(_, v) => setSupplierId(v?.id || '')}
                    renderInput={(params) => <TextField {...params} label="Supplier" required />}
                    sx={{ minWidth: 260 }}
                />
                <TextField
                    size="small"
                    select
                    label="Warehouse"
                    value={warehouseId}
                    required
                    onChange={(e) => setWarehouseId(e.target.value)}
                    sx={{ minWidth: 180 }}
                >
                    {activeWarehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>
                            {w.name}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <Autocomplete
                    size="small"
                    options={filteredOptions}
                    getOptionLabel={(o) => `${o.sku} | ${o.itemName} ${o.size}/${o.color}`}
                    value={variantPickerValue}
                    onChange={(_, v) => setVariantPickerValue(v)}
                    sx={{ minWidth: 320 }}
                    renderInput={(params) => (
                        <TextField {...params} label="Add item (search by SKU or name)" placeholder="Select variant" />
                    )}
                />
                <Button
                    variant="outlined"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={addLine}
                    disabled={!variantPickerValue}
                >
                    Add Line
                </Button>
            </Stack>

            {formError && (
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                    {formError}
                </Typography>
            )}

            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Size/Color</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                Qty
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                Rate
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                Disc %
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                Tax %
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                                Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} width={56} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lines.map((l) => {
                            const lt = calculateLine(l);
                            return (
                                <TableRow key={l.id}>
                                    <TableCell>{l.itemName}</TableCell>
                                    <TableCell>{l.sku}</TableCell>
                                    <TableCell>{`${l.size}/${l.color}`}</TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={l.quantity}
                                            onChange={(e) => updateLineField(l.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                            inputProps={{ min: 1, style: { textAlign: 'right', width: 60 } }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={l.rate}
                                            onChange={(e) => updateLineField(l.id, 'rate', Math.max(0, Number(e.target.value)))}
                                            inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', width: 80 } }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={l.discount}
                                            onChange={(e) => updateLineField(l.id, 'discount', Math.max(0, Math.min(100, Number(e.target.value))))}
                                            inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: 60 } }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={l.tax}
                                            onChange={(e) => updateLineField(l.id, 'tax', Math.max(0, Math.min(100, Number(e.target.value))))}
                                            inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: 60 } }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">{lt.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="error" onClick={() => removeLine(l.id)}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Gross: ₹{totals.grossAmount.toFixed(2)} | Discount: ₹{totals.lineDiscount.toFixed(2)} | Tax:
                    ₹{totals.taxAmount.toFixed(2)} | Net: ₹{totals.netAmount.toFixed(2)}
                </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/purchase/orders')}>
                    Cancel
                </Button>
                <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>
                    Save Purchase Order
                </Button>
            </Stack>
        </Paper>
    );
}

export default PurchaseOrderFormPage;
