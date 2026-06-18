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
  ToggleButton,
  Accordion,
  AccordionDetails,
  AccordionSummary
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageHeader from '../../components/erp/PageHeader';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import { itemPickerParams } from '../items/itemFetchConstants';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { fetchPurchaseOrders } from '../purchase/purchaseSlice';
import { fetchGrns, fetchGrnById, addGrn, approveGrn, updateGrn } from './grnSlice';
import { fetchOutwards } from '../production/productionSlice';
import PieceEntryDialog from './PieceEntryDialog';
import BulkInventoryUploadDialog from './components/BulkInventoryUploadDialog';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { calculateGST } from '../../utils/taxCalculator';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

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
  const taxRules = useSelector((state) => state.masters.taxRules || []);

  const user = useSelector((state) => state.auth.user);
  const isStoreStaff = user?.role !== 'Admin';

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [consumptionLines, setConsumptionLines] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const debouncedCatalogSearch = useDebouncedValue(catalogSearch, 300);
  const [lastScannedItemName, setLastScannedItemName] = useState('');
  const [activeItemForRolls, setActiveItemForRolls] = useState(null);
  const [isRollDialogOpen, setIsRollDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [loadedGrn, setLoadedGrn] = useState(null);
  const existingGrn = useMemo(
    () => loadedGrn || grns.find((g) => (g._id || g.id) === id),
    [loadedGrn, grns, id],
  );

  const filteredPurchaseOrders = useMemo(() => {
    let list = (purchaseOrders || []).filter(po =>
      ['APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status?.toUpperCase())
    );
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
    dispatch(fetchOutwards());
    dispatch(fetchMasters('taxRules'));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchItems(itemPickerParams(debouncedCatalogSearch)));
  }, [dispatch, debouncedCatalogSearch]);

  const fetchWarehouseFabrics = async (warehouseId) => {
    if (!warehouseId) return;
    try {
      const res = await (await import('../../services/api')).default.get(`/inventory/warehouse-stock/${warehouseId}`);
      const enrichedItems = res.data.items || [];
      const flatOptions = [];
      enrichedItems.forEach(item => {
        if (item.type !== 'FABRIC') return;
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
      dispatch(fetchGrnById(id))
        .unwrap()
        .then((grn) => setLoadedGrn(grn))
        .catch(() => {});
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
        const masterItem = allItems.find(i => (i._id || i.id).toString() === (item.itemId?._id || item.itemId || "").toString()) || {};
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
          hsnCode: masterItem.hsnCode || '',
          category: masterItem.categoryName || masterItem.type || '',
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
            hsnCode: master?.hsnCode || '',
            category: master?.categoryName || master?.type || '',
            batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
          };
        }));
      }
    }
  }, [formValues.purchaseOrderId, purchaseOrders, id, allItems]);

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
    const rawTotal = lines.reduce((acc, curr) => acc + (Number(curr.costPrice || 0) * Number(curr.receivedQty || 0)), 0);
    
    // Detect slab based on rawTotal (exclusive of tax)
    const slabInfo = calculateGST(rawTotal, null, null, taxRules);
    const generalRate = slabInfo.rate;

    return lines.reduce((acc, curr) => {
      acc.received += Number(curr.receivedQty || 0);
      
      // Determine line tax rate
      const itemRule = calculateGST(0, curr.sku || curr.barcode, curr.category, taxRules);
      const lineTaxRate = (itemRule.type === 'FLAT') ? itemRule.rate : generalRate;
      
      const lineValue = (Number(curr.costPrice || 0) * Number(curr.receivedQty || 0));
      const lineTax = (lineValue * lineTaxRate) / 100;
      
      acc.totalValue += lineValue + lineTax;
      acc.totalTax += lineTax;
      acc.generalRate = generalRate;
      acc.gstSlabMessage = slabInfo.message;
      return acc;
    }, { received: 0, totalValue: 0, totalTax: 0, generalRate: 5 });
  }, [lines, taxRules]);

  const summaryData = useMemo(() => {
    const totalLines = lines.length;
    const totalQty = totals.received;
    const taxableValue = lines.reduce((acc, curr) => acc + (Number(curr.costPrice || 0) * Number(curr.receivedQty || 0)), 0);
    const netPayable = totals.totalValue;
    return { totalLines, totalQty, taxableValue, netPayable };
  }, [lines, totals]);

  const updateLine = (idx, field, val) => {
    const newLines = [...lines];
    let nextVal = val;
    if (field === 'receivedQty') {
      nextVal = Math.max(0, Number(val) || 0);
    }
    newLines[idx] = { ...newLines[idx], [field]: nextVal };
    setLines(newLines);
  };

  const handleGrnTypeChange = (nextType) => {
    if (!nextType || nextType === formValues.grnType) return;
    setFormValues({
      ...defaultForm,
      grnNumber: formValues.grnNumber,
      grnDate: formValues.grnDate,
      warehouseId: formValues.warehouseId,
      grnType: nextType,
    });
    setLines([]);
    setConsumptionLines([]);
    setSelectedItem(null);
    setSearchText('');
    setErrorMessage('');
  };

  const removeLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const addLineItem = (item, variant) => {
    const targetSku = variant.sku || variant.barcode;
    const targetVariantId = variant._id || variant.id;

    // Check if the item already exists in the list
    const existingIndex = lines.findIndex(l => 
      (l.variantId && l.variantId.toString() === targetVariantId?.toString()) ||
      (l.sku && targetSku && l.sku.toLowerCase() === targetSku.toLowerCase())
    );

    if (existingIndex > -1) {
      const updatedLines = [...lines];
      updatedLines[existingIndex] = {
        ...updatedLines[existingIndex],
        receivedQty: Number(updatedLines[existingIndex].receivedQty || 0) + 1
      };
      setLines(updatedLines);
      setLastScannedItemName(item.itemName || item.name || '');
    } else {
      const newLine = {
        id: `scan-${Date.now()}-${Math.random()}`,
        itemId: item._id || item.id,
        variantId: targetVariantId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        size: variant.size,
        color: item.shade || '',
        sku: targetSku,
        receivedQty: 1,
        uom: item.uom || 'PCS',
        costPrice: variant.mrp || 0,
        taxPercent: item?.gstPercent || 0,
        hsnCode: item?.hsnCode || '',
        category: item?.categoryName || item?.type || '',
        batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
      };
      setLines(prev => [newLine, ...prev]);
      setLastScannedItemName(item.itemName || item.name || '');
    }
  };

  const addItemToLines = (item) => {
    if (!item || !item.sizes?.length) return;
    
    // Filter out size variants that are already in lines
    const existingVariantIds = new Set(lines.map(l => {
      const vId = l.variantId?._id || l.variantId || l.itemId?._id || l.itemId;
      return (vId || "").toString();
    }));
    
    const newVariants = item.sizes.filter(v => !existingVariantIds.has((v._id || v.id || "").toString()));
    
    if (newVariants.length === 0) {
      setErrorMessage(`All sizes for ${item.itemName} are already added.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const newLines = newVariants.map(v => ({
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
      hsnCode: item?.hsnCode || '',
      category: item?.categoryName || item?.type || '',
      batchNumber: `B-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    }));
    setLines(prev => [...prev, ...newLines]);
    setSelectedItem(null);
    setLastScannedItemName(item.itemName || item.name || '');
  };

  const handleBarcodeScan = async (barcode) => {
    if (!barcode) return;
    setErrorMessage('');
    
    try {
      const api = (await import('../../services/api')).default;
      const response = await api.get(`/items/scan/${encodeURIComponent(barcode)}`);
      
      if (response.data.success && response.data.data) {
        const { item, variant } = response.data.data;
        if (item.type === 'FABRIC' || item.type === 'ACCESSORY') {
          setActiveItemForRolls(item);
          setIsRollDialogOpen(true);
        } else if (variant) {
          addLineItem(item, variant);
          setLastScannedItemName(item.itemName || item.name || '');
        }
      } else {
        throw new Error('Barcode not found');
      }
    } catch (err) {
      console.error('Scan error:', err);
      // Fallback to local search if API fails or returns not found
      const localItem = allItems.find(it => {
        if (it.itemCode?.toUpperCase() === barcode.toUpperCase()) return true;
        return (it.sizes || []).some(s => s.sku?.toUpperCase() === barcode.toUpperCase() || s.barcode?.toUpperCase() === barcode.toUpperCase());
      });

      if (localItem) {
        const variant = (localItem.sizes || []).find(v => v.sku?.toUpperCase() === barcode.toUpperCase() || v.barcode?.toUpperCase() === barcode.toUpperCase()) || localItem.sizes?.[0];
        addLineItem(localItem, variant);
      } else {
        setErrorMessage(`Barcode NOT FOUND: ${barcode}. Please check Item Master.`);
        setTimeout(() => setErrorMessage(''), 5000);
      }
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
          .map((l) => {
            const itemRule = calculateGST(0, l.sku || l.barcode, l.category, taxRules);
            const lineTaxRate = (itemRule.type === 'FLAT' ? itemRule.rate : totals.generalRate);
            const rawItemId = l.itemId?._id || (typeof l.itemId === 'string' ? l.itemId : null) || l._id || l.id;
            const rawVariantId = l.variantId?._id || (typeof l.variantId === 'string' ? l.variantId : null) || rawItemId;
            return {
              itemId: rawItemId,
              variantId: rawVariantId,
              sku: l.sku || l.itemCode || 'N/A',
              receivedQty: Number(l.receivedQty || 0),
              costPrice: Number(l.costPrice || 0),
              taxPercent: lineTaxRate,
              batchNumber: l.batchNumber || `B-${Date.now().toString().slice(-4)}`,
            };
          })
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
        // Only approve if it was not already approved
        if (existingGrn?.status !== 'APPROVED' && !isDraft) {
          await dispatch(approveGrn(result._id || result.id)).unwrap();
        }
      } else {
        result = await dispatch(addGrn(payload)).unwrap();
        if (!isDraft) {
          await dispatch(approveGrn(result._id || result.id)).unwrap();
        }
      }
      setSuccessMessage('GRN saved and warehouse stock updated successfully.');
      setTimeout(() => navigate('/ho/inventory/grn'), 1500);
    } catch (err) {
      setErrorMessage(err || 'Failed to save GRN');
    }
  };

  const isLocked = isViewMode;
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
            <Button key="bulk-upload" variant="contained" color="info" sx={{ bgcolor: '#0284c7' }} startIcon={<FileUploadIcon />} onClick={() => setIsBulkUploadOpen(true)}>Bulk Excel Upload</Button>
          ) : null,
          !isLocked ? (
            <Button key="save-grn" variant="contained" color="success" sx={{ bgcolor: '#16a34a' }} startIcon={<CheckCircleOutlinedIcon />} onClick={() => handleSave(false)}>Save GRN</Button>
          ) : null
        ]}
      />

      {totals.gstSlabMessage && !isStoreStaff && (
        <Alert icon={<CheckCircleOutlinedIcon fontSize="inherit" />} severity="info" sx={{ mb: 2, fontWeight: 700, bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          {totals.gstSlabMessage}
        </Alert>
      )}

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      {/* 4 Summary Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '110px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Lines
              </Typography>
              <Chip
                label="Variants"
                size="small"
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  height: '24px'
                }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mt: 'auto' }}>
              {summaryData.totalLines}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '110px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Quantity
              </Typography>
              <Chip
                label="Items"
                size="small"
                sx={{
                  bgcolor: '#e0f2fe',
                  color: '#0284c7',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  height: '24px'
                }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mt: 'auto' }}>
              {summaryData.totalQty}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '110px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Taxable Value
              </Typography>
              <Chip
                label="Excl. Tax"
                size="small"
                sx={{
                  bgcolor: '#fdf2f8',
                  color: '#db2777',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  height: '24px'
                }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#db2777', mt: 'auto' }}>
              ₹{summaryData.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '110px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Net Payable
              </Typography>
              <Chip
                label="Incl. Tax"
                size="small"
                sx={{
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  height: '24px'
                }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a', mt: 'auto' }}>
              ₹{summaryData.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {!isLocked && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Select Receipt Type</Typography>
          <ToggleButtonGroup
            exclusive
            value={formValues.grnType}
            onChange={(e, val) => { if (val) handleGrnTypeChange(val); }}
            color="primary"
            sx={{ bgcolor: 'white' }}
          >
            <ToggleButton value="FABRIC" sx={{ px: 4, fontWeight: 700 }}>🧵 Fabric</ToggleButton>
            <ToggleButton value="ACCESSORY" sx={{ px: 4, fontWeight: 700 }}>📦 Accessories</ToggleButton>
            <ToggleButton value="GARMENT" sx={{ px: 4, fontWeight: 700 }}>👕 Garment (Job Work Return)</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
      {isLocked && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1, display: 'block', textTransform: 'uppercase' }}>Receipt Type</Typography>
          <Chip label={formValues.grnType || 'FABRIC'} color="primary" sx={{ fontWeight: 700 }} />
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Accordion
            defaultExpanded={!id}
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px !important',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              overflow: 'hidden',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#2563eb' }} />}
              sx={{
                px: 4,
                py: 0.5,
                bgcolor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                '& .MuiAccordionSummary-content': { alignItems: 'center' }
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  📝 GRN Header / Metadata Details
                </Typography>
                <Chip
                  label={formValues.invoiceNumber || 'No Invoice Number'}
                  size="small"
                  sx={{
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '6px'
                  }}
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 4, bgcolor: 'white' }}>
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
                    SelectProps={{ displayEmpty: true }}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">
                      <em>Select supplier</em>
                    </MenuItem>
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
                    SelectProps={{ displayEmpty: true }}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">
                      <em>Select warehouse</em>
                    </MenuItem>
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
                    inputProps={{ max: getTodayDate() }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          {!isLocked && (
            <Box sx={{ mb: 3, p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', borderRadius: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>Inward Entry Mode</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>Add Items to GRN</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    fullWidth
                    size="medium"
                    options={allItems}
                    value={selectedItem}
                    onChange={(_, value) => {
                      if (value) {
                        addItemToLines(value);
                      }
                    }}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') setCatalogSearch(value);
                    }}
                    filterOptions={(options) => options}
                    getOptionLabel={(option) => {
                      const code = option.itemCode || option.sku || '';
                      const name = option.itemName || option.name || '';
                      return code ? `${code} - ${name}` : name;
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Search & Add Catalog Item" placeholder="Select item to add all sizes..." />
                    )}
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Scan barcodes..."
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
                    helperText={lastScannedItemName ? `Last added: ${lastScannedItemName}` : 'Scan or type barcode and press Enter'}
                    FormHelperTextProps={{ sx: { whiteSpace: 'normal', wordBreak: 'break-word' } }}
                    sx={{ bgcolor: 'white' }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: '#3b82f6', mr: 1, fontSize: 22 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    startIcon={<FileUploadIcon />}
                    onClick={() => setIsBulkUploadOpen(true)}
                    sx={{ height: 56, fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap', bgcolor: '#0284c7' }}
                  >
                    Excel Upload
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 12, height: 12, bgcolor: '#3b82f6', borderRadius: '50%' }} />
            STEP 1: ADD FINISHED GARMENTS RECEIVED (SHIRTS/PANTS)
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4, border: '1px solid #e2e8f0', maxHeight: '400px', overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>ITEM / STYLE</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>SIZE</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>SKU</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>RECEIVED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>MRP</TableCell>
                  {!isLocked && <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>ACTION</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.id || idx} hover>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{line.itemCode}</Typography>
                        <Typography variant="caption">{line.itemName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><Chip label={line.size} size="small" /></TableCell>
                    <TableCell><Typography variant="caption">{line.sku}</Typography></TableCell>
                    <TableCell align="right">
                      {isLocked ? (
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{line.receivedQty}</Typography>
                      ) : (
                        <TextField type="number" size="small" value={line.receivedQty} onChange={e => updateLine(idx, 'receivedQty', e.target.value)} inputProps={{ min: 0 }} sx={{ width: 80 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">₹{line.costPrice}</TableCell>
                    {!isStoreStaff && (
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {(() => {
                             const itemRule = calculateGST(0, line.sku || line.barcode, line.category, taxRules);
                             return (itemRule.type === 'FLAT' ? itemRule.rate : totals.generalRate);
                          })()}%
                        </Typography>
                      </TableCell>
                    )}
                    {!isLocked && (
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => removeLine(idx)}><DeleteOutlineIcon /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {!lines.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>No items added. Please scan garments.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>

          {formValues.grnType === 'GARMENT' && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#ec4899', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ width: 12, height: 12, bgcolor: '#ec4899', borderRadius: '50%' }} />
                STEP 2: SETTLE MATERIAL CONSUMPTION (SETTLE FABRIC ACCOUNT)
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #fce7f3', maxHeight: '300px', overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#fff1f2' }}>MATERIAL / FABRIC</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: '#fff1f2' }}>AVAILABLE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#fff1f2' }}>USED QTY</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#fff1f2' }}>WASTAGE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#fff1f2' }}>PENDING</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumptionLines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{line.itemName}</Typography>
                          <Typography variant="caption" color="secondary">{line.barcode}</Typography>
                        </TableCell>
                        <TableCell>{line.availableQty} Unit</TableCell>
                        <TableCell align="right">
                          <TextField type="number" size="small" value={line.quantity} onChange={e => {
                            const nl = [...consumptionLines]; nl[idx].quantity = e.target.value; setConsumptionLines(nl);
                          }} sx={{ width: 80 }} />
                        </TableCell>
                        <TableCell align="right">
                          <TextField type="number" size="small" value={line.wasteQuantity} onChange={e => {
                            const nl = [...consumptionLines]; nl[idx].wasteQuantity = e.target.value; setConsumptionLines(nl);
                          }} sx={{ width: 80 }} />
                        </TableCell>
                        <TableCell align="right">{line.availableQty - line.quantity - line.wasteQuantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Approve & Post GRN?</DialogTitle>
        <DialogContent><Typography variant="body2">Confirm receipt of garments and consumption of fabric.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => { setConfirmOpen(false); handleSave(false); }}>Approve</Button>
        </DialogActions>
      </Dialog>

      <PieceEntryDialog open={isRollDialogOpen} onClose={() => setIsRollDialogOpen(false)} onAdd={handleAddRolls} item={activeItemForRolls} />
      <BulkInventoryUploadDialog
        open={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        warehouseId={formValues.warehouseId}
        onUploadSuccess={() => {
          setSuccessMessage('Bulk inventory uploaded successfully.');
          setTimeout(() => navigate('/ho/inventory/grn'), 2000);
        }}
      />
    </Box>
  );
}

export default GRNFormPage;
