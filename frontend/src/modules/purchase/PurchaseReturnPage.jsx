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
import PreviewOutlinedIcon from '@mui/icons-material/PreviewOutlined';
import { useForm } from 'react-hook-form';
import { addPurchaseReturn } from './purchaseSlice';
import ReturnSummaryCard from '../../components/ReturnSummaryCard';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function PurchaseReturnPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const purchases = useSelector((state) => state.purchase.records || []);
  const purchaseReturns = useSelector((state) => state.purchase.returns || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.inventory.warehouses || []);

  const purchase = purchases.find((entry) => entry.id === id);
  const supplierName = suppliers.find((entry) => entry.id === purchase?.supplierId)?.supplierName;
  const warehouseName = warehouses.find((entry) => entry.id === purchase?.warehouseId)?.name;

  const returnedByVariantLot = useMemo(() => {
    if (!purchase) {
      return {};
    }
    const key = (vId, lot) => `${vId}|${lot || ''}`;
    return purchaseReturns
      .filter((entry) => entry.purchaseId === purchase.id)
      .reduce((accumulator, entry) => {
        entry.items.forEach((line) => {
          const k = key(line.variantId, line.lotNumber);
          accumulator[k] = (accumulator[k] || 0) + Number(line.returnQty || 0);
        });
        return accumulator;
      }, {});
  }, [purchase, purchaseReturns]);

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
    if (!purchase) {
      setLines([]);
      return;
    }

    const key = (vId, lot) => `${vId}|${lot || ''}`;

    setLines(
      purchase.items.map((item, index) => {
        const alreadyReturned =
          returnedByVariantLot[key(item.variantId, item.lotNumber)] || 0;
        const remainingQty = Math.max(Number(item.quantity) - alreadyReturned, 0);

        return {
          id: `${item.variantId}-${item.lotNumber || ''}-${index}`,
          ...item,
          lotNumber: item.lotNumber || '',
          purchasedQty: Number(item.quantity),
          remainingQty,
          returnQty: 0,
        };
      }),
    );
  }, [purchase, returnedByVariantLot]);

  const totals = useMemo(() => {
    return lines.reduce(
      (accumulator, line) => {
        const qty = Number(line.returnQty || 0);
        const rate = Number(line.rate || 0);
        const amt = qty * rate;
        const taxVal = Number(line.tax || 5); // Fallback to 5% if unspecified in line level
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
        if (line.id !== lineId) {
          return line;
        }

        const qty = Math.max(0, Number(value));
        return {
          ...line,
          returnQty: qty > line.remainingQty ? line.remainingQty : qty,
        };
      }),
    );
  };

  const handleOpenConfirm = () => {
    setErrorMessage('');

    if (!purchase) {
      setErrorMessage('Purchase bill not found.');
      return;
    }

    const selectedLines = lines.filter((line) => Number(line.returnQty) > 0);
    if (!selectedLines.length) {
      setErrorMessage('Enter return quantity for at least one line.');
      return;
    }

    const invalidLine = selectedLines.find(
      (line) => Number(line.returnQty) > Number(line.remainingQty),
    );
    if (invalidLine) {
      setErrorMessage(`Return quantity exceeds purchased for ${invalidLine.sku || invalidLine.itemName}.`);
      return;
    }

    setConfirmOpen(true);
  };

  const onSubmit = () => {
    setConfirmOpen(false);
    setErrorMessage('');
    setSuccessMessage('');

    const selectedLines = lines.filter((line) => Number(line.returnQty) > 0);
    const returnPromises = selectedLines.map((line) => {
      const itemPayload = {
        type: 'STORE_TO_FACTORY',
        storeId: purchase.warehouseId || purchase.storeId,
        productId: line.variantId || line.productId,
        quantity: Number(line.returnQty),
        reason: formValues.remarks,
      };
      return dispatch(addPurchaseReturn(itemPayload)).unwrap();
    });

    Promise.all(returnPromises)
      .then(() => {
        setSuccessMessage('Purchase return processed successfully.');
        reset({ returnDate: getTodayDate(), remarks: '' });
        setTimeout(() => navigate('/purchase'), 1500);
      })
      .catch((err) => {
        setErrorMessage(err || 'Failed to process return');
      });
  };

  if (!purchase) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Purchase bill not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/purchase')}>
          Back to Purchase List
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Purchase Return
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Return variants to supplier and reduce warehouse stock.
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchase')}>
          Back
        </Button>
      </Stack>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 3, bgcolor: '#ffffff' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Reference Bill" value={purchase.billNumber || purchase.invoiceNumber} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Supplier" value={supplierName || purchase.supplierId} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Warehouse" value={warehouseName || purchase.warehouseId} InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Return Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('returnDate', { required: true })}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField size="small" fullWidth label="Return Reason / Remarks" {...register('remarks')} />
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, bgcolor: '#ffffff' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Product</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Purchased Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Return Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Rate</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>GST</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Return Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => {
                    const amt = Number(line.returnQty || 0) * Number(line.rate || 0);
                    const gst = amt * (Number(line.tax || 5) / 100);
                    const totalRetAmt = amt + gst;

                    return (
                      <TableRow key={line.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                            {line.itemName || line.name || line.sku}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {line.sku && `SKU: ${line.sku} | `}{line.size && `${line.size}/`}{line.color && `${line.color}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#475569' }}>{line.purchasedQty}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={line.returnQty}
                            onChange={(event) => updateReturnQty(line.id, event.target.value)}
                            sx={{ width: 90, '& input': { textAlign: 'right', p: 1 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#475569' }}>₹{Number(line.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ color: '#475569' }}>₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>
                          ₹{totalRetAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ReturnSummaryCard
            itemsReturned={totals.totalQuantity}
            subtotal={totals.subtotal}
            gst={totals.gstAmount}
            total={totals.totalAmount}
          />

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleOpenConfirm}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, py: 1.5 }}
            >
              Save Return
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PreviewOutlinedIcon />}
              sx={{ color: '#475569', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f1f5f9' }, py: 1.5 }}
            >
              Preview Return
            </Button>
            <Button
              variant="text"
              size="large"
              startIcon={<CancelOutlinedIcon />}
              onClick={() => navigate('/purchase')}
              sx={{ color: '#64748b', '&:hover': { bgcolor: '#f8fafc' } }}
            >
              Cancel
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Confirm Purchase Return</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            Are you sure you want to finalize this return?
            <br /><br />
            <strong>Note:</strong> Purchase return will reduce inventory and reverse supplier payable.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button onClick={onSubmit} variant="contained" sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PurchaseReturnPage;
