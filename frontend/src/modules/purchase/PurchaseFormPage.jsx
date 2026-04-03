import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api'; // Added import

import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Box,
  Button,
  Chip,
  Grid,
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
  Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import { addPurchase, updatePurchase, fetchPurchases } from './purchaseSlice';
import { fetchGrns, fetchGrnById } from '../grn/grnSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const calculateTotals = (lines, otherCharges) => {
  return lines.reduce((acc, l) => {
    const q = toNumber(l.quantity);
    const r = toNumber(l.rate);
    const dPct = toNumber(l.discount);
    const tPct = toNumber(l.tax);
    const gross = q * r;
    const dVal = (gross * dPct) / 100;
    const taxable = gross - dVal;
    const tVal = (taxable * tPct) / 100;
    acc.totalQuantity += q;
    acc.grossAmount += gross;
    acc.totalDiscount += dVal;
    acc.totalTax += tVal;
    acc.netAmount = Number((acc.grossAmount - acc.totalDiscount + acc.totalTax + toNumber(otherCharges)).toFixed(2));
    return acc;
  }, { totalQuantity: 0, grossAmount: 0, totalDiscount: 0, totalTax: 0, otherCharges: toNumber(otherCharges), netAmount: 0 });
};

function PurchaseFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const grnId = searchParams.get('grnId');
  const isEditMode = Boolean(id);

  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const basePath = useRoleBasePath();

  const purchases = useSelector((s) => s.purchase.records || []);
  const grns = useSelector((s) => s.grn.records || []);
  const suppliers = useSelector((s) => s.masters.suppliers || []);
  const warehouses = useSelector((s) => s.masters.warehouses || []);
  const stores = useSelector((s) => s.masters.stores || []);
  const items = useSelector((s) => s.items.records || []);

  const availableLocations = useMemo(() => {
    // Return only warehouses as per user requirement (Procurement to Warehouse ONLY)
    return warehouses.map(w => ({ ...w, _id: w._id || w.id, name: w.name }));
  }, [warehouses]);

  const existingPurchase = useMemo(() =>
    isEditMode ? purchases.find(p => (p.id || p._id) === id) : null,
    [id, isEditMode, purchases]
  );

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      type: 'RAW_MATERIAL', // Default to RM as per new flow
      supplierId: '',
      warehouseId: '',
      invoiceNumber: '',
      invoiceDate: getTodayDate(),
      otherCharges: 0,
      notes: ''
    }
  });

  const [lines, setLines] = useState([]);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [linkedGrnId, setLinkedGrnId] = useState(grnId || null);
  const otherChargesWatch = watch('otherCharges', 0);
  const totals = useMemo(() => calculateTotals(lines, otherChargesWatch), [lines, otherChargesWatch]);

  useEffect(() => {
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
    dispatch(fetchItems());
    dispatch(fetchPurchases());
    dispatch(fetchGrns());
  }, [dispatch]);

  // Handle URL ?grnId= redirect (from GRN list "Generate Bill" button)
  useEffect(() => {
    if (!grnId || isEditMode) return;
    const grn = grns.find(g => (g._id || g.id) === grnId);
    if (grn) {
      populateFromGRN(grn);
    } else {
      dispatch(fetchGrnById(grnId)).unwrap().then(populateFromGRN).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grnId, grns, isEditMode]);

  // Load existing purchase for edit mode
  useEffect(() => {
    if (!isEditMode || !existingPurchase) return;
    
    const supplierId = String(existingPurchase.supplierId?._id || existingPurchase.supplierId || '');
    const warehouseId = String(existingPurchase.storeId?._id || existingPurchase.storeId || '');
    const grnIdFromRec = String(existingPurchase.grnId?._id || existingPurchase.grnId || '');

    reset({
      supplierId,
      warehouseId,
      invoiceNumber: existingPurchase.invoiceNumber || '',
      invoiceDate: (existingPurchase.invoiceDate || '').slice(0, 10),
      otherCharges: existingPurchase.otherCharges || 0,
      notes: existingPurchase.notes || ''
    });

    if (grnIdFromRec) {
      setLinkedGrnId(grnIdFromRec);
    }

    const linesFromDb = (existingPurchase.products || []).map(i => ({
      id: i._id || Math.random().toString(36).substring(2, 9),
      itemId: String(i.itemId?._id || i.itemId || ''),
      itemName: i.itemName || i.itemId?.itemName || 'Item',
      variantId: i.variantId,
      sku: i.sku || '',
      size: i.size || '-',
      color: i.color || '-',
      quantity: i.quantity || 0,
      rate: i.rate || 0,
      discount: i.discountPercentage || 0,
      tax: i.taxPercentage || 0,
      total: i.total || 0,
      lotNumber: i.batchNo || i.lotNumber || ''
    }));
    setLines(linesFromDb);
  }, [isEditMode, existingPurchase, reset, availableLocations.length]);

  // Sync effect: Ensure dropdowns are set once masters are loaded
  useEffect(() => {
    if (isEditMode && existingPurchase) {
      const sId = String(existingPurchase.supplierId?._id || existingPurchase.supplierId || '');
      const wId = String(existingPurchase.storeId?._id || existingPurchase.storeId || '');
      
      // If we have IDs and the respective master lists are not empty
      if (sId && suppliers.length > 0) {
        setValue('supplierId', sId, { shouldDirty: false });
      }
      if (wId && availableLocations.length > 0) {
        setValue('warehouseId', wId, { shouldDirty: false });
      }
      if (existingPurchase.grnId && !linkedGrnId) {
        setLinkedGrnId(String(existingPurchase.grnId?._id || existingPurchase.grnId || ''));
      }
    }
  }, [isEditMode, existingPurchase, suppliers.length, availableLocations.length, setValue, linkedGrnId]);

  const populateFromGRN = (grn) => {
    if (!grn) return;

    // CRITICAL: Convert ObjectId to string for MUI Select value matching
    const supplierId = String(grn.supplierId?._id || grn.supplierId || '');
    const warehouseId = String(grn.warehouseId?._id || grn.warehouseId || '');

    // Use setValue with shouldDirty + shouldTouch to force react-hook-form + Controller re-render
    setValue('supplierId', supplierId, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('warehouseId', warehouseId, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('notes', `Billed against GRN: ${grn.grnNumber}`, { shouldDirty: true });

    // Track linked GRN ID for PV creation (enables GRN-PV linking in backend)
    setLinkedGrnId(String(grn._id || grn.id || ''));

    // Auto-fill vendor invoice number from GRN (supplier's bill ref captured at receipt)
    // This is correct ERP behavior: GRN invoice # flows into PV as vendor bill reference
    if (grn.invoiceNumber) {
      setValue('invoiceNumber', grn.invoiceNumber, { shouldValidate: true, shouldDirty: true });
    }

    const mapped = (grn.items || []).map(item => {
      // item.itemId is populated from backend (has itemName, shade, gstTax, sizes)
      const itemDoc = item.itemId || {};
      const itemDocId = String(itemDoc._id || itemDoc.id || item.itemId || '');

      // Also check local Redux items store as fallback
      const localItem = items.find(i => String(i._id || i.id) === itemDocId);
      const mergedItem = { ...localItem, ...itemDoc };

      // Find variant in sizes array for size label
      const variantDoc = (mergedItem.sizes || []).find(
        v => String(v._id || v.id) === String(item.variantId)
      ) || {};

      // Tax priority: GRN item tax > item's gstTax from master > 0
      const tax = toNumber(item.tax) || toNumber(mergedItem.gstTax) || 0;
      // Discount priority: GRN item discount > 0
      const discount = toNumber(item.discount) || 0;

      return {
        id: Math.random().toString(36).substr(2, 9),
        itemId: itemDocId,
        itemName: mergedItem.itemName || item.itemName || 'Item',
        variantId: item.variantId,
        sku: item.sku || variantDoc.sku || '',
        size: item.size || variantDoc.size || '-',
        color: item.color || mergedItem.shade || '-',
        quantity: item.receivedQty || 0,
        rate: item.costPrice || 0,
        discount,
        tax,
        lotNumber: item.batchNumber || ''
      };
    });
    setLines(mapped);
  };

  const handleScanner = async (barcode) => {
    try {
      // Use the new scan endpoint
      const response = await api.get(`/items/scan/${barcode}`);
      const { item, variant } = response.data.data;
      
      const newLine = {
        id: Math.random().toString(36).substr(2, 9),
        itemId: item._id,
        itemName: item.itemName,
        variantId: variant._id,
        sku: variant.sku,
        size: variant.size,
        color: item.shade || '-',
        quantity: 1,
        rate: variant.costPrice || 0,
        discount: 0,
        tax: item.gstTax || 0,
        lotNumber: ''
      };

      setLines(prev => [...prev, newLine]);
      setBarcodeSearch(''); // clear search
    } catch (e) {
      alert('Item not found or scan failed.');
    }
  };

  const handleAddItem = (item) => {
    if (!item) return;
    const newLine = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: item._id || item.id,
      itemName: item.itemName,
      variantId: item.sizes?.[0]?._id || item.sizes?.[0]?.id || null, // Default to first variant
      sku: item.sizes?.[0]?.sku || item.itemCode,
      size: item.sizes?.[0]?.size || 'N/A',
      color: item.shade || '-',
      quantity: 1,
      rate: item.sizes?.[0]?.costPrice || 0,
      discount: 0,
      tax: item.gstTax || 0,
      lotNumber: ''
    };
    setLines(prev => [...prev, newLine]);
  };

  const updateLineField = (lineId, field, value) => {
    setLines(prev => prev.map(l => l.id === lineId ? { ...l, [field]: value } : l));
  };

  const onSubmit = async (data) => {
    if (!lines.length) return alert('Add at least one item line.');
    const payload = {
      ...data,
      // Explicitly send otherCharges at root level (backend reads it directly)
      otherCharges: toNumber(data.otherCharges),
      // Send items array (backend supports both 'items' and 'products' key)
      items: lines.map(l => ({
        ...l,
        batchNumber: l.lotNumber,
        // ensure numeric fields are numbers not strings
        quantity: toNumber(l.quantity),
        rate: toNumber(l.rate),
        discount: toNumber(l.discount),
        tax: toNumber(l.tax),
      })),
      // Link to GRN for traceability (GRN gets marked as INVOICED)
      grnId: linkedGrnId || undefined,
      totals
    };
    try {
      if (isEditMode) {
        await dispatch(updatePurchase({ id, purchaseData: payload })).unwrap();
      } else {
        await dispatch(addPurchase(payload)).unwrap();
      }
      navigate('/purchase/purchase-voucher');
    } catch (e) {
      alert(typeof e === 'string' ? e : e?.message || 'Failed to save voucher.');
    }
  };

  // Approved GRNs not yet billed (INVOICED ones are excluded - already have a PV)
  const approvedGrns = useMemo(() =>
    grns.filter(g => {
      const status = String(g.status).toUpperCase();
      return status === 'APPROVED' && !g.purchaseId;
    }),
    [grns]
  );

  const typeWatch = watch('type');

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Header */}
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {isEditMode ? 'Edit' : 'New'} Purchase Voucher
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Record {typeWatch.replace('_', ' ')} entries.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit(onSubmit)}>
            {isEditMode ? 'Update' : 'Save'} Voucher
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3, mb: 3 }}>
        
        {/* Step 1: Inward Category */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
           <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#475569' }}>1. INWARD CATEGORY</Typography>
           <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Stack direction="row" spacing={1.5}>
                  {[
                    { val: 'RAW_MATERIAL', label: 'Fabric / Raw Material' },
                    { val: 'ACCESSORY', label: 'Accessories' },
                    { val: 'FINISHED_GOOD', label: 'Finished Goods (GRN)' }
                  ].map((cat) => (
                    <Button
                      key={cat.val}
                      variant={field.value === cat.val ? 'contained' : 'outlined'}
                      color={field.value === cat.val ? 'primary' : 'inherit'}
                      onClick={() => {
                        field.onChange(cat.val); 
                        if (cat.val !== 'FINISHED_GOOD') { setLinkedGrnId(null); setLines([]); }
                      }}
                      sx={{ 
                        borderRadius: 2, px: 3, py: 1, 
                        fontWeight: 700, textTransform: 'none',
                        ...(field.value === cat.val && { boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' })
                      }}
                    >
                      {cat.label}
                    </Button>
                  ))}
                </Stack>
              )}
           />
        </Box>

        {/* Step 2: Source / Linkage */}
        <Box sx={{ mb: 3 }}>
          {typeWatch === 'FINISHED_GOOD' ? (
              <Autocomplete
                size="small"
                fullWidth
                options={approvedGrns}
                value={grns.find(g => String(g._id || g.id) === linkedGrnId) || null}
                getOptionLabel={(o) =>
                  typeof o === 'string' ? o :
                  `${o.grnNumber || ''}${o.invoiceNumber ? ` · Bill: ${o.invoiceNumber}` : ''} — ${o.supplierId?.name || o.supplierId?.supplierName || 'Supplier'}`
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{option.grnNumber}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {option.supplierId?.name || option.supplierId?.supplierName || '—'}
                        {option.invoiceNumber ? ` · Bill# ${option.invoiceNumber}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Link Approved GRN to Auto-fill"
                    placeholder="Search by GRN Number or Supplier..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Box component="span" sx={{ color: '#10b981', mr: 0.5, fontSize: '1rem' }}>🔗</Box>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: '#f0fdf4' } }}
                  />
                )}
                onChange={(_, val) => val && populateFromGRN(val)}
                disabled={isEditMode}
                isOptionEqualToValue={(opt, val) => String(opt._id || opt.id) === String(val._id || val.id)}
              />
          ) : typeWatch === 'RAW_MATERIAL' ? (
              <Autocomplete
                size="small"
                fullWidth
                options={items.filter(i => i.type === 'RAW_MATERIAL' || !i.type)}
                getOptionLabel={(o) => `${o.itemName} (${o.itemCode})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Raw Material (Physical Entry)"
                    placeholder="Search by Style Code or Name..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <Box component="span" sx={{ mr: 1 }}>🧵</Box>,
                    }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: '#fff7ed' } }}
                  />
                )}
                onChange={(_, val) => val && handleAddItem(val)}
              />
          ) : (
              <TextField 
                fullWidth size="small"
                placeholder="🔍 Scanner Search: Type item code or scan barcode..."
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanner(barcodeSearch);
                  }
                }}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1, fontSize: '1.2rem' }}>⚡</Box>,
                  sx: { bgcolor: '#eff6ff', border: '1px dashed #3b82f6', '&:hover': { bgcolor: '#dbeafe' } }
                }}
                helperText={`Scan ${typeWatch.replace('_', ' ')} barcodes to add them below.`}
              />
          )}
        </Box>

        {/* Row 2: Supplier & Warehouse — 2 equal columns */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Controller
              name="supplierId"
              control={control}
              rules={{ required: 'Supplier is required' }}
              render={({ field }) => (
                <TextField
                  select fullWidth size="small"
                  label="Supplier / Vendor"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(errors.supplierId)}
                  helperText={errors.supplierId?.message}
                >
                  <MenuItem value=""><em>— Select Supplier —</em></MenuItem>
                  {suppliers.map(s => (
                    <MenuItem key={s._id || s.id} value={String(s._id || s.id)}>
                      {s.name || s.supplierName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="warehouseId"
              control={control}
              rules={{ required: 'Warehouse is required' }}
              render={({ field }) => (
                <TextField
                  select fullWidth size="small"
                  label="Receiving Warehouse / Store"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(errors.warehouseId)}
                  helperText={errors.warehouseId?.message}
                >
                  <MenuItem value=""><em>— Select Location —</em></MenuItem>
                  {availableLocations.map(loc => (
                    <MenuItem key={loc._id || loc.id} value={String(loc._id || loc.id)}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>

        {/* Row 3: Document Reference — 3 equal columns */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              label="System PV Number"
              value={existingPurchase?.purchaseNumber || 'PV-NEW'}
              disabled
              helperText="Auto-generated on save"
              sx={{ '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              label="Vendor Bill / Invoice No."
              {...register('invoiceNumber', { required: 'Invoice number required' })}
              error={Boolean(errors.invoiceNumber)}
              helperText={errors.invoiceNumber?.message || 'From supplier physical bill'}
              placeholder="e.g. INV/2024/0091"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              type="date"
              label="Bill Date"
              InputLabelProps={{ shrink: true }}
              {...register('invoiceDate', { required: true })}
            />
          </Grid>
        </Grid>

        {/* Financial Summary Strip */}
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
          p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0'
        }}>
          <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
              Subtotal
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              ₹{totals.grossAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Box sx={{ color: '#cbd5e1', fontSize: 20 }}>—</Box>
          <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, display: 'block' }}>
              Discount
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#dc2626' }}>
              ₹{totals.totalDiscount.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ color: '#cbd5e1', fontSize: 20 }}>+</Box>
          <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 600, display: 'block' }}>
              GST / Tax
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2563eb' }}>
              ₹{totals.totalTax.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ color: '#cbd5e1', fontSize: 20 }}>+</Box>
          <Box sx={{ flex: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
              Other Charges
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#64748b' }}>
              ₹{toNumber(otherChargesWatch).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ color: '#cbd5e1', fontSize: 20 }}>=</Box>
          <Box sx={{
            flex: 2, minWidth: 160, textAlign: 'center',
            p: 1.5, bgcolor: '#166534', borderRadius: 2
          }}>
            <Typography variant="caption" sx={{ color: '#bbf7d0', fontWeight: 700, display: 'block' }}>
              TOTAL PAYABLE
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff' }}>
              ₹{totals.netAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Box>

      </Paper>

      {/* Item Lines Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Itemized Entries
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Rate (₹)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Disc %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">GST %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount (₹)</TableCell>
                <TableCell align="center">Del</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => {
                const gross = line.quantity * line.rate;
                const discAmt = (gross * line.discount) / 100;
                const taxAmt = ((gross - discAmt) * line.tax) / 100;
                const amount = (gross - discAmt + taxAmt).toFixed(2);
                return (
                  <TableRow key={line.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{line.itemName}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${line.size} / ${line.color}`}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.78rem' }}>{line.sku}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" sx={{ width: 80 }}
                        value={line.quantity}
                        onChange={(e) => updateLineField(line.id, 'quantity', toNumber(e.target.value))}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" sx={{ width: 100 }}
                        value={line.rate}
                        onChange={(e) => updateLineField(line.id, 'rate', toNumber(e.target.value))}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" sx={{ width: 70 }}
                        value={line.discount}
                        onChange={(e) => updateLineField(line.id, 'discount', toNumber(e.target.value))}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" sx={{ width: 70 }}
                        value={line.tax}
                        onChange={(e) => updateLineField(line.id, 'tax', toNumber(e.target.value))}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {Number(amount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error" size="small"
                        onClick={() => setLines(prev => prev.filter(l => l.id !== line.id))}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!lines.length && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              No items yet. Select an Approved GRN above to auto-fill.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Footer Actions */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
        <TextField
          size="small" type="number"
          label="Freight / Other Charges"
          sx={{ width: 220 }}
          {...register('otherCharges')}
        />
        <Button
          variant="contained" size="large"
          startIcon={<SaveOutlinedIcon />}
          sx={{ px: 5 }}
          onClick={handleSubmit(onSubmit)}
        >
          Post Voucher
        </Button>
      </Stack>
    </Box>
  );
}

export default PurchaseFormPage;
