import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import api from '../../services/api';
import { combineAndConfirmDispatch } from './dispatchSlice';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
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
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNotification } from '../../context/NotificationProvider';
import { useLoading } from '../../context/LoadingProvider';
import BillPrintDialog from '../../components/BillPrintDialog';
import StandardInvoicePrint from '../sales/StandardInvoicePrint';
import ReportExportButton from '../reports/ReportExportButton';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function CombineReviewForm({ listPath = '/orders/delivery-challan' }) {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { showNotification } = useNotification();
    const { showLoading, hideLoading } = useLoading();
    
    // Extract selected IDs from route state
    const selectedIds = location.state?.selectedIds || [];
    
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [sourceDispatches, setSourceDispatches] = useState([]);
    
    // Form inputs
    const [date, setDate] = useState(getTodayDate());
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [driverName, setDriverName] = useState('');
    const [notes, setNotes] = useState('');
    
    // Combined result for printing
    const [combinedResult, setCombinedResult] = useState(null);
    const [showPrint, setShowPrint] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Fetch details of all selected dispatches
    useEffect(() => {
        if (!selectedIds || selectedIds.length < 2) {
            setError('Please select at least 2 draft challans to combine.');
            setLoadingData(false);
            return;
        }

        const fetchDetails = async () => {
            setLoadingData(true);
            setError('');
            try {
                const fetched = [];
                for (const id of selectedIds) {
                    const response = await api.get(`/dispatch/${id}`);
                    const dispatchRecord = response.data.dispatch || response.data.data;
                    if (!dispatchRecord) {
                        throw new Error(`Failed to load details for challan ID: ${id}`);
                    }
                    fetched.push(dispatchRecord);
                }
                setSourceDispatches(fetched);
            } catch (err) {
                setError(err?.message || 'Error loading selected challans.');
            } finally {
                setLoadingData(false);
            }
        };

        fetchDetails();
    }, [selectedIds]);

    // Validation checks
    const validationError = useMemo(() => {
        if (loadingData || sourceDispatches.length === 0) return '';

        const first = sourceDispatches[0];
        const firstSrc = first.sourceWarehouseId?._id || first.sourceWarehouseId;
        const firstDest = first.destinationStoreId?._id || first.destinationStoreId;

        for (const disp of sourceDispatches) {
            // Check status
            if (!['PENDING', 'PACKED'].includes(disp.status)) {
                return `Challan ${disp.dispatchNumber || disp.challanNumber} must be in PENDING or PACKED status to combine.`;
            }
            // Check same source
            const src = disp.sourceWarehouseId?._id || disp.sourceWarehouseId;
            if (String(src) !== String(firstSrc)) {
                return 'All selected challans must have the same source warehouse/location.';
            }
            // Check same destination
            const dest = disp.destinationStoreId?._id || disp.destinationStoreId;
            if (String(dest) !== String(firstDest)) {
                return 'All selected challans must have the same destination store.';
            }
        }

        return '';
    }, [sourceDispatches, loadingData]);

    // Group and merge items in memory for preview
    const mergedLines = useMemo(() => {
        if (sourceDispatches.length === 0) return [];

        const itemMap = new Map();
        for (const disp of sourceDispatches) {
            for (const item of disp.items) {
                const varId = item.variantId || {};
                const varIdStr = String(varId._id || item.variantId);
                const qty = Number(item.qty || 0);

                if (itemMap.has(varIdStr)) {
                    const existing = itemMap.get(varIdStr);
                    existing.quantity += qty;
                } else {
                    const resolvedSku = item.sku || varId.sku || item.barcode || '-';
                    const resolvedBarcode = item.barcode || varId.barcode || resolvedSku;
                    const resolvedName = item.itemName || varId.itemName || item.itemId?.itemName || item.name || 'Product Name';
                    const resolvedColor = item.color || varId.color || item.itemId?.shade || '-';
                    const resolvedSize = item.size || varId.size || '-';
                    const resolvedCategory = item.category || item.itemId?.categoryId?.name || item.itemId?.categoryName || item.itemId?.category || 'OTHERS';
                    const resolvedHsn = item.hsnCode || item.itemId?.hsCodeId?.code || item.itemId?.hsnCode || '6109';

                    itemMap.set(varIdStr, {
                        itemId: item.itemId?._id || item.itemId,
                        variantId: varIdStr,
                        barcode: resolvedBarcode,
                        sku: resolvedSku,
                        itemName: resolvedName,
                        name: resolvedName,
                        color: resolvedColor,
                        size: resolvedSize,
                        category: resolvedCategory,
                        hsnCode: resolvedHsn,
                        quantity: qty,
                        rate: Number(item.rate || 0),
                        mrp: Number(item.mrp || 0),
                        discountPercent: Number(item.discountPercent || 0),
                        taxPercentage: Number(item.taxPercentage || 0)
                    });
                }
            }
        }
        return Array.from(itemMap.values());
    }, [sourceDispatches]);

    // Check if same GST entity (Internal transfer vs Sale)
    const isSameGSTEntity = useMemo(() => {
        if (sourceDispatches.length === 0) return true;
        const first = sourceDispatches[0];
        const sourceGst = (first.sourceWarehouseId?.gstNumber || '').trim().toUpperCase();
        const destGst = (first.destinationStoreId?.gstNumber || '').trim().toUpperCase();
        return sourceGst !== '' && sourceGst === destGst;
    }, [sourceDispatches]);

    // Financial calculations
    const totals = useMemo(() => {
        let subTotal = 0;
        let totalTax = 0;
        
        mergedLines.forEach((l) => {
            const lineSubTotal = l.rate * l.quantity;
            subTotal += lineSubTotal;
            
            if (!isSameGSTEntity && l.taxPercentage > 0) {
                // Approximate line tax for preview display
                const lineTax = lineSubTotal * (l.taxPercentage / 100);
                totalTax += lineTax;
            }
        });

        return {
            subTotal,
            totalTax,
            grandTotal: subTotal + totalTax
        };
    }, [mergedLines, isSameGSTEntity]);

    const handleConfirm = async () => {
        setError('');
        if (validationError) {
            setError(validationError);
            return;
        }

        showLoading('Combining challans and generating billing invoice...');
        try {
            const payload = {
                dispatchIds: selectedIds,
                notes: notes || `Combined dispatch of dispatches: ${sourceDispatches.map(d => d.dispatchNumber || d.challanNumber).join(', ')}`,
                date,
                vehicleNumber,
                driverName
            };

            const result = await dispatch(combineAndConfirmDispatch(payload)).unwrap();
            
            // Reload the combined dispatch details so printing has fully populated fields
            const reloadResp = await api.get(`/dispatch/${result.id || result._id}`);
            const fullyPopulatedDispatch = reloadResp.data.dispatch || reloadResp.data.data;
            
            setCombinedResult(fullyPopulatedDispatch || result);
            showNotification('Challans combined and Billing finalized successfully!', 'success');
            setShowPrint(true);
        } catch (err) {
            setError(err?.message || 'Failed to combine and finalize dispatches.');
        } finally {
            hideLoading();
        }
    };

    if (loadingData) {
        return (
            <Paper elevation={0} sx={{ p: 5, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#64748b' }}>
                    Loading selected challan details, please wait...
                </Typography>
            </Paper>
        );
    }

    const firstDispatch = sourceDispatches[0];

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 1 }}>
            {/* Header Block */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate(listPath)} color="primary">
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Combine & Billing Review
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Consolidating {selectedIds.length} draft challans into one single dispatch billing document.
                    </Typography>
                </Box>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {validationError && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {validationError}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left Column: Source Info, Shipping Info, and Merged Items */}
                <Grid item xs={12} lg={8}>
                    <Stack spacing={3}>
                        {/* Source Dispatches Card */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b' }}>
                                    Selected Source Challans
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {sourceDispatches.map((d) => (
                                        <Chip
                                            key={d.id || d._id}
                                            icon={<ReceiptLongOutlinedIcon />}
                                            label={`${d.dispatchNumber || d.challanNumber} (${d.items?.length || 0} items)`}
                                            variant="outlined"
                                            color="primary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    ))}
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                            Source Warehouse/Store
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                            {firstDispatch?.sourceWarehouseId?.name || 'Warehouse'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            GSTIN: {firstDispatch?.sourceWarehouseId?.gstNumber || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                            Destination Store
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                            {firstDispatch?.destinationStoreId?.name || 'Store'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            GSTIN: {firstDispatch?.destinationStoreId?.gstNumber || 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Combined Shipping & Logistics info */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                                    <LocalShippingOutlinedIcon color="primary" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        Logistics & Vehicle Information
                                    </Typography>
                                </Stack>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <TextField
                                            label="Combined Dispatch Date"
                                            type="date"
                                            fullWidth
                                            size="small"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

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
                                                    {mergedLines.length}
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
                                                    {mergedLines.reduce((acc, l) => acc + (l.quantity || 0), 0)}
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
                                                    ₹{totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                    ₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <Chip 
                                                label={isSameGSTEntity ? "Stock Transfer" : "Incl. Tax"} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: isSameGSTEntity ? '#dbeafe' : '#d1fae5', 
                                                    color: isSameGSTEntity ? '#1e40af' : '#065f46', 
                                                    fontWeight: 700, 
                                                    fontSize: '0.7rem' 
                                                }} 
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Merged Items Preview Table */}
                        <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <CardContent sx={{ p: 0 }}>
                                <Box sx={{ p: 3, pb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        Consolidated Line Items ({mergedLines.length} variants)
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Duplicate variants across selected challans are consolidated with summed quantities.
                                    </Typography>
                                </Box>
                                <TableContainer 
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
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Barcode / SKU</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }}>Category</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }} align="right">MRP</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }} align="right">Unit Rate</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }} align="right">Consolidated Qty</TableCell>
                                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc', zIndex: 1 }} align="right">Estimated Subtotal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mergedLines.map((row) => (
                                                <TableRow key={row.variantId} hover>
                                                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                                                        {row.barcode || row.sku}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>
                                                        {row.category}
                                                    </TableCell>
                                                    <TableCell align="right">₹{row.mrp.toFixed(2)}</TableCell>
                                                    <TableCell align="right">₹{row.rate.toFixed(2)}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0369a1' }}>
                                                        {row.quantity}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                        ₹{(row.rate * row.quantity).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* Right Column: Combined Invoice / Challan Summary */}
                <Grid item xs={12} lg={4}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, position: 'sticky', top: 20 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                                Combined Dispatch Summary
                            </Typography>
                            
                            <Stack spacing={2}>
                                <Stack direction="row" justifySelf="stretch" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        Source entity shared GSTIN?
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={isSameGSTEntity ? 'Yes (Same Entity)' : 'No (Different Entity)'}
                                        color={isSameGSTEntity ? 'success' : 'warning'}
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Stack>

                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        Generated Bill Document
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {isSameGSTEntity ? 'Transfer Bill (DC)' : 'Tax Invoice (Sale)'}
                                    </Typography>
                                </Stack>

                                <Divider sx={{ my: 1 }} />

                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        Total Taxable (Subtotal)
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        ₹{totals.subTotal.toFixed(2)}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        Estimated GST Tax
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: isSameGSTEntity ? '#94a3b8' : '#0f172a' }}>
                                        {isSameGSTEntity ? '₹0.00 (0% Transfer)' : `₹${totals.totalTax.toFixed(2)}`}
                                    </Typography>
                                </Stack>

                                <Divider sx={{ my: 1 }} />

                                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        Grand Total
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0369a1' }}>
                                        ₹{totals.grandTotal.toFixed(2)}
                                    </Typography>
                                </Stack>

                                <Alert severity="info" sx={{ py: 0.5, px: 1, fontSize: '0.8rem' }}>
                                    {isSameGSTEntity
                                        ? 'Note: This stock transfer will generate a Delivery Challan with 0% tax because source and destination share a GSTIN.'
                                        : 'Note: This transfer will generate a Tax Invoice starting from fresh number sequence starting at REB-0001.'}
                                </Alert>

                                <Stack spacing={1.5} sx={{ mt: 3 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        fullWidth
                                        disabled={Boolean(validationError)}
                                        onClick={handleConfirm}
                                    >
                                        Generate Bill & Dispatch
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        fullWidth
                                        disabled={Boolean(validationError)}
                                        onClick={() => setShowPreview(true)}
                                    >
                                        Preview Invoice
                                    </Button>
                                    <ReportExportButton
                                        headers={['Barcode/SKU', 'Item Name', 'Color', 'Size', 'Category', 'Quantity', 'Rate', 'MRP', 'Tax %', 'Subtotal']}
                                        headerKeys={['Barcode/SKU', 'Item Name', 'Color', 'Size', 'Category', 'Quantity', 'Rate', 'MRP', 'Tax %', 'Subtotal']}
                                        rows={mergedLines.map(row => ({
                                            'Barcode/SKU': row.barcode || row.sku,
                                            'Item Name': row.itemName,
                                            'Color': row.color,
                                            'Size': row.size,
                                            'Category': row.category,
                                            'Quantity': row.quantity,
                                            'Rate': row.rate.toFixed(2),
                                            'MRP': row.mrp.toFixed(2),
                                            'Tax %': row.taxPercentage,
                                            'Subtotal': (row.rate * row.quantity).toFixed(2)
                                        }))}
                                        filename={`Combined_Dispatch_Export.csv`}
                                        variant="outlined"
                                        fullWidth
                                    />
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        fullWidth
                                        onClick={() => navigate(listPath)}
                                    >
                                        Cancel & Back
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Success & Print Dialog integration */}
            <BillPrintDialog open={showPrint} onClose={() => { setShowPrint(false); navigate(listPath); }}>
                {combinedResult && (
                    <Box sx={{ p: 1 }}>
                        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', mb: 3 }} className="no-print">
                            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                Dispatch Completed Successfully!
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 400 }}>
                                The selected challans have been combined into dispatch reference: 
                                <strong> {combinedResult.referenceId?.saleNumber || combinedResult.referenceId?.dcNumber || combinedResult.dispatchNumber}</strong>.
                                {combinedResult.referenceId?.saleNumber && (
                                    <> Generated Tax Invoice: <strong>{combinedResult.referenceId.saleNumber}</strong>.</>
                                )}
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<PrintOutlinedIcon />}
                                onClick={() => window.print()}
                            >
                                Print Bill / Transfer Note
                            </Button>
                        </Stack>
                        <Divider sx={{ mb: 4 }} className="no-print" />
                        <StandardInvoicePrint
                            sale={combinedResult.referenceId || combinedResult}
                            isTransfer={isSameGSTEntity}
                        />
                    </Box>
                )}
            </BillPrintDialog>

            <BillPrintDialog open={showPreview} onClose={() => setShowPreview(false)}>
                {firstDispatch && (
                    <StandardInvoicePrint
                        sale={{
                            storeId: firstDispatch.sourceWarehouseId,
                            sourceWarehouseId: firstDispatch.sourceWarehouseId,
                            destinationStoreId: firstDispatch.destinationStoreId,
                            items: mergedLines,
                            type: isSameGSTEntity ? 'INTERNAL_SALE' : 'INTERNAL_SALE',
                            isTransfer: isSameGSTEntity,
                            grandTotal: totals.grandTotal,
                            subTotal: totals.subTotal,
                            totalTax: totals.totalTax,
                            invoiceNumber: 'PROFORMA',
                            saleDate: date,
                            createdAt: date
                        }}
                        isTransfer={isSameGSTEntity}
                        title={isSameGSTEntity ? 'STOCK TRANSFER NOTE' : 'TAX INVOICE'}
                    />
                )}
            </BillPrintDialog>
        </Box>
    );
}

export default CombineReviewForm;
