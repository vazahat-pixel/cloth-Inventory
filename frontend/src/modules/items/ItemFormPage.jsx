import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  Alert, 
  Box, 
  Button, 
  FormControlLabel, 
  Grid, 
  MenuItem, 
  Paper, 
  Stack, 
  Switch, 
  Tab, 
  TableContainer, 
  Tabs, 
  TextField, 
  Typography,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useForm } from 'react-hook-form';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import PageHeader from '../../components/erp/PageHeader';
import FormSection from '../../components/erp/FormSection';
import VariantTable from './VariantTable';
import { buildSizeLabelLookup, resolveSizeLabel } from '../../common/sizeDisplay';
import { addItem, updateItem } from './itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchGstSlabs } from '../gst/gstSlice';
import api from '../../services/api';

const tabs = [
  ['basic', 'Product Details'],
  ['variants', 'Variants & Pricing'],
  ['media', 'Media'],
  ['inventory', 'Inventory Defaults'],
];

const defaultValues = {
  itemCode: '', itemName: '', brand: '', hsnCodeId: '', gstSlabId: '', shadeColor: '', uom: 'PCS', skuPrefix: '', description: '', status: 'Active',
  fabric: '', pattern: '', fit: '', gender: '', season: '', notes: '',
  sectionId: '', categoryId: '', subCategoryId: '', subSubCategoryId: '',
  defaultWarehouse: '', reorderLevel: 0, reorderQty: 0, openingStock: 0, openingStockRate: 0,
  stockTrackingEnabled: true, barcodeEnabled: true,
};

function ItemFormPage({ mode = 'edit' }) {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isViewMode = mode === 'view';
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const items = useSelector((state) => state.items.records);
  const masters = useSelector((state) => state.masters || {});
  const gstSlabs = useSelector((state) => state.gst?.taxRates || []);
  
  const brands = masters.brands || [];
  const itemGroups = masters.itemGroups || [];
  const warehouses = masters.warehouses || [];
  const hsnCodes = masters.hsnCodes || [];
  const seasons = masters.seasons || [];
  const sizes = masters.sizes || [];

  const existingItem = useMemo(() => (isEditMode ? items.find((item) => item.id === id || item._id === id) : null), [id, isEditMode, items]);
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({ defaultValues });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [variants, setVariants] = useState([]);
  const [variantError, setVariantError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [images, setImages] = useState(Array(5).fill(null));
  const [uploadingImage, setUploadingImage] = useState(null);

  const styleCode = watch('itemCode');

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('hsnCodes'));
    dispatch(fetchMasters('seasons'));
    dispatch(fetchMasters('sizes'));
    dispatch(fetchGstSlabs());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && !existingItem) return;
    if (existingItem) {
      reset({
        itemCode: existingItem.code || existingItem.sku || '',
        itemName: existingItem.name || '',
        brand: existingItem.brandId?._id || existingItem.brandId || existingItem.brand?._id || existingItem.brand || '',
        hsnCodeId: existingItem.hsnCodeId?._id || existingItem.hsnCodeId || '',
        gstSlabId: existingItem.gstSlabId?._id || existingItem.gstSlabId || '',
        shadeColor: existingItem.shadeColor || existingItem.color || '',
        uom: existingItem.uom || 'PCS',
        description: existingItem.description || '',
        status: existingItem.status || 'Active',
        fabric: existingItem.fabric || '',
        pattern: existingItem.pattern || '',
        fit: existingItem.fit || '',
        gender: existingItem.gender || '',
        season: existingItem.seasonId?._id || existingItem.seasonId || existingItem.season || '',
        sectionId: existingItem.section?._id || existingItem.section || '',
        categoryId: existingItem.categoryId?._id || existingItem.categoryId || '',
        subCategoryId: existingItem.subCategory?._id || existingItem.subCategory || '',
        subSubCategoryId: existingItem.styleType?._id || existingItem.styleType || '',
        defaultWarehouse: existingItem.defaultWarehouse?._id || existingItem.defaultWarehouse || '',
        reorderLevel: existingItem.reorderLevel || 0,
        reorderQty: existingItem.reorderQty || 0,
        openingStock: existingItem.openingStock || 0,
        openingStockRate: existingItem.openingStockRate || 0,
        stockTrackingEnabled: existingItem.stockTrackingEnabled ?? true,
        barcodeEnabled: existingItem.barcodeEnabled ?? true,
      });
      setVariants(existingItem.variants || []);
      const next = Array(5).fill(null);
      (existingItem.images || []).slice(0, 5).forEach((img, index) => {
        next[index] = typeof img === 'string' ? { preview: img, name: `Image ${index + 1}` } : img;
      });
      setImages(next);
      return;
    }
    reset(defaultValues);
    setVariants([]);
    setImages(Array(5).fill(null));
  }, [existingItem, isEditMode, reset]);

  const handleImageChange = (index) => async (event) => {
    const file = event.target.files?.[0]; 
    if (!file) return;

    setUploadingImage(index);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setImages((prev) => {
          const next = [...prev];
          next[index] = { name: file.name, preview: url };
          return next;
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(null);
    }
  };

  const removeImage = (index) => setImages((prev) => { 
    const next = [...prev]; 
    next[index] = null; 
    return next; 
  });

  const onSubmit = async (data, statusOverride = data.status || 'Active', stay = false) => {
    if (!variants.length) { 
      setVariantError('Please add at least one row in Variants & Pricing.'); 
      setActiveTab('variants'); 
      return; 
    }
    if (!data.itemCode || !data.itemName) {
      setActiveTab('basic'); 
      return; 
    }

    const payload = {
      name: data.itemName.trim(),
      code: data.itemCode.trim().toUpperCase(),
      sku: data.itemCode.trim().toUpperCase(),
      brandId: data.brand,
      seasonId: data.season,
      section: data.sectionId,
      categoryId: data.categoryId,
      subCategory: data.subCategoryId,
      styleType: data.subSubCategoryId,
      shadeColor: data.shadeColor,
      uom: data.uom,
      hsnCodeId: data.hsnCodeId,
      gstSlabId: data.gstSlabId,
      fabric: data.fabric,
      pattern: data.pattern,
      fit: data.fit,
      gender: data.gender,
      description: data.description?.trim(),
      defaultWarehouse: data.defaultWarehouse,
      reorderLevel: Number(data.reorderLevel || 0),
      reorderQty: Number(data.reorderQty || 0),
      openingStock: Number(data.openingStock || 0),
      openingStockRate: Number(data.openingStockRate || 0),
      stockTrackingEnabled: data.stockTrackingEnabled !== false,
      barcodeEnabled: data.barcodeEnabled !== false,
      status: statusOverride,
      images: images.filter(Boolean).map((img) => img.preview || img),
      variants: variants.map((v) => ({
        ...v,
        salePrice: Number(v.salePrice || 0),
        costPrice: Number(v.costPrice || 0),
        mrp: Number(v.mrp || 0),
        stock: Number(v.stock || 0)
      }))
    };

    try {
      if (isEditMode) {
        await dispatch(updateItem({ id, item: payload })).unwrap();
      } else {
        await dispatch(addItem(payload)).unwrap();
      }
      
      if (stay) {
        setSuccessMessage(`Item saved successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }
      navigate('/items');
    } catch (err) {
      console.error('Save Item Failed:', err);
      setVariantError(err.message || 'Failed to save item. Please check all fields.');
    }
  };

  const sections = itemGroups.filter(g => (g.groupType === 'Section' || !g.parentId) && !['Brand', 'Season'].includes(g.groupType));
  const categoryOptions = itemGroups.filter(g => g.parentId === watch('sectionId'));
  const subCategoryOptions = itemGroups.filter(g => g.parentId === watch('categoryId'));
  const styleOptions = itemGroups.filter(g => g.parentId === watch('subCategoryId'));
  const sizeLabelLookup = useMemo(() => buildSizeLabelLookup(sizes), [sizes]);
  const variantSizeOptions = useMemo(
    () =>
      sizes
        .map((size) => {
          const value = size.sizeCode || size.name || size.sizeLabel || '';
          return {
            value,
            label: resolveSizeLabel(size.sizeLabel || size.name || value, sizeLabelLookup) || value,
          };
        })
        .filter((option) => option.value),
    [sizeLabelLookup, sizes],
  );

  const resolveSelectLabel = (options, value, placeholder, labelGetter) => {
    if (!value) return placeholder;
    const matchedOption = options.find((option) => String(option.id || option._id) === String(value));
    return matchedOption ? labelGetter(matchedOption) : placeholder;
  };

  const renderSelectValue = (options, placeholder, labelGetter) => (selected) => (
    <Box
      component="span"
      sx={{
        display: 'block',
        color: selected ? '#0f172a' : '#94a3b8',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
        lineHeight: 1.35,
      }}
    >
      {resolveSelectLabel(options, selected, placeholder, labelGetter)}
    </Box>
  );

  const responsiveSelectFieldSx = {
    '& .MuiOutlinedInput-root': {
      alignItems: 'flex-start',
      minHeight: 64,
    },
    '& .MuiSelect-select': {
      display: 'block',
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'clip',
      overflowWrap: 'anywhere',
      lineHeight: 1.35,
      paddingTop: '18px',
      paddingBottom: '12px',
      minHeight: '1.35em !important',
    },
  };

  const renderHierarchyValue = (options, placeholder) =>
    renderSelectValue(options, placeholder, (option) => option.groupName || option.name || placeholder);

  const renderMappedSelectValue = (options, placeholder, labelGetter) =>
    renderSelectValue(options, placeholder, (option) => labelGetter(option) || placeholder);

  const uomOptions = [
    { id: 'PCS', label: 'PCS' },
    { id: 'SET', label: 'SET' },
    { id: 'METER', label: 'METER' },
  ];

  if (isEditMode && !existingItem) {
    return (
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Item not found</Typography>
        <Button variant="contained" onClick={() => navigate('/items')}>Back to Item List</Button>
      </Paper>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <PageHeader
        title={isViewMode ? 'Item Details' : isEditMode ? 'Edit Item' : 'Add Item'}
        subtitle="Industrial apparel management with advanced pricing and inventory tracking."
        breadcrumbs={[{ label: 'Items', path: '/items' }, { label: id || 'New', active: true }]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/items')}>Back</Button>,
          !isViewMode && <Button key="draft" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, 'Draft', true))}>Save Draft</Button>,
          !isViewMode && <Button key="save" variant="contained" color="primary" startIcon={<TaskAltOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, isEditMode ? existingItem.status : 'Active'))}>Save Item</Button>,
        ].filter(Boolean)}
      />

      {successMessage && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMessage}</Alert>}
      {variantError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{variantError}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, value) => setActiveTab(value)} 
          variant="scrollable" 
          scrollButtons="auto" 
          sx={{ px: 2, pt: 1, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}
        >
          {tabs.map(([value, label]) => (
            <Tab key={value} value={value} label={label} sx={{ fontWeight: 700, textTransform: 'none', minWidth: 120 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Product Details Tab */}
          <Box sx={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
            <Stack spacing={3}>
              <FormSection title="Core Information" subtitle="Item identity and classification.">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Style Code *" {...register('itemCode', { required: 'Style Code is required.' })} error={Boolean(errors.itemCode)} helperText={errors.itemCode?.message} disabled={isViewMode} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Item Name *" {...register('itemName', { required: 'Item Name is required.' })} error={Boolean(errors.itemName)} helperText={errors.itemName?.message} disabled={isViewMode} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Color / Shade" {...register('shadeColor')} disabled={isViewMode} />
                  </Grid>
                </Grid>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 2,
                  }}
                >
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="HSN Code *"
                      {...register('hsnCodeId', { required: 'HSN Code is required.' })}
                      error={Boolean(errors.hsnCodeId)}
                      helperText={errors.hsnCodeId?.message}
                      disabled={isViewMode}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: renderMappedSelectValue(
                          hsnCodes,
                          'Select HSN',
                          (hsn) => `${hsn.hsnCode || hsn.code} - ${hsn.gstRate || hsn.gstPercent}%`,
                        ),
                      }}
                      sx={responsiveSelectFieldSx}
                    >
                      <MenuItem value="">Select HSN</MenuItem>
                      {hsnCodes.map((hsn) => <MenuItem key={hsn.id || hsn._id} value={hsn.id || hsn._id}>{hsn.hsnCode || hsn.code} - {hsn.gstRate || hsn.gstPercent}%</MenuItem>)}
                    </TextField>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Brand"
                      {...register('brand')}
                      disabled={isViewMode}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: renderMappedSelectValue(brands, 'Select Brand', (brand) => brand.brandName || brand.name),
                      }}
                      sx={responsiveSelectFieldSx}
                    >
                      <MenuItem value="">Select Brand</MenuItem>
                      {brands.map((brand) => <MenuItem key={brand.id || brand._id} value={brand.id || brand._id}>{brand.brandName || brand.name}</MenuItem>)}
                    </TextField>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Season"
                      {...register('season')}
                      disabled={isViewMode}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: renderMappedSelectValue(seasons, 'Select Season', (season) => season.seasonName || season.name),
                      }}
                      sx={responsiveSelectFieldSx}
                    >
                      <MenuItem value="">Select Season</MenuItem>
                      {seasons.map((s) => <MenuItem key={s.id || s._id} value={s.id || s._id}>{s.seasonName || s.name}</MenuItem>)}
                    </TextField>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="UOM"
                      {...register('uom')}
                      disabled={isViewMode}
                      InputLabelProps={{ shrink: true }}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: renderMappedSelectValue(uomOptions, 'Select UOM', (option) => option.label),
                      }}
                      sx={responsiveSelectFieldSx}
                    >
                      <MenuItem value="PCS">PCS</MenuItem>
                      <MenuItem value="SET">SET</MenuItem>
                      <MenuItem value="METER">METER</MenuItem>
                    </TextField>
                </Box>
              </FormSection>

              <FormSection title="Category Hierarchy" subtitle="Classification tree for the item.">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 2,
                    alignItems: 'start',
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Section / Gender *"
                    {...register('sectionId', { required: 'Section is required.' })}
                    error={Boolean(errors.sectionId)}
                    disabled={isViewMode}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: renderHierarchyValue(sections, 'Select Section / Gender'),
                    }}
                    sx={responsiveSelectFieldSx}
                  >
                      <MenuItem value="">Select Section</MenuItem>
                      {sections.map(g => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Category *"
                    {...register('categoryId', { required: 'Category is required.' })}
                    error={Boolean(errors.categoryId)}
                    disabled={isViewMode}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: renderHierarchyValue(categoryOptions, 'Select Category'),
                    }}
                    sx={responsiveSelectFieldSx}
                  >
                      <MenuItem value="">Select Category</MenuItem>
                      {categoryOptions.map(g => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Sub Group"
                    {...register('subCategoryId')}
                    disabled={isViewMode}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: renderHierarchyValue(subCategoryOptions, 'Select Sub Group'),
                    }}
                    sx={responsiveSelectFieldSx}
                  >
                      <MenuItem value="">Select Sub Group</MenuItem>
                      {subCategoryOptions.map(g => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Style / Type"
                    {...register('subSubCategoryId')}
                    disabled={isViewMode}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: renderHierarchyValue(styleOptions, 'Select Style / Type'),
                    }}
                    sx={responsiveSelectFieldSx}
                  >
                      <MenuItem value="">Select Style</MenuItem>
                      {styleOptions.map(g => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}
                  </TextField>
                </Box>
              </FormSection>

              <FormSection title="Descriptors" subtitle="Garment specific attributes for better search.">
                <Grid container spacing={2}>
                  {['fabric', 'pattern', 'fit', 'gender'].map(key => (
                    <Grid key={key} item xs={12} md={3}>
                      <TextField fullWidth size="small" label={key.charAt(0).toUpperCase() + key.slice(1)} {...register(key)} disabled={isViewMode} />
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Description" multiline minRows={2} {...register('description')} disabled={isViewMode} />
                  </Grid>
                </Grid>
              </FormSection>
            </Stack>
          </Box>

          {/* Variants Tab */}
          <Box sx={{ display: activeTab === 'variants' ? 'block' : 'none' }}>
            <VariantTable 
              variants={variants} 
              onChange={setVariants} 
              styleCode={styleCode || 'ITEM'} 
              readOnly={isViewMode} 
              sizeOptions={variantSizeOptions} 
            />
          </Box>

          {/* Media Tab */}
          <Box sx={{ display: activeTab === 'media' ? 'block' : 'none' }}>
            <FormSection title="Media" subtitle="Images for catalog and sales presentation.">
              <Grid container spacing={2}>
                {images.map((img, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper elevation={0} sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 1.5, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', position: 'relative' }}>
                      {uploadingImage === index ? (
                        <CircularProgress size={30} />
                      ) : img?.preview ? (
                        <>
                          <Box component="img" src={img.preview} sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 1 }} />
                          {!isViewMode && <Button size="small" color="error" variant="contained" onClick={() => removeImage(index)} sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, px: 1 }}>X</Button>}
                        </>
                      ) : (
                        <Button component="label" sx={{ textTransform: 'none', color: '#64748b' }} disabled={isViewMode}>
                          <Stack spacing={1} sx={{ alignItems: 'center' }}>
                            <UploadFileIcon sx={{ fontSize: 32 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{index === 0 ? 'Main Image' : `Image ${index + 1}`}</Typography>
                          </Stack>
                          <input hidden type="file" accept="image/*" onChange={handleImageChange(index)} />
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </FormSection>
          </Box>

          {/* Inventory Tab */}
          <Box sx={{ display: activeTab === 'inventory' ? 'block' : 'none' }}>
            <FormSection title="Inventory Defaults" subtitle="Operational settings for warehouses.">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Default Warehouse"
                    {...register('defaultWarehouse')}
                    disabled={isViewMode}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                      displayEmpty: true,
                      renderValue: renderMappedSelectValue(warehouses, 'Select Warehouse', (warehouse) => warehouse.warehouseName || warehouse.name),
                    }}
                    sx={responsiveSelectFieldSx}
                  >
                    <MenuItem value="">Select Warehouse</MenuItem>
                    {warehouses.map((w) => <MenuItem key={w.id || w._id} value={w.id || w._id}>{w.warehouseName || w.name}</MenuItem>)}
                  </TextField>
                </Grid>
                {['reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate'].map((key) => (
                  <Grid item xs={12} md={2} key={key}>
                    <TextField fullWidth size="small" type="number" label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} {...register(key)} disabled={isViewMode} />
                  </Grid>
                ))}
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                    <FormControlLabel control={<Switch checked={watch('stockTrackingEnabled')} onChange={(e) => setValue('stockTrackingEnabled', e.target.checked)} disabled={isViewMode} />} label="Stock Tracking" />
                    <FormControlLabel control={<Switch checked={watch('barcodeEnabled')} onChange={(e) => setValue('barcodeEnabled', e.target.checked)} disabled={isViewMode} />} label="Barcode Printing" />
                  </Paper>
                </Grid>
              </Grid>
            </FormSection>
          </Box>
        </Box>
      </Paper>

      {!isViewMode && (
        <Paper elevation={0} sx={{ position: 'sticky', bottom: 0, border: '1px solid #e2e8f0', p: 2, bgcolor: '#fff', zIndex: 10, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/items')}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleSubmit((values) => onSubmit(values, 'Active'))}>Final Save</Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

export default ItemFormPage;
