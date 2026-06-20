import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { updateChallan, updateChallanStatus, addChallan } from './dispatchSlice';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { extractApiErrorMessage } from '../../utils/apiError';
import { createOperationIdempotencyKey, idempotencyHeaders } from '../../utils/idempotencyKey';
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    Grid,
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
import { fetchMasters } from '../masters/mastersSlice';
import { fetchWarehouseStock } from '../inventory/inventorySlice';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import BillPrintDialog from '../../components/BillPrintDialog';
import StandardInvoicePrint from '../sales/StandardInvoicePrint';
import SaleChallanPrint from '../sales/SaleChallanPrint';
import ReportExportButton from '../reports/ReportExportButton';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';
import { useConfirm } from '../../context/ConfirmProvider';
import { calculateGST } from '../../utils/taxCalculator';

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
    const dispatch = useDispatch();
    const navigate = useAppNavigate();

    const [date, setDate] = useState(getTodayDate());
    const [sourceId, setSourceId] = useState('');
    const [storeId, setStoreId] = useState('');
    const user = useSelector((state) => state.auth.user);
    const isStoreStaff = user?.role !== 'Admin';
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
    const stockRows = useSelector((state) => state.inventory.warehouseStock || []);
    const scanLockRef = useRef(false);
    const submitLockRef = useRef(false);
    const taxRules = useSelector((state) => state.masters.taxRules || []);

    const sourceDoc = useMemo(() => {
        const fromMasters = warehouses.find(w => (w.id || w._id) === sourceId) || stores.find(s => (s.id || s._id) === sourceId);
        if (fromMasters) return fromMasters;
        
        // Fallback to populated data from the dispatch record itself
        if (challanRawData?.sourceWarehouseId && (challanRawData.sourceWarehouseId._id === sourceId || challanRawData.sourceWarehouseId.id === sourceId)) {
            return challanRawData.sourceWarehouseId;
        }
        return null;
    }, [warehouses, stores, sourceId, challanRawData]);

    const destDoc = useMemo(() => {
        const fromMasters = stores.find(s => (s.id || s._id) === storeId);
        if (fromMasters) return fromMasters;

        // Fallback to populated data from the dispatch record itself
        if (challanRawData?.destinationStoreId && (challanRawData.destinationStoreId._id === storeId || challanRawData.destinationStoreId.id === storeId)) {
            return challanRawData.destinationStoreId;
        }
        return null;
    }, [stores, storeId, challanRawData]);

    const [companySettings, setCompanySettings] = useState(null);

    useEffect(() => {
        api.get('/settings/company').then(res => {
            setCompanySettings(res.data?.company || null);
        }).catch(() => {});
    }, []);

    // Helper to get GST safely from any doc with company fallback
    const getGst = (doc) => {
        const docGst = (doc?.gstNumber || doc?.gstin || doc?.gst || doc?.gstNo || '').trim().toUpperCase();
        // If it's a warehouse and has no GST, fallback to company GST
        if (!docGst && doc && (doc.warehouseName || doc.name?.toLowerCase().includes('warehouse'))) {
            return (companySettings?.gstin || '').trim().toUpperCase();
        }
        return docGst;
    };

    const sourceGst = getGst(sourceDoc);
    const destinationGst = getGst(destDoc);

    const isSameEntity = useMemo(() => {
        if (!sourceGst || !destinationGst) return false;
        return sourceGst === destinationGst;
    }, [sourceGst, destinationGst]);

    const isInterState = useMemo(() => {
        if (!sourceDoc || !destDoc) return false;
        const sState = (sourceDoc.location?.state || sourceDoc.state || '').trim().toLowerCase();
        const dState = (destDoc.location?.state || destDoc.state || '').trim().toLowerCase();
        return sState !== dState && sState !== '' && dState !== '';
    }, [sourceDoc, destDoc]);
    // Auto-select source warehouse for admin if none selected
    useEffect(() => {
        if (!sourceId && warehouses.length > 0) {
            const defaultId = user?.warehouseId || warehouses[0]?.id || warehouses[0]?._id;
            if (defaultId) setSourceId(defaultId);
        }
    }, [user, warehouses, sourceId]);

    const hasBothGst = Boolean(sourceGst && destinationGst);
    const billingDocTypeLabel = !hasBothGst
        ? (sourceDoc && destDoc ? (isSameEntity ? 'Transfer Bill / Stock Transfer Note' : 'Tax Invoice') : 'Unknown (Select Source & Destination)')
        : (isSameEntity ? 'Transfer Bill / Stock Transfer Note' : 'Tax Invoice');

    useEffect(() => {
        dispatch(fetchMasters('warehouses'));
        dispatch(fetchMasters('stores'));
        dispatch(fetchMasters('taxRules'));
    }, [dispatch]);

    // Auto-fetch and apply store discount when storeId changes
    useEffect(() => {
        if (storeId && stores.length > 0 && !isLocked && !isReceiveMode) {
            const selectedStore = stores.find(s => (s.id || s._id) === storeId);
            if (selectedStore) {
                const discount = selectedStore.transferDiscountPct || 0;
                setLines(prev => prev.map(l => {
                    const baseMrp = Number(l.mrp || l.rate || 0);
                    return {
                        ...l,
                        discountPercent: discount,
                        rate: Number((baseMrp * (1 - discount / 100)).toFixed(2)),
                    };
                }));
            }
        }
    }, [storeId, stores, isLocked, isReceiveMode]);

    const hsnSummary = useMemo(() => {
        const summary = {};
        lines.forEach(l => {
            const hsn = l.hsnCode || '6109';
            const taxableValue = Number(l.rate || 0) * l.quantity;
            
            // Determine GST slab for this item based on individual unit price
            const unitPrice = Number(l.rate || l.mrp || 0);
            const slab = calculateGST(unitPrice, null, null, taxRules);
            const itemRule = calculateGST(0, l.sku || l.barcode, l.category, taxRules);
            const actualGstRate = (itemRule.type === 'FLAT') ? itemRule.rate : slab.rate;
            const displayGstRate = isSameEntity ? 0 : actualGstRate;
            
            const taxAmount = !isSameEntity ? (taxableValue * actualGstRate) / 100 : 0;
            
            const key = `${hsn}-${displayGstRate}`;
            if (!summary[key]) {
                summary[key] = {
                    hsnCode: hsn,
                    totalQty: 0,
                    gstPercent: displayGstRate,
                    taxableAmount: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    totalTax: 0
                };
            }
            
            summary[key].totalQty += l.quantity;
            summary[key].taxableAmount += taxableValue;
            summary[key].totalTax += taxAmount;
            
            if (isInterState) {
                summary[key].igst += taxAmount;
            } else {
                summary[key].cgst += taxAmount / 2;
                summary[key].sgst += taxAmount / 2;
            }
        });
        return Object.values(summary);
    }, [lines, isSameEntity, isInterState, taxRules]);

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
                            // SKU = itemCode only (no size suffix) — matches user's master format
                            sku: item.itemCode,
                            // Keep full barcode internally for accurate matching
                            barcode: sz.barcode || sz.sku || item.itemCode,
                            size: sz.size || '-',
                            color: item.shade || sz.color || '-',
                            available: Number(sz.stock),
                            rate: baseRate,
                            mrp: baseRate,
                            discountPercent: 0,
                            gstPercent: gstPct,
                            hsnCode: item.hsnCode || item.hsCodeId?.code || item.hsCodeId?.hsnCode || '6109',
                            category: item.categoryName || item.type || ''
                        });
                    }
                });
            }
        });

        return flattened;
    }, [stockRows, isReceiveMode]);

    const handleScanner = async (code) => {
        if (!code || scanLockRef.current || isSubmitting) return;
        scanLockRef.current = true;

        try {
        // 1. Clean barcode — strip scanner quantity suffixes like ":1", ":2"
        let cleaned = String(code).trim().replace(/:(\d+)$/, '').trim();
        const normalizedCode = cleaned.toLowerCase();

        // 2. Receive mode — just match against existing lines
        if (isReceiveMode) {
            const match = lines.find(l =>
                String(l.sku).toLowerCase() === normalizedCode ||
                String(l.barcode).toLowerCase() === normalizedCode
            );
            if (match) {
                setError('');
            } else {
                setError(`Item "${cleaned}" not found in this dispatch.`);
            }
            return;
        }

        const selectedStore = stores.find(s => (s.id || s._id) === storeId);
        const storeDiscount = selectedStore?.transferDiscountPct || 0;

        // 3. Local match from preloaded warehouse stock (exact barcode/sku match first, then itemCode prefix match)
        const localMatch =
            variantOptions.find(o =>
                String(o.sku || '').toLowerCase() === normalizedCode ||
                String(o.barcode || '').toLowerCase() === normalizedCode
            ) ||
            variantOptions.find(o =>
                String(o.sku || '').toLowerCase().startsWith(normalizedCode + '-') ||
                String(o.barcode || '').toLowerCase().startsWith(normalizedCode + '-') ||
                String(o.itemCode || '').toLowerCase() === normalizedCode
            );

        if (localMatch) {
            const existing = lines.find(l => l.variantId === localMatch.variantId);
            if (existing) {
                updateQuantity(existing.variantId, existing.quantity + 1);
            } else {
                const baseMrp = localMatch.mrp || localMatch.rate || 0;
                setLines(prev => [...prev, {
                    ...localMatch,
                    quantity: 1,
                    barcode: localMatch.barcode || localMatch.sku,
                    discountPercent: storeDiscount,
                    rate: Number((baseMrp * (1 - storeDiscount / 100)).toFixed(2))
                }]);
            }
            setError('');
            return;
        }

        // 4. Fallback — call backend scan API with cleaned code
        if (!sourceId) {
            setError("Please select a source warehouse before scanning.");
            return;
        }

            const res = await api.get(`/inventory/warehouse/${sourceId}/scan/${encodeURIComponent(cleaned)}`);
            const item = res.data.data || res.data;
            if (item) {
                if (Number(item.quantity || 0) <= 0) {
                    const errMsg = `This stock quantity is 0, cannot be dispatched. Barcode: ${cleaned}`;
                    setError(errMsg);
                    showNotification(errMsg, 'error');
                    return;
                }
                const baseMrp = item.mrp || item.rate || 0;
                const resolvedItemCode = item.itemCode || item.itemId?.itemCode || '';
                const newLine = {
                    itemId: item.itemId?._id || item.itemId,
                    variantId: item.variantId,
                    barcode: item.barcode,
                    itemName: item.itemName || item.itemId?.itemName || 'Item',
                    itemCode: resolvedItemCode,
                    sku: resolvedItemCode || item.sku || item.barcode,
                    size: item.size || '-',
                    color: item.color || '-',
                    available: item.quantity,
                    quantity: 1,
                    rate: Number((baseMrp * (1 - storeDiscount / 100)).toFixed(2)),
                    mrp: baseMrp,
                    discountPercent: storeDiscount,
                    gstPercent: Number(item.gstPercent || 0),
                    hsnCode: item.hsnCode || '6109',
                    category: item.itemId?.categoryName || item.categoryName || item.type || ''
                };
                setLines(prev => [...prev, newLine]);
                setError('');
            }
        } catch (err) {
            setError(extractApiErrorMessage(err, `"${String(code).trim()}" warehouse mein nahi mila. Sahi barcode scan karein.`));
        } finally {
            scanLockRef.current = false;
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

    useEffect(() => {
        if (!id) return undefined;

        const controller = new AbortController();
        api.get(`/dispatch/${id}`, { signal: controller.signal })
            .then(res => {
                const data = res.data.dispatch || res.data.data;
                if (!data) return;
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
                            const derivedSku = itemDoc.itemCode || v.sku || v.barcode || variantDoc?.sku || variantDoc?.barcode || item.barcode || '-';
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
                                receivedQty: mode === 'receive' ? Number(item.qty) : Number(item.qty),
                                rate: Number(item.rate || item.mrp || 0),
                                mrp: Number(item.mrp || item.rate || 0),
                                discountPercent: Number(item.discountPercent || 0),
                                gstPercent: Number(item.taxPercentage || 0),
                                hsnCode: item.hsnCode || itemDoc.hsnCode || itemDoc.hsCodeId?.code || itemDoc.hsCodeId?.hsnCode || '6109',
                                category: itemDoc.categoryName || itemDoc.type || ''
                            };
                        });
                        setLines(prefilledLines);
                    }
                    setStatus(data.status || 'PENDING');
                    setChallanNumber(data.dispatchNumber || '');
                    setChallanRawData(data);
            })
            .catch((err) => {
                if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
                    setError('Failed to load challan details. Please try again.');
                }
            });

        return () => controller.abort();
    }, [id]);

    const handleSave = async (targetStatus = 'PENDING') => {
        if (submitLockRef.current || isSubmitting) return;
        setError('');
        if (!sourceId || !storeId || !lines.length) { setError("Incomplete data"); return; }

        submitLockRef.current = true;
        setIsSubmitting(true);
        const idempotencyKey = createOperationIdempotencyKey(id ? 'challan-save' : 'challan-create', id || 'new');

        try {
            if (isReceiveMode) {
                const mismatched = lines.filter((l) => Number(l.receivedQty) !== Number(l.quantity));
                if (mismatched.length) {
                    setError(`Received quantity must match expected quantity for all items (${mismatched.length} mismatch${mismatched.length > 1 ? 'es' : ''}).`);
                    submitLockRef.current = false;
                    setIsSubmitting(false);
                    return;
                }
                const payload = {
                    receivedItems: lines.map(l => ({
                        variantId: l.variantId,
                        receivedQty: Number(l.quantity || 0),
                    }))
                };
                showLoading('Updating inventory stock...');
                await api.post(`/dispatch/${id}/receive`, payload, { headers: idempotencyHeaders(idempotencyKey) });
                showNotification("Stock successfully audited and added to inventory!", "success");
                navigate(listPath);
                return;
            }

            const payload = {
                dcDate: date,
                sourceId,
                destinationStoreId: storeId,
                items: lines.map(l => {
                    const totalTaxable = lines.reduce((acc, x) => acc + (Number(x.rate || x.mrp || 0) * x.quantity), 0);
                    const slab = calculateGST(totalTaxable, null, null, taxRules);
                    const itemRule = calculateGST(0, l.sku || l.barcode, l.category, taxRules);
                    const lineRate = (itemRule.type === 'FLAT') ? itemRule.rate : slab.rate;

                    return {
                        itemId: l.itemId,
                        variantId: l.variantId,
                        barcode: l.barcode,
                        quantity: l.quantity,
                        rate: Number(l.rate || l.mrp || 0),
                        mrp: Number(l.mrp || l.rate || 0),
                        discountPercent: Number(l.discountPercent || 0),
                        gstPercent: lineRate
                    };
                }),
                status: targetStatus,
                type: 'WAREHOUSE_TO_STORE',
                totalMRP: lines.reduce((acc, l) => acc + (Number(l.mrp || 0) * l.quantity), 0),
                totalDiscount: lines.reduce((acc, l) => acc + ((Number(l.mrp || 0) - Number(l.rate || 0)) * l.quantity), 0),
                taxableAmount: lines.reduce((acc, l) => acc + (Number(l.rate || 0) * l.quantity), 0),
                gstAmount: hsnSummary.reduce((acc, h) => acc + h.totalTax, 0),
                finalAmount: lines.reduce((acc, l) => acc + (Number(l.rate || 0) * l.quantity), 0) + hsnSummary.reduce((acc, h) => acc + h.totalTax, 0),
                hsnSummary
            };

            showLoading(id ? 'Updating challan...' : 'Saving new challan...');
            const action = id
                ? updateChallan({ id, data: payload, idempotencyKey })
                : addChallan({ ...payload, idempotencyKey });
            await dispatch(action).unwrap();
            showNotification(id ? "Challan updated successfully!" : "Challan saved successfully!", "success");
            navigate(listPath);
        } catch (err) {
            setError(extractApiErrorMessage(err, "Failed to save challan. Please try again."));
        } finally {
            hideLoading();
            submitLockRef.current = false;
            setIsSubmitting(false);
        }
    };

    const handleBillingDispatch = async () => {
        if (submitLockRef.current || isSubmitting) return;
        setError('');
        if (!sourceId || !storeId || !lines.length) {
            setError('Dispatch karne se pehle items add/verify karna zaroori hai.');
            return;
        }

        submitLockRef.current = true;
        setIsSubmitting(true);
        const idempotencyKey = createOperationIdempotencyKey('billing-dispatch', id);

        try {
            await dispatch(updateChallan({
                id,
                idempotencyKey: createOperationIdempotencyKey('billing-update', id),
                data: {
                    dcDate: date,
                    sourceId,
                    destinationStoreId: storeId,
                    items: lines.map((l) => {
                        const totalTaxable = lines.reduce((acc, x) => acc + (Number(x.rate || x.mrp || 0) * x.quantity), 0);
                        const slab = calculateGST(totalTaxable, null, null, taxRules);
                        const itemRule = calculateGST(0, l.sku || l.barcode, l.category, taxRules);
                        const lineRate = (itemRule.type === 'FLAT') ? itemRule.rate : slab.rate;

                        return {
                            itemId: l.itemId,
                            variantId: l.variantId,
                            barcode: l.barcode,
                            quantity: l.quantity,
                            rate: Number(l.rate || l.mrp || 0),
                            mrp: Number(l.mrp || l.rate || 0),
                            discountPercent: Number(l.discountPercent || 0),
                            gstPercent: lineRate
                        };
                    })
                }
            })).unwrap();

            showLoading('Generating final invoice and completing dispatch...');
            await dispatch(updateChallanStatus({ id, status: 'DISPATCHED', idempotencyKey })).unwrap();
            showNotification('Billing reviewed and dispatch completed.', 'success');
            navigate(listPath);
        } catch (err) {
            setError(extractApiErrorMessage(err, 'Failed to complete billing dispatch. Please try again.'));
        } finally {
            hideLoading();
            submitLockRef.current = false;
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
                        {destDoc && (
                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: '#166534' }}>
                                Store Discount Applied: {destDoc.transferDiscountPct || 0}%
                            </Typography>
                        )}
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
                        <Typography sx={{ fontWeight: 900, color: '#166534' }}>Full Receive Only</Typography>
                        <Typography variant="caption">Poora dispatch qty receive hoga — partial receive allowed nahi. Confirm karke save karein.</Typography>
                    </Box>
                )}
                {/* Stats Summary Dashboard Panel */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ 
                            border: '1px solid #cbd5e1', 
                            bgcolor: '#f8fafc',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
                        }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Total Lines
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
                                            {lines.length}
                                        </Typography>
                                    </Box>
                                    <Chip label="Variants" size="small" sx={{ bgcolor: '#e2e8f0', color: '#334155', fontWeight: 700, fontSize: '0.7rem' }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ 
                            border: '1px solid #bfdbfe', 
                            bgcolor: '#eff6ff',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
                        }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Total Quantity
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#1d4ed8', mt: 0.5 }}>
                                            {lines.reduce((acc, l) => acc + (l.quantity || 0), 0)}
                                        </Typography>
                                    </Box>
                                    <Chip label="Items" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: '0.7rem' }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ 
                            border: '1px solid #e9d5ff', 
                            bgcolor: '#faf5ff',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
                        }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Taxable Value
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#7e22ce', mt: 0.5 }}>
                                            ₹{lines.reduce((acc, l) => acc + (Number(l.rate || 0) * (l.quantity || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                    <Chip label="Excl. Tax" size="small" sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', fontWeight: 700, fontSize: '0.7rem' }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ 
                            border: '1px solid #a7f3d0', 
                            bgcolor: '#ecfdf5',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
                        }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Net Payable
                                        </Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#047857', mt: 0.5 }}>
                                            ₹{(lines.reduce((acc, l) => acc + (Number(l.rate || 0) * (l.quantity || 0)), 0) + (isSameEntity ? 0 : hsnSummary.reduce((acc, h) => acc + h.totalTax, 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={isSameEntity ? "Stock Transfer" : "Incl. Tax"} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: isSameEntity ? '#dbeafe' : '#d1fae5', 
                                            color: isSameEntity ? '#1e40af' : '#065f46', 
                                            fontWeight: 700, 
                                            fontSize: '0.7rem' 
                                        }} 
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

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

                <TableContainer 
                    component={Paper} 
                    elevation={0} 
                    variant="outlined" 
                    sx={{ 
                        maxHeight: 350, 
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f5f9',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#cbd5e1',
                            borderRadius: '4px',
                            '&:hover': {
                                background: '#94a3b8',
                            }
                        }
                    }}
                >
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Garment Variant</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>SKU</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>{isBillingMode ? 'Base MRP' : 'MRP'}</TableCell>
                                {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Discount %</TableCell>}
                                {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Bill Rate</TableCell>}
                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Expected Qty</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Taxable Value</TableCell>
                                {!isSameEntity && !isStoreStaff && <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>GST%</TableCell>}
                                {!isSameEntity && !isStoreStaff && <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Tax</TableCell>}
                                {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Line Total</TableCell>}
                                {isReceiveMode && <TableCell align="right" sx={{ fontWeight: 700, color: '#166534', bgcolor: '#f8fafc', zIndex: 1 }}>Received Qty</TableCell>}
                                {!isReceiveMode && <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Dispatch Qty</TableCell>}
                                {!isLocked && <TableCell align="center" sx={{ bgcolor: '#f8fafc', zIndex: 1 }}>Action</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lines.map((l) => {
                                const baseRate = Number(l.mrp || 0);
                                const billRate = Number(l.rate || l.mrp || 0);
                                const taxableValue = billRate * (l.quantity || 0);
                                
                                // Determine GST slab based on individual unit price
                                const slabInfo = calculateGST(billRate, null, null, taxRules);
                                const itemRule = calculateGST(0, l.sku || l.barcode, l.category, taxRules);
                                const lineTaxRate = (itemRule.type === 'FLAT') ? itemRule.rate : slabInfo.rate;
                                
                                const taxAmount = !isSameEntity ? (taxableValue * lineTaxRate) / 100 : 0;
                                const lineTotal = taxableValue + taxAmount;
                                
                                return (
                                <TableRow key={l.variantId}>
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
                                    {!isSameEntity && !isStoreStaff && (
                                        <TableCell align="right">
                                            {isBillingMode ? (
                                                <TextField 
                                                    size="small" type="number" value={lineTaxRate}
                                                    onChange={(e) => updateLineField(l.variantId, 'gstPercent', e.target.value)}
                                                    inputProps={{ style: { textAlign: 'right', width: 70 } }}
                                                    disabled={isLocked}
                                                />
                                            ) : `${lineTaxRate}%`}
                                        </TableCell>
                                    )}
                                    {!isSameEntity && !isStoreStaff && <TableCell align="right">₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>}
                                    {isBillingMode && <TableCell align="right" sx={{ fontWeight: 700 }}>₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>}
                                    {isReceiveMode && (
                                        <TableCell align="right">
                                            <Typography sx={{ fontWeight: 800, color: '#166534' }}>{l.quantity}</Typography>
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

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>HSN Wise Summary</Typography>
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>HSN</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>GST %</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>Taxable</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>CGST</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>SGST</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700 }}>IGST</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {hsnSummary.map((h, i) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ fontSize: '0.7rem' }}>{h.hsnCode}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem' }}>{h.totalQty}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem' }}>{h.gstPercent}%</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem' }}>₹{h.taxableAmount.toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem' }}>₹{h.cgst.toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem' }}>₹{h.sgst.toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem' }}>₹{h.igst.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

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
                                    - ₹{lines.reduce((acc, l) => acc + ((Number(l.mrp || 0) - Number(l.rate || 0)) * l.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Subtotal / Taxable:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    ₹{lines.reduce((acc, l) => acc + ((Number(l.rate || 0)) * l.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                            {!isSameEntity && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Tax ({isInterState ? 'IGST' : 'CGST+SGST'}):</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        ₹{hsnSummary.reduce((acc, h) => acc + h.totalTax, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Typography>
                                </Stack>
                            )}
                            <Divider />
                            {(() => {
                                const representativeRate = lines[0] ? Number(lines[0].rate || lines[0].mrp || 0) : 0;
                                const slabInfo = calculateGST(representativeRate, null, null, taxRules);
                                return slabInfo.message && (
                                    <Box sx={{ py: 1, px: 1.5, mb: 1, bgcolor: isSameEntity ? '#eff6ff' : '#f0fdf4', borderRadius: 1.5, border: `1px solid ${isSameEntity ? '#bfdbfe' : '#bbf7d0'}` }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: isSameEntity ? '#1e40af' : '#166534' }}>
                                            ✅ {isSameEntity ? 'Stock Transfer (0% GST Applied)' : slabInfo.message}
                                        </Typography>
                                    </Box>
                                );
                            })()}
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Value:</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                    ₹{(lines.reduce((acc, l) => acc + (Number(l.rate || 0) * l.quantity), 0) + (isSameEntity ? 0 : hsnSummary.reduce((acc, h) => acc + h.totalTax, 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => navigate(listPath)}>Cancel</Button>
                    <ReportExportButton
                        headers={['Barcode/SKU', 'Item Name', 'Color', 'Size', 'Quantity', 'Rate', 'MRP', 'Tax %', 'Subtotal']}
                        headerKeys={['Barcode/SKU', 'Item Name', 'Color', 'Size', 'Quantity', 'Rate', 'MRP', 'Tax %', 'Subtotal']}
                        rows={lines.map(row => {
                            const qty = Number(row.quantity || 0);
                            const rate = Number(row.rate || 0);
                            const taxPct = Number(row.gstPercent ?? row.taxPercentage ?? 0);
                            const subtotal = rate * qty;
                            const taxAmount = isSameEntity ? 0 : (subtotal * taxPct) / 100;
                            return {
                            'Barcode/SKU': row.barcode || row.sku,
                            'Item Name': row.itemName,
                            'Color': row.color,
                            'Size': row.size,
                            'Quantity': qty,
                            'Rate': rate.toFixed(2),
                            'MRP': Number(row.mrp || 0).toFixed(2),
                            'Tax %': taxPct,
                            'Subtotal': (subtotal + taxAmount).toFixed(2)
                        };
                        })}
                        filename={`Delivery_Challan_Export.csv`}
                        variant="outlined"
                    />
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
                        <Button variant="outlined" color="warning" onClick={() => setShowPrint(true)} disabled={isSubmitting}>
                            Preview Invoice
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
                        sale={{
                            ...challanRawData,
                            orderNo: challanRawData?.dcNumber || challanRawData?.dispatchNumber || challanNumber,
                            vehicleNo: challanRawData?.vehicleNumber,
                            storeId: sourceDoc,
                            sourceWarehouseId: sourceDoc,
                            destinationStoreId: destDoc,
                            items: lines,
                            hsnSummary: hsnSummary,
                            type: isSameEntity ? 'INTERNAL_SALE' : 'INTERNAL_SALE',
                            isTransfer: isSameEntity,
                            grandTotal: lines.reduce((acc, l) => acc + (Number(l.rate || 0) * l.quantity), 0) + (isSameEntity ? 0 : hsnSummary.reduce((acc, h) => acc + h.totalTax, 0))
                        }} 
                        isTransfer={isSameEntity} 
                        title={isSameEntity ? 'STOCK TRANSFER NOTE' : 'TAX INVOICE'}
                    />
                ) : (
                    <SaleChallanPrint challan={{
                        ...challanRawData,
                        challanNumber: challanNumber || challanRawData?.dispatchNumber || challanRawData?.dcNumber,
                        vehicleNumber: challanRawData?.vehicleNumber,
                        items: lines,
                    }} />
                )}
            </BillPrintDialog>
        </Paper>
    );
}

const Divider = () => <Box sx={{ borderBottom: '1px dashed #e2e8f0', my: 1 }} />;

export default DeliveryChallanForm;
