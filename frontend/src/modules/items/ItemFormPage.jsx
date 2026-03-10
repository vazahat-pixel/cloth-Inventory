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

const defaultValues = {
  name: '',
  code: '',
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
    api.get('/hsn-codes').then(res => setHsnCodes(res.data.data.hsns || [])).catch(console.error);
  }, [dispatch]);

  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    if (isEditMode && !existingItem) {
      return;
    }

    if (existingItem) {
      reset({
        name: existingItem.name || '',
        code: existingItem.code || '',
        brand: existingItem.brand || '',
        category: existingItem.category || '',
        description: existingItem.description || '',
        status: existingItem.status || 'Active',
        gender: existingItem.attributes?.gender || '',
        season: existingItem.attributes?.season || '',
        fabric: existingItem.attributes?.fabric || '',
        fabricType: existingItem.attributes?.fabricType || '',
        hsnCodeId: existingItem.hsnCodeId || '',
      });
      setVariants(existingItem.variants || []);
      setImageData(existingItem.image || null);
      return;
    }

    reset(defaultValues);
    setVariants([]);
    setImageData(null);
  }, [existingItem, isEditMode, reset]);

  const brandOptions = brands.map((brand) => brand.brandName);
  const categoryOptions = itemGroups.map((group) => group.groupName);

  const styleCode = watch('code');

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageData({
        name: file.name,
        preview: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageData(null);
  };

  const onSubmit = (values) => {
    if (!variants.length) {
      setVariantError('Add at least one variant before saving this item.');
      return;
    }

    const payload = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      brand: values.brand,
      category: values.category,
      description: values.description.trim(),
      attributes: {
        gender: values.gender,
        season: values.season,
        fabric: values.fabric,
        fabricType: values.fabricType,
      },
      hsnCodeId: values.hsnCodeId,
      image: imageData,
      status: values.status,
      variants,
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
              label="Style Code / Item Code"
              fullWidth
              size="small"
              {...register('code', { required: 'Style code is required.' })}
              error={Boolean(errors.code)}
              helperText={errors.code?.message || ' '}
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
              {brandOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
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
              {categoryOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
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
          Media
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
            Upload Image
            <input hidden type="file" accept="image/*" onChange={handleImageChange} />
          </Button>

          {imageData?.name && (
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
              {imageData.name}
            </Typography>
          )}

          {imageData && (
            <Button color="error" variant="text" onClick={removeImage}>
              Remove
            </Button>
          )}
        </Stack>

        {imageData?.preview && (
          <Box
            component="img"
            src={imageData.preview}
            alt="Item Preview"
            sx={{ mt: 2, width: 120, height: 120, objectFit: 'cover', borderRadius: 1.5 }}
          />
        )}
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
