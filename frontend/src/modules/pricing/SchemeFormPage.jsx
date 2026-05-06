import { useEffect, useMemo, useState, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { List } from 'react-window';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useForm, Controller } from 'react-hook-form';
import { addScheme, updateScheme, fetchPromotionGroups } from './pricingSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const ProductRow = memo(({ index, style, items, selection, onToggle }) => {
  const item = items[index];
  if (!item) return null;
  const itemId = item._id || item.id;
  const isSelected = selection.includes(itemId);

  return (
    <Box
      style={style}
      sx={{
        borderBottom: '1px solid #f1f5f9',
        '&:hover': { bgcolor: '#f8fafc' },
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        px: 2
      }}
      onClick={() => onToggle(itemId, isSelected)}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Checkbox
          edge="start"
          checked={isSelected}
          tabIndex={-1}
          disableRipple
        />
      </ListItemIcon>
      <ListItemText
        primary={item.itemName}
        secondary={`${item.itemCode || 'No Code'} | ${item.sizes?.map(s => s.sku || s.size).join(', ') || 'No Variants'}`}
        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem', noWrap: true }}
        secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
      />
    </Box>
  );
});


function SchemeFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const schemes = useSelector((state) => state.pricing.schemes);
  const items = useSelector((state) => state.items.records || []);
  const stateCategories = useSelector((state) => state.masters.categories || []);
  const stateBrands = useSelector((state) => state.masters.brands || []);
  const promotionTypes = useSelector((state) => state.masters.promotionTypes || []);
  const stores = useSelector((state) => state.masters.stores || []);
  const promotionGroups = useSelector((state) => state.pricing.promotionGroups || []);

  const categories = useMemo(() => {
    if (stateCategories.length > 0) return stateCategories;
    const unique = new Map();
    items.forEach(item => {
      const cat = item.categoryId || item.category;
      if (cat) {
        const id = cat._id || cat.id || cat;
        if (!unique.has(id)) {
          // Store only plain data to avoid circular references
          const name = typeof cat === 'object' ? (cat.name || cat.groupName || item.categoryName) : item.categoryName || id;
          unique.set(id, { _id: id, id: id, name: name });
        }
      }
    });
    return Array.from(unique.values());
  }, [stateCategories, items]);

  const brands = useMemo(() => {
    if (stateBrands.length > 0) return stateBrands;
    const unique = new Map();
    items.forEach(item => {
      const b = item.brand || item.brandId;
      if (b) {
        const id = b._id || b.id || b;
        if (!unique.has(id)) {
          // Store only plain data to avoid circular references
          const name = typeof b === 'object' ? (b.name || b.brandName || item.brandName) : item.brandName || id;
          unique.set(id, { _id: id, id: id, name: name });
        }
      }
    });
    return Array.from(unique.values());
  }, [stateBrands, items]);

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
    setValue,
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
      applicablePromotionGroups: [],
      applicableProducts: [],
      applicableStores: [],
      minPurchaseAmount: 0,
      minPurchaseQuantity: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      isUniversal: false,
    },
  });

  const handleCategoryChange = (newCategoryIds) => {
    const currentCats = watch('applicableCategories') || [];
    const currentProds = watch('applicableProducts') || [];
    
    const added = newCategoryIds.filter(id => !currentCats.includes(id));
    const removed = currentCats.filter(id => !newCategoryIds.includes(id));

    let updatedProds = [...currentProds];

    if (added.length > 0) {
      items.forEach(item => {
        const cat = item.categoryId || item.category;
        const catId = cat ? String(cat._id || cat.id || cat) : null;
        if (catId && added.includes(catId)) {
          const itemId = String(item._id || item.id);
          if (!updatedProds.includes(itemId)) {
            updatedProds.push(itemId);
          }
        }
      });
    }

    if (removed.length > 0) {
      items.forEach(item => {
        const cat = item.categoryId || item.category;
        const catId = cat ? String(cat._id || cat.id || cat) : null;
        if (catId && removed.includes(catId)) {
          const itemId = String(item._id || item.id);
          updatedProds = updatedProds.filter(id => id !== itemId);
        }
      });
    }

    setValue('applicableCategories', newCategoryIds);
    setValue('applicableProducts', updatedProds);
  };

  const handleBrandChange = (newBrandIds) => {
    const currentBrands = watch('applicableBrands') || [];
    const currentProds = watch('applicableProducts') || [];

    const added = newBrandIds.filter(id => !currentBrands.includes(id));
    const removed = currentBrands.filter(id => !newBrandIds.includes(id));

    let updatedProds = [...currentProds];

    if (added.length > 0) {
      items.forEach(item => {
        const b = item.brandId || item.brand;
        const brandId = b ? String(b._id || b.id || b) : null;
        if (brandId && added.includes(brandId)) {
          const itemId = String(item._id || item.id);
          if (!updatedProds.includes(itemId)) {
            updatedProds.push(itemId);
          }
        }
      });
    }

    if (removed.length > 0) {
      items.forEach(item => {
        const b = item.brandId || item.brand;
        const brandId = b ? String(b._id || b.id || b) : null;
        if (brandId && removed.includes(brandId)) {
          const itemId = String(item._id || item.id);
          updatedProds = updatedProds.filter(id => id !== itemId);
        }
      });
    }

    setValue('applicableBrands', newBrandIds);
    setValue('applicableProducts', updatedProds);
  };

  const handleGroupChange = (newGroupIds) => {
    const currentGroups = watch('applicablePromotionGroups') || [];
    const currentCats = watch('applicableCategories') || [];
    const currentBrands = watch('applicableBrands') || [];
    const currentProds = watch('applicableProducts') || [];

    const added = newGroupIds.filter(id => !currentGroups.includes(id));
    const removed = currentGroups.filter(id => !newGroupIds.includes(id));

    let updatedCats = [...currentCats];
    let updatedBrands = [...currentBrands];
    let updatedProds = [...currentProds];

    if (added.length > 0) {
      added.forEach(gId => {
        const group = promotionGroups.find(g => String(g._id || g.id) === String(gId));
        if (group) {
          const gCats = (group.applicableCategories || []).map(c => String(c._id || c.id || c));
          gCats.forEach(cId => {
            if (!updatedCats.includes(cId)) updatedCats.push(cId);
          });

          const gBrands = (group.applicableBrands || []).map(b => String(b._id || b.id || b));
          gBrands.forEach(bId => {
            if (!updatedBrands.includes(bId)) updatedBrands.push(bId);
          });

          const gProds = (group.applicableProducts || []).map(p => String(p._id || p.id || p));
          gProds.forEach(pId => {
            if (!updatedProds.includes(pId)) updatedProds.push(pId);
          });

          items.forEach(item => {
            const cat = item.categoryId || item.category;
            const catId = cat ? String(cat._id || cat.id || cat) : null;
            const b = item.brandId || item.brand;
            const brandId = b ? String(b._id || b.id || b) : null;

            if ((catId && gCats.includes(catId)) || (brandId && gBrands.includes(brandId))) {
              const itemId = String(item._id || item.id);
              if (!updatedProds.includes(itemId)) {
                updatedProds.push(itemId);
              }
            }
          });
        }
      });
    }

    if (removed.length > 0) {
      removed.forEach(gId => {
        const group = promotionGroups.find(g => String(g._id || g.id) === String(gId));
        if (group) {
          const gCats = (group.applicableCategories || []).map(c => String(c._id || c.id || c));
          updatedCats = updatedCats.filter(cId => !gCats.includes(cId));

          const gBrands = (group.applicableBrands || []).map(b => String(b._id || b.id || b));
          updatedBrands = updatedBrands.filter(bId => !gBrands.includes(bId));

          const gProds = (group.applicableProducts || []).map(p => String(p._id || p.id || p));
          updatedProds = updatedProds.filter(pId => !gProds.includes(pId));

          items.forEach(item => {
            const cat = item.categoryId || item.category;
            const catId = cat ? String(cat._id || cat.id || cat) : null;
            const b = item.brandId || item.brand;
            const brandId = b ? String(b._id || b.id || b) : null;

            if ((catId && gCats.includes(catId)) || (brandId && gBrands.includes(brandId))) {
              const itemId = String(item._id || item.id);
              updatedProds = updatedProds.filter(id => id !== itemId);
            }
          });
        }
      });
    }

    setValue('applicablePromotionGroups', newGroupIds);
    setValue('applicableCategories', updatedCats);
    setValue('applicableBrands', updatedBrands);
    setValue('applicableProducts', updatedProds);
  };

  const schemeType = watch('type');

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('categories')); // Consistent with other modules
    dispatch(fetchItems({ limit: 10000 })); // Fetch all items for selection
    dispatch(fetchMasters('promotionTypes'));
    dispatch(fetchMasters('stores'));
    dispatch(fetchPromotionGroups());
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
        applicablePromotionGroups: existing.applicablePromotionGroups || [],
        applicableProducts: existing.applicableProducts || [],
        applicableStores: existing.applicableStores || [],
        minPurchaseAmount: existing.minPurchaseAmount || 0,
        minPurchaseQuantity: existing.minPurchaseQuantity || 0,
        startDate: existing.startDate ? new Date(existing.startDate).toISOString().split('T')[0] : '',
        endDate: existing.endDate ? new Date(existing.endDate).toISOString().split('T')[0] : '',
        isActive: existing.isActive ?? true,
        isUniversal: existing.isUniversal ?? false,
      });
    }
  }, [existing, reset, isEditMode]);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [localSelection, setLocalSelection] = useState([]);

  // Sync local selection when dialog opens
  useEffect(() => {
    if (productDialogOpen) {
      setLocalSelection(watch('applicableProducts') || []);
    }
  }, [productDialogOpen, watch]);

  const allFiltered = useMemo(() => {
    return items.filter(item => {
      // 1. Category Filter
      if (selectedCategory !== 'all') {
        const catId = item.categoryId?._id || item.categoryId?.id || item.categoryId;
        if (catId !== selectedCategory) return false;
      }

      // 2. Brand Filter
      if (selectedBrand !== 'all') {
        const brandId = item.brandId?._id || item.brandId?.id || item.brandId;
        if (brandId !== selectedBrand) return false;
      }

      // 3. Text Search
      if (productSearch) {
        const lower = (productSearch || '').toLowerCase();
        const itemName = (item.itemName || item.name || '').toLowerCase();
        const itemCode = (item.itemCode || item.sku || '').toLowerCase();
        
        // Safe extraction of category/brand names
        const catName = String(
          (typeof item.categoryId === 'object' ? (item.categoryId?.name || item.categoryId?.groupName || '') : (item.categoryName || '')) || ''
        ).toLowerCase();
        
        const brandName = String(
          (typeof item.brandId === 'object' ? (item.brandId?.name || item.brandId?.brandName || '') : (item.brandName || '')) || ''
        ).toLowerCase();
        
        const matchesText = 
          itemName.includes(lower) || 
          itemCode.includes(lower) || 
          catName.includes(lower) ||
          brandName.includes(lower) ||
          (item.sizes || []).some(s => String(s.sku || '').toLowerCase().includes(lower)) ||
          (item.sizes || []).some(s => String(s.barcode || '').toLowerCase().includes(lower));
          
        if (!matchesText) return false;
      }

      return true;
    });
  }, [items, productSearch, selectedCategory, selectedBrand]);

  const handleToggle = useCallback((id, isSelected) => {
    if (isSelected) {
      setLocalSelection(prev => prev.filter(i => i !== id));
    } else {
      setLocalSelection(prev => [...prev, id]);
    }
  }, []);

  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [conflictList, setConflictList] = useState([]);

  const onSubmit = (values, force = false) => {
    setFormError('');

    // Normalizing values
    const payload = {
      ...values,
      value: ['PERCENTAGE', 'FLAT', 'FLAT_PRICE', 'FIXED_PRICE', 'MANUAL'].includes(values.type) ? Number(values.value) : 0,
      buyQuantity: values.type === 'BUY_X_GET_Y' ? Number(values.buyQuantity) : (values.type === 'BOGO' ? 1 : 0),
      getQuantity: values.type === 'BUY_X_GET_Y' ? Number(values.getQuantity) : (values.type === 'BOGO' ? 1 : 0),
      minPurchaseAmount: Number(values.minPurchaseAmount),
      minPurchaseQuantity: Number(values.minPurchaseQuantity),
      isUniversal: Boolean(values.isUniversal),
      startDate: values.startDate || new Date(),
      endDate: values.endDate || null,
      force: force
    };

    const action = isEditMode ? updateScheme({ id, scheme: payload }) : addScheme(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        alert(isEditMode ? 'Scheme updated successfully' : 'Scheme created successfully');
        navigate('/pricing/schemes');
      })
      .catch(err => {
        if (err.includes('Overlap detected')) {
          setConflictList(err.split(': ')[1].split(', '));
          setPendingValues(values);
          setConflictDialogOpen(true);
        } else {
          setFormError(err);
        }
      });
  };

  const samplePrice = 1000;
  const discountVal = watch('value');
  const previewPrice = useMemo(() => {
    const val = Number(discountVal) || 0;
    if (schemeType === 'PERCENTAGE') return samplePrice * (1 - val / 100);
    if (schemeType === 'FLAT' || schemeType === 'MANUAL') return Math.max(0, samplePrice - val);
    if (schemeType === 'FLAT_PRICE') return val;
    return samplePrice;
  }, [schemeType, discountVal]);

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
                      {...register('type', { required: 'Type is required' })}
                    >
                      {promotionTypes.map(o => (
                        <MenuItem key={o._id || o.id} value={o.baseLogic}>
                          {o.name}
                        </MenuItem>
                      ))}
                      <MenuItem value="FLAT_PRICE" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        Flat Selling Price (Fixed Price per item)
                      </MenuItem>
                      <MenuItem value="FIXED_PRICE" sx={{ fontWeight: 700, color: '#2563eb' }}>
                        Bundle Fixed Price (Fixed total for X qty)
                      </MenuItem>
                      {promotionTypes.length === 0 && (
                        <MenuItem disabled value="">
                          <em>Add more types in "Offer Configs"</em>
                        </MenuItem>
                      )}
                    </TextField>
                  </Grid>

                  {(schemeType === 'PERCENTAGE' || schemeType === 'FLAT' || schemeType === 'FLAT_PRICE' || schemeType === 'FIXED_PRICE' || schemeType === 'MANUAL') && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label={
                          schemeType === 'PERCENTAGE' ? 'Discount Percentage (%)' :
                            schemeType === 'FIXED_PRICE' ? 'Combo Price (₹ for bundle)' :
                              schemeType === 'FLAT_PRICE' ? 'Flat Selling Price (₹ per unit)' :
                                schemeType === 'MANUAL' ? 'Manual Discount (₹)' :
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
                
                {/* Universal Toggle */}
                <Controller
                  name="isUniversal"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: field.value ? '#eff6ff' : '#f8fafc', borderRadius: 2, border: `1px solid ${field.value ? '#3b82f6' : '#e2e8f0'}` }}>
                      <Switch
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: field.value ? '#1d4ed8' : '#374151' }}>
                          {field.value ? '🌐 Apply to ALL Items (Global Offer)' : 'Apply to Specific Items Only'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {field.value 
                            ? 'This offer will apply to every item in the cart — even new products not in any list.'
                            : 'Enable this to make the offer apply store-wide to all items automatically.'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />

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
                        onChange={(_, v) => handleCategoryChange(v.map(i => i._id || i.id))}
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
                        onChange={(_, v) => handleBrandChange(v.map(i => i._id || i.id))}
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
                    name="applicablePromotionGroups"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={promotionGroups}
                        getOptionLabel={(o) => o.name || ''}
                        value={promotionGroups.filter(g => field.value.includes(g._id || g.id))}
                        onChange={(_, v) => handleGroupChange(v.map(i => i._id || i.id))}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="Limit to Promotion Groups (Dynamic Sets)" 
                            placeholder="Choose Groups..." 
                            helperText="Groups contain dynamic categories/brands (Priority 2)"
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option._id || option.id}>
                            {option.name}
                          </li>
                        )}
                      />
                    )}
                  />

                  <Controller
                    name="applicableStores"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={[{ id: 'all', name: '--- SELECT ALL STORES ---' }, ...stores]}
                        getOptionLabel={(o) => o.name || o.storeName || ''}
                        value={stores.filter(s => field.value.includes(s._id || s.id))}
                        onChange={(_, v) => {
                          if (v.some(i => i.id === 'all')) {
                            if (field.value.length === stores.length) {
                              field.onChange([]);
                            } else {
                              field.onChange(stores.map(i => i._id || i.id));
                            }
                          } else {
                            field.onChange(v.map(i => i._id || i.id));
                          }
                        }}
                        renderInput={(params) => <TextField {...params} label="Limit to Stores" placeholder="Choose Stores..." />}
                        renderOption={(props, option, { selected }) => (
                          <li {...props} key={option._id || option.id}>
                            <Checkbox
                              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                              checkedIcon={<CheckBoxIcon fontSize="small" />}
                              style={{ marginRight: 8 }}
                              checked={option.id === 'all' ? (field.value.length === stores.length && stores.length > 0) : selected}
                            />
                            {option.name || option.storeName}
                          </li>
                        )}
                      />
                    )}
                  />

                  <Controller
                    name="applicableProducts"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Specific Products ({field.value.length} selected)</Typography>
                          <Button variant="outlined" size="small" onClick={() => setProductDialogOpen(true)}>
                            Select Products
                          </Button>
                        </Stack>
                        <Paper variant="outlined" sx={{ p: 1, minHeight: 40, maxHeight: 120, overflowY: 'auto', bgcolor: '#f1f5f9' }}>
                          {field.value.length === 0 ? (
                            <Typography variant="caption" color="textSecondary">All products included (No restriction)</Typography>
                          ) : (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {items.filter(i => field.value.includes(i._id || i.id)).map(i => (
                                <Box key={i._id || i.id} sx={{ bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                                  {i.itemName}
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Paper>

                        <Dialog
                          open={productDialogOpen}
                          onClose={() => setProductDialogOpen(false)}
                          fullWidth
                          maxWidth="md"
                          PaperProps={{ sx: { borderRadius: 4, height: '85vh' } }}
                        >
                          <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Select Specific Products
                            <IconButton onClick={() => setProductDialogOpen(false)} size="small">
                              <CloseIcon />
                            </IconButton>
                          </DialogTitle>
                          <Divider />
                          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <Stack direction="row" spacing={2}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder="Search by Item Name, Code or Variant SKU..."
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                                <TextField
                                  select
                                  size="small"
                                  label="Filter by Category"
                                  value={selectedCategory}
                                  onChange={(e) => setSelectedCategory(e.target.value)}
                                  sx={{ minWidth: 200 }}
                                  SelectProps={{ native: true }}
                                >
                                  <option value="all">All Categories</option>
                                  {categories.map(cat => (
                                    <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                      {cat.name || cat.categoryName}
                                    </option>
                                  ))}
                                </TextField>
                                <TextField
                                  select
                                  size="small"
                                  label="Filter by Brand"
                                  value={selectedBrand}
                                  onChange={(e) => setSelectedBrand(e.target.value)}
                                  sx={{ minWidth: 200 }}
                                  SelectProps={{ native: true }}
                                >
                                  <option value="all">All Brands</option>
                                  {brands.map(brand => (
                                    <option key={brand.id || brand._id} value={brand.id || brand._id}>
                                      {brand.name || brand.brandName}
                                    </option>
                                  ))}
                                </TextField>
                              </Stack>
                              <Stack direction="row" spacing={2} sx={{ mt: 1.5, alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {allFiltered.length} items found total
                                </Typography>
                                <Button 
                                  size="small" 
                                  variant="text" 
                                  onClick={() => {
                                    const filteredIds = allFiltered.map(i => i._id || i.id);
                                    setLocalSelection(prev => {
                                      const newSelection = [...prev];
                                      filteredIds.forEach(id => {
                                        if (!newSelection.includes(id)) newSelection.push(id);
                                      });
                                      return newSelection;
                                    });
                                  }}
                                >
                                  Select All Found
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="text" 
                                  color="error"
                                  onClick={() => {
                                    const filteredIds = allFiltered.map(i => i._id || i.id);
                                    setLocalSelection(prev => prev.filter(id => !filteredIds.includes(id)));
                                  }}
                                >
                                  Deselect All Found
                                </Button>
                              </Stack>
                            </Box>

                            <Box sx={{ flex: 1 }}>
                              {allFiltered.length > 0 ? (
                                <List
                                  style={{ height: 500, width: '100%' }}
                                  rowCount={allFiltered.length}
                                  rowHeight={70}
                                  rowComponent={ProductRow}
                                  rowProps={{
                                    items: allFiltered,
                                    selection: localSelection,
                                    onToggle: handleToggle
                                  }}
                                />
                              ) : (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                  <Typography variant="body2" color="textSecondary">No items found matching your search.</Typography>
                                </Box>
                              )}
                            </Box>
                          </DialogContent>
                          <Divider />
                          <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
                            <Typography variant="caption" sx={{ mr: 'auto', ml: 2, fontWeight: 700 }}>
                              {localSelection.length} Items Selected
                            </Typography>
                            <Button onClick={() => setProductDialogOpen(false)} color="inherit">
                              Cancel
                            </Button>
                            <Button
                              onClick={() => {
                                field.onChange(localSelection);
                                setProductDialogOpen(false);
                              }}
                              variant="contained"
                              sx={{ px: 4, borderRadius: 2 }}
                            >
                              Confirm Selection
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </Box>
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

              {/* Targeted Items Summary */}
              <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Targeted Inventory Summary</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">Selected Categories:</Typography>
                    <Chip size="small" label={`${watch('applicableCategories')?.length || 0} Categories`} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">Selected Brands:</Typography>
                    <Chip size="small" label={`${watch('applicableBrands')?.length || 0} Brands`} color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">Selected Groups:</Typography>
                    <Chip size="small" label={`${watch('applicablePromotionGroups')?.length || 0} Groups`} color="info" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f0fdf4', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534' }}>Total Active Items Targeted:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#166534' }}>{watch('applicableProducts')?.length || 0}</Typography>
                  </Box>
                  {watch('applicableProducts')?.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>Preview of Mapped Items (Top 5):</Typography>
                      <Stack spacing={0.5}>
                        {items.filter(i => watch('applicableProducts')?.includes(i._id || i.id)).slice(0, 5).map(i => (
                          <Box key={i._id || i.id} sx={{ bgcolor: '#f8fafc', px: 1.5, py: 0.75, borderRadius: 1.5, border: '1px solid #f1f5f9', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>{i.itemName}</span>
                            <span style={{ color: '#64748b' }}>{i.itemCode}</span>
                          </Box>
                        ))}
                        {watch('applicableProducts')?.length > 5 && (
                          <Typography variant="caption" align="center" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                            and {watch('applicableProducts').length - 5} other items...
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* Preview */}
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#eff6ff', border: '1px dashed #2563eb' }} elevation={0}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e40af', mb: 1 }}>Real-time Preview</Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Sample Item Price:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{samplePrice.toFixed(2)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Discount Type:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{schemeType}</Typography>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" sx={{ color: '#1e40af' }}>Final Price:</Typography>
                    <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 900 }}>₹{previewPrice.toFixed(2)}</Typography>
                  </Stack>
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

                  <TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} {...register('startDate', { required: 'Start Date is required' })} error={!!errors.startDate} helperText={errors.startDate?.message} />
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

      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: '#991b1b' }}>⚠️ Overlapping Offers Detected</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This scheme overlaps with the following active offers:
          </Typography>
          <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 2, mb: 2 }}>
            {conflictList.map((c, i) => (
              <Typography key={i} variant="body2" sx={{ color: '#991b1b', fontWeight: 600 }}>• {c}</Typography>
            ))}
          </Box>
          <Typography variant="body2" color="textSecondary">
            Do you want to launch this scheme anyway? The hierarchy (Item {'>'} Group {'>'} Category {'>'} Brand) will ensure the most specific offer is applied.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => {
              setConflictDialogOpen(false);
              onSubmit(pendingValues, true);
            }}
          >
            Launch Anyway (Overwrite Logic)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SchemeFormPage;
