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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useForm } from 'react-hook-form';
import { addSalesReturn, fetchSales, fetchSalesReturns } from './salesSlice';
import { fetchMasters } from '../masters/mastersSlice';
import ReturnSummaryCard from '../../components/ReturnSummaryCard';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function SalesReturnPage({
  listPath = '/sales',
  pageTitle = 'Customer Return',
  pageDescription = 'Process customer refunds and reverse sold items back to inventory.',
  listLabel = 'Back to Sales List',
}) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const sales = useSelector((state) => state.sales.records || []);
  const salesReturns = useSelector((state) => state.sales.returns || []);
  const customers = useSelector((state) => state.masters.customers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const sale = sales.find((entry) => entry.id === id);
  const customerName =
    sale?.customerName ||
    customers.find((entry) => entry.id === sale?.customerId)?.customerName ||
    'Walk-in Customer';
  const warehouseName = warehouses.find((entry) => entry.id === sale?.warehouseId)?.name;

  const returnedByVariant = useMemo(() => {
    if (!sale) {
      return {};
    }

    return salesReturns
      .filter((entry) => entry.saleId === sale.id)
      .reduce((accumulator, entry) => {
        entry.items.forEach((line) => {
          accumulator[line.variantId] =
            (accumulator[line.variantId] || 0) + Number(line.returnQty || 0);
        });
        return accumulator;
      }, {});
  }, [sale, salesReturns]);

  const [lines, setLines] = useState([]);
  const [returnType, setReturnType] = useState('refund');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      returnDate: getTodayDate(),
      reason: '',
    },
  });

  const formValues = watch();

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchSalesReturns());
    dispatch(fetchMasters('customers'));
    dispatch(fetchMasters('warehouses'));
  }, [dispatch]);

  useEffect(() => {
    if (!sale) {
      setLines([]);
      return;
    }

    setLines(
      sale.items.map((item, index) => {
        const alreadyReturned = returnedByVariant[item.variantId] || 0;
        const remainingQty = Math.max(Number(item.quantity) - alreadyReturned, 0);

        return {
          id: `${item.variantId}-${index}`,
          ...item,
          soldQty: Number(item.quantity),
          remainingQty,
          returnQty: 0,
        };
      }),
    );
  }, [returnedByVariant, sale]);

  const totals = useMemo(
    () =>
      lines.reduce(
        (accumulator, line) => {
          const qty = Number(line.returnQty || 0);
          const rate = Number(line.rate || 0);
          const amt = qty * rate;
          const taxVal = Number(line.tax || 5);
          const gst = amt * (taxVal / 100);

          accumulator.totalQuantity += qty;
          accumulator.refundAmount += amt;
          accumulator.gstReversal += gst;
          accumulator.totalReturn += (amt + gst);
          return accumulator;
        },
        { totalQuantity: 0, refundAmount: 0, gstReversal: 0, totalReturn: 0 },
      ),
    [lines],
  );

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

    if (!sale) {
      setErrorMessage('Sales invoice not found.');
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
      setErrorMessage(`Return quantity exceeds sold quantity for ${invalidLine.sku || invalidLine.itemName}.`);
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
        type: 'CUSTOMER_RETURN',
        storeId: sale.storeId || sale.warehouseId,
        productId: line.productId || line.variantId,
        quantity: Number(line.returnQty),
        referenceSaleId: sale.id,
        reason: formValues.reason,
        paymentMode: returnType === 'refund' ? paymentMethod : 'CREDIT_NOTE',
      };
      return dispatch(addSalesReturn(itemPayload)).unwrap();
    });

    Promise.all(returnPromises)
      .then(() => {
        setSuccessMessage('Sales return processed successfully.');
        reset({ returnDate: getTodayDate(), reason: '' });
        setTimeout(() => navigate(listPath), 1500);
      })
      .catch((err) => {
        setErrorMessage(err || 'Failed to process return');
      });
  };

  if (!sale) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Sales invoice not found
        </Typography>
        <Button variant="contained" onClick={() => navigate(listPath)}>
          {listLabel}
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
            {pageTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {pageDescription}
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPath)} sx={{ color: '#475569', borderColor: '#cbd5e1' }}>
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
                <TextField
                  size="small"
                  fullWidth
                  label="Reference Invoice"
                  value={sale.invoiceNumber || sale.billNumber}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField size="small" fullWidth label="Customer" value={customerName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Warehouse"
                  value={warehouseName || sale.warehouseId}
                  InputProps={{ readOnly: true }}
                />
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
                <TextField size="small" fullWidth label="Return Reason" {...register('reason')} />
              </Grid>
            </Grid>
          </Paper>

          {/* Refund Method Section */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 3, bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Refund Method
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={returnType}
                onChange={(e) => setReturnType(e.target.value)}
              >
                <FormControlLabel value="refund" control={<Radio sx={{ color: '#2563eb', '&.Mui-checked': { color: '#2563eb' } }} />} label="Refund Cash/Bank" sx={{ color: '#1e293b' }} />
                <FormControlLabel value="credit_note" control={<Radio sx={{ color: '#2563eb', '&.Mui-checked': { color: '#2563eb' } }} />} label="Issue Credit Note" sx={{ color: '#1e293b' }} />
              </RadioGroup>
            </FormControl>

            {returnType === 'refund' && (
              <Box sx={{ mt: 2, maxWidth: 300 }}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="BANK">Bank</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                </TextField>
              </Box>
            )}

            {returnType === 'credit_note' && (
              <Alert severity="info" sx={{ mt: 2, '& .MuiAlert-message': { color: '#0369a1' }, bgcolor: '#e0f2fe' }}>
                Credit note will be applied to future sales.
              </Alert>
            )}
          </Paper>

          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              Returned Items
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Variant</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Sold Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Return Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Rate</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', py: 1.5 }}>Refund</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => {
                    const lineRefund = Number(line.returnQty) * Number(line.rate);
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
                        <TableCell align="right" sx={{ color: '#475569' }}>{line.soldQty}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.returnQty}
                            onChange={(event) => updateReturnQty(line.id, event.target.value)}
                            sx={{ width: 95, '& input': { textAlign: 'right', p: 1 } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#475569' }}>₹{Number(line.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>
                          ₹{lineRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            subtotal={totals.refundAmount}
            gst={totals.gstReversal}
            total={totals.totalReturn}
          />

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveOutlinedIcon />}
              onClick={handleOpenConfirm}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, py: 1.5 }}
            >
              Finalize Return
            </Button>
            <Button
              variant="text"
              size="large"
              startIcon={<CancelOutlinedIcon />}
              onClick={() => navigate(listPath)}
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
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>Confirm Customer Return</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            Are you sure you want to finalize this customer return?
            <br /><br />
            <strong>Refund Method:</strong> {returnType === 'refund' ? `Cash/Bank (${paymentMethod})` : 'Credit Note'}
            <br />
            <strong>Total Amount:</strong> ₹{totals.totalReturn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button onClick={onSubmit} variant="contained" sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SalesReturnPage;
