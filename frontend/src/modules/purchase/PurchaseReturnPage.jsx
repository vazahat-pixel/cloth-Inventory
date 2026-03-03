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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addPurchaseReturn } from './purchaseSlice';
import { applyPurchaseReturn } from '../inventory/inventorySlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const getReturnNumber = () => `RET-${Date.now().toString().slice(-6)}`;

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

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      returnDate: getTodayDate(),
      remarks: '',
    },
  });

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
        accumulator.totalQuantity += qty;
        accumulator.totalAmount += qty * Number(line.rate || 0);
        return accumulator;
      },
      { totalQuantity: 0, totalAmount: 0 },
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

  const onSubmit = (values) => {
    setErrorMessage('');
    setSuccessMessage('');

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
      setErrorMessage(`Return quantity exceeds purchased for ${invalidLine.sku}.`);
      return;
    }

    const returnPromises = selectedLines.map((line) => {
      const itemPayload = {
        type: 'STORE_TO_FACTORY',
        storeId: purchase.warehouseId || purchase.storeId, // Backend uses storeId
        productId: line.variantId, // In our flat schema, variantId is the product _id
        quantity: Number(line.returnQty),
        reason: values.remarks,
      };
      console.log('[DEBUG] Submitting Purchase Return Item:', itemPayload);
      return dispatch(addPurchaseReturn(itemPayload)).unwrap();
    });

    Promise.all(returnPromises)
      .then(() => {
        setSuccessMessage('Purchase return processed successfully.');
        reset({ returnDate: getTodayDate(), remarks: '' });
        navigate('/purchase');
      })
      .catch((err) => {
        setErrorMessage(err || 'Failed to process return');
      });

    setSuccessMessage('Purchase return saved successfully.');
    reset({
      returnDate: getTodayDate(),
      remarks: '',
    });
    navigate('/purchase');
  };

  if (!purchase) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
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
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <TextField size="small" label="Reference Bill" value={purchase.billNumber} InputProps={{ readOnly: true }} />
          <TextField size="small" label="Supplier" value={supplierName || purchase.supplierId} InputProps={{ readOnly: true }} />
          <TextField size="small" label="Warehouse" value={warehouseName || purchase.warehouseId} InputProps={{ readOnly: true }} />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            label="Return Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register('returnDate', { required: true })}
          />
          <TextField size="small" label="Remarks" fullWidth {...register('remarks')} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lot No.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Purchased Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Remaining Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Return Qty
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Rate
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{`${line.itemName} (${line.size}/${line.color})`}</TableCell>
                  <TableCell>{line.lotNumber || '-'}</TableCell>
                  <TableCell>{line.sku}</TableCell>
                  <TableCell align="right">{line.purchasedQty}</TableCell>
                  <TableCell align="right">{line.remainingQty}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={line.returnQty}
                      onChange={(event) => updateReturnQty(line.id, event.target.value)}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="right">{Number(line.rate).toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {(Number(line.returnQty) * Number(line.rate)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
          <SummaryField label="Total Return Qty" value={totals.totalQuantity} />
          <SummaryField label="Total Return Amount" value={totals.totalAmount.toFixed(2)} />
        </Stack>
      </Paper>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
          Save Return
        </Button>
      </Stack>
    </Box>
  );
}

function SummaryField({ label, value }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 1.5,
        py: 1,
        minWidth: 165,
        textAlign: 'right',
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default PurchaseReturnPage;
