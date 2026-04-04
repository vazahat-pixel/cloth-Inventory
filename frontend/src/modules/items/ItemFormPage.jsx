import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { 
  Alert, 
  Box, 
  Button, 
  Grid, 
  MenuItem, 
  Paper, 
  Stack, 
  Tab, 
  Tabs, 
  TextField, 
  Typography,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useForm, Controller } from 'react-hook-form';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import PageHeader from '../../components/erp/PageHeader';
import FormSection from '../../components/erp/FormSection';
import VariantTable from './VariantTable';
import { addItem, updateItem } from './itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
import api from '../../services/api';

const createVariantId = () => `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const COMMON_COLORS = [
  'Black', 'White', 'Off-White', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Light Blue', 'Dark Green', 'Olive Green', 
  'Bottle Green', 'Mint Green', 'Red', 'Maroon', 'Wine', 'Crimson', 'Yellow', 'Mustard', 'Orange', 'Rust', 
  'Pink', 'Dusty Rose', 'Grey', 'Light Grey', 'Charcoal', 'Beige', 'Cream', 'Camel', 'Dark Brown', 'Khaki', 
  'Turquoise', 'Teal', 'Purple', 'Lavender', 'Magenta', 'Peach', 'Coral', 'Salmon', 'Gold', 'Silver', 'Copper'
];

const TABS = [
  ['basic', 'Core Information'],
  ['variants', 'Sizes & Pricing'],
  ['media', 'Media'],
];

const defaultValues = {
  type: 'GARMENT', itemCode: '', itemName: '', brand: '', hsCodeId: '', gstSlabId: '', uom: 'PCS', skuPrefix: '', description: '', status: 'Active',
  fabric: '', pattern: '', fit: '', gender: '', notes: '',
  sectionId: '', categoryId: '', subCategoryId: '', subSubCategoryId: '',
  defaultWarehouse: '', reorderLevel: 0, reorderQty: 0, openingStock: 0, openingStockRate: 0,
  stockTrackingEnabled: true, barcodeEnabled: true,
  vendorId: '',
  accessorySize: '', packingType: '',
};

function ItemFormPage({ mode = 'edit' }) {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isViewMode = mode === 'view';
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const items = useSelector((state) => state.items.records);
  const masters = useSelector((state) => state.masters || {});
  
  const brands = masters.brands || [];
  const itemGroups = masters.itemGroups || [];
  const warehouses = masters.warehouses || [];
  const hsnCodes = masters.hsnCodes || [];
  const sizes = masters.sizes || [];
  const suppliers = masters.suppliers || [];
 
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues,
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [variants, setVariants] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [images, setImages] = useState(Array(5).fill(null));
  const [uploadingImage, setUploadingImage] = useState(null);

  const styleCode = watch('itemCode');
  const typeWatch = watch('type');

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('hsnCodes'));
    dispatch(fetchMasters('sizes'));
    dispatch(fetchMasters('suppliers'));
  }, [dispatch]);

  const existingItem = useMemo(() => (isEditMode ? items.find((item) => item.id === id || item._id === id) : null), [id, isEditMode, items]);

  useEffect(() => {
    if (!isEditMode && typeWatch) {
      api.get(`/items/next-code?type=${typeWatch}`)
        .then(res => {
          if (res.data.success && res.data.code) {
            setValue('itemCode', res.data.code);
          }
        })
        .catch(err => console.error('Failed to fetch next item code', err));
    }
  }, [isEditMode, setValue, typeWatch]);

  useEffect(() => {
    if (isEditMode && !existingItem) return;
    if (existingItem) {
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
        type: existingItem.type || 'GARMENT',
        itemCode: existingItem.itemCode || '', 
        itemName: existingItem.itemName || '', 
        brand: getId(existingItem.brand) ? String(getId(existingItem.brand)) : '',
        hsCodeId: getId(existingItem.hsCodeId || existingItem.hsnCodeId) ? String(getId(existingItem.hsCodeId || existingItem.hsnCodeId)) : '', 
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
        accessorySize: existingItem.accessorySize || '',
        packingType: existingItem.packingType || '',
      });

      const mappedVariants = (existingItem.sizes || []).map(s => ({
        id: s._id || s.id || createVariantId(),
        size: s.size,
        color: existingItem.shade || '',
        sku: s.sku || s.barcode || '',
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
  }, [existingItem, isEditMode, reset, brands.length, itemGroups.length, hsnCodes.length]);

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
      setErrorMessage('Please add at least one Size/Variant and Pricing.'); 
      setActiveTab('variants'); 
      return; 
    }
    if (!data.itemCode || !data.itemName) {
      setErrorMessage('Code and Name are required.');
      setActiveTab('basic'); 
      return; 
    }

    const payload = {
      itemName: data.itemName.trim(),
      itemCode: data.itemCode.trim().toUpperCase(),
      brand: data.brand,
      sectionId: data.sectionId,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      styleId: data.subSubCategoryId, // Mapping UI subSubCategoryId to styleId
      groupIds: [data.sectionId, data.categoryId, data.subCategoryId, data.subSubCategoryId].filter(Boolean),
      category: data.categoryId, 
      uom: data.uom,
      hsCodeId: data.hsCodeId,
      gstTax: data.gstSlabId, 
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
      accessorySize: data.accessorySize,
      packingType: data.packingType,
      images: images.filter(Boolean).map((img) => img.preview || img),
      type: data.type || 'GARMENT',
      sizes: variants.map((v) => ({
        ...v,
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
      setErrorMessage(err.message || 'Failed to save item.');
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

  const sections = itemGroups.filter((g) => (g.groupType === 'Section' || !g.parentId) && !['Brand', 'Season'].includes(g.groupType));
  const categoryOptions = itemGroups.filter((g) => g.groupType === 'Category' && getOptionId(g.parentId) === selectedSectionId);
  const subCategoryOptions = itemGroups.filter((g) => g.groupType === 'Sub Category' && getOptionId(g.parentId) === selectedCategoryId);
  const styleOptions = itemGroups.filter((g) => g.groupType === 'Style / Type' && getOptionId(g.parentId) === selectedSubCategoryId);

  return (
    <Box component="form" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <PageHeader
        title={isViewMode ? 'Inventory Item Details' : isEditMode ? 'Edit Unified Item' : 'Add New Item / Accessory'}
        subtitle="Manage shirts, pants, ties, belts, and wallets in a unified catalog."
        breadcrumbs={[{ label: 'Items', path: '/items' }, { label: 'Item Details', active: true }]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/items')}>Back</Button>,
          !isViewMode && <Button key="draft" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, 'Draft', true))}>Save Draft</Button>,
          !isViewMode && <Button key="save" variant="contained" color="primary" startIcon={<TaskAltOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, isEditMode ? existingItem.status : 'Active'))}>Save Item</Button>,
        ].filter(Boolean)}
      />

      {successMessage && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMessage}</Alert>}
      {errorMessage && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMessage}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, value) => setActiveTab(value)} 
          sx={{ px: 2, pt: 1, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}
        >
          {TABS.map(([value, label]) => (
            <Tab key={value} value={value} label={label} sx={{ fontWeight: 700, textTransform: 'none', minWidth: 120 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Core Information Tab */}
          <Box sx={{ display: activeTab === 'basic' ? 'block' : 'none' }}>
            <Stack spacing={3}>
              <FormSection title="Core Information" subtitle="Basic identity and classification.">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField fullWidth size="small" select label="Item Type *" {...register('type')} disabled={isViewMode || isEditMode}>
                      <MenuItem value="GARMENT">Finished Garment</MenuItem>
                      <MenuItem value="ACCESSORY">Accessory / Trim Item</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField 
                      fullWidth size="small" label="Item/Style Code *" 
                      {...register('itemCode', { required: 'Code is required' })} 
                      error={Boolean(errors.itemCode)} 
                      disabled={isViewMode} 
                      InputLabelProps={{ shrink: Boolean(styleCode) || isEditMode }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth size="small" label="Item Name *" 
                      {...register('itemName', { required: 'Name is required' })} 
                      error={Boolean(errors.itemName)} 
                      disabled={isViewMode} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="hsCodeId"
                      control={control}
                      rules={{ required: 'HSN is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field} select size="small" fullWidth label="HSN Code *"
                          value={field.value ?? ''} disabled={isViewMode}
                          error={Boolean(errors.hsCodeId)}
                          helperText={field.value ? `Applied GST: ${hsnCodes.find(h => String(h.id || h._id) === String(field.value))?.gstPercent || 0}%` : 'Select HSN'}
                        >
                          {renderAsyncValueOption(field.value, hsnCodes)}
                          <MenuItem value="">Select HSN</MenuItem>
                          {hsnCodes.map((h) => <MenuItem key={h.id || h._id} value={h.id || h._id}>{h.hsnCode || h.code} - {h.gstPercent}%</MenuItem>)}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField fullWidth size="small" select label="Unit (UOM) *" {...register('uom')} disabled={isViewMode}>
                      <MenuItem value="PCS">Piece (PCS)</MenuItem>
                      <MenuItem value="SET">Set (SET)</MenuItem>
                      <MenuItem value="DOZ">Dozen (DOZ)</MenuItem>
                      <MenuItem value="PKT">Packet (PKT)</MenuItem>
                      <MenuItem value="BOX">Box (BOX)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection title="Category & Hierarchy" subtitle="Organize item in Section > Category > Sub Category.">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="sectionId" control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Section" value={field.value ?? ''} disabled={isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, sections)}<MenuItem value="">Select Section</MenuItem>{sections.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="categoryId" control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Category" value={field.value ?? ''} disabled={!selectedSectionId || isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, categoryOptions)}<MenuItem value="">Select Category</MenuItem>{categoryOptions.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="subCategoryId" control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Sub Category" value={field.value ?? ''} disabled={!selectedCategoryId || isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, subCategoryOptions)}<MenuItem value="">Select Sub Category</MenuItem>{subCategoryOptions.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="subSubCategoryId" control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Style / Type" value={field.value ?? ''} disabled={!selectedSubCategoryId || isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, styleOptions)}<MenuItem value="">Select Style / Type</MenuItem>{styleOptions.map((g) => <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.groupName || g.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                </Grid>
              </FormSection>

              <FormSection title="Technical Attributes" subtitle="Additional specifications for Garments and Accessories.">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Controller
                      name="brand" control={control}
                      render={({ field }) => <TextField {...field} select size="small" fullWidth label="Brand" value={field.value ?? ''} disabled={isViewMode} InputLabelProps={{ shrink: true }}>{renderAsyncValueOption(field.value, brands)}<MenuItem value="">Select Brand</MenuItem>{brands.map((b) => <MenuItem key={b.id || b._id} value={b.id || b._id}>{b.brandName || b.name}</MenuItem>)}</TextField>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Fabric / Material" {...register('fabric')} disabled={isViewMode} /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Pattern" {...register('pattern')} disabled={isViewMode} /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Fit" {...register('fit')} disabled={isViewMode} /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Accessory Size / Specs" {...register('accessorySize')} disabled={isViewMode} /></Grid>
                  <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth size="small" label="Packing Type" {...register('packingType')} disabled={isViewMode} /></Grid>
                  <Grid size={12}><TextField fullWidth size="small" label="Item Description" multiline minRows={2} {...register('description')} disabled={isViewMode} /></Grid>
                </Grid>
              </FormSection>
            </Stack>
          </Box>

          {/* Variants Tab */}
          <Box sx={{ display: activeTab === 'variants' ? 'block' : 'none' }}>
              <VariantTable 
                variants={variants} onChange={setVariants} 
                styleCode={styleCode || 'ITEM'} readOnly={isViewMode} 
                sizeOptions={sizes.map(s => s.sizeCode || s.name)} 
              />
            </Box>

          {/* Media Tab */}
          <Box sx={{ display: activeTab === 'media' ? 'block' : 'none' }}>
            <FormSection title="Gallery" subtitle="Images for catalog and sales.">
              <Grid container spacing={2}>
                {images.map((img, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper elevation={0} sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 1.5, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', position: 'relative' }}>
                      {uploadingImage === index ? <CircularProgress size={30} /> : img?.preview ? (
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
        </Box>
      </Paper>

      {!isViewMode && (
        <Paper elevation={0} sx={{ position: 'sticky', bottom: 0, border: '1px solid #e2e8f0', p: 2, bgcolor: '#fff', zIndex: 10, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/items')}>Cancel</Button>
            <Button variant="contained" color="primary" sx={{ px: 4, fontWeight: 800 }} onClick={handleSubmit((values) => onSubmit(values, 'Active'))}>Save Everything</Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

export default ItemFormPage;

function renderAsyncValueOption(value, options) {
  if (!value) return null;
  const match = options.find((o) => String(o.id || o._id) === String(value));
  if (match) return null;
  return <MenuItem key={value} value={value} sx={{ display: 'none' }}>Loading...</MenuItem>;
}
