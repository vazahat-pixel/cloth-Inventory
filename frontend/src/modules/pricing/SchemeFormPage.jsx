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
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

function SchemeFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const schemes = useSelector((state) => state.pricing.schemes);
  const items = useSelector((state) => state.items.records || []);
  const categories = useSelector((state) => state.masters.itemGroups || []);
  const brands = useSelector((state) => state.masters.brands || []);
  const promotionTypes = useSelector((state) => state.masters.promotionTypes || []);

  const existing = useMemo(
    () => (isEditMode ? schemes.find((s) => (s.id || s._id) === id) : null),
    [id, isEditMode, schemes],
  );

  const [formError, setFormError] = useState('');

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
      type: 'PERCENTAGE',
      value: '',
      buyQuantity: '',
      getQuantity: '',
      applicableCategories: [],
      applicableBrands: [],
      applicableProducts: [],
      minPurchaseAmount: 0,
      minPurchaseQuantity: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
    },
  });

  const schemeType = watch('type');

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups')); // Categories
    dispatch(fetchItems()); // Products
    dispatch(fetchMasters('promotionTypes'));
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && existing) {
      reset({
        name: existing.name || '',
        type: existing.type || 'PERCENTAGE',
        value: existing.value ?? '',
        buyQuantity: existing.buyQuantity ?? '',
        getQuantity: existing.getQuantity ?? '',
        applicableCategories: existing.applicableCategories || [],
        applicableBrands: existing.applicableBrands || [],
        applicableProducts: existing.applicableProducts || [],
        minPurchaseAmount: existing.minPurchaseAmount || 0,
        minPurchaseQuantity: existing.minPurchaseQuantity || 0,
        startDate: existing.startDate ? new Date(existing.startDate).toISOString().split('T')[0] : '',
        endDate: existing.endDate ? new Date(existing.endDate).toISOString().split('T')[0] : '',
        isActive: existing.isActive ?? true,
      });
    }
  }, [existing, reset, isEditMode]);

  const onSubmit = (values) => {
    setFormError('');
    
    // Normalizing values
    const payload = {
      ...values,
      value: values.type === 'PERCENTAGE' || values.type === 'FLAT' ? Number(values.value) : 0,
      buyQuantity: values.type === 'BUY_X_GET_Y' ? Number(values.buyQuantity) : (values.type === 'BOGO' ? 1 : 0),
      getQuantity: values.type === 'BUY_X_GET_Y' ? Number(values.getQuantity) : (values.type === 'BOGO' ? 1 : 0),
      minPurchaseAmount: Number(values.minPurchaseAmount),
      minPurchaseQuantity: Number(values.minPurchaseQuantity),
      startDate: values.startDate || new Date(),
      endDate: values.endDate || null,
    };

    if (isEditMode) {
      dispatch(updateScheme({ id, scheme: payload }))
        .unwrap()
        .then(() => {
          alert('Scheme updated successfully');
          navigate('/pricing/schemes');
        })
        .catch(err => setFormError(err));
    } else {
      dispatch(addScheme(payload))
        .unwrap()
        .then(() => {
          alert('Scheme created successfully');
          navigate('/pricing/schemes');
        })
        .catch(err => setFormError(err));
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/pricing/schemes')}
          sx={{ color: '#64748b', fontWeight: 600 }}
        >
          Back to List
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
          {isEditMode ? 'Edit Promotional Scheme' : 'Set Up New Scheme'}
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Basic Details */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Scheme Definition</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Public Scheme Name"
                      placeholder="e.g., Summer End Clearance 20% OFF"
                      {...register('name', { required: 'Name is required' })}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Offer Type (From your Master List)"
                      {...register('type')}
                    >
                      {promotionTypes.length > 0 ? (
                        promotionTypes.map(o => (
                          <MenuItem key={o._id || o.id} value={o.baseLogic}>
                            {o.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          <em>Add types in "Offer Configs" first!</em>
                        </MenuItem>
                      )}
                    </TextField>
                  </Grid>

                  {(schemeType === 'PERCENTAGE' || schemeType === 'FLAT' || schemeType === 'FIXED_PRICE') && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label={
                          schemeType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 
                          schemeType === 'FIXED_PRICE' ? 'Combo Price (₹ for bundle)' : 
                          'Flat Discount (₹)'
                        }
                        {...register('value', { required: true, min: 0 })}
                        InputProps={{
                          startAdornment: (
                            <Typography sx={{ mr: 1, color: '#94a3b8' }}>
                              {schemeType === 'PERCENTAGE' ? '%' : '₹'}
                            </Typography>
                          )
                        }}
                      />
                    </Grid>
                  )}

                  {(schemeType === 'BUY_X_GET_Y' || schemeType === 'FIXED_PRICE') && (
                    <>
                      <Grid item xs={12} md={3}>
                        <TextField 
                            fullWidth 
                            type="number" 
                            label={schemeType === 'FIXED_PRICE' ? 'Bundle Qty (X)' : 'Buy Qty (X)'} 
                            {...register('buyQuantity', { required: true, min: 1 })} 
                        />
                      </Grid>
                      {schemeType === 'BUY_X_GET_Y' && (
                        <Grid item xs={12} md={3}>
                            <TextField fullWidth type="number" label="Get Qty (Y)" {...register('getQuantity', { required: true, min: 1 })} />
                        </Grid>
                      )}
                    </>
                  )}

                </Grid>
              </Paper>

              {/* Applicability */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Applicability Rules</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    Leave any category/brand/product empty to apply the scheme to ALL items in that group.
                </Typography>
                
                <Stack spacing={3}>
                  <Controller
                    name="applicableCategories"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={categories}
                        getOptionLabel={(o) => o.name || o.categoryName || ''}
                        value={categories.filter(c => field.value.includes(c._id || c.id))}
                        onChange={(_, v) => field.onChange(v.map(i => i._id || i.id))}
                        renderInput={(params) => <TextField {...params} label="Limit to Categories" placeholder="Choose Categories..." />}
                        renderOption={(props, option) => (
                           <li {...props} key={option._id || option.id}>
                               {option.name || option.categoryName}
                           </li>
                        )}
                      />
                    )}
                  />

                  <Controller
                    name="applicableBrands"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={brands}
                        getOptionLabel={(o) => o.name || o.brandName || ''}
                        value={brands.filter(b => field.value.includes(b._id || b.id))}
                        onChange={(_, v) => field.onChange(v.map(i => i._id || i.id))}
                        renderInput={(params) => <TextField {...params} label="Limit to Brands" placeholder="Choose Brands..." />}
                        renderOption={(props, option) => (
                           <li {...props} key={option._id || option.id}>
                               {option.name || option.brandName}
                           </li>
                        )}
                      />
                    )}
                  />

                  <Controller
                    name="applicableProducts"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={items}
                        getOptionLabel={(o) => `${o.itemName} (${o.itemCode})`}
                        value={items.filter(i => field.value.includes(i._id || i.id))}
                        onChange={(_, v) => field.onChange(v.map(i => i._id || i.id))}
                        renderInput={(params) => <TextField {...params} label="Specific Products" placeholder="Search items..." />}
                        renderOption={(props, option) => (
                           <li {...props} key={option._id || option.id}>
                               {option.itemName} ({option.itemCode})
                           </li>
                        )}
                      />
                    )}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Thresholds */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Requirement Thresholds</Typography>
                <Stack spacing={3}>
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Minimum Bill Value (₹)" 
                    {...register('minPurchaseAmount')} 
                    helperText="Cart value needed to trigger scheme"
                  />
                  <TextField 
                    fullWidth 
                    type="number" 
                    label="Minimum Item Quantity" 
                    {...register('minPurchaseQuantity')} 
                    helperText="Item count needed in cart"
                  />
                </Stack>
              </Paper>

              {/* Status & Validity */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Status & Validity</Typography>
                <Stack spacing={3}>
                   <TextField
                      fullWidth
                      select
                      label="Execution Status"
                      {...register('isActive')}
                    >
                      <MenuItem value={true}>Active (Live for billing)</MenuItem>
                      <MenuItem value={false}>Inactive (Draft/Expired)</MenuItem>
                    </TextField>

                    <TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('startDate')} />
                    <TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('endDate')} />
                </Stack>
              </Paper>

              <Button 
                type="submit" 
                variant="contained" 
                size="large" 
                fullWidth 
                startIcon={<SaveOutlinedIcon />}
                sx={{ py: 2, borderRadius: 3, fontWeight: 800, fontSize: '1rem', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)' }}
              >
                {isEditMode ? 'Update Scheme' : 'Launch New Scheme'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
      {formError && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{formError}</Alert>}
    </Box>
  );
}

export default SchemeFormPage;
