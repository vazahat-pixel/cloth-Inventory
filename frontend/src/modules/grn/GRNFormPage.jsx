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
  CircularProgress,
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
import { addGrn, approveGrn, fetchGrnById } from './grnSlice';

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

  const [formValues, setFormValues] = useState(defaultForm);
  const [lines, setLines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const existingGrn = useMemo(() => grns.find(g => g._id === id), [grns, id]);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('suppliers'));
    if (id) {
        dispatch(fetchGrnById(id));
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
      setLines(existingGrn.items || []);
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
    if (field === 'receivedQty' || field === 'rejectedQty') {
        newLines[idx].acceptedQty = Math.max(0, Number(newLines[idx].receivedQty || 0) - Number(newLines[idx].rejectedQty || 0));
    }
    setLines(newLines);
  };

  const handleSave = async (isDraft = true) => {
    try {
        setErrorMessage('');
        const payload = {
            ...formValues,
            items: lines.map(l => ({
                productId: l.productId,
                receivedQty: Number(l.receivedQty),
                rejectedQty: Number(l.rejectedQty),
                batchNumber: l.batchNumber || `B-${Date.now().toString().slice(-4)}`
            }))
        };

        const result = await dispatch(addGrn(payload)).unwrap();
        setSuccessMessage('GRN created successfully');
        
        if (!isDraft) {
            await dispatch(approveGrn(result._id || result.id)).unwrap();
            setSuccessMessage('GRN created and approved successfully');
        }

        setTimeout(() => navigate('/ho/grn'), 1500);
    } catch (err) {
        setErrorMessage(err || 'Failed to save GRN');
    }
  };

  if (grnLoading && id) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <PageHeader
        title={isViewMode ? 'GRN Details' : id ? 'Edit GRN' : 'Create GRN'}
        subtitle="Receipt goods against Purchase Order or Voucher."
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/ho/grn')}>
            Back
          </Button>,
          !isViewMode && (
            <Button key="save" variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => handleSave(true)}>
              Save Draft
            </Button>
          ),
          !isViewMode && (
            <Button key="approve" variant="contained" color="success" startIcon={<TaskAltOutlinedIcon />} onClick={() => setConfirmOpen(true)}>
              Approve & Post
            </Button>
          )
        ].filter(Boolean)}
      />

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Purchase Order" size="small" value={formValues.purchaseOrderId} 
                    onChange={e => setFormValues({...formValues, purchaseOrderId: e.target.value})} disabled={isViewMode || !!id}>
                    <MenuItem value="">Direct Receipt</MenuItem>
                    {purchaseOrders.map(po => <MenuItem key={po.id || po._id} value={po.id || po._id}>{po.poNumber} - {po.supplierName}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Supplier" size="small" value={formValues.supplierId} 
                    onChange={e => setFormValues({...formValues, supplierId: e.target.value})} disabled={isViewMode || !!id}>
                    {suppliers.map(s => <MenuItem key={s.id || s._id} value={s.id || s._id}>{s.supplierName || s.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select fullWidth label="Warehouse" size="small" value={formValues.warehouseId} 
                    onChange={e => setFormValues({...formValues, warehouseId: e.target.value})} disabled={isViewMode}>
                    {warehouses.map(w => <MenuItem key={w.id || w._id} value={w.id || w._id}>{w.warehouseName || w.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Invoice No" size="small" value={formValues.invoiceNumber} 
                    onChange={e => setFormValues({...formValues, invoiceNumber: e.target.value})} disabled={isViewMode} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ORDERED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>RECEIVED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>REJECTED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ACCEPTED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>RATE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>BATCH #</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{line.itemName || line.productId?.name || 'Item'}</TableCell>
                    <TableCell align="right">{line.orderedQty}</TableCell>
                    <TableCell align="right">
                        <TextField type="number" size="small" value={line.receivedQty} 
                            onChange={e => updateLine(idx, 'receivedQty', e.target.value)} disabled={isViewMode} sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell align="right">
                        <TextField type="number" size="small" value={line.rejectedQty} 
                            onChange={e => updateLine(idx, 'rejectedQty', e.target.value)} disabled={isViewMode} sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 700 }}>{line.acceptedQty}</TableCell>
                    <TableCell align="right">₹{Number(line.rate || 0).toFixed(2)}</TableCell>
                    <TableCell>
                        <TextField size="small" value={line.batchNumber} onChange={e => updateLine(idx, 'batchNumber', e.target.value)} disabled={isViewMode} />
                    </TableCell>
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
