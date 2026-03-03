import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
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
import { addDeliveryOrder } from './ordersSlice';

const toNumber = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const calculateTotals = (items) => {
  const s = items.reduce(
    (acc, l) => {
      const qty = toNumber(l.quantity);
      const rate = toNumber(l.rate);
      const disc = toNumber(l.discount);
      const tax = toNumber(l.tax);
      const gross = qty * rate;
      const discAmt = (gross * disc) / 100;
      const taxable = gross - discAmt;
      const taxAmt = (taxable * tax) / 100;
      acc.totalQuantity += qty;
      acc.grossAmount += gross;
      acc.lineDiscount += discAmt;
      acc.taxAmount += taxAmt;
      return acc;
    },
    { totalQuantity: 0, grossAmount: 0, lineDiscount: 0, taxAmount: 0 },
  );
  s.netAmount = s.grossAmount - s.lineDiscount + s.taxAmount;
  return s;
};

function DeliveryOrderPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const saleOrders = useSelector((state) => state.orders.saleOrders);
  const packingSlips = useSelector((state) => state.orders.packingSlips);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [packingSlipId, setPackingSlipId] = useState('');
  const [doDate, setDoDate] = useState(getTodayDate());
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');

  const packedOrders = useMemo(
    () =>
      saleOrders.filter(
        (o) => String(o.status || '').toLowerCase() === 'packed',
      ),
    [saleOrders],
  );

  const slipsForPackedOrders = useMemo(() => {
    const packedIds = new Set(packedOrders.map((o) => o.id));
    return (packingSlips || []).filter((s) => packedIds.has(s.saleOrderId));
  }, [packingSlips, packedOrders]);

  const selectedSlip = useMemo(
    () => packingSlips.find((s) => s.id === packingSlipId),
    [packingSlips, packingSlipId],
  );

  const saleOrderForSlip = useMemo(
    () =>
      selectedSlip
        ? saleOrders.find((o) => o.id === selectedSlip.saleOrderId)
        : null,
    [selectedSlip, saleOrders],
  );

  const slipByVariant = useMemo(() => {
    const m = {};
    (selectedSlip?.items || []).forEach((it) => {
      m[it.variantId] = (m[it.variantId] || 0) + toNumber(it.qty);
    });
    return m;
  }, [selectedSlip]);

  const doItems = useMemo(() => {
    if (!saleOrderForSlip?.items) return [];
    return saleOrderForSlip.items.map((line) => ({
      ...line,
      quantity: slipByVariant[line.variantId] ?? toNumber(line.quantity),
    }));
  }, [saleOrderForSlip, slipByVariant]);

  const totals = useMemo(() => calculateTotals(doItems), [doItems]);

  const handleCreate = () => {
    setFormError('');
    if (!packingSlipId || !selectedSlip || !saleOrderForSlip) {
      setFormError('Select a packing slip.');
      return;
    }
    if (!doItems.length) {
      setFormError('No items in selected packing slip.');
      return;
    }

    const payload = {
      saleOrderId: selectedSlip.saleOrderId,
      packingSlipId,
      customerId: saleOrderForSlip.customerId,
      customerName: saleOrderForSlip.customerName || '',
      warehouseId: selectedSlip.warehouseId,
      date: doDate,
      remarks: remarks.trim(),
      items: doItems.map((l) => ({
        variantId: l.variantId,
        itemName: l.itemName,
        styleCode: l.styleCode,
        size: l.size,
        color: l.color,
        sku: l.sku,
        quantity: toNumber(l.quantity),
        rate: toNumber(l.rate),
        discount: toNumber(l.discount),
        tax: toNumber(l.tax),
      })),
      totals,
      status: 'Pending',
    };

    dispatch(addDeliveryOrder(payload));
    navigate('/orders/delivery');
    setPackingSlipId('');
    setRemarks('');
  };

  const itemsForTable = useMemo(() => {
    if (!saleOrderForSlip?.items) return [];
    return saleOrderForSlip.items.map((line) => ({
      ...line,
      qty: slipByVariant[line.variantId] ?? toNumber(line.quantity),
    }));
  }, [saleOrderForSlip, slipByVariant]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
        Delivery Orders
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
        Select a packing slip to create a delivery order. Items are taken from the packing slip.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="Packing Slip"
          value={packingSlipId}
          onChange={(e) => setPackingSlipId(e.target.value)}
          sx={{ minWidth: 300 }}
        >
          <MenuItem value="">Select packing slip</MenuItem>
          {slipsForPackedOrders.map((s) => {
            const so = saleOrders.find((o) => o.id === s.saleOrderId);
            return (
              <MenuItem key={s.id} value={s.id}>
                {s.slipNumber} - {so?.customerName || 'Unknown'} ({s.date})
              </MenuItem>
            );
          })}
        </TextField>
        <TextField
          size="small"
          label="Delivery Date"
          type="date"
          value={doDate}
          onChange={(e) => setDoDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          size="small"
          label="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>

      {formError && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {formError}
        </Typography>
      )}

      {selectedSlip && saleOrderForSlip && itemsForTable.length > 0 && (
        <>
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Size/Color</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemsForTable.map((l) => {
                  const gross = toNumber(l.qty) * toNumber(l.rate);
                  const disc = (gross * toNumber(l.discount)) / 100;
                  const tax = ((gross - disc) * toNumber(l.tax)) / 100;
                  const amt = gross - disc + tax;
                  return (
                    <TableRow key={`${l.variantId}-${l.sku}`}>
                      <TableCell>{l.itemName}</TableCell>
                      <TableCell>{l.sku}</TableCell>
                      <TableCell>{`${l.size}/${l.color}`}</TableCell>
                      <TableCell align="right">{l.qty}</TableCell>
                      <TableCell align="right">{Number(l.rate).toFixed(2)}</TableCell>
                      <TableCell align="right">{amt.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Net Amount: ₹{totals.netAmount.toFixed(2)}
          </Typography>
          <Button variant="contained" onClick={handleCreate}>
            Create Delivery Order
          </Button>
        </>
      )}

      {slipsForPackedOrders.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No packing slips available. Create a packing slip first.
          </Typography>
          <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/orders/packing')}>
            Go to Packing Slips
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default DeliveryOrderPage;
