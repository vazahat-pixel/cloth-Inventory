import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { deleteItem, fetchItems } from './itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
import itemsExportColumns from '../../config/exportColumns/items';
import BulkItemUploadDialog from './components/BulkItemUploadDialog';
import api from '../../services/api';

const flattenItemToRows = (item, brands = [], hsnCodes = []) => {
  const brandId = item.brand?._id || item.brand?.id || item.brand;
  const brandFromMaster = brands.find((b) => String(b._id || b.id) === String(brandId));
  const hsnId = item.hsCodeId?._id || item.hsCodeId?.id || item.hsCodeId;
  const hsnFromMaster = hsnCodes.find((h) => String(h._id || h.id) === String(hsnId));
  const section = item.sectionId?.groupName || item.sectionId?.name || item.sectionName || '';
  const category = item.categoryId?.groupName || item.categoryId?.name || item.categoryName || '';
  const subCategory = item.subCategoryId?.groupName || item.subCategoryId?.name || '';
  const mainGroup = section || category || (item.groupIds?.find((g) => g.groupType === 'Section' || g.groupType === 'Category')?.name) || '--';
  const subGroup = subCategory || (item.groupIds?.find((g) => g.groupType === 'Sub Category')?.name) || '--';
  
  const baseItemInfo = {
    parentId: item.id || item._id,
    itemCode: item.itemCode || item.code || '',
    itemName: item.itemName || item.name || '',
    brand: (
      item.brand?.brandName || item.brand?.name || item.brandName || brandFromMaster?.brandName || brandFromMaster?.name || 'UNSPECIFIED'
    ),
    fabric: item.fabric || '--',
    pattern: item.pattern || '--',
    fit: item.fit || '--',
    gender: item.gender || '--',
    type: item.type || '--',
    mainGroup,
    subGroup,
    hsnCode: (
      item.hsCodeId?.code || item.hsCodeId?.hsnCode || item.hsnCode || hsnFromMaster?.code || hsnFromMaster?.hsnCode || '--'
    ),
    gstRate: item.hsCodeId?.gstPercent !== undefined ? `${item.hsCodeId.gstPercent}%` : (hsnFromMaster?.gstPercent !== undefined ? `${hsnFromMaster.gstPercent}%` : (item.gstPercent ? `${item.gstPercent}%` : '--')),
    status: item.status || 'Active',
    season: item.season || '--',
    occasion: item.occasion || '--',
  };

  const sizes = Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : [{}];

  return sizes.map((variant) => ({
    ...baseItemInfo,
    id: variant._id || variant.id || baseItemInfo.parentId,
    size: variant.size || '--',
    color: variant.color || item.color || item.shadeNo || '--',
    sku: variant.sku || variant.barcode || baseItemInfo.itemCode || '--',
    costPrice: variant.costPrice || item.costPrice,
    salePrice: variant.salePrice || item.salePrice,
    mrp: variant.mrp || item.mrp,
  }));
};

const toExportRows = (rows) => rows.map((row) => ({
  item_code: row.itemCode, item_name: row.itemName, brand: row.brand, hsn_code: row.hsnCode, gst_rate: row.gstRate, color: row.color, fabric: row.fabric, pattern: row.pattern, fit: row.fit, gender: row.gender, season: row.season, occasion: row.occasion, main_group: row.mainGroup, sub_group: row.subGroup, size: row.sizes || row.size, cost_price: row.costPrice, sale_price: row.salePrice, mrp: row.mrp, sku: row.sku, status: row.status,
}));

function ItemListPage() {
  const navigate = useAppNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { records: items, total, loading } = useSelector((state) => state.items);
  const brands = useSelector((state) => state.masters?.brands || []);
  const hsnCodes = useSelector((state) => state.masters?.hsnCodes || []);
  
  const restoredListState = location.state?.listState;
  const [searchText, setSearchText] = useState(restoredListState?.searchText ?? '');
  const debouncedSearch = useDebouncedValue(searchText, 350);
  const [brandFilter, setBrandFilter] = useState(restoredListState?.brandFilter ?? 'all');
  const [groupFilter, setGroupFilter] = useState(restoredListState?.groupFilter ?? 'all');
  const [viewMode, setViewMode] = useState(restoredListState?.viewMode ?? 'table');
  const [page, setPage] = useState(restoredListState?.page ?? 0);
  const [rowsPerPage, setRowsPerPage] = useState(restoredListState?.rowsPerPage ?? 20);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const listState = useMemo(() => ({
    page, rowsPerPage, searchText, brandFilter, groupFilter, viewMode,
  }), [page, rowsPerPage, searchText, brandFilter, groupFilter, viewMode]);

  const goToItem = (path) => navigate(path, { state: { listState } });

  useEffect(() => {
    dispatch(fetchItems({ 
      page: page + 1, 
      limit: rowsPerPage, 
      search: debouncedSearch,
      brand: brandFilter,
      section: groupFilter
    }));
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('hsnCodes'));
  }, [dispatch, page, rowsPerPage, debouncedSearch, brandFilter, groupFilter]);

  const groups = useSelector((state) => state.masters?.itemGroups || []);

  const rows = useMemo(() => {
    const itemsArray = Array.isArray(items) ? items : [];
    const flattened = itemsArray.flatMap((item) => flattenItemToRows(item, brands, hsnCodes));
    
    if (!debouncedSearch) return flattened;
    const lowerSearch = debouncedSearch.toLowerCase();
    return flattened.filter(row => 
      (row.sku && row.sku.toLowerCase().includes(lowerSearch)) ||
      (row.itemCode && row.itemCode.toLowerCase().includes(lowerSearch)) ||
      (row.itemName && row.itemName.toLowerCase().includes(lowerSearch))
    );
  }, [items, brands, hsnCodes, debouncedSearch]);

  const paginatedRows = rows;

  const loadExportRows = async () => {
    const response = await api.get('/items', {
      params: {
        page: 1,
        limit: 20000,
        forReport: true,
        search: debouncedSearch || undefined,
        brand: brandFilter !== 'all' ? brandFilter : undefined,
        section: groupFilter !== 'all' ? groupFilter : undefined,
      },
    });
    const resData = response.data.data || response.data || {};
    const raw = resData.items || resData.records || [];
    const records = Array.isArray(raw) ? raw : (raw.items || []);
    return toExportRows(records.map((item) => mapItemToRow(item, brands, hsnCodes)));
  };

  return (
    <div>
      <PageHeader
        title="Unified Item Master"
        subtitle="One central registry for Men's Wear, Belts, Ties, and Wallets."
        breadcrumbs={[{ label: 'Items', active: true }]}
        actions={[
          <Button key="bulk-upload" variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => setBulkDialogOpen(true)} sx={{ color: '#6366f1', borderColor: '#6366f1', fontWeight: 700 }}>Bulk Upload</Button>,
          <ExportButton key="export" rows={[]} loadRows={loadExportRows} columns={itemsExportColumns} filename="unified_item_master" sheetName="Items" />,
          <Button key="add" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => goToItem('/items/new')} sx={{ bgcolor: '#d946ef', px: 3, fontWeight: 700 }}>Add New Item</Button>,
        ]}
      />

      <BulkItemUploadDialog 
        open={bulkDialogOpen} 
        onClose={() => setBulkDialogOpen(false)} 
        onUploadSuccess={() => dispatch(fetchItems())} 
      />

      <FilterBar sx={{ mb: 2, mt: 1 }}>
        <TextField size="small" value={searchText} onChange={(e) => { setPage(0); setSearchText(e.target.value); }} placeholder="Search code, name, HSN..." sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <TextField size="small" select label="Brand" value={brandFilter} onChange={(e) => { setPage(0); setBrandFilter(e.target.value); }} sx={{ minWidth: 160 }}><MenuItem value="all">All Brands</MenuItem>{brands.map((brand) => <MenuItem key={brand.id || brand._id} value={brand.brandName || brand.name}>{brand.brandName || brand.name}</MenuItem>)}</TextField>
        <TextField size="small" select label="Section/Group" value={groupFilter} onChange={(e) => { setPage(0); setGroupFilter(e.target.value); }} sx={{ minWidth: 180 }}><MenuItem value="all">All Sections</MenuItem>{groups.filter(g => g.groupType === 'Section').map((group) => <MenuItem key={group.id || group._id} value={group.groupName || group.name}>{group.groupName || group.name}</MenuItem>)}</TextField>
        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, value) => value && setViewMode(value)}>
          <ToggleButton value="table"><TableRowsRoundedIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="cards"><GridViewRoundedIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </FilterBar>

      {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      {viewMode === 'cards' ? (
        <>
        <Grid container spacing={2}>
          {paginatedRows.map((row) => (
            <Grid key={row.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, transition: 'all 0.2s', '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.05)', transform: 'translateY(-2px)' } }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box><Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>{row.itemName}</Typography><Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{row.itemCode}</Typography></Box>
                      <StatusBadge value={row.status} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>{row.brand} • {row.mainGroup || 'Unassigned'} • {row.color || 'No Color'}</Typography>
                    <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, display: 'flex', gap: 2 }}>
                       <Typography variant="caption" sx={{ color: '#64748b' }}>HSN <b>{row.hsnCode}</b></Typography>
                       <Typography variant="caption" sx={{ color: '#64748b' }}>Sizes <b>{row.sizes}</b></Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" color="info" onClick={() => goToItem(`/items/view/${row.id}`)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="primary" onClick={() => goToItem(`/items/edit/${row.id}`)}><EditOutlinedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => dispatch(deleteItem(row.id))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[20, 50, 100]}
        />
        </>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />}
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow>
                <TableCell sx={{ fontWeight: 700 }}>SKU / Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Brand</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>HSN</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>GST</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#6366f1' }}>
                      {row.sku && row.sku !== '--' ? row.sku : row.itemCode}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                    <TableCell>{row.brand}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.size}</TableCell>
                    <TableCell>{row.color}</TableCell>
                    <TableCell><b>{row.hsnCode}</b></TableCell>
                    <TableCell>{row.mainGroup}</TableCell>
                    <TableCell>{row.gstRate}</TableCell>
                    <TableCell><StatusBadge value={row.status} /></TableCell>
                    <TableCell align="right">
                        <IconButton size="small" color="info" onClick={() => goToItem(`/items/view/${row.parentId}`)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="primary" onClick={() => goToItem(`/items/edit/${row.parentId}`)}><EditOutlinedIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !paginatedRows.length ? <TableRow><TableCell colSpan={9} sx={{ py: 10, textAlign: 'center', color: '#64748b' }}>No items found.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[20, 50, 100]} />
        </Paper>
      )}
    </div>
  );
}

export default ItemListPage;
