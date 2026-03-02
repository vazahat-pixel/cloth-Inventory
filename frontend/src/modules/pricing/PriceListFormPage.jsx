import { useEffect, useMemo, useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { addPriceList, updatePriceList } from './pricingSlice';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const PRICING_METHODS = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'discount_mrp', label: 'Discount on MRP (%)' },
  { value: 'markup_cost', label: 'Markup on Cost (%)' },
];

const APPLICABLE_CUSTOMERS = [
  { value: 'all', label: 'All Customers' },
  { value: 'selected', label: 'Selected Customers' },
  { value: 'group', label: 'Customer Group' },
];

const APPLICABLE_ITEMS = [
  { value: 'all', label: 'All Items' },
  { value: 'selected', label: 'Selected Items' },
  { value: 'group', label: 'Item Group' },
];

function PriceListFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const priceLists = useSelector((state) => state.pricing.priceLists);
  const customers = useSelector((state) => state.masters.customers || []);
  const itemGroups = useSelector((state) => state.masters.itemGroups);
  const items = useSelector((state) => state.items.records);

  const existing = useMemo(
    () => (isEditMode ? priceLists.find((p) => p.id === id) : null),
    [id, isEditMode, priceLists],
  );

  const [rules, setRules] = useState([]);
  const [variantPicker, setVariantPicker] = useState(null);
  const [formError, setFormError] = useState('');

  const variantOptions = useMemo(() => {
    const opts = [];
    items.forEach((item) => {
      item.variants?.forEach((v) => {
        opts.push({
          variantId: v.id,
          itemId: item.id,
          itemName: item.name,
          size: v.size,
          color: v.color,
          sku: v.sku,
          basePrice: toNum(v.mrp || v.sellingPrice),
          costPrice: toNum(v.costPrice),
        });
      });
    });
    return opts;
  }, [items]);

  const filteredVariants = useMemo(() => {
    const selected = new Set(rules.map((r) => r.variantId));
    return variantOptions.filter((o) => !selected.has(o.variantId));
  }, [rules, variantOptions]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      applicableCustomers: 'all',
      applicableItems: 'all',
      pricingMethod: 'fixed',
      validFrom: '',
      validTo: '',
      status: 'Active',
      selectedCustomerIds: [],
      customerGroupId: '',
      selectedItemIds: [],
      itemGroupId: '',
      fixedValue: '',
      discountPercent: '',
      markupPercent: '',
    },
  });

  const applicableCustomers = watch('applicableCustomers');
  const applicableItems = watch('applicableItems');
  const pricingMethod = watch('pricingMethod');
  const discountPercent = watch('discountPercent');
  const markupPercent = watch('markupPercent');

  useEffect(() => {
    if (!existing) {
      reset({
        name: '',
        applicableCustomers: 'all',
        applicableItems: 'all',
        pricingMethod: 'fixed',
        validFrom: '',
        validTo: '',
        status: 'Active',
        selectedCustomerIds: [],
        customerGroupId: '',
        selectedItemIds: [],
        itemGroupId: '',
        fixedValue: '',
        discountPercent: '',
        markupPercent: '',
      });
      setRules([]);
      return;
    }
    reset({
      name: existing.name,
      applicableCustomers: existing.applicableCustomers || 'all',
      applicableItems: existing.applicableItems || 'all',
      pricingMethod: existing.pricingMethod || 'fixed',
      validFrom: existing.validity?.from || '',
      validTo: existing.validity?.to || '',
      status: existing.status || 'Active',
      selectedCustomerIds: existing.selectedCustomerIds || [],
      customerGroupId: existing.customerGroupId || '',
      selectedItemIds: existing.selectedItemIds || [],
      itemGroupId: existing.itemGroupId || '',
      fixedValue: existing.fixedValue ?? '',
      discountPercent: existing.discountPercent ?? '',
      markupPercent: existing.markupPercent ?? '',
    });
    setRules(existing.rules ? [...existing.rules] : []);
  }, [existing, reset]);

  const addRule = () => {
    if (!variantPicker) return;
    const opt = variantPicker;
    let basePrice = opt.basePrice;
    if (pricingMethod === 'markup_cost') basePrice = opt.costPrice;
    let discount = toNum(discountPercent);
    if (pricingMethod === 'discount_mrp' && discount <= 0) discount = toNum(existing?.discountPercent, 0);
    const finalPrice = basePrice * (1 - discount / 100);
    setRules((prev) => [
      ...prev,
      {
        id: `${opt.variantId}-${Date.now()}`,
        itemId: opt.itemId,
        variantId: opt.variantId,
        itemName: opt.itemName,
        size: opt.size,
        color: opt.color,
        sku: opt.sku,
        basePrice,
        discountPercent: discount,
        finalPrice,
      },
    ]);
    setVariantPicker(null);
  };

  const updateRule = (ruleId, field, value) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const next = { ...r, [field]: value };
        if (field === 'basePrice' || field === 'discountPercent') {
          const base = toNum(next.basePrice, r.basePrice);
          const disc = toNum(next.discountPercent, 0);
          next.finalPrice = base * (1 - disc / 100);
        }
        return next;
      }),
    );
  };

  const removeRule = (ruleId) => setRules((prev) => prev.filter((r) => r.id !== ruleId));

  const validateDates = (from, to) => {
    if (!from || !to) return true;
    return new Date(from) <= new Date(to);
  };

  const onSubmit = (values) => {
    setFormError('');
    if (!values.name?.trim()) {
      setFormError('Price list name is required.');
      return;
    }
    if (!validateDates(values.validFrom, values.validTo)) {
      setFormError('Valid From must be before or equal to Valid To.');
      return;
    }
    const discountPct = toNum(values.discountPercent);
    const markupPct = toNum(values.markupPercent);
    if (values.pricingMethod === 'discount_mrp' && (discountPct < 0 || discountPct > 100)) {
      setFormError('Discount on MRP must be between 0 and 100.');
      return;
    }
    if (values.pricingMethod === 'markup_cost' && markupPct < 0) {
      setFormError('Markup on Cost cannot be negative.');
      return;
    }

    const payload = {
      name: values.name.trim(),
      applicableCustomers: values.applicableCustomers,
      applicableItems: values.applicableItems,
      pricingMethod: values.pricingMethod,
      validity: { from: values.validFrom || null, to: values.validTo || null },
      status: values.status,
      selectedCustomerIds: values.selectedCustomerIds || [],
      customerGroupId: values.customerGroupId || '',
      selectedItemIds: values.selectedItemIds || [],
      itemGroupId: values.itemGroupId || '',
      fixedValue: values.pricingMethod === 'fixed' ? toNum(values.fixedValue) : null,
      discountPercent: values.pricingMethod === 'discount_mrp' ? discountPct : null,
      markupPercent: values.pricingMethod === 'markup_cost' ? markupPct : null,
      rules: rules.map((r) => ({
        itemId: r.itemId,
        variantId: r.variantId,
        basePrice: toNum(r.basePrice),
        discountPercent: toNum(r.discountPercent),
        finalPrice: toNum(r.finalPrice),
      })),
    };

    if (isEditMode && existing) {
      dispatch(updatePriceList({ id, priceList: payload }));
    } else {
      dispatch(addPriceList(payload));
    }
    navigate('/pricing/price-lists');
  };

  if (isEditMode && !existing) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Price list not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/pricing/price-lists')}>
          Back to Price Lists
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
              {isEditMode ? 'Edit Price List' : 'New Price List'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Configure pricing rules for items and customers.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/pricing/price-lists')}>
              Back
            </Button>
            <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Basic Info
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Price List Name"
              {...register('name', { required: 'Name is required.' })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message || ' '}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Applicable To"
              {...register('applicableCustomers')}
            >
              {APPLICABLE_CUSTOMERS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Applicable Items"
              {...register('applicableItems')}
            >
              {APPLICABLE_ITEMS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {applicableCustomers === 'selected' && (
            <Grid item xs={12}>
              <Controller
                name="selectedCustomerIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    size="small"
                    options={customers}
                    getOptionLabel={(o) => (typeof o === 'string' ? o : o.customerName)}
                    value={customers.filter((c) => field.value?.includes(c.id))}
                    onChange={(_, v) => field.onChange(v?.map((c) => c.id) || [])}
                    renderInput={(params) => <TextField {...params} label="Select Customers" />}
                  />
                )}
              />
            </Grid>
          )}
          {applicableCustomers === 'group' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Customer Group"
                {...register('customerGroupId')}
              >
                <MenuItem value="">None</MenuItem>
                {itemGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.groupName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          {applicableItems === 'group' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Item Group"
                {...register('itemGroupId')}
              >
                <MenuItem value="">None</MenuItem>
                {itemGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.groupName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Pricing Method"
              {...register('pricingMethod')}
            >
              {PRICING_METHODS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {pricingMethod === 'fixed' && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Fixed Price"
                {...register('fixedValue', { min: { value: 0, message: 'Must be ≥ 0' } })}
                error={Boolean(errors.fixedValue)}
                helperText={errors.fixedValue?.message || ' '}
              />
            </Grid>
          )}
          {pricingMethod === 'discount_mrp' && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Discount %"
                {...register('discountPercent', {
                  min: { value: 0, message: '0–100' },
                  max: { value: 100, message: '0–100' },
                })}
                error={Boolean(errors.discountPercent)}
                helperText={errors.discountPercent?.message || ' '}
              />
            </Grid>
          )}
          {pricingMethod === 'markup_cost' && (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Markup %"
                {...register('markupPercent', { min: { value: 0, message: 'Must be ≥ 0' } })}
                error={Boolean(errors.markupPercent)}
                helperText={errors.markupPercent?.message || ' '}
              />
            </Grid>
          )}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Valid From"
              InputLabelProps={{ shrink: true }}
              {...register('validFrom')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Valid To"
              InputLabelProps={{ shrink: true }}
              {...register('validTo')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Status"
              {...register('status')}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
          Item-wise Pricing
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Assign custom prices per item or variant. Base price uses MRP for discount, cost for markup.
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <Autocomplete
            fullWidth
            size="small"
            options={filteredVariants}
            value={variantPicker}
            onChange={(_, v) => setVariantPicker(v)}
            getOptionLabel={(o) => `${o.itemName} (${o.size}/${o.color}) - ${o.sku}`}
            renderInput={(params) => <TextField {...params} label="Add Item / Variant" />}
          />
          <Button
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={addRule}
            disabled={!variantPicker}
          >
            Add
          </Button>
        </Stack>
        {rules.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item / Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Base Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Discount %
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Final Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{`${r.itemName} (${r.size}/${r.color})`}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={r.basePrice}
                        onChange={(e) => updateRule(r.id, 'basePrice', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        value={r.discountPercent}
                        onChange={(e) =>
                          updateRule(r.id, 'discountPercent', Math.max(0, Math.min(100, toNum(e.target.value))))
                        }
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {toNum(r.finalPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton color="error" size="small" onClick={() => removeRule(r.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No item-wise pricing. Add variants above or leave empty for list-level rules.
            </Typography>
          </Box>
        )}
      </Paper>

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined" onClick={() => navigate('/pricing/price-lists')}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
          Save Price List
        </Button>
      </Stack>
    </Box>
  );
}

export default PriceListFormPage;
