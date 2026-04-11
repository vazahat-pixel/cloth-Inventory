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
  TableRow,
  TextField,
  Typography,
  TableHead,
  ToggleButtonGroup,
  ToggleButton
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
import { fetchOutwards } from '../production/productionSlice';
import PieceEntryDialog from './PieceEntryDialog';

const defaultForm = {
  grnNumber: '',
  grnType: 'FABRIC',
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
  const supplierOutwards = useSelector((state) => state.production.outwards || []);

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [consumptionLines, setConsumptionLines] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeItemForRolls, setActiveItemForRolls] = useState(null);
  const [isRollDialogOpen, setIsRollDialogOpen] = useState(false);
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
    dispatch(fetchOutwards());
  }, [dispatch]);

  const fetchWarehouseFabrics = async (warehouseId) => {
    if (!warehouseId) return;
    try {
      const res = await (await import('../../services/api')).default.get(`/inventory/warehouse-stock/${warehouseId}`);
      const enrichedItems = res.data.items || [];
      const flatOptions = [];
      enrichedItems.forEach(item => {
        if (item.type !== 'FABRIC') return; // Only show Fabric type as per requirement
        Object.values(item.sizes || []).forEach(sz => {
          if (sz.availableStock > 0 || sz.stock > 0) {
             const qty = sz.availableStock > 0 ? sz.availableStock : sz.stock;
             const barcode = sz.sku || sz.barcode || `${item.itemCode}-${sz.size}`;
             flatOptions.push({
               itemId: item._id || item.id,
               itemName: item.itemName,
               itemCode: item.itemCode,
               variantId: sz._id || sz.id,
               barcode: barcode,
               quantity: qty,
               label: `${item.itemName} (${sz.size}) [${barcode}] - Bal: ${qty}`
             });
          }
        });
      });
      setWarehouseStock(flatOptions);
    } catch (e) { console.error('Failed to fetch warehouse fabric stock', e); }
  };

  useEffect(() => {
    if (formValues.warehouseId && formValues.grnType === 'GARMENT') {
      fetchWarehouseFabrics(formValues.warehouseId);
    }
  }, [formValues.warehouseId, formValues.grnType]);

  useEffect(() => {
    if (id) {
      dispatch(fetchGrns());
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id && existingGrn) {
      setFormValues({
        grnNumber: existingGrn.grnNumber || '',
        grnType: existingGrn.grnType || 'FABRIC',
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
          taxPercent: item.taxPercent || item.tax || 0,
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

  useEffect(() => {
    if (!id && warehouses.length === 1 && !formValues.warehouseId) {
      setFormValues(prev => ({ ...prev, warehouseId: warehouses[0]._id || warehouses[0].id }));
    }
  }, [warehouses, id, formValues.warehouseId]);

  // AUTO-POPULATE LINES FROM PO
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

        setLines((po.items || []).map((item, idx) => {
          const vId = item.variantId?._id || item.variantId;
          const iId = item.itemId?._id || item.itemId;
          const master = allItems.find(i => (i._id || i.id).toString() === iId.toString());
          const variant = master?.sizes?.find(v => (v._id || v.id).toString() === vId.toString());

          return {
            id: `po-${idx}-${Date.now()}`,
            itemId: iId,
            variantId: vId,
            itemName: item.itemName || 'Item',
            itemCode: item.itemCode || '',
            size: item.size || '',
            color: item.color || '',
            sku: item.sku || variant?.sku || '',
            receivedQty: item.qty || item.quantity,
            uom: master?.uom || 'PCS',
            costPrice: variant?.mrp || item.costPrice || item.rate || 0,
            taxPercent: master?.gstPercent || item.taxPercent || 0,
            batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
          };
        }));
      }
    }
  }, [formValues.purchaseOrderId, purchaseOrders, id, allItems]);

  // AUTO-POPULATE CONSUMPTION FROM JOB WORK
  useEffect(() => {
    if (!id && formValues.jobWorkId && formValues.grnType === 'GARMENT') {
       const so = supplierOutwards.find(o => (o._id || o.id) === formValues.jobWorkId);
       if (so && so.items) {
          setConsumptionLines(so.items.map(item => ({
             itemId: item.itemId?._id || item.itemId,
             variantId: item.variantId || null,
             itemName: item.itemId?.itemName || 'Material',
             barcode: item.code || 'N/A',
             availableQty: item.quantity,
             quantity: 0,
             wasteQuantity: 0,
             pendingQuantity: item.quantity
          })));
       }
    }
  }, [formValues.jobWorkId, formValues.grnType, supplierOutwards, id]);


  const totals = useMemo(() => {
    return lines.reduce((acc, curr) => {
      acc.received += Number(curr.receivedQty || 0);
      acc.totalValue += (Number(curr.costPrice || 0) * Number(curr.receivedQty || 0));
      return acc;
    }, { received: 0 });
  }, [lines]);

  const updateLine = (idx, field, val) => {
    const newLines = [...lines];
    newLines[idx] = { ...newLines[idx], [field]: val };
    setLines(newLines);
  };

  const removeLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const addLineItem = (item, variant) => {
    const newLine = {
      id: `scan-${Date.now()}-${Math.random()}`,
      itemId: item._id || item.id,
      variantId: variant._id || variant.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      size: variant.size,
      color: item.shade || '',
      sku: variant.sku || variant.barcode,
      receivedQty: 1,
      uom: item.uom || 'PCS',
      costPrice: variant.mrp || 0,
      taxPercent: item?.gstPercent || 0,
      batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    };
    setLines(prev => [newLine, ...prev]);
  };

  const addItemToLines = (item) => {
    if (!item || !item.sizes?.length) return;
    const newLines = item.sizes.map(v => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      itemId: item._id || item.id,
      variantId: v._id || v.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      size: v.size,
      color: item.shade || '',
      sku: v.sku || v.barcode,
      receivedQty: 0,
      uom: item.uom || 'PCS',
      costPrice: v.mrp || 0,
      taxPercent: item?.gstPercent || 0,
      batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    }));
    setLines([...lines, ...newLines]);
    setSelectedItem(null);
  };

  const handleBarcodeScan = (barcode) => {
    const item = allItems.find(it => {
      if (it.itemCode === barcode) return true;
      return (it.sizes || []).some(s => s.sku === barcode || s.barcode === barcode);
    });

    if (item) {
      if (item.type === 'FABRIC' || item.type === 'ACCESSORY') {
        setActiveItemForRolls(item);
        setIsRollDialogOpen(true);
        return;
      }
      
      const variant = (item.sizes || []).find(v => v.sku === barcode || v.barcode === barcode) || item.sizes?.[0];
      if (variant) {
        addLineItem(item, variant);
      }
    } else {
      setErrorMessage(`Barcode NOT FOUND: ${barcode}. Please check Item Master.`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleAddRolls = (rolls) => {
    setLines(prev => [...rolls, ...prev]);
  };

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
            taxPercent: Number(l.taxPercent || 0),
            batchNumber: l.batchNumber || `B-${Date.now().toString().slice(-4)}`,
          }))
          .filter((l) => l.receivedQty > 0),
        jobWorkId: formValues.jobWorkId,
        consumptionDetails: consumptionLines.map(cl => ({
          itemId: cl.itemId,
          variantId: cl.variantId,
          barcode: cl.barcode,
          itemName: cl.itemName,
          availableQty: Number(cl.availableQty || 0),
          usedQty: Number(cl.quantity || 0),
          wasteQty: Number(cl.wasteQuantity || 0),
          pendingQty: Number(cl.pendingQuantity || 0)
        })).filter(c => (c.usedQty + c.wasteQty) > 0),
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
      setTimeout(() => navigate('/ho/inventory/grn'), 1500);
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
        subtitle="Manage stock in-flow through scanning or selection."
        breadcrumbs={[
          { label: 'Purchase' },
          { label: 'GRN', href: '/ho/inventory/grn' },
          { label: id ? 'Edit' : 'New', active: true },
        ]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/ho/inventory/grn')}>Back</Button>,
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

      {!isLocked && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Select Receipt Type</Typography>
          <ToggleButtonGroup
            exclusive
            value={formValues.grnType}
            onChange={(e, val) => { if (val) setFormValues({ ...formValues, grnType: val }); }}
            color="primary"
            sx={{ bgcolor: 'white' }}
          >
            <ToggleButton value="FABRIC" sx={{ px: 4, fontWeight: 700 }}>🧵 Fabric</ToggleButton>
            <ToggleButton value="ACCESSORY" sx={{ px: 4, fontWeight: 700 }}>📦 Accessories</ToggleButton>
            <ToggleButton value="GARMENT" sx={{ px: 4, fontWeight: 700 }}>👕 Garment (Job Work Return)</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Link Purchase Order</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formValues.purchaseOrderId || ''}
                  onChange={e => setFormValues({ ...formValues, purchaseOrderId: e.target.value })}
                  disabled={!!id}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>Direct Receipt (No PO)</Typography>
                  </MenuItem>
                  {filteredPurchaseOrders.map(po => (
                    <MenuItem key={po._id || po.id} value={po._id || po.id}>{po.poNumber}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Supplier / Vendor</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formValues.supplierId || ''}
                  onChange={e => setFormValues({ ...formValues, supplierId: e.target.value })}
                  disabled={!!id || !!formValues.purchaseOrderId}
                >
                  {suppliers.map(s => (
                    <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.name || s.supplierName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Target Warehouse</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formValues.warehouseId || ''}
                  onChange={e => setFormValues({ ...formValues, warehouseId: e.target.value })}
                  disabled={isLocked || (warehouses.length === 1 && !id)}
                >
                  {warehouses.map(w => (
                    <MenuItem key={w._id || w.id} value={w._id || w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {formValues.grnType === 'GARMENT' && (
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Job Work Reference</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={formValues.jobWorkId || ''}
                    onChange={e => setFormValues({ ...formValues, jobWorkId: e.target.value })}
                    disabled={isLocked}
                    SelectProps={{ displayEmpty: true }}
                  >
                    <MenuItem value="">
                      <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>Direct (No Job Work)</Typography>
                    </MenuItem>
                    {supplierOutwards.map(so => (
                      <MenuItem key={so._id || so.id} value={so._id || so.id}>{so.outwardNumber}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} md={formValues.grnType === 'GARMENT' ? 4 : 6}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Supplier Bill / Challan #</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formValues.invoiceNumber}
                  onChange={e => setFormValues({ ...formValues, invoiceNumber: e.target.value })}
                  disabled={isLocked}
                  placeholder="Enter invoice number"
                />
              </Grid>
              <Grid item xs={12} md={formValues.grnType === 'GARMENT' ? 4 : 6}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Receipt Date</Typography>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  value={(formValues.invoiceDate || formValues.grnDate)?.slice(0, 10)}
                  onChange={e => setFormValues({ ...formValues, invoiceDate: e.target.value, grnDate: e.target.value })}
                  disabled={isLocked}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>GRN Number</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formValues.grnNumber || 'AUTOGENERATE'}
                  disabled
                  sx={{ bgcolor: '#f8fafc' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', mb: 1, display: 'block', textTransform: 'uppercase' }}>Total Units Received</Typography>
                <Box sx={{ px: 2, height: 40, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="body1" sx={{ color: '#15803d', fontWeight: 900 }}>{totals.received} Items</Typography>
                </Box>
              </Grid>

              {!isLocked && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', borderRadius: 2 }}>
                    <Stack direction="row" spacing={3} alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>Scanning Active</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>Scan Barcodes</Typography>
                      </Box>
                      <Autocomplete
                        sx={{ flex: 1, bgcolor: 'white' }}
                        options={allItems}
                        getOptionLabel={(option) => `${option.itemCode} - ${option.itemName}`}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            if (newValue.type === 'FABRIC' || newValue.type === 'ACCESSORY') {
                              setActiveItemForRolls(newValue);
                              setIsRollDialogOpen(true);
                            } else {
                              addItemToLines(newValue);
                            }
                          }
                        }}
                        renderInput={(params) => <TextField {...params} size="medium" label="Search Item Manually..." />}
                      />
                      <Box sx={{ px: 2, height: 52, display: 'flex', alignItems: 'center', borderLeft: '2px solid #e2e8f0', color: '#94a3b8' }}>
                         <Typography variant="body2" sx={{ fontWeight: 700 }}>OR</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        autoFocus
                        placeholder="Scan tags one by one to add items to this GRN..."
                        size="medium"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchText.trim()) {
                            e.preventDefault();
                            handleBarcodeScan(searchText.trim());
                            setSearchText('');
                          }
                        }}
                        sx={{ bgcolor: 'white' }}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ color: '#3b82f6', mr: 1, fontSize: 22 }} />
                        }}
                      />
                    </Stack>
                  </Box>
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
                  <TableCell align="right" sx={{ fontWeight: 700 }}>RECEIVED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>MRP</TableCell>
                  {formValues.grnType !== 'GARMENT' && <TableCell align="right" sx={{ fontWeight: 700 }}>GST %</TableCell>}
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
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={line.receivedQty}
                        onChange={e => updateLine(idx, 'receivedQty', e.target.value)}
                        disabled={isLocked}
                        sx={{ width: 100 }}
                        onFocus={(e) => e.target.select()}
                        InputProps={{
                          endAdornment: <Typography variant="caption" sx={{ color: '#94a3b8', ml: 0.5 }}>{line.uom || 'PCS'}</Typography>
                        }}
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
                    {formValues.grnType !== 'GARMENT' && (
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={line.taxPercent}
                          onChange={e => updateLine(idx, 'taxPercent', e.target.value)}
                          disabled={isLocked}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                    )}
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

        {formValues.grnType === 'GARMENT' && (
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
                  <TableCell align="right" sx={{ fontWeight: 700 }}>PENDING</TableCell>
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
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={line.pendingQuantity}
                        onChange={e => {
                          const newLines = [...consumptionLines];
                          newLines[idx].pendingQuantity = e.target.value;
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
                    <TableCell colSpan={6} sx={{ p: 1.5, bgcolor: '#fff5f7' }}>
                      <Autocomplete
                        options={warehouseStock}
                        getOptionLabel={(o) => o.label}
                        onChange={(_, newVal) => {
                          if (newVal) {
                            setConsumptionLines([...consumptionLines, {
                              itemId: newVal.itemId,
                              variantId: newVal.variantId,
                              itemName: newVal.itemName,
                              barcode: newVal.barcode,
                              availableQty: newVal.quantity,
                              quantity: 0,
                              wasteQuantity: 0,
                              pendingQuantity: newVal.quantity
                            }]);
                          }
                        }}
                        renderInput={(params) => <TextField {...params} label="Select Fabric from Warehouse Stock..." size="small" variant="standard" placeholder="Search available warehouse fabrics..." />}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        )}
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

      <PieceEntryDialog 
        open={isRollDialogOpen} 
        onClose={() => setIsRollDialogOpen(false)} 
        onAdd={handleAddRolls} 
        item={activeItemForRolls}
      />
    </Box>
  );
}

export default GRNFormPage;
