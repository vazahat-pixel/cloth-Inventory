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
import { addPackingSlip } from './ordersSlice';
import { updateSaleOrder } from './ordersSlice';

const toNumber = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function PackingSlipPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const saleOrders = useSelector((state) => state.orders.saleOrders);
  const packingSlips = useSelector((state) => state.orders.packingSlips);
  const warehouses = useSelector((state) => state.inventory.warehouses || []);
  const stock = useSelector((state) => state.inventory.stock);

  const [saleOrderId, setSaleOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [boxPrefix, setBoxPrefix] = useState('B');
  const [formError, setFormError] = useState('');
  const [allocations, setAllocations] = useState({});

  const packableOrders = useMemo(
    () =>
      saleOrders.filter(
        (o) =>
          String(o.status || '').toLowerCase() === 'pending' ||
          String(o.status || '').toLowerCase() === 'confirmed',
      ),
    [saleOrders],
  );

  const selectedOrder = useMemo(
    () => saleOrders.find((o) => o.id === saleOrderId),
    [saleOrders, saleOrderId],
  );

  const warehouseStock = useMemo(
    () =>
      (stock || []).filter((s) => s.warehouseId === warehouseId),
    [stock, warehouseId],
  );

  const availableByVariant = useMemo(() => {
    const map = {};
    warehouseStock.forEach((s) => {
      const avail = toNumber(s.quantity) - toNumber(s.reserved || 0);
      map[s.variantId] = (map[s.variantId] || 0) + Math.max(0, avail);
    });
    return map;
  }, [warehouseStock]);

  const stockRowsByVariant = useMemo(() => {
    const map = {};
    warehouseStock.forEach((s) => {
      if (!map[s.variantId]) map[s.variantId] = [];
      map[s.variantId].push(s);
    });
    return map;
  }, [warehouseStock]);

  const linesWithStock = useMemo(() => {
    if (!selectedOrder?.items) return [];
    return selectedOrder.items.map((line, idx) => {
      const avail = availableByVariant[line.variantId] || 0;
      const orderQty = toNumber(line.quantity);
      const allocKey = `${line.variantId}-${idx}`;
      const alloc = allocations[allocKey] ?? Math.min(orderQty, avail);
      return {
        ...line,
        idx,
        allocKey,
        orderQty,
        available: avail,
        allocated: alloc,
        stockRows: stockRowsByVariant[line.variantId] || [],
      };
    });
  }, [selectedOrder, availableByVariant, stockRowsByVariant, allocations]);

  const setAllocation = (allocKey, value) => {
    const num = Math.max(0, toNumber(value));
    setAllocations((prev) => ({ ...prev, [allocKey]: num }));
  };

  const handleCreate = () => {
    setFormError('');
    if (!saleOrderId || !selectedOrder) {
      setFormError('Select a sale order.');
      return;
    }
    if (!warehouseId) {
      setFormError('Select warehouse.');
      return;
    }
    const slipItems = [];
    let boxNum = 1;
    linesWithStock.forEach((l) => {
      const alloc = toNumber(l.allocated);
      if (alloc <= 0) return;
      const stockRows = l.stockRows || [];
      slipItems.push({
        variantId: l.variantId,
        stockId: stockRows[0]?.id || '',
        sku: l.sku,
        qty: alloc,
        boxNumber: `${boxPrefix}${boxNum++}`,
      });
    });
    if (!slipItems.length) {
      setFormError('Allocate at least one item.');
      return;
    }
    const invalidAlloc = linesWithStock.find(
      (l) => toNumber(l.allocated) > toNumber(l.available),
    );
    if (invalidAlloc) {
      setFormError(`Allocated qty exceeds available for ${invalidAlloc.sku}.`);
      return;
    }

    const slip = {
      saleOrderId,
      warehouseId,
      date: getTodayDate(),
      items: slipItems,
      status: 'Completed',
    };
    dispatch(addPackingSlip(slip));
    dispatch(updateSaleOrder({ id: saleOrderId, order: { status: 'Packed' } }));
    navigate('/orders/packing');
    setSaleOrderId('');
    setAllocations({});
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
        Packing Slips
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
        Select a sale order and warehouse, then allocate stock to create a packing slip.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="Sale Order"
          value={saleOrderId}
          onChange={(e) => {
            setSaleOrderId(e.target.value);
            setAllocations({});
          }}
          sx={{ minWidth: 280 }}
        >
          <MenuItem value="">Select order</MenuItem>
          {packableOrders.map((o) => (
            <MenuItem key={o.id} value={o.id}>
              {o.orderNumber} - {o.customerName || 'Unknown'} ({o.date})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Warehouse"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {warehouses.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Box prefix"
          value={boxPrefix}
          onChange={(e) => setBoxPrefix(e.target.value)}
          sx={{ width: 100 }}
        />
      </Stack>

      {formError && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {formError}
        </Typography>
      )}

      {selectedOrder && linesWithStock.length > 0 && (
        <>
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Order Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Available</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Allocate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linesWithStock.map((l) => (
                  <TableRow key={l.allocKey}>
                    <TableCell>{l.itemName}</TableCell>
                    <TableCell>{l.sku}</TableCell>
                    <TableCell align="right">{l.orderQty}</TableCell>
                    <TableCell align="right">{l.available}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={l.allocated}
                        onChange={(e) => setAllocation(l.allocKey, e.target.value)}
                        inputProps={{
                          min: 0,
                          max: Math.min(l.orderQty, l.available),
                          style: { textAlign: 'right', width: 70 },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" onClick={handleCreate}>
            Create Packing Slip
          </Button>
        </>
      )}

      {packableOrders.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No sale orders available for packing (Pending or Confirmed).
          </Typography>
          <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/orders')}>
            Create Sale Order
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default PackingSlipPage;
