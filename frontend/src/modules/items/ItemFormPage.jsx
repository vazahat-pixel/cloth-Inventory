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
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import PageHeader from '../../components/erp/PageHeader';
import FormSection from '../../components/erp/FormSection';
import VariantTable from './VariantTable';
import { addItem, updateItem } from './itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchGstSlabs } from '../gst/gstSlice';
import api from '../../services/api';

const createVariantId = () => `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const tabs = [
  ['basic', 'Product Details'],
  ['variants', 'Variants & Pricing'],
  ['media', 'Media'],
  ['inventory', 'Inventory Defaults'],
];

const defaultValues = {
  itemCode: '', itemName: '', type: 'FINISHED_GOOD', brand: '', hsCodeId: '', gstSlabId: '', shadeColor: '', uom: 'PCS', skuPrefix: '', description: '', status: 'Active',
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
 
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues,
  });

  const itemType = watch('type');
  const isRawMaterial = itemType === 'RAW_MATERIAL';

  const [activeTab, setActiveTab] = useState('basic');
  const [variants, setVariants] = useState([]);
  const [variantError, setVariantError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [images, setImages] = useState(Array(5).fill(null));
  const [uploadingImage, setUploadingImage] = useState(null);

  const styleCode = watch('itemCode');

  // Filter tabs based on type
  const activeTabs = useMemo(() => {
    const list = [...tabs];
    if (isRawMaterial) {
      return list.filter(t => t[0] !== 'variants');
    }
    return list;
  }, [isRawMaterial]);

  useEffect(() => {
    if (activeTab === 'variants' && isRawMaterial) {
      setActiveTab('basic');
    }
  }, [isRawMaterial, activeTab]);

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('hsnCodes'));
    dispatch(fetchMasters('seasons'));
    dispatch(fetchMasters('sizes'));
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchGstSlabs());
  }, [dispatch]);

  const existingItem = useMemo(() => (isEditMode ? items.find((item) => item.id === id || item._id === id) : null), [id, isEditMode, items]);

  useEffect(() => {
    if (isEditMode && !existingItem) return;
    if (existingItem) {
      // Robust extraction: Handle both populated objects and raw IDs
      const getId = (field) => {
        if (!field) return '';
        return typeof field === 'object' ? (field._id || field.id || '') : field;
      };

      const getGroupIdByType = (type) => {
        let match = existingItem.groupIds?.find(g => typeof g === 'object' && g.groupType === type);
        if (match) return String(match._id || match.id || '');
        const idMatches = existingItem.groupIds || [];
        const masterMatch = itemGroups.find(g => idMatches.includes(g._id || g.id) && g.groupType === type);
        return masterMatch ? String(masterMatch._id || masterMatch.id || '') : '';
      };

      reset({
        type: existingItem.type || 'FINISHED_GOOD',
        itemCode: existingItem.itemCode || '', 
        itemName: existingItem.itemName || '', 
        brand: getId(existingItem.brand) ? String(getId(existingItem.brand)) : '',
        season: getId(existingItem.season || existingItem.session) ? String(getId(existingItem.season || existingItem.session)) : '',
        hsCodeId: getId(existingItem.hsCodeId || existingItem.hsnCodeId) ? String(getId(existingItem.hsCodeId || existingItem.hsnCodeId)) : '', 
        shadeColor: existingItem.shade || '', 
        uom: existingItem.uom || 'PCS', 
        description: existingItem.description || '', 
        status: existingItem.status || 'Active', 
        fabric: existingItem.fabric || '',
        pattern: existingItem.pattern || '', 
        fit: existingItem.fit || '', 
        gender: existingItem.gender || '',
        sectionId: getGroupIdByType('Section'),
        categoryId: getGroupIdByType('Category'),
        subCategoryId: getGroupIdByType('Sub Category'),
        subSubCategoryId: getGroupIdByType('Style / Type'),
        defaultWarehouse: getId(existingItem.defaultWarehouse || existingItem.warehouseId) ? String(getId(existingItem.defaultWarehouse || existingItem.warehouseId)) : '', 
        reorderLevel: Number(existingItem.reorderLevel || 0), 
        reorderQty: Number(existingItem.reorderQty || 0),
        openingStock: Number(existingItem.openingStock || 0), 
        openingStockRate: Number(existingItem.openingStockRate || 0),
        stockTrackingEnabled: existingItem.stockTrackingEnabled ?? true, 
        barcodeEnabled: existingItem.barcodeEnabled ?? true,
      });

      const mappedVariants = (existingItem.sizes || []).map(s => ({
        id: s._id || s.id || createVariantId(),
        size: s.size,
        color: existingItem.shade || '',
        sku: s.sku || s.barcode || '',
        costPrice: Number(s.costPrice || 0),
        salePrice: Number(s.salePrice || 0),
        mrp: Number(s.mrp || 0),
        stock: Number(s.stock || 0),
        status: s.isActive === false ? 'Inactive' : 'Active'
      }));
      
      setVariants(mappedVariants);
      
      const next = Array(5).fill(null); 
      (existingItem.images || []).slice(0, 5).forEach((img, index) => { 
        next[index] = typeof img === 'string' ? { preview: img, name: `Image ${index+1}` } : img; 
      }); 
      setImages(next); 
      return;
    }
    reset(defaultValues); setVariants([]); setImages(Array(5).fill(null));
  }, [existingItem, isEditMode, reset, brands.length, itemGroups.length, seasons.length, hsnCodes.length]);

  useEffect(() => {
    const selected = hsnCodes.find((item) => String(item.id || item._id || '') === String(watch('hsCodeId') || ''));
    if (selected?.gstSlabId && !watch('gstSlabId')) setValue('gstSlabId', selected.gstSlabId);
  }, [hsnCodes, setValue, watch]);

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
    if (!isRawMaterial && !variants.length) { 
      setVariantError('Please add at least one row in Variants & Pricing.'); 
      setActiveTab('variants'); 
      return; 
    }
    if (!data.itemCode || !data.itemName) {
      setActiveTab('basic'); 
      return; 
    }

    const payload = {
      itemName: data.itemName.trim(),
      itemCode: data.itemCode.trim().toUpperCase(),
      brand: data.brand,
      session: data.season,
      groupIds: [data.sectionId, data.categoryId, data.subCategoryId, data.subSubCategoryId].filter(Boolean),
      category: data.categoryId, // Backward compatibility
      shade: data.shadeColor,
      uom: data.uom,
      hsCodeId: data.hsCodeId,
      gstTax: data.gstSlabId, 
      fabric: data.fabric,
      pattern: data.pattern,
      fit: data.fit,
      gender: data.gender,
      type: data.type,
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
      sizes: isRawMaterial ? [] : variants.map((v) => ({
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

  const getOptionId = (value) => {
    if (!value) return '';
    if (typeof value === 'object') return String(value._id || value.id || '');
    return String(value);
  };

  const selectedSectionId = getOptionId(watch('sectionId'));
  const selectedCategoryId = getOptionId(watch('categoryId'));
  const selectedSubCategoryId = getOptionId(watch('subCategoryId'));
  const selectedDefaultWarehouse = getOptionId(watch('defaultWarehouse'));

  const sections = itemGroups.filter((g) => (g.groupType === 'Section' || !g.parentId) && !['Brand', 'Season'].includes(g.groupType));
  const categoryOptions = itemGroups.filter((g) => g.groupType === 'Category' && getOptionId(g.parentId) === selectedSectionId);
  const subCategoryOptions = itemGroups.filter((g) => g.groupType === 'Sub Category' && getOptionId(g.parentId) === selectedCategoryId);
  const styleOptions = itemGroups.filter((g) => g.groupType === 'Style / Type' && getOptionId(g.parentId) === selectedSubCategoryId);

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
        subtitle={isRawMaterial ? 'Bulk procurement management for fabrics and accessories.' : 'Industrial apparel management with advanced pricing and inventory tracking.'}
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
          {activeTabs.map(([value, label]) => (
            <Tab key={value} value={value} label={label} sx={{ fontWeight: 700, textTransform: 'none', minWidth: 120 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Product Details Tab */}
          <Box sx={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
            <Stack spacing={3}>
              <FormSection title="Core Information" subtitle="Item identity and classification.">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      label={isRawMaterial ? "Material Code *" : "Style Code *"} 
                      {...register('itemCode', { required: 'Code is required' })} 
                      error={Boolean(errors.itemCode)} 
                      helperText={errors.itemCode?.message || ' '} 
                      disabled={isViewMode} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField 
                      fullWidth 
                      size="small" 
                      label={isRawMaterial ? "Material Name *" : "Item Name *"} 
                      {...register('itemName', { required: 'Name is required' })} 
                      error={Boolean(errors.itemName)} 
                      helperText={errors.itemName?.message || ' '} 
                      disabled={isViewMode} 
                    />
                  </Grid>
                  {!isRawMaterial && <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Color / Shade" {...register('shadeColor')} disabled={isViewMode} /></Grid>}
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="SKU Prefix" {...register('skuPrefix')} disabled={isViewMode} /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          size="small"
                          fullWidth
                          label="Item Role / Category *"
                          disabled={isViewMode}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value === 'RAW_MATERIAL' && activeTab === 'variants') {
                              setActiveTab('basic');
                            }
                          }}
                        >
                          <MenuItem value="FINISHED_GOOD">Finished Good (Barcode Entry)</MenuItem>
                          <MenuItem value="ACCESSORY">Accessory (Barcode Entry)</MenuItem>
                          <MenuItem value="RAW_MATERIAL">Raw Material (Direct / Bulk Entry)</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="hsCodeId"
                      control={control}
                      rules={{ required: 'HSN is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          size="small"
                          fullWidth
                          label="HSN Code *"
                          value={field.value ?? ''}
                          disabled={isViewMode}
                          error={Boolean(errors.hsCodeId)}
                          helperText={
                            errors.hsCodeId?.message || 
                            (field.value ? `Applied GST Slab: ${hsnCodes.find(h => String(h.id || h._id) === String(field.value))?.gstPercent || 0}%` : 'Select HSN to view tax slab.')
                          }
                        >
                          {renderAsyncValueOption(field.value, hsnCodes)}
                          <MenuItem value="">Select HSN</MenuItem>
                          {hsnCodes.map((h) => (
                            <MenuItem key={h.id || h._id} value={h.id || h._id}>
                              {h.hsnCode || h.code} - {h.gstRate || h.gstPercent}%
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="brand"
                      control={control}
                      rules={{ required: 'Brand is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          size="small"
                          fullWidth
                          label="Brand"
                          value={field.value ?? ''}
                          disabled={isViewMode}
                          error={Boolean(errors.brand)}
                          helperText={errors.brand?.message || ' '}
                          InputLabelProps={{ shrink: true }}
                        >
                          {renderAsyncValueOption(field.value, brands)}
                          <MenuItem value="">Select Brand</MenuItem>
                          {brands.map((b) => (
                            <MenuItem key={b.id || b._id} value={b.id || b._id}>
                              {b.brandName || b.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="season"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          size="small"
                          fullWidth
                          label="Season"
                          value={field.value ?? ''}
                          disabled={isViewMode}
                          InputLabelProps={{ shrink: true }}
                        >
                          {renderAsyncValueOption(field.value, seasons)}
                          <MenuItem value="">Select Season</MenuItem>
                          {seasons.map((s) => (
                            <MenuItem key={s.id || s._id} value={s.id || s._id}>
                              {s.seasonName || s.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="vendorId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          size="small"
                          fullWidth
                          label="Primary Supplier"
                          value={field.value ?? ''}
                          disabled={isViewMode}
                        >
                          {renderAsyncValueOption(field.value, masters.suppliers || [])}
                          <MenuItem value="">Select Supplier</MenuItem>
                          {(masters.suppliers || []).map((s) => (
                            <MenuItem key={s.id || s._id} value={s.id || s._id}>
                              {s.name || s.supplierName}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField fullWidth size="small" select label="UOM" {...register('uom')} disabled={isViewMode}>
                      <MenuItem value="PCS">PCS</MenuItem>
                      <MenuItem value="SET">SET</MenuItem>
                      <MenuItem value="METER">METER</MenuItem>
                      <MenuItem value="KG">KG</MenuItem>
                      <MenuItem value="YARD">YARD</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection title="Category Hierarchy" subtitle="Organize item in Section > Category > Sub Category > Style / Type.">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="sectionId"
                      control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Section" value={field.value ?? ''} disabled={isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, sections)}<MenuItem value="">Select Section</MenuItem>{sections.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Category" value={field.value ?? ''} disabled={!selectedSectionId || isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, categoryOptions)}<MenuItem value="">Select Category</MenuItem>{categoryOptions.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="subCategoryId"
                      control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Sub Category" value={field.value ?? ''} disabled={!selectedCategoryId || isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, subCategoryOptions)}<MenuItem value="">Select Sub Category</MenuItem>{subCategoryOptions.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="subSubCategoryId"
                      control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Style / Type" value={field.value ?? ''} disabled={!selectedSubCategoryId || isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, styleOptions)}<MenuItem value="">Select Style / Type</MenuItem>{styleOptions.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                </Grid>
              </FormSection>

              {!isRawMaterial && (
                <FormSection title="Descriptors" subtitle="Garment specific attributes for better search.">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Fabric" {...register('fabric')} disabled={isViewMode} /></Grid>
                    <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Pattern" {...register('pattern')} disabled={isViewMode} /></Grid>
                    <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Fit" {...register('fit')} disabled={isViewMode} /></Grid>
                    <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Gender" {...register('gender')} disabled={isViewMode} /></Grid>
                    <Grid size={12}><TextField fullWidth size="small" label="Description" multiline minRows={2} {...register('description')} disabled={isViewMode} /></Grid>
                  </Grid>
                </FormSection>
              )}
            </Stack>
          </Box>

          {/* Variants Tab */}
          {!isRawMaterial && (
            <Box sx={{ display: activeTab === 'variants' ? 'block' : 'none' }}>
              <VariantTable 
                variants={variants} 
                onChange={setVariants} 
                styleCode={styleCode || 'ITEM'} 
                readOnly={isViewMode} 
                sizeOptions={sizes.map(s => s.sizeCode || s.name)} 
              />
            </Box>
          )}

          {/* Media Tab */}
          <Box sx={{ display: activeTab === 'media' ? 'block' : 'none' }}>
            <FormSection title="Media" subtitle="Images for catalog and sales presentation.">
              <Grid container spacing={2}>
                {images.map((img, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField fullWidth size="small" select label="Default Warehouse" {...register('defaultWarehouse')} disabled={isViewMode}>
                    {renderAsyncValueOption(selectedDefaultWarehouse, warehouses)}
                    <MenuItem value="">Select Warehouse</MenuItem>
                    {warehouses.map((w) => <MenuItem key={w.id || w._id} value={w.id || w._id}>{w.warehouseName || w.name}</MenuItem>)}
                  </TextField>
                </Grid>
                {['reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate'].map((key) => (
                  <Grid key={key} size={{ xs: 12, md: 2 }}>
                    <TextField fullWidth size="small" type="number" label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} {...register(key)} disabled={isViewMode} />
                  </Grid>
                ))}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                    <FormControlLabel control={<Switch checked={watch('stockTrackingEnabled')} onChange={(e) => setValue('stockTrackingEnabled', e.target.checked)} disabled={isViewMode} />} label="Stock Tracking" />
                    {!isRawMaterial && <FormControlLabel control={<Switch checked={watch('barcodeEnabled')} onChange={(e) => setValue('barcodeEnabled', e.target.checked)} disabled={isViewMode} />} label="Barcode Printing" />}
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

/**
 * Renders a placeholder MenuItem if the current value is not in the options list.
 * Crucial for avoiding MUI "Out of range" errors when data is still loading.
 */
function renderAsyncValueOption(value, options) {
  if (!value) return null;
  const match = options.find((o) => String(o.id || o._id) === String(value));
  if (match) return null; // MUI handles this fine
  return (
    <MenuItem key={value} value={value} sx={{ display: 'none' }}>
      Loading...
    </MenuItem>
  );
}
