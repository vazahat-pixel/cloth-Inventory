import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
} from '@mui/material';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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

  const purchases = useSelector((state) => state.purchase.records || []);
  const grns = useSelector((state) => state.grn.records || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);
  const items = useSelector((state) => state.items.records || []);

  const availableLocations = useMemo(() => [...warehouses, ...stores], [warehouses, stores]);

  const existingPurchase = useMemo(() => isEditMode ? purchases.find(p => (p.id || p._id) === id) : null, [id, isEditMode, purchases]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      supplierId: '',
      warehouseId: '',
      invoiceNumber: '',
      invoiceDate: getTodayDate(),
      otherCharges: 0,
      notes: ''
    }
  });

  const [lines, setLines] = useState([]);
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

  // Handle URL grnId Redirect
  useEffect(() => {
    if (grnId && !isEditMode) {
      const grn = grns.find(g => (g._id || g.id) === grnId);
      if (grn) {
        populateFromGRN(grn);
      } else {
         dispatch(fetchGrnById(grnId)).unwrap().then(populateFromGRN);
      }
    }
  }, [grnId, grns, isEditMode]);

  useEffect(() => {
    if (isEditMode && existingPurchase) {
      reset({
        supplierId: existingPurchase.supplierId?._id || existingPurchase.supplierId,
        warehouseId: existingPurchase.warehouseId?._id || existingPurchase.warehouseId || existingPurchase.storeId,
        invoiceNumber: existingPurchase.invoiceNumber || '',
        invoiceDate: (existingPurchase.invoiceDate || '').slice(0, 10),
        otherCharges: existingPurchase.totals?.otherCharges || 0,
        notes: existingPurchase.remarks || ''
      });
      setLines((existingPurchase.items || []).map(i => ({
        id: i._id || Math.random().toString(),
        itemId: i.itemId?._id || i.itemId,
        itemName: i.itemId?.name || i.itemName || 'Item',
        variantId: i.variantId,
        sku: i.sku || '',
        size: i.size || '-',
        color: i.color || '-',
        quantity: i.quantity || 0,
        rate: i.rate || 0,
        discount: i.discount || 0,
        tax: i.tax || 0,
        lotNumber: i.batchNumber || ''
      })));
    }
  }, [isEditMode, existingPurchase, reset]);

  const populateFromGRN = (grn) => {
    setValue('supplierId', grn.supplierId?._id || grn.supplierId || '', { shouldValidate: true });
    setValue('warehouseId', grn.warehouseId?._id || grn.warehouseId || '', { shouldValidate: true });
    setValue('notes', `Lined to GRN: ${grn.grnNumber}`);
    
    const mapped = (grn.items || []).map(item => {
      const itm = item.itemId || {};
      const vrnt = (itm.sizes || []).find(v => String(v._id || v.id) === String(item.variantId)) || {};
      return {
        id: Math.random().toString(36).substr(2, 9),
        itemId: itm._id || itm.id || item.itemId,
        itemName: itm.name || itm.itemName || item.itemName || 'Item',
        variantId: item.variantId,
        sku: item.sku || vrnt.sku || '',
        size: item.size || vrnt.size || '-',
        color: item.color || vrnt.color || '-',
        quantity: item.receivedQty || 0,
        rate: item.costPrice || 0,
        discount: item.discount || 0,
        tax: item.tax || 0,
        lotNumber: item.batchNumber || ''
      };
    });
    setLines(mapped);
  };

  const updateLineField = (id, field, value) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const onSubmit = async (data) => {
    if (!lines.length) return alert('Add at least one item');
    const payload = { ...data, items: lines.map(l => ({ ...l, batchNumber: l.lotNumber })), totals };
    try {
      if (isEditMode) await dispatch(updatePurchase({ id, purchaseData: payload })).unwrap();
      else await dispatch(addPurchase(payload)).unwrap();
      navigate(basePath === '/ho' ? '/purchase/purchase-voucher' : '/purchase');
    } catch (e) { alert(e); }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>{isEditMode ? 'Edit' : 'New'} Purchase Voucher</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Process supplier invoices and record inward stock details.</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit(onSubmit)}>{isEditMode ? 'Update' : 'Save'} Voucher</Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 4, mb: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              {/* Row 1: Primary Automation */}
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={grns.filter(g => String(g.status).toUpperCase() === 'APPROVED' && !g.purchaseId)}
                  getOptionLabel={(o) => `${o.grnNumber} ${o.invoiceNumber ? `| Ref: ${o.invoiceNumber}` : ''} | ${o.supplierId?.name || o.supplierId?.supplierName || 'Unknown'}`}
                  renderInput={(params) => <TextField {...params} label="Import Approved GRN (Auto-fill)" placeholder="Search GRN Number..." sx={{ '& .MuiInputBase-root': { bgcolor: '#f1f5f9' } }} />}
                  onChange={(_, val) => val && populateFromGRN(val)}
                  disabled={isEditMode}
                />
              </Grid>

              {/* Row 2: Crucial Dropdowns - FIXED WIDTH */}
              <Grid item xs={12} md={6}>
                <TextField select fullWidth size="small" label="Supplier / Vendor" {...register('supplierId', { required: true })} error={Boolean(errors.supplierId)}>
                  {suppliers.map(s => <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.name || s.supplierName}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField select fullWidth size="small" label="Warehouse / Location" {...register('warehouseId', { required: true })} error={Boolean(errors.warehouseId)}>
                  {availableLocations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Row 3: Tracking Info */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="PV Number" value={existingPurchase?.purchaseNumber || 'PV-NEW'} disabled helperText="System generated ID" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="Vendor Bill / Invoice No." {...register('invoiceNumber', { required: true })} error={Boolean(errors.invoiceNumber)} placeholder="e.g. BILL-9921" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" type="date" label="Bill Date" InputLabelProps={{ shrink: true }} {...register('invoiceDate', { required: true })} />
              </Grid>
            </Grid>
          </Grid>

          {/* Amount Summary Box */}
          <Grid item xs={12} md={3}>
            <Box sx={{ p: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="overline" sx={{ color: '#166534', fontWeight: 800, mb: 1 }}>Total Payable</Typography>
              <Typography variant="h3" sx={{ color: '#166534', fontWeight: 900 }}>₹{totals.netAmount.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ color: '#166534', mt: 1, opacity: 0.8 }}>Inclusive of Taxes & Discounts</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Itemized Entries</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Disc %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">GST %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => {
                const amount = (line.quantity * line.rate * (1 - line.discount/100) * (1 + line.tax/100)).toFixed(2);
                return (
                  <TableRow key={line.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{line.itemName}</TableCell>
                    <TableCell><Chip size="small" label={`${line.size} / ${line.color}`} variant="outlined" /></TableCell>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.8rem' }}>{line.sku}</TableCell>
                    <TableCell align="right"><TextField size="small" type="number" sx={{ width: 80 }} value={line.quantity} onChange={(e) => updateLineField(line.id, 'quantity', toNumber(e.target.value))} /></TableCell>
                    <TableCell align="right"><TextField size="small" type="number" sx={{ width: 100 }} value={line.rate} onChange={(e) => updateLineField(line.id, 'rate', toNumber(e.target.value))} /></TableCell>
                    <TableCell align="right"><TextField size="small" type="number" sx={{ width: 70 }} value={line.discount} onChange={(e) => updateLineField(line.id, 'discount', toNumber(e.target.value))} /></TableCell>
                    <TableCell align="right"><TextField size="small" type="number" sx={{ width: 70 }} value={line.tax} onChange={(e) => updateLineField(line.id, 'tax', toNumber(e.target.value))} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{amount}</TableCell>
                    <TableCell align="center"><IconButton color="error" size="small" onClick={() => setLines(prev => prev.filter(l => l.id !== line.id))}><DeleteOutlineIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!lines.length && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>No variants imported. Use the dropdown above to auto-fill from a GRN.</Typography>
          </Box>
        )}
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end', alignItems: 'center' }}>
        <TextField size="small" type="number" label="Freight / Other Charges" {...register('otherCharges')} sx={{ width: 220 }} />
        <Button variant="contained" size="large" startIcon={<SaveOutlinedIcon />} sx={{ px: 4 }} onClick={handleSubmit(onSubmit)}>Post Voucher</Button>
      </Stack>
    </Box>
  );
}

export default PurchaseFormPage;
