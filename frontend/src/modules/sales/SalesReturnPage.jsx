import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm } from 'react-hook-form';
import { addSalesReturn, addSale } from './salesSlice';
import { applySalesReturnReceipt, applySaleDispatch } from '../inventory/inventorySlice';
import { addCreditNote } from '../customers/customersSlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const getReturnNumber = () => `SRET-${Date.now().toString().slice(-6)}`;

function SalesReturnPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const sales = useSelector((state) => state.sales.records);
  const salesReturns = useSelector((state) => state.sales.returns);
  const customers = useSelector((state) => state.masters.customers);
  const warehouses = useSelector((state) => state.inventory.warehouses);

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
  const [exchangeLines, setExchangeLines] = useState([]);
  const [exchangePickerValue, setExchangePickerValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const stockRows = useSelector((state) => state.inventory.stock);
  const itemsData = useSelector((state) => state.items.records);
  const purchaseConfig = useSelector((state) => state.settings.purchaseVoucherConfig) || {};

  const getTaxBySlab = (rate) => {
    const th = Number(purchaseConfig.gstSlabThreshold) || 1000;
    const below = Number(purchaseConfig.belowThresholdTax) ?? 5;
    const above = Number(purchaseConfig.aboveThresholdTax) ?? 12;
    return Number(rate) < th ? below : above;
  };

  const warehouseStock = useMemo(
    () => (stockRows || []).filter((r) => r.warehouseId === sale?.warehouseId),
    [stockRows, sale?.warehouseId],
  );

  const exchangeOptions = useMemo(() => {
    const pickedIds = new Set(exchangeLines.map((l) => l.variantId));
    const variantMap = {};
    (itemsData || []).forEach((it) => {
      it.variants?.forEach((v) => {
        variantMap[v.id] = { ...v, itemName: it.name, styleCode: it.code };
      });
    });
    return warehouseStock
      .filter((s) => {
        const avail = Number(s.quantity) - Number(s.reserved || 0);
        return avail > 0 && !pickedIds.has(s.variantId);
      })
      .map((s) => {
        const v = variantMap[s.variantId];
        const avail = Number(s.quantity) - Number(s.reserved || 0);
        const rate = Number(v?.sellingPrice ?? v?.mrp ?? 0);
        const tax = purchaseConfig?.gstSlabEnabled ? getTaxBySlab(rate) : 5;
        return {
          variantId: s.variantId,
          itemName: s.itemName || v?.itemName || '',
          styleCode: s.styleCode || v?.styleCode || '',
          size: s.size,
          color: s.color,
          sku: s.sku,
          available: avail,
          rate,
          tax,
        };
      });
  }, [warehouseStock, exchangeLines, itemsData, purchaseConfig]);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      returnDate: getTodayDate(),
      reason: '',
    },
  });

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
          accumulator.totalQuantity += qty;
          accumulator.refundAmount += qty * Number(line.rate || 0);
          return accumulator;
        },
        { totalQuantity: 0, refundAmount: 0 },
      ),
    [lines],
  );

  const exchangeTotals = useMemo(() => {
    let gross = 0;
    let taxTotal = 0;
    exchangeLines.forEach((l) => {
      const qty = Number(l.quantity);
      const rate = Number(l.rate);
      const disc = Number(l.discount) || 0;
      const tax = Number(l.tax) || 5;
      const g = qty * rate;
      const taxable = g * (1 - disc / 100);
      gross += g;
      taxTotal += taxable * (tax / 100);
    });
    const netExchange = gross + taxTotal;
    return { gross, taxTotal, netExchange };
  }, [exchangeLines]);

  const exchangeBalance = useMemo(() => {
    return exchangeTotals.netExchange - totals.refundAmount;
  }, [exchangeTotals.netExchange, totals.refundAmount]);

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
      setErrorMessage(`Return quantity exceeds sold quantity for ${invalidLine.sku}.`);
      return;
    }

    if (returnType === 'exchange' && exchangeLines.length === 0) {
      setErrorMessage('Add at least one exchange item for exchange return.');
      return;
    }

    const returnNumber = getReturnNumber();
    const returnItems = selectedLines.map((line) => ({
      variantId: line.variantId,
      itemName: line.itemName,
      size: line.size,
      color: line.color,
      sku: line.sku,
      soldQty: line.soldQty,
      returnQty: Number(line.returnQty),
      rate: Number(line.rate),
      amount: Number(line.returnQty) * Number(line.rate),
    }));

    const payload = {
      returnNumber,
      saleId: sale.id,
      customerId: sale.customerId,
      customerName,
      warehouseId: sale.warehouseId,
      date: values.returnDate,
      reason: values.reason,
      items: returnItems,
      totals: {
        totalQuantity: returnItems.reduce((sum, item) => sum + Number(item.returnQty), 0),
        refundAmount: returnItems.reduce((sum, item) => sum + Number(item.amount), 0),
      },
    };

    dispatch(addSalesReturn(payload));
    dispatch(
      applySalesReturnReceipt({
        saleId: sale.id,
        reference: returnNumber,
        date: values.returnDate,
        warehouseId: sale.warehouseId,
        items: returnItems,
        user: 'Admin',
      }),
    );

    if (returnType === 'credit_note') {
      dispatch(
        addCreditNote({
          customerId: sale.customerId,
          amount: payload.totals.refundAmount,
          issueDate: values.returnDate,
          reason: `Return credit - ${returnNumber} (${payload.returnNumber})`,
          status: 'Available',
        }),
      );
    }

    if (returnType === 'exchange' && exchangeLines.length > 0) {
      const invoiceNumber = `INV-EX-${Date.now().toString().slice(-6)}`;
      const exchangeItems = exchangeLines.map((l) => {
        const qty = Number(l.quantity);
        const rate = Number(l.rate);
        const disc = Number(l.discount) || 0;
        const tax = Number(l.tax) || 5;
        const g = qty * rate;
        const taxable = g * (1 - disc / 100);
        const amt = taxable * (1 + tax / 100);
        return {
          variantId: l.variantId,
          itemName: l.itemName,
          styleCode: l.styleCode,
          size: l.size,
          color: l.color,
          sku: l.sku,
          quantity: qty,
          rate,
          discount: disc,
          tax,
          amount: amt,
        };
      });
      const exchangeNet = Math.max(exchangeBalance, 0);
      const exchangePayload = {
        invoiceNumber,
        date: values.returnDate,
        warehouseId: sale.warehouseId,
        customerId: sale.customerId,
        customerName,
        items: exchangeItems,
        totals: {
          grossAmount: exchangeTotals.gross,
          lineDiscount: 0,
          billDiscount: totals.refundAmount,
          taxAmount: exchangeTotals.taxTotal,
          netPayable: exchangeNet,
        },
        payment: {
          mode: exchangeNet > 0 ? 'Cash' : 'Exchange',
          amountPaid: exchangeNet,
          changeReturned: 0,
          dueAmount: 0,
          status: exchangeNet > 0 ? 'Paid' : 'Paid',
        },
        exchangeReturnRef: payload.returnNumber,
        status: 'Completed',
      };
      dispatch(addSale(exchangePayload));
      dispatch(
        applySaleDispatch({
          date: values.returnDate,
          warehouseId: sale.warehouseId,
          reference: invoiceNumber,
          items: exchangeItems,
          user: 'Admin',
        }),
      );
      if (exchangeBalance < 0) {
        dispatch(
          addCreditNote({
            customerId: sale.customerId,
            amount: Math.abs(exchangeBalance),
            issueDate: values.returnDate,
            reason: `Exchange credit - ${invoiceNumber}`,
            status: 'Available',
          }),
        );
      }
    }

    setSuccessMessage('Sales return saved successfully.');
    reset({ returnDate: getTodayDate(), reason: '' });
    setExchangeLines([]);
    navigate('/sales');
  };

  const addExchangeLine = () => {
    if (!exchangePickerValue) return;
    const opt = exchangePickerValue;
    const line = {
      id: `${opt.variantId}-${Date.now()}`,
      variantId: opt.variantId,
      itemName: opt.itemName,
      styleCode: opt.styleCode,
      size: opt.size,
      color: opt.color,
      sku: opt.sku,
      quantity: 1,
      rate: opt.rate,
      discount: 0,
      tax: opt.tax,
      available: opt.available,
    };
    setExchangeLines((prev) => [...prev, line]);
    setExchangePickerValue(null);
  };

  const updateExchangeLine = (lineId, field, value) => {
    setExchangeLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = { ...l, [field]: value };
        if (field === 'quantity') {
          next.quantity = Math.min(Math.max(1, Number(value)), l.available);
        }
        return next;
      }),
    );
  };

  const removeExchangeLine = (lineId) => {
    setExchangeLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  if (!sale) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Sales invoice not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/sales')}>
          Back to Sales List
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
              Sales Return
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Return sold variants and restock inventory.
            </Typography>
          </Box>

          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/sales')}>
            Back
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <TextField
            size="small"
            label="Reference Invoice"
            value={sale.invoiceNumber}
            InputProps={{ readOnly: true }}
          />
          <TextField size="small" label="Customer" value={customerName} InputProps={{ readOnly: true }} />
          <TextField
            size="small"
            label="Warehouse"
            value={warehouseName || sale.warehouseId}
            InputProps={{ readOnly: true }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <TextField
            size="small"
            select
            label="Return Type"
            value={returnType}
            onChange={(e) => {
              setReturnType(e.target.value);
              if (e.target.value !== 'exchange') setExchangeLines([]);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="refund">Return (Refund)</MenuItem>
            <MenuItem value="credit_note">Return for Credit Note</MenuItem>
            <MenuItem value="exchange">Exchange</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="Return Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register('returnDate', { required: true })}
          />
          <TextField size="small" fullWidth label="Reason" {...register('reason')} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Sold Qty
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
                  Refund
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{`${line.itemName} (${line.size}/${line.color})`}</TableCell>
                  <TableCell>{line.sku}</TableCell>
                  <TableCell align="right">{line.soldQty}</TableCell>
                  <TableCell align="right">{line.remainingQty}</TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={line.returnQty}
                      onChange={(event) => updateReturnQty(line.id, event.target.value)}
                      sx={{ width: 95 }}
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
          <SummaryField label="Refund Amount" value={totals.refundAmount.toFixed(2)} />
        </Stack>

        {returnType === 'exchange' && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3, mb: 1 }}>
              Exchange Items (new items)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <Autocomplete
                size="small"
                options={exchangeOptions}
                value={exchangePickerValue}
                onChange={(_, v) => setExchangePickerValue(v)}
                getOptionLabel={(o) =>
                  `${o.sku} | ${o.itemName} (${o.size}/${o.color}) [Avl: ${o.available}]`
                }
                sx={{ minWidth: 360 }}
                renderInput={(params) => (
                  <TextField {...params} label="Add exchange item" placeholder="Search by SKU" />
                )}
              />
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={addExchangeLine}
                disabled={!exchangePickerValue}
              >
                Add
              </Button>
            </Stack>
            {exchangeLines.length > 0 && (
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} width={56} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exchangeLines.map((l) => {
                      const g = Number(l.quantity) * Number(l.rate) * (1 - Number(l.discount || 0) / 100);
                      const amt = g * (1 + Number(l.tax || 5) / 100);
                      return (
                        <TableRow key={l.id}>
                          <TableCell>{l.itemName}</TableCell>
                          <TableCell>{l.sku}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={l.quantity}
                              onChange={(e) => updateExchangeLine(l.id, 'quantity', e.target.value)}
                              inputProps={{ min: 1, max: l.available, style: { width: 60, textAlign: 'right' } }}
                            />
                          </TableCell>
                          <TableCell align="right">{Number(l.rate).toFixed(2)}</TableCell>
                          <TableCell align="right">{amt.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button size="small" color="error" onClick={() => removeExchangeLine(l.id)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {exchangeLines.length > 0 && (
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <SummaryField label="Exchange Total" value={exchangeTotals.netExchange.toFixed(2)} />
                <SummaryField label="Return Refund" value={`-${totals.refundAmount.toFixed(2)}`} />
                <SummaryField
                  label="Balance (pay / credit)"
                  value={
                    exchangeBalance > 0
                      ? `₹${exchangeBalance.toFixed(2)} to pay`
                      : exchangeBalance < 0
                        ? `₹${Math.abs(exchangeBalance).toFixed(2)} credit`
                        : '0'
                  }
                />
              </Stack>
            )}
          </>
        )}
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
        minWidth: 160,
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

export default SalesReturnPage;
