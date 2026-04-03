import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../../components/erp/PageHeader';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import { fetchPurchaseOrders } from '../purchase/purchaseSlice';
import { fetchGrns, addGrn, approveGrn, updateGrn } from './grnSlice';

const defaultForm = {
  grnNumber: '',
  grnDate: new Date().toISOString().slice(0, 10),
  purchaseOrderId: '',
  supplierId: '',
  warehouseId: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  remarks: '',
  gateEntryNumber: '',
  vehicleNumber: '',
  transportName: '',
  status: 'DRAFT',
};

function GRNFormPage({ mode = 'edit' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = mode === 'view';

  const { records: grns, loading: grnLoading } = useSelector((state) => state.grn);
  const purchaseOrders = useSelector((state) => state.purchase.orders || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const allItems = useSelector((state) => state.items.records || []);
  const supplierOutwards = useSelector((state) => state.supplierOutward.records || []);

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [consumptionLines, setConsumptionLines] = useState([]);
  const [supplierStock, setSupplierStock] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const existingGrn = useMemo(() => grns.find(g => (g._id || g.id) === id), [grns, id]);

  const filteredPurchaseOrders = useMemo(() => {
    // For new GRNs, show only APPROVED or PARTIALLY_RECEIVED orders
    let list = (purchaseOrders || []).filter(po =>
      ['APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status?.toUpperCase())
    );

    // If edit mode, ensure the currently linked PO is in the list even if COMPLETED
    if (existingGrn?.purchaseOrderId) {
      const currentPoId = (existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId).toString();
      const currentPo = purchaseOrders.find(o => (o._id || o.id).toString() === currentPoId);
      if (currentPo && !list.find(o => (o._id || o.id).toString() === currentPoId)) {
        list.push(currentPo);
      }
    }
    return list;
  }, [purchaseOrders, existingGrn]);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchItems());
    import('../supplierOutward/supplierOutwardSlice').then(m => dispatch(m.fetchSupplierOutwards()));
  }, [dispatch]);

  const fetchSupplierBalance = async (supplierId) => {
    if (!supplierId) return;
    try {
      const res = await (await import('../../services/api')).default.get(`/suppliers/${supplierId}/inventory`);
      setSupplierStock(res.data.data.inventory || []);
    } catch (e) { console.error('Failed to fetch supplier inventory', e); }
  };

  useEffect(() => {
    if (formValues.supplierId) {
      fetchSupplierBalance(formValues.supplierId);
    }
  }, [formValues.supplierId]);

  useEffect(() => {
    if (id) {
      dispatch(fetchGrns());
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id && existingGrn) {
      setFormValues({
        grnNumber: existingGrn.grnNumber || '',
        grnDate: existingGrn.grnDate?.slice(0, 10) || defaultForm.grnDate,
        purchaseOrderId: existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId || '',
        supplierId: existingGrn.supplierId?._id || existingGrn.supplierId || '',
        warehouseId: existingGrn.warehouseId?._id || existingGrn.warehouseId || '',
        invoiceNumber: existingGrn.invoiceNumber || '',
        invoiceDate: existingGrn.invoiceDate?.slice(0, 10) || defaultForm.invoiceDate,
        remarks: existingGrn.remarks || '',
        gateEntryNumber: existingGrn.gateEntryNumber || '',
        vehicleNumber: existingGrn.vehicleNumber || '',
        transportName: existingGrn.transportName || '',
        status: existingGrn.status || 'DRAFT',
      });
      setLines((existingGrn.items || []).map((item, idx) => {
        // Find the full item details from our local store (allItems)
        const masterItem = allItems.find(i => (i._id || i.id).toString() === (item.itemId?._id || item.itemId || "").toString()) || {};

        // Find the original ordered quantity from the linked PO
        const linkedPO = purchaseOrders.find(o => (o._id || o.id).toString() === (existingGrn.purchaseOrderId?._id || existingGrn.purchaseOrderId || "").toString());
        const poItem = linkedPO ? (linkedPO.items || []).find(pi => (pi.variantId || "").toString() === (item.variantId || "").toString()) : null;

        return {
          ...item,
          id: item._id || `saved-${idx}`,
          itemCode: masterItem.itemCode || item.itemCode || '-',
          itemName: masterItem.itemName || item.itemName || 'Item',
          size: item.size || '-',
          color: item.color || '',
          sku: item.sku || '',
          orderedQty: poItem ? (poItem.qty || poItem.quantity) : (item.orderedQty || 0),
          receivedQty: item.receivedQty || 0,
          costPrice: item.costPrice || 0,
          batchNumber: item.batchNumber || ''
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
            supplierId: po.supplierId?._id || po.supplierId,
            remarks: po.notes || ''
          }));
        }
      }
    }
  }, [id, existingGrn, purchaseOrders, searchParams, allItems]);

  const totals = useMemo(() => {
    return lines.reduce((acc, curr) => {
      acc.ordered += Number(curr.orderedQty || 0);
      acc.received += Number(curr.receivedQty || 0);
      return acc;
    }, { ordered: 0, received: 0 });
  }, [lines]);

  const updateLine = (idx, field, val) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: val };
    setLines(newLines);
  };

  const removeLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleBarcodeScan = (barcode) => {
    if (!barcode) return;
    
    // 1. Check if item already exists in the scan lines
    const existingIdx = lines.findIndex(l => l.sku === barcode || l.barcode === barcode);
    if (existingIdx !== -1) {
      updateLine(existingIdx, 'receivedQty', Number(lines[existingIdx].receivedQty || 0) + 1);
      return;
    }

    // 2. Search in allItems master
    let foundItem = null;
    let foundVariant = null;

    for (const item of allItems) {
      const variant = (item.sizes || []).find(v => v.sku === barcode || v.barcode === barcode);
      if (variant) {
        foundItem = item;
        foundVariant = variant;
        break;
      }
    }

    if (foundItem && foundVariant) {
      const newLine = {
        id: `scan-${Date.now()}-${Math.random()}`,
        itemId: foundItem._id || foundItem.id,
        variantId: foundVariant._id || foundVariant.id,
        itemName: foundItem.itemName,
        itemCode: foundItem.itemCode,
        size: foundVariant.size,
        color: foundItem.shade || '',
        sku: foundVariant.sku || foundVariant.barcode,
        orderedQty: 0,
        receivedQty: 1,
        costPrice: foundVariant.costPrice || 0,
        batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
      };
      setLines(prev => [newLine, ...prev]);
    } else {
      setErrorMessage(`Barcode NOT FOUND: ${barcode}. Please check Item Master.`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
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
    setSelectedItem(null);
  };

  useEffect(() => {
    if (!id && formValues.purchaseOrderId) {
      const po = purchaseOrders.find(o => (o.id || o._id) === formValues.purchaseOrderId);
      if (po) {
        const suppId = (typeof po.supplierId === 'object' && po.supplierId !== null)
          ? (po.supplierId._id || po.supplierId.id)
          : po.supplierId;

        setFormValues(prev => ({
          ...prev,
          supplierId: suppId || '',
          warehouseId: po.warehouseId?._id || po.warehouseId || '',
          remarks: po.notes || '',
        }));

        const poItems = po.items || [];
        setLines(
          poItems.map((item, idx) => {
            const variantId = item.variantId?._id || item.variantId;
            const itemId = item.itemId?._id || item.itemId;

            // FALLBACK Logic: If SKU is missing in PO, fetch from master
            let sku = item.sku;
            if (!sku && itemId) {
              const masterItem = allItems.find(i => (i._id || i.id).toString() === itemId.toString());
              if (masterItem?.sizes) {
                const variant = masterItem.sizes.find(v => (v._id || v.id).toString() === variantId.toString());
                sku = variant?.sku;
              }
            }

            return {
              id: `line-${idx}-${Date.now()}`,
              itemId,
              variantId,
              itemName: item.itemName || 'Item',
              itemCode: item.itemCode || '',
              size: item.size || '',
              color: item.color || '',
              sku: sku || item.sku || item.itemCode || '',
              orderedQty: item.qty || item.quantity,
              receivedQty: item.qty || item.quantity,
              costPrice: item.costPrice || item.price || item.rate || 0,
              batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
            };
          })
        );
      }
    }
  }, [formValues.purchaseOrderId, purchaseOrders, id, allItems]);

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
        jobWorkId: formValues.jobWorkId,
        consumptionDetails: consumptionLines.map(cl => ({
          itemId: cl.itemId,
          variantId: cl.variantId,
          quantity: Number(cl.quantity || 0),
          wasteQuantity: Number(cl.wasteQuantity || 0)
        })).filter(c => (c.quantity + c.wasteQuantity) > 0),
        totalValue: totals.totalValue,
        totalQty: totals.received
      };

      if (!payload.items.length) {
        setErrorMessage('Register at least one received item quantity');
        return;
      }

      let result;
      if (id) {
        result = await dispatch(updateGrn({ id, updateData: payload })).unwrap();
      } else {
        result = await dispatch(addGrn(payload)).unwrap();
      }

      if (!isDraft) {
        await dispatch(approveGrn(result._id || result.id)).unwrap();
      }

      setSuccessMessage(isDraft ? 'GRN saved as draft.' : 'GRN approved successfully.');
      setTimeout(() => navigate('/ho/grn'), 1500);
    } catch (err) {
      setErrorMessage(err || 'Failed to save GRN');
    }
  };

  const isLocked = isViewMode || (id && existingGrn?.status === 'APPROVED');

  if (grnLoading && id) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title={isViewMode ? 'View GRN' : id ? 'Edit GRN' : 'Create GRN'}
        subtitle="Receipt goods against Purchase Order or Voucher."
        breadcrumbs={[
          { label: 'Purchase' },
          { label: 'GRN', href: '/ho/grn' },
          { label: id ? 'Edit' : 'New', active: true },
        ]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/ho/grn')}>Back</Button>,
          !isLocked ? (
            <Button key="draft" variant="contained" color="primary" sx={{ bgcolor: '#2563eb' }} startIcon={<SaveOutlinedIcon />} onClick={() => handleSave(true)}>Save Draft</Button>
          ) : null,
          !isLocked ? (
            <Button key="approve" variant="contained" color="success" sx={{ bgcolor: '#16a34a' }} startIcon={<CheckCircleOutlinedIcon />} onClick={() => setConfirmOpen(true)}>Approve & Post</Button>
          ) : null
        ]}
      />

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Purchase Order"
                  size="small"
                  value={formValues.purchaseOrderId}
                  onChange={e => setFormValues({ ...formValues, purchaseOrderId: e.target.value })}
                  disabled={!!id}
                >
                  <MenuItem value="">Direct Receipt</MenuItem>
                  {filteredPurchaseOrders.map(po => (
                    <MenuItem key={po._id || po.id} value={po._id || po.id}>
                      {po.poNumber} - {typeof po.supplierId === 'object' ? po.supplierId.name : po.supplierId}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Supplier"
                  size="small"
                  value={formValues.supplierId}
                  onChange={e => setFormValues({ ...formValues, supplierId: e.target.value })}
                  disabled={!!id || !!formValues.purchaseOrderId}
                >
                  {suppliers.map(s => (
                    <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.name || s.supplierName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Warehouse / Store"
                  size="small"
                  value={formValues.warehouseId}
                  onChange={e => setFormValues({ ...formValues, warehouseId: e.target.value })}
                  disabled={isLocked}
                >
                  {warehouses.map(w => (
                    <MenuItem key={w._id || w.id} value={w._id || w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Link Job Work (Outward)"
                  size="small"
                  value={formValues.jobWorkId || ''}
                  onChange={e => setFormValues({ ...formValues, jobWorkId: e.target.value })}
                  disabled={isLocked}
                >
                  <MenuItem value="">Not Linked (Direct GRN)</MenuItem>
                  {supplierOutwards.map(so => (
                    <MenuItem key={so._id || so.id} value={so._id || so.id}>
                      {so.outwardNumber} - {so.supplierId?.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="GRN Number"
                  size="small"
                  value={formValues.grnNumber}
                  disabled
                  placeholder="Autogenerated on save"
                  helperText="Autogenerated on save"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Supplier Invoice / Challan No."
                  size="small"
                  value={formValues.invoiceNumber}
                  onChange={e => setFormValues({ ...formValues, invoiceNumber: e.target.value })}
                  disabled={isLocked}
                  placeholder="Enter vendor's bill number"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="GRN / Receipt Date"
                  size="small"
                  value={(formValues.invoiceDate || formValues.grnDate)?.slice(0, 10)}
                  onChange={e => setFormValues({ ...formValues, invoiceDate: e.target.value, grnDate: e.target.value })}
                  disabled={isLocked}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ p: 1, px: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>Total Units Received</Typography>
                  <Typography variant="h6" sx={{ color: '#15803d', fontWeight: 900 }}>{totals.received}</Typography>
                </Box>
              </Grid>

              {!isLocked && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '2px solid #3b82f6', borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', minWidth: 120 }}>SCAN BARCODE:</Typography>
                      <TextField
                        fullWidth
                        autoFocus
                        placeholder="Scan or type barcode and press Enter..."
                        size="medium"
                        value={searchText} // Borrowing searchText state or creating new scanInput
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchText.trim()) {
                            e.preventDefault();
                            handleBarcodeScan(searchText.trim());
                            setSearchText('');
                          }
                        }}
                        sx={{ bgcolor: '#fff' }}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: '#3b82f6', mr: 1 }} />
                        }}
                      />
                      <Button variant="contained" sx={{ height: 44, px: 4, fontWeight: 700 }} onClick={() => { handleBarcodeScan(searchText); setSearchText(''); }}>Add</Button>
                    </Stack>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
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
                  {!isLocked && <TableCell align="center" sx={{ fontWeight: 700 }}>ACTION</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.id || idx} hover>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{line.itemCode}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>{line.itemName}</Typography>
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
                        onChange={e => updateLine(idx, 'receivedQty', e.target.value)}
                        disabled={isLocked}
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
                        disabled={isLocked}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={line.batchNumber} onChange={e => updateLine(idx, 'batchNumber', e.target.value)} disabled={isLocked} sx={{ width: 120 }} />
                    </TableCell>
                    {!isLocked && (
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

        {/* NEW CONSUMPTION SECTION */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: '#ec4899', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 12, height: 12, bgcolor: '#ec4899', borderRadius: '50%' }} />
            RAW MATERIAL CONSUMPTION / FABRIC SETTLEMENT
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #fce7f3' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#fff1f2' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>MATERIAL / FABRIC</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>AVAILABLE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>USED QTY</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>WASTAGE</TableCell>
                  {!isLocked && <TableCell align="center" sx={{ fontWeight: 700 }}>ACTION</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {consumptionLines.map((line, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{line.itemName}</Typography>
                        <Typography variant="caption" sx={{ color: '#ec4899' }}>{line.barcode}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${line.availableQty || 0} Unit`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={line.quantity}
                        onChange={e => {
                          const newLines = [...consumptionLines];
                          newLines[idx].quantity = e.target.value;
                          setConsumptionLines(newLines);
                        }}
                        disabled={isLocked}
                        sx={{ width: 85 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={line.wasteQuantity}
                        onChange={e => {
                          const newLines = [...consumptionLines];
                          newLines[idx].wasteQuantity = e.target.value;
                          setConsumptionLines(newLines);
                        }}
                        disabled={isLocked}
                        sx={{ width: 85 }}
                      />
                    </TableCell>
                    {!isLocked && (
                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => setConsumptionLines(consumptionLines.filter((_, i) => i !== idx))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!isLocked && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 1.5, bgcolor: '#fff5f7' }}>
                      <Autocomplete
                        options={supplierStock}
                        getOptionLabel={(o) => `${o.itemId?.itemCode} [${o.barcode}] - Bal: ${o.quantity}`}
                        onChange={(_, newVal) => {
                          if (newVal) {
                            setConsumptionLines([...consumptionLines, {
                              itemId: newVal.itemId?._id,
                              variantId: newVal.variantId,
                              itemName: newVal.itemId?.itemName,
                              barcode: newVal.barcode,
                              availableQty: newVal.quantity,
                              quantity: 0,
                              wasteQuantity: 0
                            }]);
                          }
                        }}
                        renderInput={(params) => <TextField {...params} label="Select Raw Material from Supplier Balance..." size="small" variant="standard" placeholder="Search fabric / accessories..." />}
                      />
                    </TableCell>
                  </TableRow>
                )}
                {consumptionLines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#94a3b8', fontStyle: 'italic' }}>
                      No raw material consumption added yet. Select from supplier balance above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Approve & Post GRN?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Are you sure you want to approve this GRN? This will update warehouse stock and finalize the receipt.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => { setConfirmOpen(false); handleSave(false); }}>Confirm & Approve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GRNFormPage;
