import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Autocomplete,
  Tooltip,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { fetchPromotionGroups, addPromotionGroup, updatePromotionGroup } from './pricingSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

function PromotionGroupPage() {
  const dispatch = useDispatch();
  const groups = useSelector((state) => state.pricing.promotionGroups || []);
  const masters = useSelector((state) => state.masters || {});
  const items = useSelector((state) => state.items.records || []);

  const categories = useMemo(() => {
    const unique = new Map();
    
    // 1. Add from Masters (Categories and Item Groups)
    const masterList = [...(masters.categories || []), ...(masters.itemGroups || [])];
    masterList.forEach(c => {
      const id = String(c._id || c.id || '');
      if (id && !unique.has(id)) {
        unique.set(id, { ...c, _id: id, id: id, name: c.name || c.groupName || c.categoryName || c.label });
      }
    });

    // 2. Extract from Items (Aggressive extraction from all possible fields)
    items.forEach(item => {
      // Check all possible category/group fields
      const possibleCats = [
        { val: item.categoryId, name: item.categoryName },
        { val: item.sectionId, name: item.sectionName },
        { val: item.itemGroup, name: item.itemGroupName },
        { val: item.category, name: item.categoryName }
      ];

      possibleCats.forEach(catObj => {
        const cat = catObj.val;
        const fallbackName = catObj.name;
        
        if (cat) {
            const id = String(cat._id || cat.id || cat);
            if (id && id !== 'undefined' && id !== 'null' && !unique.has(id)) {
                const name = typeof cat === 'object' ? (cat.name || cat.groupName || fallbackName) : (fallbackName || id);
                if (name && name !== 'undefined' && name !== 'null') {
                    unique.set(id, { _id: id, id: id, name: name });
                }
            }
        } else if (fallbackName && fallbackName !== 'undefined' && fallbackName !== 'null') {
            // Use name as ID if no ID is present
            if (!unique.has(fallbackName)) {
                unique.set(fallbackName, { _id: fallbackName, id: fallbackName, name: fallbackName });
            }
        }
      });
    });
    
    return Array.from(unique.values()).filter(c => c.name);
  }, [masters.categories, masters.itemGroups, items]);

  const brands = useMemo(() => {
    const unique = new Map();

    // 1. Add from Masters
    const masterList = masters.brands || [];
    masterList.forEach(b => {
      const id = String(b._id || b.id || '');
      if (id && !unique.has(id)) {
        unique.set(id, { ...b, _id: id, id: id, name: b.name || b.brandName || b.label });
      }
    });

    // 2. Extract from Items
    items.forEach(item => {
      const b = item.brandId || item.brand;
      const bName = item.brandName;

      if (b) {
        const id = String(b._id || b.id || b);
        if (id && id !== 'undefined' && id !== 'null' && !unique.has(id)) {
          const name = typeof b === 'object' ? (b.name || b.brandName || bName) : (bName || id);
          if (name && name !== 'undefined' && name !== 'null') {
            unique.set(id, { _id: id, id: id, name: name });
          }
        }
      } else if (bName && bName !== 'undefined' && bName !== 'null') {
        if (!unique.has(bName)) {
          unique.set(bName, { _id: bName, id: bName, name: bName });
        }
      }
    });

    return Array.from(unique.values()).filter(b => b.name);
  }, [masters.brands, items]);

  const [open, setOpen] = useState(false);
  const filteredResultsRef = useRef({ categories: [], brands: [], products: [] });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    applicableCategories: [],
    applicableBrands: [],
    applicableProducts: []
  });

  const handleCategoryChange = (newCategoryIds) => {
    const currentCats = formData.applicableCategories || [];
    const currentProds = formData.applicableProducts || [];

    const added = newCategoryIds.filter(id => !currentCats.includes(id));
    const removed = currentCats.filter(id => !newCategoryIds.includes(id));

    let updatedProds = [...currentProds];

    if (added.length > 0) {
      items.forEach(item => {
        const cat = item.categoryId || item.category;
        const catId = cat ? String(cat._id || cat.id || cat) : null;
        const catName = item.categoryName;
        
        if ((catId && added.includes(catId)) || (catName && added.includes(catName))) {
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
        const catName = item.categoryName;

        if ((catId && removed.includes(catId)) || (catName && removed.includes(catName))) {
          const itemId = String(item._id || item.id);
          updatedProds = updatedProds.filter(id => id !== itemId);
        }
      });
    }

    setFormData(prev => ({
      ...prev,
      applicableCategories: newCategoryIds,
      applicableProducts: updatedProds
    }));
  };

  const filteredProducts = useMemo(() => {
    if (!formData.applicableCategories || formData.applicableCategories.length === 0) {
      return items;
    }
    
    return items.filter(item => {
      const cat = item.categoryId || item.category;
      const catId = cat ? String(cat._id || cat.id || cat) : null;
      const catName = item.categoryName;

      return (catId && formData.applicableCategories.includes(catId)) ||
             (catName && formData.applicableCategories.includes(catName));
    });
  }, [items, formData.applicableCategories]);

  useEffect(() => {
    dispatch(fetchPromotionGroups());
    dispatch(fetchMasters('categories'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('brands'));
    dispatch(fetchItems({ limit: 1000 }));
  }, [dispatch]);

  const handleEdit = (group) => {
    setFormData({
        _id: group._id,
        name: group.name,
        description: group.description || '',
        applicableCategories: group.applicableCategories || [],
        applicableBrands: group.applicableBrands || [],
        applicableProducts: group.applicableProducts || []
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ name: '', description: '', applicableCategories: [], applicableBrands: [], applicableProducts: [] });
  };

  const handleSubmit = () => {
    if (formData._id) {
        dispatch(updatePromotionGroup({ id: formData._id, updates: formData })).unwrap().then(() => {
            handleClose();
        });
    } else {
        dispatch(addPromotionGroup(formData)).unwrap().then(() => {
            handleClose();
        });
    }
  };

  const getFiltered = (list, search, type) => {
    if (!search || !search.trim()) return [];
    const s = search.toLowerCase();
    return (list || []).filter(item => {
        if (!item) return false;
        let label = '';
        if (type === 'product') {
            label = `${item.itemName || item.name || ''} (${item.itemCode || item.sku || ''})`;
        } else {
            label = item.name || item.groupName || item.categoryName || item.brandName || item.label || '';
        }
        return label.toLowerCase().includes(s);
    });
  };


  const handleSelectBatch = (field, list) => {
    const current = [...formData[field]];
    const newIds = [...current];
    list.forEach(item => {
        const id = String(item.id || item._id);
        if (!newIds.includes(id)) newIds.push(id);
    });
    
    if (field === 'applicableCategories') {
        handleCategoryChange(newIds);
    } else {
        setFormData(prev => ({ ...prev, [field]: newIds }));
    }
  };

  const getOptionLabel = (option) => {
    if (!option) return '';
    return option.name || option.groupName || option.categoryName || option.brandName || option.label || '';
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>Promotion Groups</Typography>
          <Typography variant="body1" color="textSecondary">Create dynamic product sets to apply prioritized offers and discounts.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2, px: 3, fontWeight: 700, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        >
          Create New Group
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {groups.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: 'transparent' }} elevation={0}>
              <Typography variant="h6" color="textSecondary">No promotion groups defined yet.</Typography>
              <Button sx={{ mt: 2 }} onClick={() => setOpen(true)}>Create your first group</Button>
            </Paper>
          </Grid>
        ) : groups.map((group) => (
          <Grid item xs={12} md={4} key={group._id}>
            <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', transition: 'all 0.2s', '&:hover': { boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', borderColor: '#cbd5e1' } }} elevation={0}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{group.name}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>{group.description || 'No description provided'}</Typography>
                </Box>
                <IconButton size="small" onClick={() => handleEdit(group)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {group.applicableCategories?.length > 0 && (
                  <Chip label={`${group.applicableCategories.length} Categories`} size="small" sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8', border: 'none' }} />
                )}
                {group.applicableBrands?.length > 0 && (
                  <Chip label={`${group.applicableBrands.length} Brands`} size="small" sx={{ fontWeight: 700, bgcolor: '#f5f3ff', color: '#6d28d9', border: 'none' }} />
                )}
                {group.applicableProducts?.length > 0 && (
                  <Chip label={`${group.applicableProducts.length} Products`} size="small" sx={{ fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d', border: 'none' }} />
                )}
                {!group.applicableCategories?.length && !group.applicableBrands?.length && !group.applicableProducts?.length && (
                  <Chip label="Empty Group" size="small" variant="outlined" />
                )}
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 900, px: 3, pt: 3 }}>
            {formData._id ? 'Edit Promotion Group' : 'Create Promotion Group'}
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Basic Info</Typography>
                <TextField fullWidth label="Group Name" placeholder="e.g. Summer Collection, Premium Brands" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Box>
            
            <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>Inclusion Criteria</Typography>
                    <Tooltip title="Products matching ANY of the selected categories, brands, or specific items will be part of this group.">
                        <HelpOutlineIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                    </Tooltip>
                </Stack>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1, display: 'block' }}>Included Categories / Groups</Typography>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={categories}
                            getOptionLabel={getOptionLabel}
                            value={categories.filter(c => formData.applicableCategories.includes(String(c.id || c._id)))}
                            isOptionEqualToValue={(option, value) => String(option.id || option._id) === String(value.id || value._id)}
                            filterOptions={(options, params) => {
                                const filtered = options.filter(option => 
                                    getOptionLabel(option).toLowerCase().includes(params.inputValue.toLowerCase())
                                );
                                if (params.inputValue.trim() && filtered.length > 0) {
                                    return [{ isSelectAll: true, label: `SELECT ALL FOUND (${filtered.length})`, items: filtered }, ...filtered];
                                }
                                return filtered;
                            }}
                            onChange={(_, v) => {
                                const selectAll = v.find(i => i.isSelectAll);
                                if (selectAll) {
                                    handleSelectBatch('applicableCategories', selectAll.items);
                                } else {
                                    handleCategoryChange(v.map(i => String(i.id || i._id || i)));
                                }
                            }}
                            renderOption={(props, option, { selected }) => {
                                if (option.isSelectAll) {
                                    return (
                                        <li {...props} key="select-all-cat" style={{ fontWeight: 900, color: '#2563eb', backgroundColor: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
                                            <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                                            {option.label}
                                        </li>
                                    );
                                }
                                return (
                                    <li {...props} key={option.id || option._id}>
                                        <Checkbox
                                            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                            checkedIcon={<CheckBoxIcon fontSize="small" />}
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {getOptionLabel(option)}
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Select Categories" 
                                    placeholder="Search categories..." 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            )}
                        />
                    </Box>
                    
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1, display: 'block' }}>Included Brands</Typography>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={brands}
                            getOptionLabel={getOptionLabel}
                            value={brands.filter(b => formData.applicableBrands.includes(String(b.id || b._id)))}
                            isOptionEqualToValue={(option, value) => String(option.id || option._id) === String(value.id || value._id)}
                            filterOptions={(options, params) => {
                                const filtered = options.filter(option => 
                                    getOptionLabel(option).toLowerCase().includes(params.inputValue.toLowerCase())
                                );
                                if (params.inputValue.trim() && filtered.length > 0) {
                                    return [{ isSelectAll: true, label: `SELECT ALL FOUND (${filtered.length})`, items: filtered }, ...filtered];
                                }
                                return filtered;
                            }}
                            onChange={(_, v) => {
                                const selectAll = v.find(i => i.isSelectAll);
                                if (selectAll) {
                                    handleSelectBatch('applicableBrands', selectAll.items);
                                } else {
                                    setFormData(prev => ({ ...prev, applicableBrands: v.map(i => String(i.id || i._id || i)) }));
                                }
                            }}
                            renderOption={(props, option, { selected }) => {
                                if (option.isSelectAll) {
                                    return (
                                        <li {...props} key="select-all-brand" style={{ fontWeight: 900, color: '#2563eb', backgroundColor: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
                                            <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                                            {option.label}
                                        </li>
                                    );
                                }
                                return (
                                    <li {...props} key={option.id || option._id}>
                                        <Checkbox
                                            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                            checkedIcon={<CheckBoxIcon fontSize="small" />}
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {getOptionLabel(option)}
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Select Brands" 
                                    placeholder="Search brands..." 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            )}
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1, display: 'block' }}>Specific Products ({formData.applicableProducts?.length || 0} selected)</Typography>
                        <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={filteredProducts}
                            getOptionLabel={(o) => o.isSelectAll ? o.label : `${o.itemName || o.name || ''} (${o.itemCode || o.sku || ''})`}
                            value={items.filter(i => formData.applicableProducts.includes(String(i.id || i._id)))}
                            isOptionEqualToValue={(option, value) => String(option.id || option._id) === String(value.id || value._id)}
                            filterOptions={(options, params) => {
                                const filtered = options.filter(option => {
                                    const label = `${option.itemName || option.name || ''} (${option.itemCode || option.sku || ''})`.toLowerCase();
                                    return label.includes(params.inputValue.toLowerCase());
                                });
                                if (params.inputValue.trim() && filtered.length > 0) {
                                    return [{ isSelectAll: true, label: `SELECT ALL FOUND (${filtered.length})`, items: filtered }, ...filtered];
                                }
                                return filtered;
                            }}
                            onChange={(_, v) => {
                                const selectAll = v.find(i => i.isSelectAll);
                                if (selectAll) {
                                    handleSelectBatch('applicableProducts', selectAll.items);
                                } else {
                                    setFormData(prev => ({ ...prev, applicableProducts: v.map(i => String(i.id || i._id || i)) }));
                                }
                            }}
                            renderOption={(props, option, { selected }) => {
                                if (option.isSelectAll) {
                                    return (
                                        <li {...props} key="select-all-prod" style={{ fontWeight: 900, color: '#2563eb', backgroundColor: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
                                            <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                                            {option.label}
                                        </li>
                                    );
                                }
                                return (
                                    <li {...props} key={option.id || option._id}>
                                        <Checkbox
                                            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                            checkedIcon={<CheckBoxIcon fontSize="small" />}
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {`${option.itemName || option.name || ''} (${option.itemCode || option.sku || ''})`}
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Search & Select Products" 
                                    placeholder="Type SKU or Name..." 
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            )}
                        />
                    </Box>
                </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} sx={{ fontWeight: 700, color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!formData.name} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
            {formData._id ? 'Update Group' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PromotionGroupPage;
