import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
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
import { loadModuleRecords, upsertModuleRecord } from '../erp/erpLocalStore';
import { fallbackGrns, formatCurrency, grnStorageKey, mergeGrns, normalizeGrnRecord } from './grnUi';
import { fallbackPurchaseOrders, mergePurchaseOrders, purchaseOrderStorageKey, toNumber } from '../purchase/purchaseOrderUi';

const defaultForm = {
  grnNumber: '',
  grnDate: new Date().toISOString().slice(0, 10),
  poId: '',
  supplierName: '',
  warehouse: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().slice(0, 10),
  transportDetails: '',
  remarks: '',
  status: 'Draft',
};

function GRNFormPage({ mode = 'edit' }) {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = mode === 'view';
  const isEditMode = Boolean(id);

  const backendGrns = useSelector((state) => state.grn.records || []);
  const backendOrders = useSelector((state) => state.purchase.orders || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchMasters('warehouses'));
  }, [dispatch]);

  const existingGrn = useMemo(() => {
    if (!id) {
      return null;
    }
    const records = mergeGrns(loadModuleRecords(grnStorageKey, fallbackGrns), backendGrns);
    return records.find((record) => record.id === id);
  }, [backendGrns, id]);

  const purchaseOrders = useMemo(
    () => mergePurchaseOrders(loadModuleRecords(purchaseOrderStorageKey, fallbackPurchaseOrders), backendOrders),
    [backendOrders],
  );

  const selectedPoId = formValues.poId || searchParams.get('poId') || '';
  const selectedPurchaseOrder = useMemo(
    () => purchaseOrders.find((order) => order.id === selectedPoId),
    [purchaseOrders, selectedPoId],
  );

  const warehouseOptions = useMemo(
    () =>
      (warehouses || []).map((warehouse) => ({
        id: warehouse.id || warehouse._id,
        name: warehouse.warehouseName || warehouse.name,
      })),
    [warehouses],
  );

  useEffect(() => {
    if (isEditMode && !existingGrn) {
      return;
    }

    if (existingGrn) {
      setFormValues({
        grnNumber: existingGrn.grnNumber,
        grnDate: existingGrn.grnDate,
        poId: existingGrn.poId || '',
        supplierName: existingGrn.supplierName || '',
        warehouse: existingGrn.warehouse || '',
        invoiceNumber: existingGrn.invoiceNumber || '',
        invoiceDate: existingGrn.invoiceDate || defaultForm.invoiceDate,
        transportDetails: existingGrn.transportDetails || '',
        remarks: existingGrn.remarks || '',
        status: existingGrn.status || 'Draft',
      });
      setLines(existingGrn.lineItems || []);
      return;
    }

    setFormValues({
      ...defaultForm,
      grnNumber: `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      poId: searchParams.get('poId') || '',
      warehouse: warehouseOptions[0]?.name || '',
    });
    setLines([]);
  }, [existingGrn, isEditMode, searchParams, warehouseOptions]);

  useEffect(() => {
    if (!selectedPurchaseOrder || isEditMode) {
      return;
    }

    const otherGrns = mergeGrns(loadModuleRecords(grnStorageKey, fallbackGrns), backendGrns).filter((record) => record.poId === selectedPurchaseOrder.id);
    const receivedByKey = otherGrns.reduce((accumulator, record) => {
      (record.lineItems || []).forEach((line) => {
        const key = `${line.itemCode}-${line.size}`;
        accumulator[key] = (accumulator[key] || 0) + Number(line.receivedQty || 0);
      });
      return accumulator;
    }, {});

    setFormValues((previous) => ({
      ...previous,
      poId: selectedPurchaseOrder.id,
      supplierName: selectedPurchaseOrder.supplierName,
      warehouse: previous.warehouse || warehouseOptions[0]?.name || '',
      remarks: previous.remarks || selectedPurchaseOrder.notes || '',
    }));

    setLines(
      (selectedPurchaseOrder.items || []).map((line, index) => {
        const key = `${line.itemCode}-${line.size}`;
        const previouslyReceivedQty = receivedByKey[key] || 0;
        const remainingQty = Math.max(Number(line.qty || 0) - previouslyReceivedQty, 0);
        return {
          id: `grn-line-${Date.now()}-${index + 1}`,
          itemCode: line.itemCode,
          itemName: line.itemName,
          size: line.size,
          orderedQty: Number(line.qty || 0),
          previouslyReceivedQty,
          receivedQty: remainingQty,
          rejectedQty: 0,
          acceptedQty: remainingQty,
          rate: Number(line.rate || 0),
          batchNo: '',
          barcodeGenerate: true,
          remarks: '',
        };
      }),
    );
  }, [backendGrns, isEditMode, selectedPurchaseOrder, warehouseOptions]);

  const totals = useMemo(
    () =>
      lines.reduce(
        (accumulator, line) => {
          accumulator.orderedTotal += toNumber(line.orderedQty, 0);
          accumulator.receivedTotal += toNumber(line.receivedQty, 0);
          accumulator.acceptedTotal += toNumber(line.acceptedQty, 0);
          accumulator.rejectedTotal += toNumber(line.rejectedQty, 0);
          return accumulator;
        },
        { orderedTotal: 0, receivedTotal: 0, acceptedTotal: 0, rejectedTotal: 0 },
      ),
    [lines],
  );

  const updateLine = (lineId, key, value) => {
    setLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) {
          return line;
        }
        const updated = {
          ...line,
          [key]: ['orderedQty', 'previouslyReceivedQty', 'receivedQty', 'rejectedQty', 'acceptedQty', 'rate'].includes(key)
            ? Number(value)
            : value,
        };
        if (key === 'receivedQty' || key === 'rejectedQty') {
          updated.acceptedQty = Math.max(Number(updated.receivedQty || 0) - Number(updated.rejectedQty || 0), 0);
        }
        return updated;
      }),
    );
  };

  const addManualLine = () => {
    setLines((previous) => [
      ...previous,
      {
        id: `grn-line-${Date.now()}`,
        itemCode: '',
        itemName: '',
        size: '',
        orderedQty: 0,
        previouslyReceivedQty: 0,
        receivedQty: 0,
        rejectedQty: 0,
        acceptedQty: 0,
        rate: 0,
        batchNo: '',
        barcodeGenerate: true,
        remarks: '',
      },
    ]);
  };

  const validate = () => {
    if (!formValues.grnDate || !formValues.invoiceNumber || !formValues.warehouse) {
      setErrorMessage('GRN date, invoice number, and warehouse are required.');
      return false;
    }
    if (!lines.length) {
      setErrorMessage('Add at least one line item before saving the GRN.');
      return false;
    }
    const invalidLine = lines.find(
      (line) => !line.itemCode || !line.itemName || Number(line.receivedQty || 0) < 0 || Number(line.rejectedQty || 0) < 0,
    );
    if (invalidLine) {
      setErrorMessage('Each GRN line must have item code, item name, and valid quantity values.');
      return false;
    }
    return true;
  };

  const persistRecord = (targetStatus) => {
    if (!validate()) {
      return;
    }

    const derivedStatus =
      targetStatus === 'Approved' && totals.receivedTotal < totals.orderedTotal
        ? 'Partial'
        : targetStatus;

    const record = normalizeGrnRecord({
      id: existingGrn?.id || `grn-${Date.now()}`,
      grnNumber: formValues.grnNumber,
      grnDate: formValues.grnDate,
      poId: selectedPurchaseOrder?.id || formValues.poId,
      poNumber: selectedPurchaseOrder?.poNumber || existingGrn?.poNumber || '',
      supplierName: formValues.supplierName,
      warehouse: formValues.warehouse,
      invoiceNumber: formValues.invoiceNumber,
      invoiceDate: formValues.invoiceDate,
      transportDetails: formValues.transportDetails,
      remarks: formValues.remarks,
      status: derivedStatus,
      postedBy: derivedStatus === 'Draft' ? '' : 'HO Admin',
      createdAt: existingGrn?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineItems: lines,
    });

    upsertModuleRecord(grnStorageKey, record);
    setFormValues((previous) => ({ ...previous, status: derivedStatus }));
    setSuccessMessage(
      derivedStatus === 'Draft'
        ? 'GRN saved as draft. Stock is not posted yet.'
        : 'GRN approved. Inventory is marked as posted in the UI flow.',
    );
    setErrorMessage('');

    if (derivedStatus !== 'Draft') {
      navigate('/grn');
    }
  };

  if (isEditMode && !existingGrn && backendGrns.length) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          GRN not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/grn')}>
          Back to GRN List
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isViewMode ? 'GRN Details' : isEditMode ? 'Edit GRN' : 'Create GRN'}
        subtitle="Receive goods against a purchase order, review received and rejected quantities, and control when inventory is visually posted."
        breadcrumbs={[
          { label: 'Purchase' },
          { label: 'GRN' },
          { label: isViewMode ? 'View' : isEditMode ? 'Edit' : 'New', active: true },
        ]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/grn')}>
            Back
          </Button>,
          !isViewMode ? (
            <Button key="draft" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => persistRecord('Draft')}>
              Save Draft
            </Button>
          ) : null,
          !isViewMode ? (
            <Button key="approve" variant="contained" startIcon={<TaskAltOutlinedIcon />} onClick={() => setConfirmOpen(true)}>
              Approve / Post
            </Button>
          ) : null,
        ].filter(Boolean)}
      />

      {formValues.status === 'Draft' ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Draft GRN: stock is not posted yet.
        </Alert>
      ) : null}
      {(formValues.status === 'Approved' || formValues.status === 'Partial') ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Approved GRN: inventory is shown as posted to warehouse.
        </Alert>
      ) : null}
      {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}
      {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="GRN Number" value={formValues.grnNumber || '--'} helper="Auto-display inward reference." />
        <SummaryCard label="Current Status" value={<StatusBadge value={formValues.status} />} helper="Draft, approved, partial, or cancelled." tone="warning" />
        <SummaryCard label="Received Total" value={totals.receivedTotal} helper="Visible inward quantity in this GRN." tone="info" />
        <SummaryCard label="Accepted Value" value={formatCurrency(lines.reduce((sum, line) => sum + Number(line.acceptedQty || 0) * Number(line.rate || 0), 0))} helper="Accepted inward value based on rate." tone="success" />
      </Box>

      <FormSection title="Header" subtitle="GRN details, selected PO, supplier, warehouse, and invoice references.">
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" label="GRN Number" value={formValues.grnNumber} disabled />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="GRN Date"
              value={formValues.grnDate}
              onChange={(event) => setFormValues((previous) => ({ ...previous, grnDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Select PO"
              value={selectedPurchaseOrder?.id || formValues.poId}
              onChange={(event) => setFormValues((previous) => ({ ...previous, poId: event.target.value }))}
              disabled={isViewMode || Boolean(existingGrn)}
            >
              <MenuItem value="">Manual GRN</MenuItem>
              {purchaseOrders.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  {`${order.poNumber} | ${order.supplierName}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" label="Supplier" value={formValues.supplierName} disabled />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Warehouse / Location"
              value={formValues.warehouse}
              onChange={(event) => setFormValues((previous) => ({ ...previous, warehouse: event.target.value }))}
              disabled={isViewMode}
            >
              <MenuItem value="">Select Warehouse</MenuItem>
              {warehouseOptions.map((warehouse) => (
                <MenuItem key={warehouse.id || warehouse.name} value={warehouse.name}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Invoice Number"
              value={formValues.invoiceNumber}
              onChange={(event) => setFormValues((previous) => ({ ...previous, invoiceNumber: event.target.value }))}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Invoice Date"
              value={formValues.invoiceDate}
              onChange={(event) => setFormValues((previous) => ({ ...previous, invoiceDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Transport Details"
              value={formValues.transportDetails}
              onChange={(event) => setFormValues((previous) => ({ ...previous, transportDetails: event.target.value }))}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Remarks"
              value={formValues.remarks}
              onChange={(event) => setFormValues((previous) => ({ ...previous, remarks: event.target.value }))}
              disabled={isViewMode}
              placeholder="Quality notes, receiving remarks, or warehouse comments"
            />
          </Grid>
        </Grid>
      </FormSection>

      {!isViewMode ? (
        <Box sx={{ mb: 2, mt: 2 }}>
          <Button variant="outlined" onClick={addManualLine}>
            Add Manual Row
          </Button>
        </Box>
      ) : null}

      <FormSection title="Item Receipt Table" subtitle="Review ordered, previously received, received, rejected, accepted, rate, batch, barcode toggle, and remarks.">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Ordered Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Previously Received</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Received Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Rejected Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Accepted Qty</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Batch No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Barcode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                {!isViewMode ? <TableCell sx={{ fontWeight: 700 }} align="right">Remove</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    {isViewMode ? (
                      line.itemCode || '--'
                    ) : (
                      <TextField size="small" value={line.itemCode} onChange={(event) => updateLine(line.id, 'itemCode', event.target.value)} />
                    )}
                  </TableCell>
                  <TableCell>
                    {isViewMode ? (
                      line.itemName || '--'
                    ) : (
                      <TextField size="small" value={line.itemName} onChange={(event) => updateLine(line.id, 'itemName', event.target.value)} />
                    )}
                  </TableCell>
                  <TableCell>
                    {isViewMode ? (
                      line.size || '--'
                    ) : (
                      <TextField size="small" value={line.size} onChange={(event) => updateLine(line.id, 'size', event.target.value)} sx={{ width: 84 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">{line.orderedQty}</TableCell>
                  <TableCell align="right">{line.previouslyReceivedQty}</TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.receivedQty
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.receivedQty}
                        onChange={(event) => updateLine(line.id, 'receivedQty', Math.max(0, Number(event.target.value)))}
                        sx={{ width: 92 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.rejectedQty
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.rejectedQty}
                        onChange={(event) => updateLine(line.id, 'rejectedQty', Math.max(0, Number(event.target.value)))}
                        sx={{ width: 92 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">{line.acceptedQty}</TableCell>
                  <TableCell align="right">
                    {isViewMode ? (
                      line.rate
                    ) : (
                      <TextField
                        size="small"
                        type="number"
                        value={line.rate}
                        onChange={(event) => updateLine(line.id, 'rate', Math.max(0, Number(event.target.value)))}
                        sx={{ width: 98 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isViewMode ? (
                      line.batchNo || '--'
                    ) : (
                      <TextField size="small" value={line.batchNo} onChange={(event) => updateLine(line.id, 'batchNo', event.target.value)} />
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(line.barcodeGenerate)}
                          onChange={(event) => updateLine(line.id, 'barcodeGenerate', event.target.checked)}
                          disabled={isViewMode}
                        />
                      }
                      label=""
                    />
                  </TableCell>
                  <TableCell>
                    {isViewMode ? (
                      line.remarks || '--'
                    ) : (
                      <TextField size="small" value={line.remarks} onChange={(event) => updateLine(line.id, 'remarks', event.target.value)} />
                    )}
                  </TableCell>
                  {!isViewMode ? (
                    <TableCell align="right">
                      <IconButton color="error" size="small" onClick={() => setLines((previous) => previous.filter((item) => item.id !== line.id))}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {!lines.length ? (
                <TableRow>
                  <TableCell colSpan={isViewMode ? 12 : 13} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                    No receipt lines available.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </FormSection>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mt: 2, mb: 2 }}>
        <SummaryCard label="Ordered Total" value={totals.orderedTotal} helper="Quantity expected on the GRN." />
        <SummaryCard label="Received Total" value={totals.receivedTotal} helper="Quantity physically received in this document." tone="info" />
        <SummaryCard label="Accepted Total" value={totals.acceptedTotal} helper="Inventory-ready quantity after rejection." tone="success" />
        <SummaryCard label="Rejected Total" value={totals.rejectedTotal} helper="Rejected quantity to review with supplier." tone="warning" />
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
            <Button variant="outlined" onClick={() => navigate('/grn')}>
              Cancel
            </Button>
            <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => persistRecord('Draft')}>
              Save Draft
            </Button>
            <Button variant="contained" startIcon={<TaskAltOutlinedIcon />} onClick={() => setConfirmOpen(true)}>
              Approve / Post
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Approve and post inventory?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Approving this GRN will mark inventory as posted in the UI flow. Draft state will no longer show as stock pending.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Back</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              persistRecord('Approved');
            }}
          >
            Confirm Approve / Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GRNFormPage;
