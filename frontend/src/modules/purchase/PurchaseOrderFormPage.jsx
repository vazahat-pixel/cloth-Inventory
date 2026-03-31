import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import FormSection from '../../components/erp/FormSection';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';
import { fetchPurchaseOrders, addPurchaseOrder, updatePurchaseOrder } from './purchaseSlice';
import { loadModuleRecords } from '../erp/erpLocalStore';
import {
  buildFallbackSuppliers,
  buildFallbackVariantOptions,
  calculatePurchaseOrderLine,
  calculatePurchaseOrderTotals,
  fallbackPurchaseOrders,
  formatCurrency,
  mergePurchaseOrders,
  normalizePurchaseOrderRecord,
  purchaseOrderStorageKey,
} from './purchaseOrderUi';

const today = () => new Date().toISOString().slice(0, 10);

const defaultForm = {
  poNumber: '',
  poDate: today(),
  supplierId: '',
  expectedDeliveryDate: '',
  billingAddress: '',
  deliveryAddress: '',
  paymentTerms: '',
  notes: '',
  status: 'DRAFT',
};

function buildVariantOptions(records = []) {
  const options = [
    ...buildFallbackVariantOptions(),
    ...(records || []).map((item) => ({
      id: item.id || item._id || item.sku,
      itemCode: item.code || item.itemCode || item.sku || '',
      itemName: item.name || item.itemName || '',
      size: item.size || '',
      color: item.color || item.shadeColor || '',
      sku: item.sku || '',
      rate: Number(item.costPrice || item.salePrice || item.sellingPrice || 0),
      mrp: Number(item.mrp || item.salePrice || item.sellingPrice || 0),
      uom: item.uom || 'PCS',
      status: item.status || 'Active',
    })),
  ];

  const merged = new Map();
  options.forEach((option) => {
    merged.set(option.sku || option.id, option);
  });
  return Array.from(merged.values());
}

function PurchaseOrderFormPage({ mode = 'edit' }) {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const location = useLocation();
  const basePath = useRoleBasePath();
  const { id } = useParams();
  const isViewMode = mode === 'view';
  const isEditMode = Boolean(id);

  const backendOrders = useSelector((state) => state.purchase.orders || []);
  const backendSuppliers = useSelector((state) => state.masters.suppliers || []);
  const backendItems = useSelector((state) => state.items.records || []);

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [linePicker, setLinePicker] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchItems());
  }, [dispatch]);

  const localPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || '/'
    : location.pathname;
  const listPath = localPath.startsWith('/orders/purchase-order')
    ? '/orders/purchase-order'
    : '/purchase/orders';

  const suppliers = useMemo(() => {
    const backend = (backendSuppliers || []).map((supplier) => ({
      id: supplier.id || supplier._id,
      supplierName: supplier.supplierName || supplier.name || '',
      city: supplier.city || '',
      state: supplier.state || '',
      addressLine1: supplier.addressLine1 || supplier.address || '',
      addressLine2: supplier.addressLine2 || '',
      creditDays: supplier.creditDays || 0,
      status: supplier.status || 'Active',
    }));
    const merged = new Map();
    [...buildFallbackSuppliers(), ...backend].forEach((supplier) => {
      merged.set(supplier.id, supplier);
    });
    return Array.from(merged.values());
  }, [backendSuppliers]);

  const variantOptions = useMemo(() => buildVariantOptions(backendItems), [backendItems]);

  const existingOrder = useMemo(() => {
    if (!id) {
      return null;
    }
    return backendOrders.find((order) => order._id === id || order.id === id);
  }, [backendOrders, id]);

  useEffect(() => {
    if (isEditMode && !existingOrder) {
      return;
    }

    if (existingOrder) {
      setFormValues({
        poNumber: existingOrder.poNumber,
        poDate: existingOrder.poDate,
        supplierId: existingOrder.supplierId,
        expectedDeliveryDate: existingOrder.expectedDeliveryDate || '',
        billingAddress: existingOrder.billingAddress || '',
        deliveryAddress: existingOrder.deliveryAddress || '',
        paymentTerms: existingOrder.paymentTerms || '',
        notes: existingOrder.notes || '',
        status: existingOrder.status || 'DRAFT',
      });
      setLines(existingOrder.items || []);
      return;
    }

    const generatedNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    setFormValues({
      ...defaultForm,
      poNumber: generatedNumber,
    });
    setLines([]);
  }, [existingOrder, isEditMode]);

  useEffect(() => {
    const supplier = suppliers.find((item) => item.id === formValues.supplierId);
    if (!supplier) {
      return;
    }

    setFormValues((previous) => ({
      ...previous,
      billingAddress:
        previous.billingAddress ||
        [supplier.addressLine1, supplier.addressLine2, supplier.city, supplier.state].filter(Boolean).join(', '),
      paymentTerms: previous.paymentTerms || (supplier.creditDays ? `${supplier.creditDays} days credit` : ''),
    }));
  }, [formValues.supplierId, suppliers]);

  const updateFormValue = (key, value) => {
    setFormError('');
    setSuccessMessage('');
    setFormValues((previous) => ({ ...previous, [key]: value }));
  };

  const availableOptions = useMemo(() => {
    const selectedSkus = new Set(lines.map((line) => line.sku || `${line.itemCode}-${line.size}-${line.color}`));
    return variantOptions.filter((option) => !selectedSkus.has(option.sku || option.id));
  }, [lines, variantOptions]);

  const totals = useMemo(() => calculatePurchaseOrderTotals(lines), [lines]);

  const addLine = () => {
    if (!linePicker) {
      return;
    }

    const option = availableOptions.find((item) => (item.sku || item.id) === linePicker);
    if (!option) {
      return;
    }

    setLines((previous) => [
      ...previous,
      {
        id: `po-line-${Date.now()}`,
        productId: option.id,
        itemCode: option.itemCode,
        itemName: option.itemName,
        size: option.size,
        color: option.color,
        sku: option.sku,
        qty: 1,
        rate: option.rate || 0,
        discountPercent: 0,
        taxPercent: 5,
        remarks: '',
        amount: option.rate || 0,
      },
    ]);
    setLinePicker('');
  };

  const updateLineField = (lineId, key, value) => {
    setFormError('');
    setLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) {
          return line;
        }
        const updated = {
          ...line,
          [key]: ['qty', 'rate', 'discountPercent', 'taxPercent'].includes(key) ? Number(value) : value,
        };
        return {
          ...updated,
          amount: calculatePurchaseOrderLine(updated).amount,
        };
      }),
    );
  };

  const removeLine = (lineId) => {
    setLines((previous) => previous.filter((line) => line.id !== lineId));
  };

  const validateForm = () => {
    if (!formValues.supplierId) {
      setFormError('Supplier is required.');
      return false;
    }
    if (!formValues.poDate) {
      setFormError('PO date is required.');
      return false;
    }
    if (!lines.length) {
      setFormError('Add at least one item line.');
      return false;
    }
    const invalidLine = lines.find(
      (line) => !line.itemCode || !line.itemName || Number(line.qty || 0) <= 0 || Number(line.rate || 0) < 0,
    );
    if (invalidLine) {
      setFormError('Each item line must have item details, quantity, and rate.');
      return false;
    }
    return true;
  };

  const saveOrder = async (status) => {
    setSuccessMessage('');
    if (!validateForm()) {
      return;
    }

    const payload = {
      poNumber: formValues.poNumber,
      poDate: formValues.poDate,
      supplierId: formValues.supplierId,
      expectedDeliveryDate: formValues.expectedDeliveryDate,
      billingAddress: formValues.billingAddress,
      deliveryAddress: formValues.deliveryAddress,
      paymentTerms: formValues.paymentTerms,
      notes: formValues.notes,
      status: status || 'DRAFT',
      items: lines.map((line) => ({
        productId: line.productId || line.id || line._id,
        qty: Number(line.qty || 0),
        price: Number(line.rate || 0),
        remarks: line.remarks || '',
      })),
    };

    try {
      if (isEditMode) {
        await dispatch(updatePurchaseOrder({ id, orderData: payload })).unwrap();
        setSuccessMessage('Purchase order updated successfully.');
      } else {
        await dispatch(addPurchaseOrder(payload)).unwrap();
        setSuccessMessage(status === 'DRAFT' ? 'Purchase order saved as draft.' : 'Purchase order submitted successfully.');
      }

      if (status !== 'DRAFT') {
        setTimeout(() => navigate(listPath), 1500);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save purchase order.');
    }
  };

  if (isEditMode && !existingOrder && backendOrders.length) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Purchase order not found
        </Typography>
        <Button variant="contained" onClick={() => navigate(listPath)}>
          Back to Purchase Orders
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isViewMode ? 'Purchase Order Details' : isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}
        subtitle="Manage supplier, expected delivery, address blocks, status, and garment line items in one purchase order workspace."
        breadcrumbs={[
          { label: 'Purchase' },
          { label: 'Purchase Orders' },
          { label: isViewMode ? 'View' : isEditMode ? 'Edit' : 'New', active: true },
        ]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPath)}>
            Back
          </Button>,
          !isViewMode ? (
            <Button key="draft" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => saveOrder('DRAFT')}>
              Save Draft
            </Button>
          ) : null,
          !isViewMode ? (
            <Button key="submit" variant="contained" startIcon={<SendOutlinedIcon />} onClick={() => saveOrder('PENDING')}>
              Submit
            </Button>
          ) : null,
        ].filter(Boolean)}
      />

      {formError ? <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert> : null}
      {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="PO Number" value={formValues.poNumber || '--'} helper="Auto-generated reference placeholder." />
        <SummaryCard label="Current Status" value={<StatusBadge value={formValues.status} />} helper="Drafts are editable and safe to revise." tone="warning" />
        <SummaryCard label="Total Quantity" value={totals.totalQty} helper="Sum of all quantity lines in this PO." tone="info" />
        <SummaryCard label="Grand Total" value={formatCurrency(totals.grandTotal)} helper="Discount and tax included." tone="success" />
      </Box>

      <FormSection title="PO Header" subtitle="Supplier details, dates, addresses, terms, and status." sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" label="PO Number" value={formValues.poNumber} disabled />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="PO Date"
              value={formValues.poDate}
              onChange={(event) => updateFormValue('poDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Expected Delivery Date"
              value={formValues.expectedDeliveryDate}
              onChange={(event) => updateFormValue('expectedDeliveryDate', event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              value={formValues.status}
              onChange={(event) => updateFormValue('status', event.target.value)}
              disabled={isViewMode}
            >
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Supplier"
              value={formValues.supplierId}
              onChange={(event) => updateFormValue('supplierId', event.target.value)}
              disabled={isViewMode}
            >
              <MenuItem value="">Select Supplier</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Billing Address"
              value={formValues.billingAddress}
              onChange={(event) => updateFormValue('billingAddress', event.target.value)}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Delivery Address"
              value={formValues.deliveryAddress}
              onChange={(event) => updateFormValue('deliveryAddress', event.target.value)}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Payment Terms"
              value={formValues.paymentTerms}
              onChange={(event) => updateFormValue('paymentTerms', event.target.value)}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              value={formValues.notes}
              onChange={(event) => updateFormValue('notes', event.target.value)}
              disabled={isViewMode}
              placeholder="Internal notes, delivery instructions, or special vendor remarks"
            />
          </Grid>
        </Grid>
      </FormSection>

      {!isViewMode ? (
        <FilterBar sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            select
            label="Item Search"
            value={linePicker}
            onChange={(event) => setLinePicker(event.target.value)}
          >
            <MenuItem value="">Select item / size / color</MenuItem>
            {availableOptions.map((option) => (
              <MenuItem key={option.sku || option.id} value={option.sku || option.id}>
                {`${option.itemCode} | ${option.itemName} | ${option.size || '--'} | ${option.color || '--'}`}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addLine} disabled={!linePicker}>
            Add Line
          </Button>
        </FilterBar>
      ) : null}

      <FormSection title="Item Lines" subtitle="Add garment variants with size, color, quantity, rate, discount, tax, and remarks." sx={{ mb: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Discount %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Tax %</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                {!isViewMode ? <TableCell sx={{ fontWeight: 700 }} align="right">Remove</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{line.itemCode}</TableCell>
                  <TableCell>{line.itemName}</TableCell>
                  <TableCell>{line.size || '--'}</TableCell>
                  <TableCell>{line.color || '--'}</TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.qty
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.qty}
                        onChange={(event) => updateLineField(line.id, 'qty', Math.max(1, Number(event.target.value)))}
                        sx={{ width: 88 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      formatCurrency(line.rate)
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.rate}
                        onChange={(event) => updateLineField(line.id, 'rate', Math.max(0, Number(event.target.value)))}
                        sx={{ width: 104 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.discountPercent
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.discountPercent}
                        onChange={(event) =>
                          updateLineField(line.id, 'discountPercent', Math.min(100, Math.max(0, Number(event.target.value))))
                        }
                        sx={{ width: 92 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.taxPercent
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.taxPercent}
                        onChange={(event) =>
                          updateLineField(line.id, 'taxPercent', Math.min(100, Math.max(0, Number(event.target.value))))
                        }
                        sx={{ width: 92 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(calculatePurchaseOrderLine(line).amount)}</TableCell>
                  <TableCell>
                    {isViewMode ? (
                      line.remarks || '--'
                    ) : (
                      <TextField
                        size="small"
                        value={line.remarks || ''}
                        onChange={(event) => updateLineField(line.id, 'remarks', event.target.value)}
                        placeholder="Line remarks"
                      />
                    )}
                  </TableCell>
                  {!isViewMode ? (
                    <TableCell align="right">
                      <IconButton color="error" size="small" onClick={() => removeLine(line.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {!lines.length ? (
                <TableRow>
                  <TableCell colSpan={isViewMode ? 10 : 11} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                    No item lines added yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </FormSection>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Subtotal" value={formatCurrency(totals.subtotal)} helper="Gross line value before discount and tax." />
        <SummaryCard label="Discount Total" value={formatCurrency(totals.discountTotal)} helper="Total line discount applied on the PO." tone="warning" />
        <SummaryCard label="Tax Total" value={formatCurrency(totals.taxTotal)} helper="GST and line tax impact across all rows." tone="info" />
        <SummaryCard label="Grand Total" value={formatCurrency(totals.grandTotal)} helper="Final payable amount for supplier approval." tone="success" />
      </Box>

      {!isViewMode ? (
        <Paper
          elevation={0}
          sx={{
            position: 'sticky',
            bottom: 0,
            p: 2,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            bgcolor: '#fff',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => setCancelDialogOpen(true)}>
              Cancel
            </Button>
            <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => saveOrder('DRAFT')}>
              Save Draft
            </Button>
            <Button variant="contained" startIcon={<SendOutlinedIcon />} onClick={() => saveOrder('PENDING')}>
              Submit
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Any unsaved updates in this purchase order screen will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Continue Editing</Button>
          <Button color="error" onClick={() => navigate(listPath)}>
            Leave Page
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PurchaseOrderFormPage;
