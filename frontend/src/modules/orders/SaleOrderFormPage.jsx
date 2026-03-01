import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
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
import { addSaleOrder, updateSaleOrder } from './ordersSlice';
import { getVariantRateFromPriceLists } from '../pricing/priceListService';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

const calculateLine = (line) => {
  const qty = toNumber(line.quantity);
  const rate = toNumber(line.rate);
  const disc = toNumber(line.discount);
  const tax = toNumber(line.tax);
  const gross = qty * rate;
  const discAmt = (gross * disc) / 100;
  const taxable = gross - discAmt;
  const taxAmt = (taxable * tax) / 100;
  return { gross, discAmt, taxAmt, amount: taxable + taxAmt };
};

const calculateTotals = (items) => {
  const s = items.reduce(
    (acc, l) => {
      const lt = calculateLine(l);
      acc.totalQuantity += toNumber(l.quantity);
      acc.grossAmount += lt.gross;
      acc.lineDiscount += lt.discAmt;
      acc.taxAmount += lt.taxAmt;
      return acc;
    },
    { totalQuantity: 0, grossAmount: 0, lineDiscount: 0, taxAmount: 0 },
  );
  s.netAmount = s.grossAmount - s.lineDiscount + s.taxAmount;
  return s;
};

const DEFAULT_TAX = 5;
const getTaxBySlab = (rate, purchaseConfig) => {
  if (!purchaseConfig?.gstSlabEnabled) return purchaseConfig?.defaultTaxPercent ?? DEFAULT_TAX;
  const th = toNumber(purchaseConfig.gstSlabThreshold, 1000);
  const below = toNumber(purchaseConfig.belowThresholdTax, 5);
  const above = toNumber(purchaseConfig.aboveThresholdTax, 12);
  return toNumber(rate) < th ? below : above;
};

function SaleOrderFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const saleOrders = useSelector((state) => state.orders.saleOrders);
  const customers = useSelector((state) => state.masters.customers);
  const salesmen = useSelector((state) => state.masters.salesmen);
  const priceLists = useSelector((state) => state.pricing.priceLists);
  const items = useSelector((state) => state.items.records);
  const purchaseConfig = useSelector((state) => state.settings.purchaseVoucherConfig) || {};

  const existing = useMemo(
    () => (isEdit ? saleOrders.find((o) => o.id === id) : null),
    [id, isEdit, saleOrders],
  );

  const [date, setDate] = useState(getTodayDate());
  const [customerId, setCustomerId] = useState('');
  const [priceListId, setPriceListId] = useState('');
  const [salesmanId, setSalesmanId] = useState('');
  const [lines, setLines] = useState([]);
  const [variantPickerValue, setVariantPickerValue] = useState(null);
  const [formError, setFormError] = useState('');

  const activeCustomers = useMemo(
    () => (customers || []).filter((c) => String(c.status).toLowerCase() === 'active'),
    [customers],
  );
  const activeSalesmen = useMemo(
    () => (salesmen || []).filter((s) => String(s.status).toLowerCase() === 'active'),
    [salesmen],
  );

  const customer = useMemo(
    () => activeCustomers.find((c) => c.id === customerId),
    [activeCustomers, customerId],
  );

  const variantOptions = useMemo(() => {
    return (items || []).flatMap((item) =>
      (item.variants || []).map((v) => ({
        variantId: v.id,
        itemName: item.name,
        styleCode: item.code,
        size: v.size,
        color: v.color,
        sku: v.sku,
        itemId: item.id,
        category: item.category,
      })),
    );
  }, [items]);

  const filteredOptions = useMemo(() => {
    const ids = new Set(lines.map((l) => l.variantId));
    return variantOptions.filter((o) => !ids.has(o.variantId));
  }, [lines, variantOptions]);

  const getVariantRate = (option) => {
    const variant = items
      .flatMap((i) =>
        (i.variants || []).map((v) => ({ ...v, itemId: i.id, itemCategory: i.category })),
      )
      .find((v) => v.id === option.variantId);
    const plResult =
      customer && priceLists?.length
        ? getVariantRateFromPriceLists({
            priceLists,
            customerId: customer.id,
            customerGroupId: customer.groupId || '',
            variantId: option.variantId,
            itemId: option.itemId,
            itemCategory: option.category,
            variant,
            billDate: date,
          })
        : null;
    const base = variant?.sellingPrice ?? variant?.mrp ?? 0;
    return plResult ? plResult.rate : toNumber(base);
  };

  const totals = useMemo(() => calculateTotals(lines), [lines]);

  useEffect(() => {
    if (!existing) {
      setDate(getTodayDate());
      setCustomerId('');
      setPriceListId('');
      setSalesmanId('');
      setLines([]);
      return;
    }
    setDate(existing.date || getTodayDate());
    setCustomerId(existing.customerId || '');
    setPriceListId(existing.priceListId || '');
    setSalesmanId(existing.salesmanId || '');
    setLines(
      (existing.items || []).map((it, idx) => ({
        id: `${it.variantId}-${idx}`,
        ...it,
      })),
    );
  }, [existing]);

  const addLine = () => {
    if (!variantPickerValue) return;
    const rate = getVariantRate(variantPickerValue);
    const tax = getTaxBySlab(rate, purchaseConfig);
    const line = {
      id: `${variantPickerValue.variantId}-${Date.now()}`,
      variantId: variantPickerValue.variantId,
      itemName: variantPickerValue.itemName,
      styleCode: variantPickerValue.styleCode,
      size: variantPickerValue.size,
      color: variantPickerValue.color,
      sku: variantPickerValue.sku,
      quantity: 1,
      rate,
      discount: 0,
      tax,
      amount: rate * (1 - 0) * (1 + tax / 100),
    };
    setLines((prev) => [...prev, line]);
    setVariantPickerValue(null);
  };

  const updateLineField = (lineId, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = { ...l, [field]: value };
        if (field === 'rate') {
          next.tax = getTaxBySlab(Number(value), purchaseConfig);
        }
        return next;
      }),
    );
  };

  const removeLine = (lineId) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleSave = () => {
    setFormError('');
    if (!customerId) {
      setFormError('Select a customer.');
      return;
    }
    if (!lines.length) {
      setFormError('Add at least one item.');
      return;
    }
    const customerName = activeCustomers.find((c) => c.id === customerId)?.customerName || '';
    const payload = {
      date,
      customerId,
      customerName,
      priceListId: priceListId || undefined,
      salesmanId: salesmanId || undefined,
      items: lines.map((l) => {
        const lt = calculateLine(l);
        return {
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
          amount: lt.amount,
        };
      }),
      totals,
      status: existing?.status || 'Pending',
    };

    if (isEdit) {
      dispatch(updateSaleOrder({ id, order: payload }));
    } else {
      dispatch(addSaleOrder(payload));
    }
    navigate('/orders');
  };

  if (isEdit && !existing) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Sale order not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/orders')}>
          Back to Sale Orders
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', flex: 1 }}>
          {isEdit ? 'Edit Sale Order' : 'New Sale Order'}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <Autocomplete
          size="small"
          options={activeCustomers}
          getOptionLabel={(o) => o.customerName || o.name || ''}
          value={activeCustomers.find((c) => c.id === customerId) || null}
          onChange={(_, v) => setCustomerId(v?.id || '')}
          renderInput={(params) => <TextField {...params} label="Customer" required />}
          sx={{ minWidth: 260 }}
        />
        <TextField
          size="small"
          select
          label="Price List"
          value={priceListId}
          onChange={(e) => setPriceListId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Default</MenuItem>
          {(priceLists || []).map((pl) => (
            <MenuItem key={pl.id} value={pl.id}>
              {pl.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Salesman"
          value={salesmanId}
          onChange={(e) => setSalesmanId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">-</MenuItem>
          {activeSalesmen.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <Autocomplete
          size="small"
          options={filteredOptions}
          getOptionLabel={(o) => `${o.sku} | ${o.itemName} ${o.size}/${o.color}`}
          value={variantPickerValue}
          onChange={(_, v) => setVariantPickerValue(v)}
          sx={{ minWidth: 320 }}
          renderInput={(params) => (
            <TextField {...params} label="Add item (search by SKU or name)" placeholder="Select variant" />
          )}
        />
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={addLine}
          disabled={!variantPickerValue}
        >
          Add Line
        </Button>
      </Stack>

      {formError && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {formError}
        </Typography>
      )}

      <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Size/Color</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Qty
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Rate
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Disc %
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Tax %
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} width={56} />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((l) => {
              const lt = calculateLine(l);
              return (
                <TableRow key={l.id}>
                  <TableCell>{l.itemName}</TableCell>
                  <TableCell>{l.sku}</TableCell>
                  <TableCell>{`${l.size}/${l.color}`}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={l.quantity}
                      onChange={(e) => updateLineField(l.id, 'quantity', Math.max(1, Number(e.target.value)))}
                      inputProps={{ min: 1, style: { textAlign: 'right', width: 60 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={l.rate}
                      onChange={(e) => updateLineField(l.id, 'rate', Math.max(0, Number(e.target.value)))}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', width: 80 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={l.discount}
                      onChange={(e) =>
                        updateLineField(l.id, 'discount', Math.max(0, Math.min(100, Number(e.target.value))))
                      }
                      inputProps={{ min: 0, max: 100, style: { textAlign: 'right', width: 60 } }}
                    />
                  </TableCell>
                  <TableCell align="right">{l.tax}</TableCell>
                  <TableCell align="right">{lt.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => removeLine(l.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Gross: ₹{totals.grossAmount.toFixed(2)} | Discount: ₹{totals.lineDiscount.toFixed(2)} | Tax:
          ₹{totals.taxAmount.toFixed(2)} | Net: ₹{totals.netAmount.toFixed(2)}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>
          Save Sale Order
        </Button>
      </Stack>
    </Paper>
  );
}

export default SaleOrderFormPage;
