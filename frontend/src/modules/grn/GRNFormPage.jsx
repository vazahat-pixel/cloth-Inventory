import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FormSection from '../../components/erp/FormSection';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchPurchaseOrders } from '../purchase/purchaseSlice';
import { fetchItems } from '../items/itemsSlice';
import { addGrn, approveGrn, fetchGrnById, fetchNextGrnNumber } from './grnSlice';

const defaultForm = {
  grnNumber: '',
  grnDate: new Date().toISOString().slice(0, 10),
  purchaseOrderId: '',
  supplierId: '',
  warehouseId: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  remarks: '',
  status: 'DRAFT',
};

function GRNFormPage({ mode = 'edit' }) {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = mode === 'view';
  
  const { records: grns, loading: grnLoading } = useSelector((state) => state.grn);
  const purchaseOrders = useSelector((state) => state.purchase.orders || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const allItems = useSelector((state) => state.items.records || []);

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const existingGrn = useMemo(() => grns.find(g => (g._id || g.id) === id), [grns, id]);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchItems());
    if (id) {
        dispatch(fetchGrnById(id));
    } else {
        dispatch(fetchNextGrnNumber()).unwrap().then(nextNo => {
            setFormValues(prev => ({ ...prev, invoiceNumber: nextNo }));
        });
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id && existingGrn) {
      setFormValues({
        grnNumber: existingGrn.grnNumber,
        grnDate: existingGrn.grnDate?.slice(0, 10) || defaultForm.grnDate,
        purchaseOrderId: existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId || '',
        supplierId: existingGrn.supplierId?._id || existingGrn.supplierId || '',
        warehouseId: existingGrn.warehouseId?._id || existingGrn.warehouseId || '',
        invoiceNumber: existingGrn.invoiceNumber || '',
        invoiceDate: existingGrn.invoiceDate?.slice(0, 10) || defaultForm.invoiceDate,
        remarks: existingGrn.remarks || '',
        status: existingGrn.status || 'DRAFT',
      });
      setLines((existingGrn.items || []).map((item, idx) => {
        const base = item.itemId || {};
        const variant = (base.sizes || []).find(v => (v._id || v.id).toString() === (item.variantId || "").toString());
        const poMatch = (existingGrn.purchaseOrderId?.items || []).find(pi => (pi.variantId || "").toString() === (item.variantId || "").toString());
        return {
            ...item,
            id: item._id || `idx-${idx}`,
            itemCode: base.itemCode || item.itemCode || '-',
            itemName: base.itemName || item.itemName || 'Item',
            shade: base.shade || item.shade || '',
            size: variant?.size || item.size || '-',
            color: variant?.color || item.color || '',
            orderedQty: poMatch?.qty || poMatch?.quantity || 0,
        };
      }));
    } else if (!id) {
        const poId = searchParams.get('poId');
        if (poId) {
            const po = purchaseOrders.find(o => o.id === poId || o._id === poId);
            if (po) {
                setFormValues(prev => ({
                    ...prev,
                    purchaseOrderId: poId,
                    supplierId: po.supplierId,
                    remarks: po.notes || ''
                }));
                // Auto-fill lines from PO
                setLines((po.items || []).map((item, idx) => ({
                    id: `new-${idx}`,
                    productId: item.productId,
                    itemName: item.itemName || 'Item',
                    orderedQty: item.qty || item.quantity,
                    receivedQty: item.qty || item.quantity,
                    acceptedQty: item.qty || item.quantity,
                    rejectedQty: 0,
                    rate: item.price || item.rate,
                    batchNumber: ''
                })));
            }
        }
    }
  }, [id, existingGrn, purchaseOrders, searchParams]);

  const totals = useMemo(() => {
    return lines.reduce((acc, curr) => {
        acc.ordered += Number(curr.orderedQty || 0);
        acc.received += Number(curr.receivedQty || 0);
        acc.accepted += Number(curr.acceptedQty || 0);
        acc.rejected += Number(curr.rejectedQty || 0);
        return acc;
    }, { ordered: 0, received: 0, accepted: 0, rejected: 0 });
  }, [lines]);

  const updateLine = (idx, field, val) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: val };
    setLines(newLines);
  };

  const addItemToLines = (item) => {
    if (!item || !item.sizes?.length) return;
    
    const newLines = item.sizes.map(v => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        itemId: item._id || item.id,
        variantId: v._id || v.id,
        itemName: item.itemName,
        itemCode: item.itemCode,
        shade: item.shade,
        size: v.size,
        sku: v.sku,
        orderedQty: 0,
        receivedQty: 0,
        costPrice: v.costPrice || 0,
        batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    }));

    setLines([...lines, ...newLines]);
    setSelectedItem(null); // Reset search
  };

  const removeLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const isLocked = isViewMode || (id && formValues.status !== 'DRAFT');

  useEffect(() => {
    if (!id && formValues.purchaseOrderId) {
      const po = purchaseOrders.find((o) => (o.id || o._id) === formValues.purchaseOrderId);
      if (po) {
        // Correctly handle populated supplierId from backend
        const suppId = (typeof po.supplierId === 'object' && po.supplierId !== null) 
          ? (po.supplierId._id || po.supplierId.id) 
          : po.supplierId;

        setFormValues((prev) => ({
          ...prev,
          supplierId: suppId || '',
          remarks: po.notes || '',
        }));
        
        const poItems = po.items || [];
        setLines(
          poItems.map((item, idx) => ({
            id: `line-${idx}-${Date.now()}`,
            itemId: item.itemId?._id || item.itemId,
            variantId: item.variantId?._id || item.variantId,
            itemName: item.itemName || 'Item',
            itemCode: item.itemCode || '',
            size: item.size || '',
            color: item.color || '',
            sku: item.sku || '',
            orderedQty: item.qty || item.quantity,
            receivedQty: item.qty || item.quantity,
            acceptedQty: item.qty || item.quantity,
            costPrice: item.price || item.rate || 0,
            batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
          }))
        );
      }
    }
  }, [formValues.purchaseOrderId, purchaseOrders, id]);

  const handleSave = async (isDraft = true) => {
    try {
      setErrorMessage('');
      const payload = {
        ...formValues,
        items: lines
          .map((l) => ({
            itemId: l.itemId,
            variantId: l.variantId,
            sku: l.sku,
            receivedQty: Number(l.receivedQty || 0),
            costPrice: Number(l.costPrice || 0),
            batchNumber: l.batchNumber || `B-${Date.now().toString().slice(-4)}`,
          }))
          .filter((l) => l.receivedQty > 0),
      };

      if (!payload.items.length) {
        throw new Error('Please enter quantity for at least one item.');
      }

      const result = await dispatch(addGrn(payload)).unwrap();
      
      if (!isDraft) {
        await dispatch(approveGrn(result._id || result.id)).unwrap();
        setSuccessMessage('GRN created and approved successfully');
      } else {
        setSuccessMessage('GRN created successfully');
      }

      setTimeout(() => navigate('/ho/grn'), 1500);
    } catch (err) {
      setErrorMessage(typeof err === 'string' ? err : err.message || 'Failed to save GRN');
    }
  };

  if (grnLoading && id) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <PageHeader
        title={isViewMode ? `GRN - ${formValues.grnNumber || formValues.invoiceNumber}` : id ? `Edit GRN - ${formValues.grnNumber || formValues.invoiceNumber}` : 'Create GRN'}
        subtitle="Receipt goods against Purchase Order or Voucher."
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/ho/grn')}>
            Back
          </Button>,
          !isLocked && (
            <Button key="save" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => handleSave(true)}>
              Save Draft
            </Button>
          ),
          !isLocked && (
            <Button key="approve" variant="contained" color="success" startIcon={<TaskAltOutlinedIcon />} onClick={() => setConfirmOpen(true)}>
              Approve & Post
            </Button>
          )
        ].filter(Boolean)}
      />

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  select 
                  fullWidth 
                  label="Purchase Order" 
                  size="small" 
                  value={formValues.purchaseOrderId} 
                  onChange={e => setFormValues({...formValues, purchaseOrderId: e.target.value})} 
                  disabled={!!id}
                >
                  <MenuItem value="">Direct Receipt</MenuItem>
                  {purchaseOrders
                    .map((po) => (
                      <MenuItem key={po.id || po._id} value={po.id || po._id}>
                        {po.poNumber} - {po.supplierId?.name || 'Direct'}
                      </MenuItem>
                    ))}
                  {/* Fallback for populated PO and view mode if not in list */}
                  {id && existingGrn?.purchaseOrderId && !purchaseOrders.find(o => (o._id || o.id) === (existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId)) && (
                    <MenuItem key={existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId} value={existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId}>
                        {existingGrn.purchaseOrderId?.poNumber || 'Original PO'}
                    </MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  select 
                  fullWidth 
                  label="Supplier" 
                  size="small" 
                  value={formValues.supplierId} 
                  onChange={e => setFormValues({...formValues, supplierId: e.target.value})} 
                  disabled={!!id || !!formValues.purchaseOrderId}
                >
                  {suppliers.map(s => (
                    <MenuItem key={s.id || s._id} value={s.id || s._id}>
                      {s.supplierName || s.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  select 
                  fullWidth 
                  label="Warehouse / Store" 
                  size="small" 
                  value={formValues.warehouseId} 
                  onChange={e => setFormValues({...formValues, warehouseId: e.target.value})} 
                  disabled={isLocked}
                >
                  {warehouses.map(w => (
                    <MenuItem key={w.id || w._id} value={w.id || w._id}>
                      {w.warehouseName || w.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  fullWidth 
                  label="GRN Number" 
                  size="small" 
                  value={formValues.grnNumber || formValues.invoiceNumber} 
                  disabled 
                  helperText={!id ? "Autogenerated on save" : ""}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  fullWidth 
                  label="Supplier Invoice / Challan No." 
                  size="small" 
                  value={id ? formValues.invoiceNumber : (formValues.invoiceNumber?.startsWith('GRN-') ? '' : formValues.invoiceNumber)} 
                  onChange={e => setFormValues({...formValues, invoiceNumber: e.target.value})} 
                  disabled={isLocked} 
                  placeholder="Enter vendor's bill number"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                  fullWidth 
                  type="date"
                  label="GRN / Receipt Date" 
                  size="small" 
                  value={formValues.invoiceDate || formValues.grnDate} 
                  onChange={e => setFormValues({...formValues, invoiceDate: e.target.value, grnDate: e.target.value})} 
                  disabled={isLocked}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ p: 1, px: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>Total Units Received</Typography>
                  <Typography variant="h6" sx={{ color: '#15803d', fontWeight: 900 }}>{totals.received}</Typography>
                </Box>
              </Grid>
              {!isLocked && !id && !formValues.purchaseOrderId && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, minWidth: 100 }}>Direct Item Add:</Typography>
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={allItems}
                      getOptionLabel={(option) => `${option.itemCode} - ${option.itemName} (${option.shade || 'No shade'})`}
                      value={selectedItem}
                      onChange={(_, newValue) => addItemToLines(newValue)}
                      renderInput={(params) => <TextField {...params} label="Search Style Code" placeholder="Add custom item..." />}
                      sx={{ bgcolor: '#fff' }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM / STYLE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SIZE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ORDERED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>RECEIVED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>COST PRICE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>BATCH #</TableCell>
                  {!isViewMode && <TableCell align="center" sx={{ fontWeight: 700 }}>ACTION</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.id || idx} hover>
                    <TableCell>
                        <Stack>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{line.itemCode}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>{line.itemName} - {line.shade}</Typography>
                        </Stack>
                    </TableCell>
                    <TableCell>
                        <Chip label={line.size} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} />
                    </TableCell>
                    <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>{line.sku}</Typography>
                    </TableCell>
                    <TableCell align="right">{line.orderedQty || 0}</TableCell>
                    <TableCell align="right">
                        <TextField 
                            type="number" 
                            size="small" 
                            value={line.receivedQty} 
                            placeholder="0"
                            onChange={e => updateLine(idx, 'receivedQty', e.target.value)} 
                            disabled={isViewMode} 
                            sx={{ width: 80 }} 
                            onFocus={(e) => e.target.select()}
                        />
                    </TableCell>
                    <TableCell align="right">
                        <TextField 
                            type="number" 
                            size="small" 
                            value={line.costPrice} 
                            onChange={e => updateLine(idx, 'costPrice', e.target.value)} 
                            disabled={isViewMode} 
                            sx={{ width: 90 }} 
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 0.5 }}>₹</Typography> }}
                        />
                    </TableCell>
                    <TableCell>
                        <TextField size="small" value={line.batchNumber} onChange={e => updateLine(idx, 'batchNumber', e.target.value)} disabled={isViewMode} sx={{ width: 120 }} />
                    </TableCell>
                    {!isViewMode && (
                        <TableCell align="center">
                            <IconButton color="error" size="small" onClick={() => removeLine(idx)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Approve GRN?</DialogTitle>
        <DialogContent>This will post received quantities to your warehouse inventory.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={() => { setConfirmOpen(false); handleSave(false); }} variant="contained">Confirm & Approve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GRNFormPage;
