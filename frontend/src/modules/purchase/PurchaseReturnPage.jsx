import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Box,
  Button,
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useForm } from 'react-hook-form';
import { addPurchaseReturn, fetchPurchases } from './purchaseSlice';
import ReturnSummaryCard from '../../components/ReturnSummaryCard';
import useRoleBasePath from '../../hooks/useRoleBasePath';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function PurchaseReturnPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const basePath = useRoleBasePath();

  const purchases = useSelector((state) => state.purchase.records || []);
  const loading = useSelector((state) => state.purchase.loading);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);

  const purchase = useMemo(() => purchases.find((entry) => (entry.id === id || entry._id === id)), [purchases, id]);
  
  const supplierName = useMemo(() => {
    const sId = purchase?.supplierId?._id || purchase?.supplierId;
    const match = suppliers.find((s) => (s.id === sId || s._id === sId));
    return match?.supplierName || match?.name || sId || 'Searching...';
  }, [suppliers, purchase]);

  const locationName = useMemo(() => {
    const lId = purchase?.storeId || purchase?.warehouseId || purchase?.locationId;
    const combined = [...warehouses, ...stores];
    const match = combined.find((l) => (l.id === lId || l._id === lId));
    return match?.name || match?.warehouseName || lId || 'Searching...';
  }, [warehouses, stores, purchase]);

  const returnHomePath = '/purchase/purchase-return';

  const [lines, setLines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      returnDate: getTodayDate(),
      remarks: '',
    },
  });

  const formValues = watch();

  useEffect(() => {
    if (!purchases.length) {
      dispatch(fetchPurchases());
    }
  }, [dispatch, purchases.length]);

  useEffect(() => {
    if (!purchase) return;

    // Use normalized items if available, otherwise products
    const rawItems = purchase.items || purchase.products || [];

    setLines(
      rawItems.map((item, index) => {
        // Handle both populated and raw item structures
        const pId = item.productId?._id || item.productId || item.variantId;
        const itemName = item.itemName || item.name || item.productId?.name || 'Item';
        const rate = Number(item.rate || item.price || 0);

        return {
          id: pId || index,
          productId: pId,
          itemName,
          sku: item.sku || item.productId?.sku || '',
          size: item.size || item.productId?.size || '',
          color: item.color || item.shadeColor || item.productId?.shadeColor || '',
          purchasedQty: Number(item.quantity || item.qty || 0),
          remainingQty: Number(item.quantity || item.qty || 0), 
          returnQty: 0,
          rate,
          tax: item.tax || item.gstPercent || 5
        };
      }),
    );
  }, [purchase]);

  const totals = useMemo(() => {
    return lines.reduce(
      (accumulator, line) => {
        const qty = Number(line.returnQty || 0);
        const rate = Number(line.rate || 0);
        const amt = qty * rate;
        const taxVal = Number(line.tax || 0);
        const gst = amt * (taxVal / 100);

        accumulator.totalQuantity += qty;
        accumulator.subtotal += amt;
        accumulator.gstAmount += gst;
        accumulator.totalAmount += (amt + gst);
        return accumulator;
      },
      { totalQuantity: 0, subtotal: 0, gstAmount: 0, totalAmount: 0 },
    );
  }, [lines]);

  const updateReturnQty = (lineId, value) => {
    setLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) return line;
        const qty = Math.max(0, Number(value));
        return {
          ...line,
          returnQty: qty > line.remainingQty ? line.remainingQty : qty,
        };
      }),
    );
  };

  const onSubmit = async () => {
    setConfirmOpen(false);
    setErrorMessage('');
    
    const selectedLines = lines.filter((line) => Number(line.returnQty) > 0);
    if (!selectedLines.length) {
        setErrorMessage('Please enter return quantities for at least one item.');
        return;
    }

    const payload = {
      referenceId: purchase.id || purchase._id,
      locationId: purchase.storeId || purchase.warehouseId || purchase.locationId,
      reason: formValues.remarks,
      type: 'PURCHASE_RETURN',
      items: selectedLines.map(line => ({
        variantId: line.productId,
        quantity: Number(line.returnQty)
      }))
    };

    try {
      await dispatch(addPurchaseReturn(payload)).unwrap();
      setSuccessMessage('Purchase return processed successfully. Inventory and ledger updated.');
      setTimeout(() => navigate(returnHomePath), 1500);
    } catch (err) {
      setErrorMessage(err || 'Failed to process return. Please check your connection.');
    }
  };

  if (loading && !purchase) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={40} />
        <Typography color="textSecondary">Loading purchase details...</Typography>
      </Box>
    );
  }

  if (!purchase && !loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Purchase Record Not Found</Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 3 }} color="textSecondary">The voucher ID you are looking for does not exist or has been removed.</Typography>
        <Button variant="contained" onClick={() => navigate('/purchase/purchase-voucher')}>Back to Vouchers</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: 13 }} onClick={() => navigate('/purchase/purchase-voucher')}>Purchases</Link>
            <Typography color="text.primary" sx={{ fontSize: 13 }}>Process Return</Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>Purchase Return</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Reference Voucher: {purchase?.invoiceNumber || purchase?.billNumber}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(returnHomePath)}>Back to List</Button>
      </Stack>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', fontSize: 11 }}>Document Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Supplier" value={supplierName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Location" value={locationName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Return Date" type="date" InputLabelProps={{ shrink: true }} {...register('returnDate')} />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Reason for Return" {...register('remarks')} placeholder="Ex: Defective goods, mapping issue, SKU mismatch..." />
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>PRODUCT / VARIANT</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>BILLED QTY</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>RETURN QTY</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>RATE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>TAX %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: 11 }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.itemName}</Typography>
                      <Typography variant="caption" color="textSecondary">{line.sku} {line.size && `| ${line.size}`} {line.color && `| ${line.color}`}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#64748b' }}>{line.purchasedQty}</TableCell>
                    <TableCell align="right">
                      <TextField 
                        type="number" 
                        size="small" 
                        value={line.returnQty} 
                        onChange={(e) => updateReturnQty(line.id, e.target.value)} 
                        sx={{ width: 80, '& .MuiOutlinedInput-input': { p: 1, textAlign: 'right' } }} 
                      />
                    </TableCell>
                    <TableCell align="right">₹{line.rate.toFixed(2)}</TableCell>
                    <TableCell align="right">{line.tax}%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: line.returnQty > 0 ? 'error.main' : 'text.secondary' }}>
                      ₹{(line.returnQty * line.rate * (1 + line.tax/100)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ReturnSummaryCard itemsReturned={totals.totalQuantity} subtotal={totals.subtotal} gst={totals.gstAmount} total={totals.totalAmount} />
          
          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            color="error"
            onClick={() => setConfirmOpen(true)} 
            disabled={totals.totalQuantity <= 0}
            startIcon={<SaveOutlinedIcon />} 
            sx={{ mt: 2, py: 1.5, fontWeight: 700, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
          >
            Finalize Return
          </Button>
          
          <Button 
            variant="outlined" 
            fullWidth 
            size="large" 
            onClick={() => navigate(returnHomePath)}
            startIcon={<CancelOutlinedIcon />} 
            sx={{ mt: 2, py: 1.2, color: '#64748b', borderColor: '#e2e8f0' }}
          >
            Cancel
          </Button>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Purchase Return?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
            You are about to return <strong>{totals.totalQuantity} items</strong> to the supplier. 
            This action will:
          </Typography>
          <Box component="ul" sx={{ mt: 2, mb: 0, color: '#475569', fontSize: 13 }}>
            <li>Decrease stock in <strong>{locationName}</strong>.</li>
            <li>Reduce the outstanding payable amount to the supplier.</li>
            <li>Generate a reversal in the inventory ledger.</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#64748b', fontWeight: 600 }}>Review Again</Button>
          <Button onClick={onSubmit} variant="contained" color="error" sx={{ px: 4, fontWeight: 700 }}>Confirm & Process</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PurchaseReturnPage;
