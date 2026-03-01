import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
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
import { useForm } from 'react-hook-form';
import { addPurchase, updatePurchase } from './purchaseSlice';
import { parsePurchaseExcel } from './purchaseImportService';
import { applyPurchaseReceipt, reconcilePurchaseReceipt } from '../inventory/inventorySlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const calculateLine = (line) => {
  const quantity = toNumber(line.quantity);
  const rate = toNumber(line.rate);
  const discountPercent = toNumber(line.discount);
  const taxPercent = toNumber(line.tax);

  const gross = quantity * rate;
  const discountAmount = (gross * discountPercent) / 100;
  const taxableAmount = gross - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const amount = taxableAmount + taxAmount;

  return {
    gross,
    discountAmount,
    taxAmount,
    amount,
  };
};

const calculateTotals = (items, otherCharges) => {
  const summary = items.reduce(
    (accumulator, item) => {
      const line = calculateLine(item);

      accumulator.totalQuantity += toNumber(item.quantity);
      accumulator.grossAmount += line.gross;
      accumulator.totalDiscount += line.discountAmount;
      accumulator.totalTax += line.taxAmount;

      return accumulator;
    },
    {
      totalQuantity: 0,
      grossAmount: 0,
      totalDiscount: 0,
      totalTax: 0,
    },
  );

  const netAmount =
    summary.grossAmount - summary.totalDiscount + summary.totalTax + toNumber(otherCharges);

  return {
    ...summary,
    otherCharges: toNumber(otherCharges),
    netAmount,
  };
};

function PurchaseFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const purchases = useSelector((state) => state.purchase.records);
  const suppliers = useSelector((state) => state.masters.suppliers);
  const warehouses = useSelector((state) => state.inventory.warehouses);
  const items = useSelector((state) => state.items.records);
  const purchaseConfig = useSelector((state) => state.settings.purchaseVoucherConfig) || {};

  const existingPurchase = useMemo(
    () => (isEditMode ? purchases.find((entry) => entry.id === id) : null),
    [id, isEditMode, purchases],
  );

  const [lines, setLines] = useState([]);
  const [variantPickerValue, setVariantPickerValue] = useState(null);
  const [formError, setFormError] = useState('');
  const [importError, setImportError] = useState('');
  const importInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      supplierId: '',
      billNumber: '',
      billDate: getTodayDate(),
      warehouseId: '',
      purchaseType: '',
      remarks: '',
      otherCharges: 0,
    },
  });

  useEffect(() => {
    if (!existingPurchase) {
      reset({
        supplierId: '',
        billNumber: '',
        billDate: getTodayDate(),
        warehouseId: '',
        purchaseType: '',
        remarks: '',
        otherCharges: 0,
      });
      setLines([]);
      return;
    }

    reset({
      supplierId: existingPurchase.supplierId,
      billNumber: existingPurchase.billNumber,
      billDate: existingPurchase.billDate,
      warehouseId: existingPurchase.warehouseId,
      purchaseType: existingPurchase.purchaseType || '',
      remarks: existingPurchase.remarks || '',
      otherCharges: existingPurchase.totals.otherCharges || 0,
    });
    setLines(
      existingPurchase.items.map((item, index) => ({
        id: `${item.variantId}-${index}`,
        ...item,
      })),
    );
  }, [existingPurchase, reset]);

  const otherCharges = watch('otherCharges');

  const variantOptions = useMemo(
    () =>
      items.flatMap((item) =>
        item.variants.map((variant) => ({
          variantId: variant.id,
          itemName: item.name,
          styleCode: item.code,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          brand: item.brand,
          category: item.category,
          status: variant.status || 'Active',
          defaultRate: toNumber(variant.costPrice || variant.sellingPrice || 0),
        })),
      ),
    [items],
  );

  const filteredOptions = useMemo(() => {
    const selectedVariantIds = new Set(lines.map((line) => line.variantId));
    return variantOptions.filter((option) => !selectedVariantIds.has(option.variantId));
  }, [lines, variantOptions]);

  const lotOptionsForVariant = useMemo(() => {
    const set = new Set();
    purchases.forEach((p) => {
      p.items?.forEach((item) => {
        if (item.variantId && item.lotNumber) {
          set.add(item.lotNumber);
        }
      });
    });
    return Array.from(set).sort();
  }, [purchases]);

  const getTaxBySlab = (rate) => {
    const threshold = Number(purchaseConfig.gstSlabThreshold) || 1000;
    const below = Number(purchaseConfig.belowThresholdTax) ?? 5;
    const above = Number(purchaseConfig.aboveThresholdTax) ?? 12;
    if (purchaseConfig.gstSlabEnabled && Number(rate) < threshold) return below;
    if (purchaseConfig.gstSlabEnabled && Number(rate) >= threshold) return above;
    return Number(purchaseConfig.defaultTaxPercent) ?? 12;
  };

  const getDefaultLot = (variantId) => {
    const variantLots = purchases.flatMap((p) =>
      (p.items || [])
        .filter((i) => i.variantId === variantId && i.lotNumber)
        .map((i) => i.lotNumber),
    );
    if (variantLots.length) {
      return variantLots[0];
    }
    const nextNum = purchases.flatMap((p) => p.items || []).filter((i) => i.lotNumber).length + 1;
    return `LOT-${String(nextNum).padStart(3, '0')}`;
  };

  const totals = useMemo(() => calculateTotals(lines, otherCharges), [lines, otherCharges]);

  const addLine = () => {
    if (!variantPickerValue) {
      return;
    }

    const defaultLot = getDefaultLot(variantPickerValue.variantId);

    const rate = variantPickerValue.defaultRate;
    const tax = getTaxBySlab(rate);
    setLines((previous) => [
      ...previous,
      {
        id: `${variantPickerValue.variantId}-${Date.now()}`,
        variantId: variantPickerValue.variantId,
        lotNumber: defaultLot,
        itemName: variantPickerValue.itemName,
        styleCode: variantPickerValue.styleCode,
        size: variantPickerValue.size,
        color: variantPickerValue.color,
        sku: variantPickerValue.sku,
        brand: variantPickerValue.brand,
        category: variantPickerValue.category,
        status: variantPickerValue.status,
        quantity: 1,
        rate,
        discount: 0,
        tax,
      },
    ]);

    setVariantPickerValue(null);
    setFormError('');
  };

  const updateLineField = (lineId, field, value) => {
    setLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) return line;
        const updates = { [field]: value };
        if (field === 'rate' && purchaseConfig.gstSlabEnabled) {
          updates.tax = getTaxBySlab(value);
        }
        return { ...line, ...updates };
      }),
    );
  };

  const addNextSizeOfSameItem = (currentLine) => {
    if (!purchaseConfig.carryForwardPackSize) return;
    const selectedIds = new Set(lines.map((l) => l.variantId));
    const nextVariant = variantOptions.find(
      (opt) =>
        opt.itemName === currentLine.itemName &&
        !selectedIds.has(opt.variantId),
    );
    if (!nextVariant) return;
    const defaultLot = getDefaultLot(nextVariant.variantId);
    const rate = toNumber(currentLine.rate);
    const tax = getTaxBySlab(rate);
    setLines((prev) => [
      ...prev,
      {
        id: `${nextVariant.variantId}-${Date.now()}`,
        variantId: nextVariant.variantId,
        lotNumber: defaultLot,
        itemName: nextVariant.itemName,
        styleCode: nextVariant.styleCode,
        size: nextVariant.size,
        color: nextVariant.color,
        sku: nextVariant.sku,
        brand: nextVariant.brand,
        category: nextVariant.category,
        status: nextVariant.status,
        quantity: 1,
        rate,
        discount: toNumber(currentLine.discount),
        tax,
      },
    ]);
  };

  const removeLine = (lineId) => {
    setLines((previous) => previous.filter((line) => line.id !== lineId));
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setFormError('');
    try {
      const { rows, errors } = await parsePurchaseExcel(file);
      if (errors?.length) {
        setImportError(errors.join(' '));
        return;
      }
      const skuToVariant = variantOptions.reduce((acc, opt) => {
        acc[opt.sku] = opt;
        return acc;
      }, {});
      const invalid = rows.filter((r) => !skuToVariant[r.sku]);
      if (invalid.length) {
        setImportError(`Invalid SKUs: ${invalid.map((r) => r.sku).join(', ')}`);
        return;
      }
      const newLines = rows
        .filter((r) => skuToVariant[r.sku])
        .map((r) => {
          const opt = skuToVariant[r.sku];
          const rate = toNumber(r.rate);
          const tax = r.tax > 0 ? r.tax : getTaxBySlab(rate);
          const defaultLot = r.lotNumber || getDefaultLot(opt.variantId);
          return {
            id: `${opt.variantId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            variantId: opt.variantId,
            lotNumber: defaultLot,
            itemName: opt.itemName,
            styleCode: opt.styleCode,
            size: opt.size,
            color: opt.color,
            sku: opt.sku,
            brand: opt.brand,
            category: opt.category,
            status: opt.status,
            quantity: toNumber(r.quantity),
            rate,
            discount: toNumber(r.discount),
            tax,
          };
        });
      setLines((prev) => [...prev, ...newLines]);
      setImportError('');
    } catch (err) {
      setImportError(err?.message || 'Import failed.');
    }
    e.target.value = '';
  };

  const onSubmit = (values) => {
    setFormError('');

    if (!lines.length) {
      setFormError('Add at least one item variant to the purchase bill.');
      return;
    }

    const preparedItems = lines.map((line) => {
      const quantity = toNumber(line.quantity);
      const rate = toNumber(line.rate);
      const discount = toNumber(line.discount);
      const tax = toNumber(line.tax);
      const amount = calculateLine({ ...line, quantity, rate, discount, tax }).amount;

      return {
        variantId: line.variantId,
        lotNumber: String(line.lotNumber || '').trim() || '',
        itemName: line.itemName,
        styleCode: line.styleCode,
        size: line.size,
        color: line.color,
        sku: line.sku,
        brand: line.brand,
        category: line.category,
        quantity,
        rate,
        discount,
        tax,
        amount,
        status: line.status || 'Active',
      };
    });

    const invalidLine = preparedItems.find((item) => item.quantity <= 0 || item.rate < 0);
    if (invalidLine) {
      setFormError('Quantity must be greater than 0 and rate cannot be negative.');
      return;
    }

    const computedTotals = calculateTotals(preparedItems, values.otherCharges);

    const payload = {
      supplierId: values.supplierId,
      billNumber: values.billNumber.trim(),
      billDate: values.billDate,
      warehouseId: values.warehouseId,
      purchaseType: values.purchaseType,
      remarks: values.remarks,
      items: preparedItems,
      totals: computedTotals,
    };

    if (isEditMode && existingPurchase) {
      dispatch(updatePurchase({ id, purchase: payload }));
      dispatch(
        reconcilePurchaseReceipt({
          date: values.billDate,
          reference: values.billNumber,
          previousWarehouseId: existingPurchase.warehouseId,
          newWarehouseId: values.warehouseId,
          previousItems: existingPurchase.items,
          newItems: preparedItems,
          user: 'Admin',
        }),
      );
    } else {
      dispatch(addPurchase(payload));
      dispatch(
        applyPurchaseReceipt({
          date: values.billDate,
          reference: values.billNumber,
          warehouseId: values.warehouseId,
          items: preparedItems,
          user: 'Admin',
        }),
      );
    }

    navigate('/purchase');
  };

  if (isEditMode && !existingPurchase) {
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
              {isEditMode ? 'Edit Purchase Bill' : 'New Purchase Bill'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Capture supplier invoice and inward stock details.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchase')}>
              Back
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
              Save Bill
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Supplier & Bill Info
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Supplier"
              {...register('supplierId', { required: 'Supplier is required.' })}
              error={Boolean(errors.supplierId)}
              helperText={errors.supplierId?.message || ' '}
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Bill Number"
              {...register('billNumber', { required: 'Bill number is required.' })}
              error={Boolean(errors.billNumber)}
              helperText={errors.billNumber?.message || ' '}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Bill Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('billDate', { required: true })}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Warehouse"
              {...register('warehouseId', { required: 'Warehouse is required.' })}
              error={Boolean(errors.warehouseId)}
              helperText={errors.warehouseId?.message || ' '}
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Purchase Type"
              {...register('purchaseType')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Other Charges"
              type="number"
              {...register('otherCharges')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Remarks"
              {...register('remarks')}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
          Item Entry
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleImportExcel}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => importInputRef.current?.click()}
          >
            Import from Excel
          </Button>
          <Autocomplete
            fullWidth
            size="small"
            options={filteredOptions}
            value={variantPickerValue}
            onChange={(_, value) => setVariantPickerValue(value)}
            getOptionLabel={(option) =>
              `${option.itemName} (${option.size}/${option.color}) - ${option.sku}`
            }
            renderInput={(params) => <TextField {...params} label="Add Variant" />}
          />
          <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addLine} disabled={!variantPickerValue}>
            Add
          </Button>
        </Stack>

        {lines.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lot No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Quantity
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Rate
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Discount %
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    GST %
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => {
                  const lineTotals = calculateLine(line);

                  return (
                    <TableRow key={line.id}>
                      <TableCell>{line.itemName}</TableCell>
                      <TableCell>{`${line.size}/${line.color}`}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={line.lotNumber || ''}
                          onChange={(e) =>
                            updateLineField(line.id, 'lotNumber', e.target.value)
                          }
                          placeholder="LOT-001"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>{line.sku}</TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLineField(line.id, 'quantity', Math.max(0, toNumber(event.target.value)))
                          }
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.rate}
                          onChange={(event) =>
                            updateLineField(line.id, 'rate', Math.max(0, toNumber(event.target.value)))
                          }
                          sx={{ width: 110 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.discount}
                          onChange={(event) =>
                            updateLineField(line.id, 'discount', Math.max(0, toNumber(event.target.value)))
                          }
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.tax}
                          onChange={(event) =>
                            updateLineField(line.id, 'tax', Math.max(0, toNumber(event.target.value)))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && purchaseConfig.carryForwardPackSize) {
                              e.preventDefault();
                              addNextSizeOfSameItem(line);
                            }
                          }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {lineTotals.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <IconButton color="error" size="small" onClick={() => removeLine(line.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No variants added yet.
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
          Bill Totals
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="flex-end">
          <SummaryField label="Gross Amount" value={totals.grossAmount} />
          <SummaryField label="Total Discount" value={totals.totalDiscount} />
          <SummaryField label="Total Tax" value={totals.totalTax} />
          <SummaryField label="Other Charges" value={totals.otherCharges} />
          <SummaryField label="Net Amount" value={totals.netAmount} strong />
        </Stack>
      </Paper>

      {(formError || importError) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {formError || importError}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/purchase')}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
          Save Purchase
        </Button>
      </Stack>
    </Box>
  );
}

function SummaryField({ label, value, strong }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 1.5,
        py: 1,
        minWidth: 145,
        textAlign: 'right',
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}>
        {Number(value || 0).toFixed(2)}
      </Typography>
    </Box>
  );
}

export default PurchaseFormPage;
