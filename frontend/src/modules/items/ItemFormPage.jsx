import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Alert, Box, Button, FormControlLabel, Grid, MenuItem, Paper, Stack, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useForm } from 'react-hook-form';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import PageHeader from '../../components/erp/PageHeader';
import FormSection from '../../components/erp/FormSection';
import VariantTable from './VariantTable';
import { addItem, updateItem } from './itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchGstSlabs } from '../gst/gstSlice';
import api from '../../services/api';
import { groupSeed, hsnSeed } from '../erp/erpUiMocks';

const tabs = [
  ['basic', 'Basic Info'],
  ['attributes', 'Attributes'],
  ['groups', 'Group Allocation'],
  ['pricing', 'Sizes & Pricing'],
  ['preview', 'Variants / SKU Preview'],
  ['media', 'Media'],
  ['inventory', 'Inventory Defaults'],
];

const defaultValues = {
  itemCode: '', itemName: '', brand: '', hsnCodeId: '', gstSlabId: '', shadeColor: '', uom: 'PCS', skuPrefix: '', description: '', status: 'Active',
  fabric: '', type: '', pattern: '', fit: '', sleeveType: '', neckType: '', gender: '', season: '', occasion: '', materialComposition: '', notes: '',
  mainGroup: '', subGroup: '', categoryPath: '', defaultWarehouse: '', reorderLevel: 0, reorderQty: 0, openingStock: 0, openingStockRate: 0,
  stockTrackingEnabled: true, barcodeEnabled: true,
};

function ItemFormPage({ mode = 'edit' }) {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isViewMode = mode === 'view';
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const items = useSelector((state) => state.items.records);
  const brands = useSelector((state) => state.masters?.brands || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);
  const warehouses = useSelector((state) => state.masters?.warehouses || []);
  const gstSlabs = useSelector((state) => state.gst?.taxRates || []);
  const existingItem = useMemo(() => (isEditMode ? items.find((item) => item.id === id || item._id === id) : null), [id, isEditMode, items]);
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({ defaultValues });
  const [activeTab, setActiveTab] = useState('basic');
  const [variants, setVariants] = useState([]);
  const [variantError, setVariantError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hsnCodes, setHsnCodes] = useState(hsnSeed);
  const [images, setImages] = useState(Array(5).fill(null));
  const styleCode = watch('itemCode');

  useEffect(() => {
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchGstSlabs());
    api.get('/setup/hsn').then((res) => {
      const data = res.data?.data || res.data?.hsns || res.data?.data?.hsns || [];
      if (data.length) setHsnCodes(data.map((item) => ({ id: item._id || item.id, hsnCode: item.code || item.hsnCode, description: item.description || '', gstRate: item.gstSlabId?.percentage || item.gstRate || 0, gstSlabId: item.gstSlabId?._id || item.gstSlabId || '' })));
    }).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && !existingItem) return;
    if (existingItem) {
      reset({
        itemCode: existingItem.code || existingItem.sku || '', itemName: existingItem.name || '', brand: existingItem.brand?._id || existingItem.brand || '',
        hsnCodeId: existingItem.hsnCodeId?._id || existingItem.hsnCodeId || '', gstSlabId: existingItem.gstSlabId?._id || existingItem.gstSlabId || '',
        shadeColor: existingItem.color || '', uom: existingItem.uom || 'PCS', skuPrefix: existingItem.skuPrefix || existingItem.code || existingItem.sku || '',
        description: existingItem.description || '', status: existingItem.status || 'Active', fabric: existingItem.fabric || existingItem.attributes?.fabric || '',
        type: existingItem.fabricType || existingItem.type || '', pattern: existingItem.pattern || '', fit: existingItem.fit || '', sleeveType: existingItem.sleeveType || '',
        neckType: existingItem.neckType || '', gender: existingItem.gender || existingItem.attributes?.gender || '', season: existingItem.season || existingItem.attributes?.season || '',
        occasion: existingItem.occasion || '', materialComposition: existingItem.materialComposition || '', notes: existingItem.notes || '',
        mainGroup: existingItem.category?._id || existingItem.category || '', subGroup: existingItem.subGroup || '', categoryPath: existingItem.categoryPath || '',
        defaultWarehouse: existingItem.defaultWarehouse || '', reorderLevel: existingItem.reorderLevel || 0, reorderQty: existingItem.reorderQty || 0,
        openingStock: existingItem.openingStock || existingItem.factoryStock || 0, openingStockRate: existingItem.openingStockRate || 0,
        stockTrackingEnabled: existingItem.stockTrackingEnabled ?? true, barcodeEnabled: existingItem.barcodeEnabled ?? true,
      });
      setVariants(existingItem.variants?.length ? existingItem.variants : [{ id: existingItem.id, size: existingItem.size || '', color: existingItem.color || '', sku: existingItem.sku || '', barcodePrefix: existingItem.code || existingItem.sku || '', costPrice: Number(existingItem.costPrice || 0), salePrice: Number(existingItem.salePrice || 0), mrp: Number(existingItem.mrp || existingItem.salePrice || 0), stock: Number(existingItem.factoryStock || 0), status: existingItem.status || 'Active' }]);
      const next = Array(5).fill(null); (existingItem.images || []).slice(0, 5).forEach((img, index) => { next[index] = typeof img === 'string' ? { preview: img, name: `Image ${index + 1}` } : img; }); setImages(next); return;
    }
    reset(defaultValues); setVariants([]); setImages(Array(5).fill(null));
  }, [existingItem, isEditMode, reset]);

  useEffect(() => {
    const selected = hsnCodes.find((item) => item.id === watch('hsnCodeId'));
    if (selected?.gstSlabId && !watch('gstSlabId')) setValue('gstSlabId', selected.gstSlabId);
  }, [hsnCodes, setValue, watch]);

  const [uploadingImage, setUploadingImage] = useState(null);

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

  const removeImage = (index) => setImages((prev) => { const next = [...prev]; next[index] = null; return next; });

  const onSubmit = (values, statusOverride = values.status, stay = false) => {
    if (!variants.length) { setVariantError('Add at least one size row before saving this item.'); setActiveTab('pricing'); return; }
    if (!values.itemCode?.trim() || !values.itemName?.trim() || !values.hsnCodeId || !values.mainGroup) { setActiveTab('basic'); return; }
    const payload = {
      name: values.itemName.trim(), itemName: values.itemName.trim(), sku: values.itemCode.trim().toUpperCase(), code: values.itemCode.trim().toUpperCase(),
      brand: values.brand, category: values.mainGroup, subGroup: values.subGroup, categoryPath: values.categoryPath, description: values.description.trim(),
      gender: values.gender, season: values.season, fabric: values.fabric, fabricType: values.type, hsnCodeId: values.hsnCodeId, gstSlabId: values.gstSlabId,
      shadeColor: values.shadeColor, uom: values.uom, skuPrefix: values.skuPrefix, pattern: values.pattern, fit: values.fit, sleeveType: values.sleeveType, neckType: values.neckType, occasion: values.occasion, materialComposition: values.materialComposition, notes: values.notes,
      defaultWarehouse: values.defaultWarehouse, reorderLevel: Number(values.reorderLevel || 0), reorderQty: Number(values.reorderQty || 0), openingStock: Number(values.openingStock || 0), openingStockRate: Number(values.openingStockRate || 0), stockTrackingEnabled: values.stockTrackingEnabled, barcodeEnabled: values.barcodeEnabled,
      images: images.filter(Boolean).map((img) => img.preview || img), status: statusOverride,
      variants: variants.map((variant) => ({ ...variant, salePrice: Number(variant.salePrice || variant.sellingPrice || 0), sellingPrice: Number(variant.salePrice || variant.sellingPrice || 0), costPrice: Number(variant.costPrice || 0), mrp: Number(variant.mrp || 0), stock: Number(variant.stock || 0), factoryStock: Number(variant.stock || 0) })),
    };
    if (isEditMode) dispatch(updateItem({ id, item: payload })); else dispatch(addItem(payload));
    if (stay) { setSuccessMessage(`Item ${statusOverride} saved in frontend.`); return; }
    navigate('/items');
  };

  const fields = {
    basic: [['itemCode', 'Item Code *'], ['itemName', 'Item Name *'], ['shadeColor', 'Shade / Color'], ['uom', 'UOM'], ['skuPrefix', 'SKU Prefix']],
    attrs: [['fabric', 'Fabric'], ['type', 'Type'], ['pattern', 'Pattern'], ['fit', 'Fit'], ['sleeveType', 'Sleeve Type'], ['neckType', 'Neck Type'], ['gender', 'Gender'], ['season', 'Season'], ['occasion', 'Occasion'], ['materialComposition', 'Material Composition']],
  };

  if (isEditMode && !existingItem) return <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}><Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Item not found</Typography><Button variant="contained" onClick={() => navigate('/items')}>Back to Item List</Button></Paper>;

  return (
    <Box component="form" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <PageHeader
        title={isViewMode ? 'Item Details' : isEditMode ? 'Edit Item' : 'Add Item'}
        subtitle="Build a garment item with attributes, group allocation, variant pricing, media, and inventory defaults."
        breadcrumbs={[{ label: 'Items' }, { label: isViewMode ? 'View Item' : isEditMode ? 'Edit Item' : 'Add Item', active: true }]}
        actions={[
          <Button key="back" variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/items')}>Back</Button>,
          !isViewMode ? <Button key="draft" variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, 'Draft', true))}>Save Draft</Button> : null,
          !isViewMode ? <Button key="save" variant="contained" startIcon={<TaskAltOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, values.status))}>Save Item</Button> : null,
        ].filter(Boolean)}
      />
      {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}
      {variantError ? <Alert severity="warning" sx={{ mb: 2 }}>{variantError}</Alert> : null}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, pt: 1, borderBottom: '1px solid #e2e8f0' }}>
          {tabs.map(([value, label]) => <Tab key={value} value={value} label={label} />)}
        </Tabs>
        <Box sx={{ p: 3 }}>
          {activeTab === 'basic' ? <FormSection title="Basic Info" subtitle="Style-level information and tax setup."><Grid container spacing={2}>
            {fields.basic.map(([key, label]) => <Grid key={key} item xs={12} md={key === 'itemName' ? 6 : 3}><TextField fullWidth size="small" label={label} {...register(key, { required: key === 'itemCode' || key === 'itemName' ? `${label} is required.` : false })} error={Boolean(errors[key])} helperText={errors[key]?.message || ' '} disabled={isViewMode} /></Grid>)}
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="Brand" {...register('brand')} disabled={isViewMode}><MenuItem value="">Select Brand</MenuItem>{brands.map((brand) => <MenuItem key={brand.id || brand._id} value={brand.id || brand._id}>{brand.brandName || brand.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="HSN Code *" {...register('hsnCodeId', { required: 'HSN Code is required.' })} error={Boolean(errors.hsnCodeId)} helperText={errors.hsnCodeId?.message || ' '} disabled={isViewMode}><MenuItem value="">Select HSN</MenuItem>{hsnCodes.map((hsn) => <MenuItem key={hsn.id} value={hsn.id}>{hsn.hsnCode} - {hsn.description}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="GST" {...register('gstSlabId')} disabled={isViewMode}><MenuItem value="">Select GST</MenuItem>{gstSlabs.map((slab) => <MenuItem key={slab._id || slab.id} value={slab._id || slab.id}>{slab.name} ({slab.percentage}%)</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="Status" {...register('status')} disabled={isViewMode}><MenuItem value="Active">Active</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline minRows={3} {...register('description')} disabled={isViewMode} /></Grid>
          </Grid></FormSection> : null}
          {activeTab === 'attributes' ? <FormSection title="Attributes" subtitle="Garment descriptors used in search, reporting, and variants."><Grid container spacing={2}>{fields.attrs.map(([key, label]) => <Grid key={key} item xs={12} md={key === 'materialComposition' ? 6 : 3}><TextField fullWidth size="small" label={label} {...register(key)} disabled={isViewMode} /></Grid>)}<Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline minRows={3} {...register('notes')} disabled={isViewMode} /></Grid></Grid></FormSection> : null}
          {activeTab === 'groups' ? <FormSection title="Group Allocation" subtitle="Allocate the item to the configured garment hierarchy."><Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="Main Group *" {...register('mainGroup', { required: 'Main group is required.' })} error={Boolean(errors.mainGroup)} helperText={errors.mainGroup?.message || ' '} disabled={isViewMode}><MenuItem value="">Select Main Group</MenuItem>{(itemGroups.length ? itemGroups : groupSeed).map((group) => <MenuItem key={group.id || group._id} value={group.id || group._id}>{group.groupName || group.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="Sub Group" {...register('subGroup')} disabled={isViewMode}><MenuItem value="">Select Sub Group</MenuItem>{(itemGroups.length ? itemGroups : groupSeed).map((group) => <MenuItem key={`sub-${group.id || group._id}`} value={group.id || group._id}>{group.groupName || group.name}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Category Path" placeholder="T-Shirt > Cotton" {...register('categoryPath')} disabled={isViewMode} /></Grid>
          </Grid></FormSection> : null}
          {activeTab === 'pricing' ? <VariantTable variants={variants} onChange={(updated) => { setVariantError(''); setVariants(updated); }} styleCode={styleCode || 'ITEM'} readOnly={isViewMode} /> : null}
          {activeTab === 'preview' ? <FormSection title="Variants / SKU Preview" subtitle="Review generated rows before final save."><TableContainer><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Size</TableCell><TableCell sx={{ fontWeight: 700 }}>Color</TableCell><TableCell sx={{ fontWeight: 700 }} align="right">Cost</TableCell><TableCell sx={{ fontWeight: 700 }} align="right">Sale</TableCell><TableCell sx={{ fontWeight: 700 }} align="right">MRP</TableCell><TableCell sx={{ fontWeight: 700 }}>Barcode Prefix</TableCell><TableCell sx={{ fontWeight: 700 }}>SKU</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell></TableRow></TableHead><TableBody>{variants.map((variant) => <TableRow key={variant.id}><TableCell>{variant.size}</TableCell><TableCell>{variant.color}</TableCell><TableCell align="right">{variant.costPrice}</TableCell><TableCell align="right">{variant.salePrice}</TableCell><TableCell align="right">{variant.mrp}</TableCell><TableCell>{variant.barcodePrefix || watch('skuPrefix') || watch('itemCode')}</TableCell><TableCell>{variant.sku}</TableCell><TableCell>{variant.status}</TableCell></TableRow>)}{!variants.length ? <TableRow><TableCell colSpan={8} sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>No variant rows added yet.</TableCell></TableRow> : null}</TableBody></Table></TableContainer></FormSection> : null}
          {activeTab === 'media' ? <FormSection title="Media" subtitle="Frontend-ready image slots for item presentation."><Grid container spacing={2}>{images.map((img, index) => <Grid item xs={12} sm={6} md={4} key={index}><Paper elevation={0} sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 1.5, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>{uploadingImage === index ? <CircularProgress size={32} /> : img?.preview ? <><Box component="img" src={img.preview} sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 1 }} />{!isViewMode ? <Button size="small" color="error" variant="contained" onClick={() => removeImage(index)} sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, px: 1 }}>X</Button> : null}</> : <Button component="label" sx={{ textTransform: 'none', color: '#64748b' }} disabled={isViewMode}><Stack spacing={1} sx={{ alignItems: 'center' }}><UploadFileIcon sx={{ fontSize: 32 }} /><Typography variant="body2" sx={{ fontWeight: 700 }}>{index === 0 ? 'Main Image' : `Additional Image ${index}`}</Typography></Stack><input hidden type="file" accept="image/*" onChange={handleImageChange(index)} /></Button>}</Paper></Grid>)}</Grid></FormSection> : null}
          {activeTab === 'inventory' ? <FormSection title="Inventory Defaults" subtitle="Defaults used by warehouse operations, barcode printing, and replenishment."><Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" select label="Default Warehouse" {...register('defaultWarehouse')} disabled={isViewMode}><MenuItem value="">Select Warehouse</MenuItem>{warehouses.map((warehouse) => <MenuItem key={warehouse.id || warehouse._id} value={warehouse.id || warehouse._id}>{warehouse.warehouseName || warehouse.name}</MenuItem>)}</TextField></Grid>
            {['reorderLevel', 'reorderQty', 'openingStock', 'openingStockRate'].map((key) => <Grid item xs={12} md={2} key={key}><TextField fullWidth size="small" type="number" label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} {...register(key)} disabled={isViewMode} /></Grid>)}
            <Grid item xs={12} md={4}><Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}><FormControlLabel control={<Switch checked={watch('stockTrackingEnabled')} onChange={(e) => setValue('stockTrackingEnabled', e.target.checked)} disabled={isViewMode} />} label="Stock Tracking Enabled" /><FormControlLabel control={<Switch checked={watch('barcodeEnabled')} onChange={(e) => setValue('barcodeEnabled', e.target.checked)} disabled={isViewMode} />} label="Barcode Enabled" /></Paper></Grid>
          </Grid></FormSection> : null}
        </Box>
      </Paper>
      {!isViewMode ? <Paper elevation={0} sx={{ position: 'sticky', bottom: 0, border: '1px solid #e2e8f0', borderRadius: 2, p: 2, bgcolor: '#fff' }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}><Button variant="outlined" onClick={() => navigate('/items')}>Cancel</Button><Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, 'Draft', true))}>Save Draft</Button><Button variant="contained" startIcon={<TaskAltOutlinedIcon />} onClick={handleSubmit((values) => onSubmit(values, values.status))}>Save Item</Button></Stack></Paper> : null}
    </Box>
  );
}

export default ItemFormPage;
