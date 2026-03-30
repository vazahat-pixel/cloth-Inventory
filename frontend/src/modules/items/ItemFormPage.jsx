import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Alert,
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useForm } from 'react-hook-form';
import { addItem, updateItem } from './itemsSlice';
import VariantTable from './VariantTable';
import api from '../../services/api';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchGstSlabs } from '../gst/gstSlice';

const defaultValues = {
  name: '',
  sku: '',
  brand: '',
  category: '',
  description: '',
  status: 'Active',
  gender: '',
  season: '',
  fabric: '',
  fabricType: '',
  hsnCodeId: '',
};

function ItemFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const items = useSelector((state) => state.items.records);
  const brands = useSelector((state) => state.masters?.brands || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);
  const gstSlabs = useSelector((state) => state.gst?.taxRates || []);
  const existingItem = useMemo(
    () => (isEditMode ? items.find((item) => item.id === id) : null),
    [id, isEditMode, items],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const [variants, setVariants] = useState([]);
  const [variantError, setVariantError] = useState('');
  const [hsnCodes, setHsnCodes] = useState([]);

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchGstSlabs());
    api.get('/hsn-codes').then(res => setHsnCodes(res.data.hsnCodes || res.data.data?.hsnCodes || res.data.data || [])).catch(console.error);
  }, [dispatch]);

  const [images, setImages] = useState(Array(7).fill(null));

  useEffect(() => {
    if (isEditMode && !existingItem) {
      return;
    }

    if (existingItem) {
      reset({
        name: existingItem.name || '',
        sku: existingItem.sku || existingItem.code || '',
        brand: existingItem.brand?._id || existingItem.brand || '',
        category: existingItem.category?._id || existingItem.category || '',
        description: existingItem.description || '',
        status: existingItem.status || 'Active',
        gender: existingItem.gender || existingItem.attributes?.gender || '',
        season: existingItem.season || existingItem.attributes?.season || '',
        fabric: existingItem.fabric || existingItem.attributes?.fabric || '',
        fabricType: existingItem.fabricType || existingItem.attributes?.fabricType || '',
        hsnCodeId: existingItem.hsnCodeId?._id || existingItem.hsnCodeId || '',
      });
      setVariants(existingItem.variants || []);
      
      // Load images into slots
      const existingImages = existingItem.images || (existingItem.image ? [existingItem.image] : []);
      const newImages = Array(7).fill(null);
      existingImages.forEach((img, idx) => {
        if (idx < 7) {
          if (typeof img === 'string') {
             newImages[idx] = { name: `Image ${idx + 1}`, preview: img };
          } else {
             newImages[idx] = img;
          }
        }
      });
      setImages(newImages);
      return;
    }

    reset(defaultValues);
    setVariants([]);
    setImages(Array(7).fill(null));
  }, [existingItem, isEditMode, reset]);

  const styleCode = watch('sku');

  const handleImageChange = (index) => (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...images];
      newImages[index] = {
        name: file.name,
        preview: String(reader.result),
      };
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const hsnCodeId = watch('hsnCodeId');
  useEffect(() => {
    if (hsnCodeId) {
      const hsn = hsnCodes.find(h => h._id === hsnCodeId);
      if (hsn?.gstSlabId) {
        const slabId = typeof hsn.gstSlabId === 'object' ? hsn.gstSlabId._id : hsn.gstSlabId;
        setValue('gstSlabId', slabId);
      }
    }
  }, [hsnCodeId, hsnCodes, setValue]);

  const removeImage = (index) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const onSubmit = (values) => {
    if (!variants.length) {
      setVariantError('Add at least one variant before saving this item.');
      return;
    }

    const payload = {
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      brand: values.brand, // Now sending ID
      category: values.category, // Now sending ID
      description: values.description.trim(),
      gender: values.gender,
      season: values.season,
      fabric: values.fabric,
      fabricType: values.fabricType,
      hsnCodeId: values.hsnCodeId,
      gstSlabId: values.gstSlabId,
      images: images.filter(img => img !== null).map(img => img.preview || img),
      status: values.status,
      variants: variants.map(v => ({
        ...v,
        salePrice: Number(v.salePrice),
        costPrice: Number(v.costPrice),
        factoryStock: Number(v.stock || v.factoryStock || 0),
      })),
    };

    if (isEditMode) {
      dispatch(updateItem({ id, item: payload }));
    } else {
      dispatch(addItem(payload));
    }

    navigate('/items');
  };

  if (isEditMode && !existingItem) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          Item not found
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          The requested item does not exist in current mock data.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/items')}>
          Back to Item List
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
              {isEditMode ? 'Edit Item' : 'Create Item'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Manage parent style information and its size-color variants.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/items')}>
              Back
            </Button>
            <Button variant="contained" type="submit" startIcon={<SaveOutlinedIcon />}>
              Save Item
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Basic Item Information
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Item Name"
              fullWidth
              size="small"
              {...register('name', { required: 'Item name is required.' })}
              error={Boolean(errors.name)}
              helperText={errors.name?.message || ' '}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Style Code / SKU"
              fullWidth
              size="small"
              {...register('sku', { required: 'SKU is required.' })}
              error={Boolean(errors.sku)}
              helperText={errors.sku?.message || ' '}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Brand"
              select
              fullWidth
              size="small"
              {...register('brand', { required: 'Brand is required.' })}
              error={Boolean(errors.brand)}
              helperText={errors.brand?.message || ' '}
            >
              {brands.map((b) => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>
                  {b.brandName || b.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Category / Item Group"
              select
              fullWidth
              size="small"
              {...register('category', { required: 'Category is required.' })}
              error={Boolean(errors.category)}
              helperText={errors.category?.message || ' '}
            >
              {itemGroups.map((g) => (
                <MenuItem key={g._id || g.id} value={g._id || g.id}>
                  {g.groupName || g.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              size="small"
              multiline
              minRows={2}
              {...register('description')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Status"
              select
              fullWidth
              size="small"
              {...register('status', { required: true })}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="HSN Code"
              select
              fullWidth
              size="small"
              {...register('hsnCodeId')}
            >
              <MenuItem value="">None</MenuItem>
              {hsnCodes.map((hsn) => (
                <MenuItem key={hsn._id} value={hsn._id}>
                  {hsn.code} - {hsn.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Tax Rate (GST Slab)"
              select
              fullWidth
              size="small"
              {...register('gstSlabId', { required: 'Tax slab is required.' })}
              error={Boolean(errors.gstSlabId)}
              helperText={errors.gstSlabId?.message || ' '}
            >
              {gstSlabs.map((slab) => (
                <MenuItem key={slab._id || slab.id} value={slab._id || slab.id}>
                  {slab.name} ({slab.percentage}%)
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Apparel Attributes
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField label="Gender" fullWidth size="small" {...register('gender')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Season" fullWidth size="small" {...register('season')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Fabric" fullWidth size="small" {...register('fabric')} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Fabric Type" fullWidth size="small" {...register('fabricType')} />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Media / Product Images (Max 7)
        </Typography>

        <Grid container spacing={2}>
          {images.map((img, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Box
                sx={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 2,
                  p: 1,
                  height: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f8fafc',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {img?.preview ? (
                  <>
                    <Box
                      component="img"
                      src={img.preview}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }}
                    />
                    <Button
                      size="small"
                      color="error"
                      variant="contained"
                      onClick={() => removeImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        minWidth: 0,
                        p: 0.5,
                        borderRadius: '50%',
                        opacity: 0.8,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      ×
                    </Button>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        width: '100%', 
                        bgcolor: 'rgba(0,0,0,0.5)', 
                        color: 'white', 
                        textAlign: 'center',
                        fontSize: 10
                      }}
                    >
                      Slot {index + 1}
                    </Typography>
                  </>
                ) : (
                  <Button
                    component="label"
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      textTransform: 'none',
                      color: '#64748b'
                    }}
                  >
                    <UploadFileIcon sx={{ mb: 1, fontSize: 32, opacity: 0.5 }} />
                    <Typography variant="caption" fontWeight={600}>Image {index + 1}</Typography>
                    <input hidden type="file" accept="image/*" onChange={handleImageChange(index)} />
                  </Button>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {variantError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {variantError}
        </Alert>
      )}

      <VariantTable
        variants={variants}
        onChange={(updatedVariants) => {
          setVariantError('');
          setVariants(updatedVariants);
        }}
        styleCode={styleCode}
      />

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/items')}>
          Cancel
        </Button>
        <Button variant="contained" type="submit" startIcon={<SaveOutlinedIcon />}>
          Save Item
        </Button>
      </Stack>
    </Box>
  );
}

export default ItemFormPage;
