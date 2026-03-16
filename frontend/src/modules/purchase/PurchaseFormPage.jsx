import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';

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
import { addPurchase, updatePurchase, fetchPurchases, fetchPurchaseOrderById } from './purchaseSlice';

import { parsePurchaseExcel } from './purchaseImportService';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const calculateTotals = (items, otherCharges) => {
  // Simple UX display total; backend is final authority
  return items.reduce((acc, item) => {
    const gross = toNumber(item.quantity) * toNumber(item.rate);
    const disc = (gross * toNumber(item.discount)) / 100;
    const tax = ((gross - disc) * toNumber(item.tax)) / 100;
    acc.totalQuantity += toNumber(item.quantity);
    acc.grossAmount += gross;
    acc.totalDiscount += disc;
    acc.totalTax += tax;
    acc.netAmount = acc.grossAmount - acc.totalDiscount + acc.totalTax + toNumber(otherCharges);
    return acc;
  }, { totalQuantity: 0, grossAmount: 0, totalDiscount: 0, totalTax: 0, otherCharges: toNumber(otherCharges), netAmount: 0 });
};

function PurchaseFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const isEditMode = Boolean(id);


  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const purchases = useSelector((state) => state.purchase.records || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);
  const user = useSelector((state) => state.auth.user);
  const items = useSelector((state) => state.items.records || []);

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
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      supplierId: '',
      invoiceNumber: '',
      invoiceDate: getTodayDate(),
      warehouseId: '',
      notes: '',
      otherCharges: 0,
    },
  });

  useEffect(() => {
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
    dispatch(fetchItems());
  }, [dispatch]);

  useEffect(() => {
    if (orderId && !isEditMode) {
      dispatch(fetchPurchaseOrderById(orderId))
        .unwrap()
        .then((order) => {
          reset({
            supplierId: order.supplierId,
            warehouseId: order.warehouseId,
            invoiceNumber: '',
            invoiceDate: getTodayDate(),
            notes: `Converted from PO: ${order.orderNumber}`,
            otherCharges: order.totals?.otherCharges || 0,
          });
          setLines(
            (order.items || order.products || []).map((item, index) => ({
              id: `${item.productId || item.variantId}-${index}-${Date.now()}`,
              variantId: item.productId || item.variantId,
              itemName: item.itemName || (items.find(i => i._id === (item.productId || item.variantId))?.name) || 'Item',
              styleCode: item.styleCode || (items.find(i => i._id === (item.productId || item.variantId))?.sku) || '',
              size: item.size || (items.find(i => i._id === (item.productId || item.variantId))?.size) || '',
              color: item.color || (items.find(i => i._id === (item.productId || item.variantId))?.color) || '',
              sku: item.sku || (items.find(i => i._id === (item.productId || item.variantId))?.barcode) || '',
              quantity: item.quantity,
              rate: item.rate,
              discount: item.discount || 0,
              tax: item.tax || 0,
            })),
          );
        })
        .catch(err => setFormError("Failed to load Purchase Order details"));
    }
  }, [orderId, isEditMode, dispatch, reset, items]);

  useEffect(() => {
    if (!existingPurchase) {
      if (!orderId) {
        reset({
          supplierId: '',
          invoiceNumber: '',
          invoiceDate: getTodayDate(),
          warehouseId: '',
          notes: '',
          otherCharges: 0,
        });
        setLines([]);
      }
      return;
    }

    reset({
      supplierId: existingPurchase.supplierId,
      invoiceNumber: existingPurchase.invoiceNumber || existingPurchase.billNumber,
      invoiceDate: existingPurchase.invoiceDate || (existingPurchase.billDate ? new Date(existingPurchase.billDate).toISOString().split('T')[0] : getTodayDate()),
      warehouseId: existingPurchase.warehouseId || existingPurchase.storeId,
      notes: existingPurchase.notes || '',
      otherCharges: existingPurchase.otherCharges || 0,
    });
    setLines(
      (existingPurchase.items || []).map((item, index) => ({
        id: `${item.variantId}-${index}`,
        ...item,
      })),
    );
  }, [existingPurchase, reset, orderId]);


  const activeWarehouses = useMemo(
    () => (warehouses || []).filter((w) => String(w.status).toLowerCase() === 'active'),
    [warehouses],
  );

  const isStoreStaff = user?.role !== 'Admin';

  const availableLocations = useMemo(() => {
    // If user is Staff/Manager, they only see their assigned shop
    if (isStoreStaff && user?.shopId) {
      const combined = [...warehouses, ...stores];
      return combined.filter(l => l.id === user.shopId || l._id === user.shopId);
    }
    
    // For HO / Admin, show only Warehouses to keep the list clear of retail stores.
    // This addresses the user's feedback that showing all stores is unnecessary here.
    return warehouses.length > 0 ? warehouses : [...warehouses, ...stores];
  }, [warehouses, stores, isStoreStaff, user?.shopId]);

  useEffect(() => {
    if (!isEditMode && (warehouses.length > 0 || stores.length > 0)) {
      if (!getValues('warehouseId')) {
        const defaultId = user?.shopId || warehouses[0]?.id || stores[0]?.id;
        if (defaultId) setValue('warehouseId', defaultId);
      }
    }
  }, [warehouses, stores, user, isEditMode, setValue, getValues]);

  const otherCharges = watch('otherCharges');

  // Each product in the backend IS a variant (has size, color, sku, salePrice directly)
  const variantOptions = useMemo(
    () =>
      (items || []).map((product) => ({
        variantId: product._id || product.id,
        itemName: product.name || '',
        styleCode: product.sku || '',
        size: product.size || '',
        color: product.color || '',
        sku: product.barcode || product.sku || '',
        brand: product.brand || '',
        category: product.category || '',
        mrp: product.salePrice || 0,
        status: product.isActive === false ? 'Inactive' : 'Active',
        defaultRate: product.salePrice || product.costPrice || 0,
      })),
    [items],
  );

  useEffect(() => {
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchItems());
    dispatch(fetchPurchases());
  }, [dispatch]);

  const filteredOptions = useMemo(() => {
    const selectedVariantIds = new Set(lines.map((line) => line.variantId));
    return variantOptions.filter((option) => !selectedVariantIds.has(option.variantId));
  }, [lines, variantOptions]);

  const totals = useMemo(() => calculateTotals(lines, otherCharges), [lines, otherCharges]);

  const addLine = () => {
    if (!variantPickerValue) return;

    setLines((previous) => [
      ...previous,
      {
        id: `${variantPickerValue.variantId}-${Date.now()}`,
        variantId: variantPickerValue.variantId,
        lotNumber: '',
        itemName: variantPickerValue.itemName,
        styleCode: variantPickerValue.styleCode,
        size: variantPickerValue.size,
        color: variantPickerValue.color,
        sku: variantPickerValue.sku,
        brand: variantPickerValue.brand,
        category: variantPickerValue.category,
        status: variantPickerValue.status,
        quantity: 1,
        rate: variantPickerValue.defaultRate,
        discount: 0,
        tax: 0,
      },
    ]);

    setVariantPickerValue(null);
    setFormError('');
  };

  const updateLineField = (lineId, field, value) => {
    setLines((previous) =>
      previous.map((line) => {
        if (line.id !== lineId) return line;
        return { ...line, [field]: value };
      }),
    );
  };

  const addNextSizeOfSameItem = (currentLine) => {
    const selectedIds = new Set(lines.map((l) => l.variantId));
    const nextVariant = variantOptions.find(
      (opt) =>
        opt.itemName === currentLine.itemName &&
        !selectedIds.has(opt.variantId),
    );
    if (!nextVariant) return;
    const rate = toNumber(currentLine.rate);
    setLines((prev) => [
      ...prev,
      {
        id: `${nextVariant.variantId}-${Date.now()}`,
        variantId: nextVariant.variantId,
        lotNumber: '',
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
        tax: 0,
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
          const tax = r.tax;
          return {
            id: `${opt.variantId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            variantId: opt.variantId,
            lotNumber: r.lotNumber || '',
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

      return {
        productId: line.variantId,   // variantId holds the product _id
        quantity,
        rate,
      };
    });

    const invalidLine = preparedItems.find((item) => item.quantity <= 0 || item.rate < 0);
    if (invalidLine) {
      setFormError('Quantity must be greater than 0 and rate cannot be negative.');
      return;
    }


    const payload = {
      supplierId: values.supplierId,
      warehouseId: values.warehouseId,
      invoiceNumber: values.invoiceNumber.trim(),
      invoiceDate: values.invoiceDate,
      notes: values.notes,
      otherCharges: toNumber(values.otherCharges),
      products: preparedItems,
    };

    dispatch(isEditMode ? updatePurchase({ id, purchaseData: payload }) : addPurchase(payload))
      .unwrap()
      .then(() => {
        navigate('/purchase');
      })
      .catch((err) => {
        setFormError(err || 'Failed to save purchase');
      });
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
          <Grid item xs={12} md={3}>
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
                <MenuItem key={supplier._id || supplier.id} value={supplier._id || supplier.id}>
                  {supplier.name || supplier.supplierName || ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Location"
              {...register('warehouseId', { required: 'Location is required.' })}
              error={Boolean(errors.warehouseId)}
              helperText={errors.warehouseId?.message || ' '}
              disabled={isStoreStaff && availableLocations.length === 1}
            >
              {availableLocations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name} ({warehouses.find(w => w.id === loc.id) ? 'Warehouse' : 'Store'})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Invoice Number"
              {...register('invoiceNumber', { required: 'Invoice number is required.' })}
              error={Boolean(errors.invoiceNumber)}
              helperText={errors.invoiceNumber?.message || ' '}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Invoice Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('invoiceDate', { required: true })}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              size="small"
              label="Notes / Remarks"
              {...register('notes')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Other Charges"
              {...register('otherCharges')}
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
                            if (e.key === 'Enter' && purchaseConfig?.carryForwardPackSize) {
                              e.preventDefault();
                              addNextSizeOfSameItem(line);
                            }
                          }}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {(toNumber(line.quantity) * toNumber(line.rate) * (1 - toNumber(line.discount) / 100) * (1 + toNumber(line.tax) / 100)).toFixed(2)}
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
