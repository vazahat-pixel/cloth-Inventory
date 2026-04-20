import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { updateChallan, updateChallanStatus } from './dispatchSlice';
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
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import BillPrintDialog from '../../components/BillPrintDialog';
import StandardInvoicePrint from '../sales/StandardInvoicePrint';
import SaleChallanPrint from '../sales/SaleChallanPrint';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';
import { useConfirm } from '../../context/ConfirmProvider';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function DeliveryChallanForm({
    listPath = '/orders/delivery-challan',
    pageTitle: providedTitle = 'New Delivery Challan',
    saveLabel = 'Save Challan',
    mode = 'edit' // edit, view, receive, billing
}) {
    const { id } = useParams();
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    const { showConfirm } = useConfirm();

    const [date, setDate] = useState(getTodayDate());
    const [sourceId, setSourceId] = useState('');
    const [storeId, setStoreId] = useState('');
    const [lines, setLines] = useState([]);
    const [variantPickerValue, setVariantPickerValue] = useState(null);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('PENDING');
    const [challanNumber, setChallanNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPrint, setShowPrint] = useState(false);
    const [challanRawData, setChallanRawData] = useState(null);

    const isReceiveMode = mode === 'receive';
    const isBillingMode = mode === 'billing';
    const isViewMode = mode === 'view';
    const isLocked = (status === 'DISPATCHED' || status === 'RECEIVED') && (!isReceiveMode);
    const isPacked = status === 'PACKED';

    const getFormTitle = () => {
        if (isReceiveMode) return 'Stock Receipt Audit (Verified)';
        if (status === 'RECEIVED') return 'Sale Bill (Received)';
        if (status === 'DISPATCHED') return 'Sale Bill (Finalized & Locked)';
        if (isBillingMode) return 'Billing Review Before Dispatch';
        if (status === 'PACKED') return 'Packed Challan (Ready For Billing)';
        return 'Sale Challan (Edit Draft)';
    };
    
    const pageTitle = getFormTitle();

    const warehouses = useSelector((state) => state.masters.warehouses || []);
    const stores = useSelector((state) => state.masters.stores || []);
    const stockRows = useSelector((state) => state.inventory.stock || []);

    const sourceDoc = useMemo(() => warehouses.find(w => (w.id || w._id) === sourceId) || stores.find(s => (s.id || s._id) === sourceId), [warehouses, stores, sourceId]);
    const destDoc = useMemo(() => stores.find(s => (s.id || s._id) === storeId), [stores, storeId]);

    const isSameEntity = useMemo(() => {
        if (!sourceDoc || !destDoc) return true;
        const sGst = (sourceDoc.gstNumber || '').trim().toUpperCase();
        const dGst = (destDoc.gstNumber || '').trim().toUpperCase();
        return sGst === dGst && sGst !== '';
    }, [sourceDoc, destDoc]);

    const isInterState = useMemo(() => {
        if (!sourceDoc || !destDoc) return false;
        const sState = (sourceDoc.location?.state || sourceDoc.state || '').trim().toLowerCase();
        const dState = (destDoc.location?.state || destDoc.state || '').trim().toLowerCase();
        return sState !== dState && sState !== '' && dState !== '';
    }, [sourceDoc, destDoc]);
    const sourceGst = (sourceDoc?.gstNumber || '').trim().toUpperCase();
    const destinationGst = (destDoc?.gstNumber || '').trim().toUpperCase();
    const hasBothGst = Boolean(sourceGst && destinationGst);
    const billingDocTypeLabel = !hasBothGst
        ? 'Unknown (GSTIN missing)'
        : (isSameEntity ? 'Transfer Bill / Stock Transfer Note' : 'Tax Invoice');

    useEffect(() => {
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchMasters('stores'));
    }, [dispatch]);

    useEffect(() => {
        if (sourceId && !isReceiveMode) {
            dispatch(fetchWarehouseStock(sourceId));
        }
    }, [dispatch, sourceId, isReceiveMode]);

    const variantOptions = useMemo(() => {
        if (isReceiveMode) return [];
        const flattened = [];
        const items = Array.isArray(stockRows) ? stockRows : (Array.isArray(stockRows?.items) ? stockRows.items : []);
        
        items.forEach(item => {
            if (item.type === 'FABRIC') return;

            if (item.sizes && Array.isArray(item.sizes)) {
                item.sizes.forEach(sz => {
                    if (Number(sz.stock || 0) > 0) {
                        const gstPct = Number(item.hsCodeId?.gstPercent || item.gstPercent || 0);
                        const baseRate = Number(sz.mrp || item.salePrice || 0);
                        
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
                            rate: baseRate,
                            mrp: baseRate,
                            discountPercent: 0,
                            gstPercent: gstPct
                        });
                    }
                });
            }
        });

        return flattened;
    }, [stockRows, isReceiveMode]);

    const handleScanner = async (code) => {
        if (!code) return;
        const normalizedCode = String(code).trim().toLowerCase();

        if (isReceiveMode) {
            const match = lines.find(l => 
                String(l.sku).toLowerCase() === normalizedCode || 
                String(l.barcode).toLowerCase() === normalizedCode
            );
            if (match) {
                updateReceivedQuantity(match.variantId, (match.receivedQty || 0) + 1);
                setError('');
            } else {
                setError(`Item ${code} not found in this dispatch.`);
            }
            return;
        }

        const localMatch = variantOptions.find(o => 
            String(o.sku).toLowerCase() === normalizedCode || 
            String(o.barcode).toLowerCase() === normalizedCode ||
            String(o.variantId).toLowerCase() === normalizedCode
        );

        if (localMatch) {
            const existing = lines.find(l => l.variantId === localMatch.variantId);
            if (existing) {
                updateQuantity(existing.variantId, existing.quantity + 1);
            } else {
                setLines(prev => [...prev, { ...localMatch, quantity: 1, barcode: localMatch.sku }]);
            }
            setError('');
            return;
        }

        if (!sourceId) {
            setError("Please select a source warehouse before scanning.");
            return;
        }

        try {
            const res = await api.get(`/inventory/warehouse/${sourceId}/scan/${code}`);
            const item = res.data.data || res.data;
            if (item) {
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
                    rate: item.rate || item.mrp || 0,
                    mrp: item.rate || item.mrp || 0,
                    discountPercent: 0,
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
            return { ...l, quantity: Math.max(1, Math.min(Number(val), l.available)) };
        }));
    };

    const updateLineField = (variantId, field, val) => {
        setLines(prev => prev.map((line) => {
            if (line.variantId !== variantId) return line;
            const numericValue = Math.max(0, Number(val) || 0);

            if (field === 'discountPercent') {
                const cappedDiscount = Math.min(numericValue, 100);
                const baseMrp = Number(line.mrp || line.rate || 0);
                return {
                    ...line,
                    discountPercent: cappedDiscount,
                    rate: Number((baseMrp * (1 - cappedDiscount / 100)).toFixed(2)),
                };
            }

            return { ...line, [field]: numericValue };
        }));
    };

    const updateReceivedQuantity = (variantId, val) => {
        setLines(prev => prev.map(l => {
            if (l.variantId !== variantId) return l;
            return { ...l, receivedQty: Math.max(0, Math.min(Number(val), (l.quantity || 0) + 100)) };
        }));
    };

    useEffect(() => {
        if (id) {
            api.get(`/dispatch/${id}`).then(res => {
                const data = res.data.dispatch || res.data.data;
                if (data) {
                    setDate(data.dispatchedAt ? new Date(data.dispatchedAt).toISOString().slice(0, 10) : getTodayDate());
                    setSourceId(data.sourceWarehouseId?._id || data.sourceWarehouseId || '');
                    setStoreId(data.destinationStoreId?._id || data.destinationStoreId || '');
                    
                    if (data.items && Array.isArray(data.items)) {
                        const prefilledLines = data.items.map(item => {
                            const v = item.variantId || {};
                            const itemDoc = (item.itemId && typeof item.itemId === 'object') ? item.itemId : {};
                            const variantDoc = Array.isArray(itemDoc.sizes)
                                ? itemDoc.sizes.find((sz) =>
                                    String(sz?._id || '') === String(v._id || item.variantId || '') ||
                                    String(sz?.barcode || '').toLowerCase() === String(item.barcode || '').toLowerCase() ||
                                    String(sz?.sku || '').toLowerCase() === String(item.barcode || '').toLowerCase()
                                )
                                : null;
                            const derivedSku = v.sku || v.barcode || variantDoc?.sku || variantDoc?.barcode || item.barcode || itemDoc.itemCode || '-';
                            const derivedBarcode = v.barcode || v.sku || variantDoc?.barcode || variantDoc?.sku || item.barcode || '-';
                            return {
                                variantId: v._id || variantDoc?._id || item.variantId,
                                itemId: v.itemId || itemDoc._id || item.itemId,
                                itemName: v.itemName || v.name || itemDoc.itemName || itemDoc.name || 'Unknown Item',
                                sku: derivedSku,
                                barcode: derivedBarcode,
                                size: v.size || variantDoc?.size || '-',
                                color: v.color || variantDoc?.color || itemDoc.shade || '-',
                                available: Number(item.qty + 100),
                                quantity: Number(item.qty),
                                receivedQty: mode === 'receive' ? 0 : Number(item.qty),
                                rate: Number(item.rate || item.mrp || 0),
                                mrp: Number(item.mrp || item.rate || 0),
                                discountPercent: Number(item.discountPercent || 0),
                                gstPercent: Number(item.taxPercentage || 0)
                            };
                        });
                        setLines(prefilledLines);
                    }
                    setStatus(data.status || 'PENDING');
                    setChallanNumber(data.dispatchNumber || '');
                    setChallanRawData(data);
                }
            });
        }
    }, [id]);

    const handleSave = async (targetStatus = 'PENDING') => {
        setError('');
        if (!sourceId || !storeId || !lines.length) { setError("Incomplete data"); return; }
        setIsSubmitting(true);

        try {
            if (isReceiveMode) {
                const payload = {
                    receivedItems: lines.map(l => ({
                        variantId: l.variantId,
                        receivedQty: l.receivedQty
                    }))
                };
                showLoading('Updating inventory stock...');
                await api.post(`/dispatch/${id}/receive`, payload);
                showNotification("Stock successfully audited and added to inventory!", "success");
                navigate(listPath);
                return;
            }

            const payload = {
                dcDate: date,
                sourceId,
                destinationStoreId: storeId,
                items: lines.map(l => ({
                    itemId: l.itemId,
                    variantId: l.variantId,
                    barcode: l.barcode,
                    quantity: l.quantity,
                    rate: Number(l.rate || l.mrp || 0),
                    mrp: Number(l.mrp || l.rate || 0),
                    discountPercent: Number(l.discountPercent || 0),
                    gstPercent: Number(l.gstPercent || 0)
                })),
                status: targetStatus,
                type: 'WAREHOUSE_TO_STORE'
            };

            showLoading(id ? 'Updating challan...' : 'Saving new challan...');
            const action = id ? updateChallan({ id, data: payload }) : addChallan(payload);
            await dispatch(action).unwrap();
            showNotification(id ? "Challan updated successfully!" : "Challan saved successfully!", "success");
            navigate(listPath);
        } catch (err) {
            setError(err.message || "Failed to process");
        } finally {
            hideLoading();
            setIsSubmitting(false);
        }
    };

    const handleBillingDispatch = async () => {
        setError('');
        if (!sourceId || !storeId || !lines.length) {
            setError('Dispatch karne se pehle items add/verify karna zaroori hai.');
            return;
        }
        setIsSubmitting(true);

        try {
            await dispatch(updateChallan({
                id,
                data: {
                    dcDate: date,
                    sourceId,
                    destinationStoreId: storeId,
                    items: lines.map((l) => ({
                        itemId: l.itemId,
                        variantId: l.variantId,
                        barcode: l.barcode,
                        quantity: l.quantity,
                        rate: Number(l.rate || l.mrp || 0),
                        mrp: Number(l.mrp || l.rate || 0),
                        discountPercent: Number(l.discountPercent || 0),
                        gstPercent: Number(l.gstPercent || 0)
                    }))
                }
            })).unwrap();

            // Ensure backend status precondition before confirm dispatch.
            if (status === 'PENDING') {
                await dispatch(updateChallanStatus({ id, status: 'PACKED' })).unwrap();
            }

            showLoading('Generating final invoice and completing dispatch...');
            await dispatch(updateChallanStatus({ id, status: 'DISPATCHED' })).unwrap();
            showNotification('Billing reviewed and dispatch completed.', 'success');
            navigate(listPath);
        } catch (err) {
            const rawError = err?.message || '';
            const friendlyError = rawError.includes('Only packed challans can be dispatched')
                ? 'Dispatch se pehle challan ko PACKED karna zaroori hai. Please retry billing dispatch.'
                : rawError || 'Failed to complete billing dispatch';
            setError(friendlyError);
        } finally {
            hideLoading();
            setIsSubmitting(false);
        }
    };

    return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(listPath)}>Back</Button>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', flex: 1 }}>
                    {pageTitle} {challanNumber && `| ${challanNumber}`}
                </Typography>
                {status && (
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 800, bgcolor: status === 'RECEIVED' ? '#dcfce7' : '#fef9c3', color: status === 'RECEIVED' ? '#166534' : '#854d0e', border: '1px solid #e2e8f0' }}>
                        {status === 'RECEIVED' ? '✓ STOCK IN' : (status === 'DISPATCHED' ? '📊 SENT' : '🏷️ DRAFT')}
                    </Box>
                )}
            </Stack>

            {isPacked && !isReceiveMode && (
                <Box sx={{ mb: 3, px: 1.5, py: 0.75, borderRadius: 1.5, display: 'inline-flex', fontSize: '0.75rem', fontWeight: 800, bgcolor: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}>
                    READY FOR BILLING
                </Box>
            )}

            <Stack spacing={4}>
                {isPacked && !isReceiveMode && (
                    <Box sx={{ p: 2, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 900, color: '#6b21a8' }}>Packing completed</Typography>
                        <Typography variant="caption">Ab ye challan packed stage me hai. Final tax invoice ya transfer bill banane ke baad hi dispatch hoga.</Typography>
                    </Box>
                )}
                {!isReceiveMode && (
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Dispatch Document Type: {billingDocTypeLabel}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Source GSTIN: {sourceGst || 'N/A'} | Destination GSTIN: {destinationGst || 'N/A'}
                        </Typography>
                    </Box>
                )}
                <Stack direction="row" spacing={2} sx={{ opacity: isReceiveMode || isLocked ? 0.6 : 1, pointerEvents: isReceiveMode || isLocked ? 'none' : 'auto' }}>
                    <TextField 
                        type="date" 
                        label="Date" 
                        size="small" 
                        fullWidth 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)}
                        disabled={isReceiveMode || isLocked}
                    />

                    <Autocomplete
                        fullWidth
                        size="small"
                        options={warehouses}
                        getOptionLabel={(w) => w.name || w.warehouseName || ''}
                        value={warehouses.find(w => (w.id || w._id) === sourceId) || null}
                        disabled={isReceiveMode || isLocked}
                        onChange={async (_, newValue) => {
                            const newId = newValue ? (newValue.id || newValue._id) : '';
                            if (lines.length > 0 && newId !== sourceId) {
                                const confirmed = await showConfirm({
                                    title: 'Change Source Warehouse?',
                                    message: 'Changing source warehouse will clear all current items from the list. Do you want to continue?',
                                    confirmText: 'Clear & Change',
                                    severity: 'warning'
                                });
                                if (confirmed) {
                                    setLines([]);
                                    setSourceId(newId);
                                }
                            } else {
                                setSourceId(newId);
                            }
                        }}
                        renderInput={(params) => <TextField {...params} label="Source Warehouse" />}
                    />

                    <Autocomplete
                        fullWidth
                        size="small"
                        options={stores}
                        getOptionLabel={(s) => s.name || s.storeName || ''}
                        value={stores.find(s => (s.id || s._id) === storeId) || null}
                        disabled={isReceiveMode || isLocked}
                        onChange={(_, newValue) => setStoreId(newValue ? (newValue.id || newValue._id) : '')}
                        renderInput={(params) => <TextField {...params} label="Destination Store" />}
                    />
                </Stack>

                {isReceiveMode && (
                    <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 900, color: '#166534' }}>⚡ AUDIT MODE ACTIVE</Typography>
                        <Typography variant="caption">Scan garments to verify received quantity. Mismatches will be logged.</Typography>
                    </Box>
                )}

                <TextField 
                    fullWidth size="small"
                    autoFocus
                    placeholder="Scan barcode to audit/add item..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleScanner(e.target.value);
                            e.target.value = '';
                        }
                    }}
                    sx={{ bgcolor: '#f8fafc' }}
                />

                <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Garment Variant</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{isBillingMode ? 'Base MRP' : 'MRP'}</TableCell>
                                {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700 }}>Discount %</TableCell>}
                                {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700 }}>Bill Rate</TableCell>}
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Expected Qty</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Taxable Value</TableCell>
                                {!isSameEntity && <TableCell align="right" sx={{ fontWeight: 700 }}>GST%</TableCell>}
                                {!isSameEntity && <TableCell align="right" sx={{ fontWeight: 700 }}>Tax</TableCell>}
                                {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700 }}>Line Total</TableCell>}
                                {isReceiveMode && <TableCell align="right" sx={{ fontWeight: 700, color: '#166534' }}>Received Qty</TableCell>}
                                {!isReceiveMode && <TableCell align="right" sx={{ fontWeight: 700 }}>Dispatch Qty</TableCell>}
                                {!isLocked && <TableCell align="center">Action</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lines.map((l) => {
                                const baseRate = Number(l.mrp || 0);
                                const billRate = Number(l.rate || l.mrp || 0);
                                const taxableValue = billRate * (l.quantity || 0);
                                const taxAmount = !isSameEntity ? (taxableValue * (l.gstPercent || 0)) / 100 : 0;
                                const lineTotal = taxableValue + taxAmount;
                                
                                return (
                                <TableRow key={l.variantId} sx={{ bgcolor: isReceiveMode && l.receivedQty != l.quantity ? '#fff1f2' : 'inherit' }}>
                                    <TableCell>{l.itemName} ({l.size}/{l.color})</TableCell>
                                    <TableCell>{l.sku}</TableCell>
                                    <TableCell align="right">₹{baseRate.toLocaleString()}</TableCell>
                                    {isBillingMode && (
                                        <TableCell align="right">
                                            <TextField 
                                                size="small" type="number" value={l.discountPercent || 0}
                                                onChange={(e) => updateLineField(l.variantId, 'discountPercent', e.target.value)}
                                                inputProps={{ style: { textAlign: 'right', width: 70 } }}
                                                disabled={isLocked}
                                            />
                                        </TableCell>
                                    )}
                                    {isBillingMode && (
                                        <TableCell align="right">
                                            <TextField 
                                                size="small" type="number" value={l.rate || 0}
                                                onChange={(e) => updateLineField(l.variantId, 'rate', e.target.value)}
                                                inputProps={{ style: { textAlign: 'right', width: 80 } }}
                                                disabled={isLocked}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>{l.quantity}</TableCell>
                                    <TableCell align="right">₹{taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    {!isSameEntity && (
                                        <TableCell align="right">
                                            {isBillingMode ? (
                                                <TextField 
                                                    size="small" type="number" value={l.gstPercent || 0}
                                                    onChange={(e) => updateLineField(l.variantId, 'gstPercent', e.target.value)}
                                                    inputProps={{ style: { textAlign: 'right', width: 70 } }}
                                                    disabled={isLocked}
                                                />
                                            ) : `${l.gstPercent}%`}
                                        </TableCell>
                                    )}
                                    {!isSameEntity && <TableCell align="right">₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>}
                                    {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700 }}>₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>}
                                    {isReceiveMode && (
                                        <TableCell align="right">
                                            <TextField 
                                                size="small" type="number" value={l.receivedQty} 
                                                onChange={(e) => updateReceivedQuantity(l.variantId, e.target.value)}
                                                inputProps={{ style: { textAlign: 'right', fontWeight: 800, width: 70 } }}
                                            />
                                        </TableCell>
                                    )}
                                    {!isReceiveMode && (
                                        <TableCell align="right">
                                            <TextField 
                                                size="small" type="number" value={l.quantity} 
                                                onChange={(e) => updateQuantity(l.variantId, e.target.value)}
                                                inputProps={{ style: { textAlign: 'right', width: 70 } }}
                                                disabled={isLocked}
                                            />
                                        </TableCell>
                                    )}
                                    {!isLocked && (
                                        <TableCell align="center">
                                            <IconButton color="error" onClick={() => setLines(prev => prev.filter(x => x.variantId !== l.variantId))} disabled={isReceiveMode}>
                                                <DeleteOutlineIcon size="small" />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Box sx={{ minWidth: 250, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Total MRP:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    ₹{lines.reduce((acc, l) => acc + (Number(l.mrp || 0) * l.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="success.main">Total Discount:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    - ₹{lines.reduce((acc, l) => acc + ((Number(l.mrp || 0) - Number(l.rate || l.mrp || 0)) * l.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Subtotal / Taxable:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    ₹{lines.reduce((acc, l) => acc + ((Number(l.rate || l.mrp || 0)) * l.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                            {!isSameEntity && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Tax ({isInterState ? 'IGST' : 'CGST+SGST'}):</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        ₹{lines.reduce((acc, l) => acc + (((Number(l.rate || l.mrp || 0)) * l.quantity * l.gstPercent) / 100), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Stack>
                            )}
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Value:</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                    ₹{lines.reduce((acc, l) => {
                                        const base = Number(l.rate || l.mrp || 0) * l.quantity;
                                        const tax = !isSameEntity ? (base * l.gstPercent) / 100 : 0;
                                        return acc + base + tax;
                                    }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => navigate(listPath)}>Cancel</Button>
                    {isReceiveMode && (
                        <Button variant="contained" color="success" onClick={() => handleSave()} disabled={isSubmitting}>
                            Confirm Verified Stock-In
                        </Button>
                    )}
                    {isBillingMode && !isLocked && (
                      <>
                        <Button variant="outlined" color="primary" onClick={() => handleSave()} disabled={isSubmitting}>
                            Save Billing Review
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleBillingDispatch} disabled={isSubmitting}>
                            Generate Bill & Dispatch
                        </Button>
                      </>
                    )}
                    {!isReceiveMode && !isBillingMode && !isLocked && (
                      <Button variant="contained" color="primary" onClick={() => handleSave()} disabled={isSubmitting}>
                          {id ? 'Update Sale Challan' : 'Save Sale Challan'}
                      </Button>
                    )}
                    {(isLocked || isPacked) && (
                        <Button 
                            variant="outlined" 
                            color="info" 
                            startIcon={<PrintOutlinedIcon />} 
                            onClick={() => setShowPrint(true)}
                        >
                            Print Document
                        </Button>
                    )}
                </Stack>
            </Stack>
            <BillPrintDialog open={showPrint} onClose={() => setShowPrint(false)}>
                {status === 'DISPATCHED' || status === 'RECEIVED' || isBillingMode ? (
                    <StandardInvoicePrint 
                        sale={{ ...challanRawData, items: lines }} 
                        isTransfer={isSameEntity} 
                        title={isSameEntity ? 'STOCK TRANSFER NOTE' : 'TAX INVOICE'}
                    />
                ) : (
                    <SaleChallanPrint challan={{ ...challanRawData, items: lines }} />
                )}
            </BillPrintDialog>
        </Paper>
    );
}

const Divider = () => <Box sx={{ borderBottom: '1px dashed #e2e8f0', my: 1 }} />;

export default DeliveryChallanForm;
