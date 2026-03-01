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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm, Controller } from 'react-hook-form';
import { addScheme, updateScheme } from './pricingSlice';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const SCHEME_TYPES = [
  { value: 'percentage_discount', label: 'Percentage Discount' },
  { value: 'flat_discount', label: 'Flat Discount' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y' },
  { value: 'free_gift', label: 'Free Gift' },
];

const APPLICABILITY_TYPES = [
  { value: 'item', label: 'Item' },
  { value: 'itemGroup', label: 'Item Group' },
  { value: 'brand', label: 'Brand' },
  { value: 'company', label: 'Company' },
];

function SchemeFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const schemes = useSelector((state) => state.pricing.schemes);
  const items = useSelector((state) => state.items.records);
  const itemGroups = useSelector((state) => state.masters.itemGroups);
  const brands = useSelector((state) => state.masters.brands || []);

  const existing = useMemo(
    () => (isEditMode ? schemes.find((s) => s.id === id) : null),
    [id, isEditMode, schemes],
  );

  const [formError, setFormError] = useState('');

  const itemOptions = useMemo(
    () => items.map((i) => ({ id: i.id, label: i.name })),
    [items],
  );

  const itemGroupOptions = useMemo(
    () => itemGroups.map((g) => ({ id: g.id, label: g.groupName })),
    [itemGroups],
  );

  const brandOptions = useMemo(
    () => brands.map((b) => ({ id: b.id, label: b.brandName })),
    [brands],
  );

  const getOptionsForType = (type) => {
    if (type === 'item') return itemOptions;
    if (type === 'itemGroup') return itemGroupOptions;
    if (type === 'brand') return brandOptions;
    return [];
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: 'percentage_discount',
      applicabilityType: 'item',
      applicabilityIds: [],
      minQuantity: 0,
      minValue: 0,
      discountPercent: '',
      flatAmount: '',
      buyQty: '',
      getQty: '',
      giftItemId: '',
      giftQuantity: 1,
      validFrom: '',
      validTo: '',
      status: 'Active',
    },
  });

  const schemeType = watch('type');
  const applicabilityType = watch('applicabilityType');
  const applicabilityIds = watch('applicabilityIds');

  useEffect(() => {
    if (!existing) {
      reset({
        name: '',
        type: 'percentage_discount',
        applicabilityType: 'item',
        applicabilityIds: [],
        minQuantity: 0,
        minValue: 0,
        discountPercent: '',
        flatAmount: '',
        buyQty: '',
        getQty: '',
        giftItemId: '',
        giftQuantity: 1,
        validFrom: '',
        validTo: '',
        status: 'Active',
      });
      return;
    }
    const app = existing.applicability || {};
    const ids = app.ids || [];
    const cond = existing.conditions || {};
    const ben = existing.benefit || {};
    reset({
      name: existing.name,
      type: existing.type || 'percentage_discount',
      applicabilityType: app.type || 'item',
      applicabilityIds: ids,
      minQuantity: cond.minQuantity ?? 0,
      minValue: cond.minValue ?? 0,
      discountPercent: ben.discountPercent ?? '',
      flatAmount: ben.flatAmount ?? '',
      buyQty: ben.buyQty ?? '',
      getQty: ben.getQty ?? '',
      giftItemId: existing.giftItemId ?? '',
      giftQuantity: existing.giftQuantity ?? 1,
      validFrom: existing.validity?.from || '',
      validTo: existing.validity?.to || '',
      status: existing.status || 'Active',
    });
  }, [existing, reset]);

  const applicabilityOptions = getOptionsForType(applicabilityType);
  const selectedApplicability = applicabilityOptions.filter((o) =>
    (applicabilityIds || []).includes(o.id),
  );

  const giftItemOptions = useMemo(
    () => items.map((i) => ({ id: i.id, label: i.name })),
    [items],
  );

  const validateDates = (from, to) => {
    if (!from || !to) return true;
    return new Date(from) <= new Date(to);
  };

  const onSubmit = (values) => {
    setFormError('');
    if (!values.name?.trim()) {
      setFormError('Scheme name is required.');
      return;
    }
    if (!validateDates(values.validFrom, values.validTo)) {
      setFormError('Valid From must be before or equal to Valid To.');
      return;
    }
    if (values.type === 'percentage_discount') {
      const pct = toNum(values.discountPercent);
      if (pct < 0 || pct > 100) {
        setFormError('Discount percentage must be between 0 and 100.');
        return;
      }
    }
    if (values.type === 'flat_discount' && toNum(values.flatAmount) < 0) {
      setFormError('Flat discount cannot be negative.');
      return;
    }
    if (values.type === 'buy_x_get_y') {
      const buy = toNum(values.buyQty);
      const get = toNum(values.getQty);
      if (buy < 1 || get < 1) {
        setFormError('Buy quantity and Get quantity must be at least 1.');
        return;
      }
    }
    if (values.type === 'free_gift') {
      if (!values.giftItemId) {
        setFormError('Gift item is required for Free Gift scheme.');
        return;
      }
      if (toNum(values.giftQuantity) < 1) {
        setFormError('Gift quantity must be at least 1.');
        return;
      }
    }

    const ids =
      applicabilityType === 'item'
        ? (values.applicabilityIds || []).map((o) => (typeof o === 'object' ? o.id : o))
        : applicabilityType === 'itemGroup'
          ? (values.applicabilityIds || []).map((o) => (typeof o === 'object' ? o.id : o))
          : applicabilityType === 'brand'
            ? (values.applicabilityIds || []).map((o) => (typeof o === 'object' ? o.id : o))
            : [];

    const payload = {
      name: values.name.trim(),
      type: values.type,
      applicability: { type: applicabilityType, ids },
      conditions: {
        minQuantity: toNum(values.minQuantity),
        minValue: toNum(values.minValue),
      },
      benefit: {
        discountPercent:
          values.type === 'percentage_discount' ? toNum(values.discountPercent) : null,
        flatAmount: values.type === 'flat_discount' ? toNum(values.flatAmount) : null,
        buyQty: values.type === 'buy_x_get_y' ? toNum(values.buyQty) : null,
        getQty: values.type === 'buy_x_get_y' ? toNum(values.getQty) : null,
      },
      giftItemId: values.type === 'free_gift' ? values.giftItemId : null,
      giftQuantity: values.type === 'free_gift' ? toNum(values.giftQuantity, 1) : null,
      validity: { from: values.validFrom || null, to: values.validTo || null },
      status: values.status,
    };

    if (isEditMode && existing) {
      dispatch(updateScheme({ id, scheme: payload }));
    } else {
      dispatch(addScheme(payload));
    }
    navigate('/pricing/schemes');
  };

  if (isEditMode && !existing) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Scheme not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/pricing/schemes')}>
          Back to Schemes
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
              {isEditMode ? 'Edit Scheme' : 'New Scheme'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Configure promotional schemes for discounts and free gifts.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/pricing/schemes')}>
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
              label="Scheme Name"
              {...register('name', { required: 'Scheme name is required.' })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message || ' '}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              select
              label="Scheme Type"
              {...register('type')}
            >
              {SCHEME_TYPES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Applicability
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              select
              label="Applicable On"
              {...register('applicabilityType')}
            >
              {APPLICABILITY_TYPES.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="applicabilityIds"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  size="small"
                  options={applicabilityOptions}
                  getOptionLabel={(o) => (typeof o === 'object' ? o.label : o)}
                  value={selectedApplicability}
                  onChange={(_, v) => {
                    const ids = v?.map((o) => o.id) || [];
                    field.onChange(ids);
                  }}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={
                        applicabilityType === 'item'
                          ? 'Select Items'
                          : applicabilityType === 'itemGroup'
                            ? 'Select Item Groups'
                            : applicabilityType === 'brand'
                              ? 'Select Brands'
                              : 'Select'
                      }
                    />
                  )}
                />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Conditions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Minimum Quantity"
              {...register('minQuantity', { min: 0 })}
              error={Boolean(errors.minQuantity)}
              helperText={errors.minQuantity?.message || ' '}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Minimum Value (₹)"
              {...register('minValue', { min: 0 })}
              error={Boolean(errors.minValue)}
              helperText={errors.minValue?.message || ' '}
            />
          </Grid>
        </Grid>
      </Paper>

      {(schemeType === 'percentage_discount' ||
        schemeType === 'flat_discount' ||
        schemeType === 'buy_x_get_y') && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
            Benefit
          </Typography>
          <Grid container spacing={2}>
            {schemeType === 'percentage_discount' && (
              <Grid item xs={12} md={6}>
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
            {schemeType === 'flat_discount' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Flat Amount (₹)"
                  {...register('flatAmount', { min: 0 })}
                  error={Boolean(errors.flatAmount)}
                  helperText={errors.flatAmount?.message || ' '}
                />
              </Grid>
            )}
            {schemeType === 'buy_x_get_y' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Buy Quantity"
                    {...register('buyQty', { min: 1 })}
                    error={Boolean(errors.buyQty)}
                    helperText={errors.buyQty?.message || ' '}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Get Quantity (Free)"
                    {...register('getQty', { min: 1 })}
                    error={Boolean(errors.getQty)}
                    helperText={errors.getQty?.message || ' '}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
      )}

      {schemeType === 'free_gift' && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
            Free Gift Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="giftItemId"
                control={control}
                rules={{ required: schemeType === 'free_gift' ? 'Gift item is required.' : false }}
                render={({ field }) => (
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={giftItemOptions}
                    getOptionLabel={(o) => (typeof o === 'object' ? o.label : o)}
                    value={giftItemOptions.find((o) => o.id === field.value) || null}
                    onChange={(_, v) => field.onChange(v?.id || '')}
                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Gift Item"
                        error={Boolean(errors.giftItemId)}
                        helperText={errors.giftItemId?.message || ' '}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Gift Quantity"
                {...register('giftQuantity', { min: 1 })}
                error={Boolean(errors.giftQuantity)}
                helperText={errors.giftQuantity?.message || ' '}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Validity
        </Typography>
        <Grid container spacing={2}>
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

      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined" onClick={() => navigate('/pricing/schemes')}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>
          Save Scheme
        </Button>
      </Stack>
    </Box>
  );
}

export default SchemeFormPage;
