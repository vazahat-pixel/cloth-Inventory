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
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const purchase = useMemo(() => purchases.find((entry) => entry.id === id || entry._id === id), [purchases, id]);
  
  const supplierName = useMemo(() => {
    const sId = purchase?.supplierId?._id || purchase?.supplierId;
    const match = suppliers.find((s) => s.id === sId || s._id === sId);
    return match?.supplierName || match?.name || sId;
  }, [suppliers, purchase]);

  const warehouseName = useMemo(() => {
    const wId = purchase?.storeId || purchase?.warehouseId;
    const match = warehouses.find((w) => w.id === wId || w._id === wId);
    return match?.warehouseName || match?.name || wId;
  }, [warehouses, purchase]);

  const purchaseReturnHomePath = basePath === '/ho' ? '/ho/purchase/purchase-voucher' : '/purchase/return';

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
    dispatch(fetchPurchases());
  }, [dispatch]);

  useEffect(() => {
    if (!purchase) return;

    setLines(
      (purchase.products || purchase.items || []).map((item, index) => {
        return {
          id: item.productId?._id || item.productId || index,
          productId: item.productId?._id || item.productId,
          itemName: item.productId?.name || item.name || 'Item',
          sku: item.productId?.sku || item.sku || '',
          size: item.productId?.size || item.size || '',
          color: item.productId?.shadeColor || item.color || '',
          purchasedQty: Number(item.quantity || item.qty),
          remainingQty: Number(item.quantity || item.qty), // Note: In real app, subtract previous returns
          returnQty: 0,
          rate: Number(item.rate || item.price),
          tax: 5
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
        const taxVal = Number(line.tax || 5);
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
        setErrorMessage('Please enter return quantities.');
        return;
    }

    const payload = {
      referenceId: purchase.id || purchase._id,
      locationId: purchase.storeId || purchase.warehouseId,
      reason: formValues.remarks,
      items: selectedLines.map(line => ({
        variantId: line.productId, // Backend service expects variantId
        quantity: Number(line.returnQty)
      }))
    };

    try {
      await dispatch(addPurchaseReturn(payload)).unwrap();
      setSuccessMessage('Purchase return processed successfully and inventory updated.');
      setTimeout(() => navigate(purchaseReturnHomePath), 1500);
    } catch (err) {
      setErrorMessage(err || 'Failed to process return');
    }
  };

  if (!purchase) return <Box sx={{ p: 4 }}><Typography>Loading purchase details...</Typography></Box>;

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>Purchase Return</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Reference Voucher: {purchase.invoiceNumber || purchase.billNumber}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(purchaseReturnHomePath)}>Back</Button>
      </Stack>

      {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Supplier" value={supplierName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Location" value={warehouseName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Return Date" type="date" InputLabelProps={{ shrink: true }} {...register('returnDate')} />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Reason for Return" {...register('remarks')} placeholder="Defective goods, wrong sizing, price difference, etc." />
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>PRODUCT</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>BILLED</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>RETURN QTY</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>RATE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{line.itemName}</Typography>
                      <Typography variant="caption" color="textSecondary">{line.sku} | {line.size} | {line.color}</Typography>
                    </TableCell>
                    <TableCell align="right">{line.purchasedQty}</TableCell>
                    <TableCell align="right">
                      <TextField type="number" size="small" value={line.returnQty} 
                        onChange={(e) => updateReturnQty(line.id, e.target.value)} 
                        sx={{ width: 80 }} inputProps={{ style: { textAlign: 'right' } }} />
                    </TableCell>
                    <TableCell align="right">₹{line.rate.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>₹{(line.returnQty * line.rate).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ReturnSummaryCard itemsReturned={totals.totalQuantity} subtotal={totals.subtotal} gst={totals.gstAmount} total={totals.totalAmount} />
          <Button variant="contained" fullWidth size="large" onClick={() => setConfirmOpen(true)} startIcon={<SaveOutlinedIcon />} sx={{ mt: 2, py: 1.5 }}>
            Process Return
          </Button>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Finalize Purchase Return?</DialogTitle>
        <DialogContent>
          <Typography>This will decrease your stock in {warehouseName} and reduce the payable amount to the supplier.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={onSubmit} variant="contained" color="error">Confirm & Process</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PurchaseReturnPage;
