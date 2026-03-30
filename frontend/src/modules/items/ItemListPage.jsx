import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Card, CardContent, Grid, IconButton, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { deleteItem, fetchItems } from './itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
import itemsExportColumns from '../../config/exportColumns/items';

const toExportRows = (rows) => rows.map((row) => ({
  item_code: row.itemCode, item_name: row.itemName, brand: row.brand, hsn_code: row.hsnCode, gst_rate: row.gstRate, color: row.color, fabric: row.fabric, type: row.type, pattern: row.pattern, fit: row.fit, sleeve_type: row.sleeveType, neck_type: row.neckType, gender: row.gender, season: row.season, occasion: row.occasion, material_composition: row.materialComposition, main_group: row.mainGroup, sub_group: row.subGroup, category_path: row.categoryPath, size: row.size, cost_price: row.costPrice, sale_price: row.salePrice, mrp: row.mrp, sku: row.sku, default_warehouse: row.defaultWarehouse, reorder_level: row.reorderLevel, reorder_qty: row.reorderQty, opening_stock: row.openingStock, opening_stock_rate: row.openingStockRate, status: row.status,
}));

function ItemListPage() {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.items.records);
  const brands = useSelector((state) => state.masters?.brands || []);
  const groups = useSelector((state) => state.masters?.itemGroups || []);
  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [hsnFilter, setHsnFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
  }, [dispatch]);

  const rows = useMemo(() => items.map((item) => ({
    id: item.id || item._id,
    itemCode: item.code || item.sku || '',
    itemName: item.name || item.itemName || '',
    brand: item.brand?.brandName || item.brand?.name || item.brand || '',
    mainGroup: item.category?.groupName || item.category?.name || item.category || '',
    subGroup: item.subGroup || '',
    categoryPath: item.categoryPath || '',
    hsnCode: item.hsnCodeId?.code || item.hsnCodeId?.hsnCode || item.hsnCode || '',
    gstRate: item.gstSlabId?.percentage || item.gstRate || '',
    color: item.color || item.shadeColor || '',
    fabric: item.fabric || item.attributes?.fabric || '',
    type: item.fabricType || item.type || '',
    pattern: item.pattern || '',
    fit: item.fit || '',
    sleeveType: item.sleeveType || '',
    neckType: item.neckType || '',
    gender: item.gender || item.attributes?.gender || '',
    season: item.season || item.attributes?.season || '',
    occasion: item.occasion || '',
    materialComposition: item.materialComposition || '',
    size: item.size || '',
    costPrice: item.costPrice || 0,
    salePrice: item.salePrice || item.sellingPrice || 0,
    mrp: item.mrp || item.salePrice || 0,
    sku: item.sku || '',
    defaultWarehouse: item.defaultWarehouse || '',
    reorderLevel: item.reorderLevel || 0,
    reorderQty: item.reorderQty || 0,
    openingStock: item.openingStock || item.factoryStock || 0,
    openingStockRate: item.openingStockRate || 0,
    variantCount: item.variants?.length || 1,
    status: item.status || 'Active',
  })), [items]);

  const hsnOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.hsnCode).filter(Boolean))), [rows]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query ? [row.itemCode, row.itemName, row.brand, row.color].some((value) => String(value).toLowerCase().includes(query)) : true;
      const matchesBrand = brandFilter === 'all' ? true : row.brand === brandFilter;
      const matchesGroup = groupFilter === 'all' ? true : row.mainGroup === groupFilter;
      const matchesHsn = hsnFilter === 'all' ? true : row.hsnCode === hsnFilter;
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesBrand && matchesGroup && matchesHsn && matchesStatus;
    });
  }, [brandFilter, groupFilter, hsnFilter, rows, searchText, statusFilter]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredRows, page, rowsPerPage]);
  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  return (
    <div>
      <PageHeader
        title="Items"
        subtitle="Manage garment styles, group allocation, HSN mapping, variant pricing, and inventory-ready item defaults."
        breadcrumbs={[{ label: 'Items', active: true }]}
        actions={[
          <ExportButton key="export" rows={exportRows} columns={itemsExportColumns} filename="items.xlsx" sheetName="Items" />,
          <Button key="add" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/items/new')}>Add Item</Button>,
        ]}
      />
      <FilterBar sx={{ mb: 2 }}>
        <TextField size="small" value={searchText} onChange={(e) => { setPage(0); setSearchText(e.target.value); }} placeholder="Search item code, name, brand, or color" sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <TextField size="small" select label="Brand" value={brandFilter} onChange={(e) => { setPage(0); setBrandFilter(e.target.value); }} sx={{ minWidth: 160 }}><MenuItem value="all">All Brands</MenuItem>{brands.map((brand) => <MenuItem key={brand.id || brand._id} value={brand.brandName || brand.name}>{brand.brandName || brand.name}</MenuItem>)}</TextField>
        <TextField size="small" select label="Group" value={groupFilter} onChange={(e) => { setPage(0); setGroupFilter(e.target.value); }} sx={{ minWidth: 180 }}><MenuItem value="all">All Groups</MenuItem>{groups.map((group) => <MenuItem key={group.id || group._id} value={group.groupName || group.name}>{group.groupName || group.name}</MenuItem>)}</TextField>
        <TextField size="small" select label="HSN" value={hsnFilter} onChange={(e) => { setPage(0); setHsnFilter(e.target.value); }} sx={{ minWidth: 140 }}><MenuItem value="all">All HSN</MenuItem>{hsnOptions.map((hsn) => <MenuItem key={hsn} value={hsn}>{hsn}</MenuItem>)}</TextField>
        <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }} sx={{ minWidth: 140 }}><MenuItem value="all">All Statuses</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Draft">Draft</MenuItem><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Inactive">Inactive</MenuItem></TextField>
        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, value) => value && setViewMode(value)}>
          <ToggleButton value="table"><TableRowsRoundedIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="cards"><GridViewRoundedIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </FilterBar>

      {viewMode === 'cards' ? (
        <Grid container spacing={2}>
          {paginatedRows.map((row) => (
            <Grid item xs={12} md={6} lg={4} key={row.id}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box><Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{row.itemName}</Typography><Typography variant="caption" sx={{ color: '#64748b' }}>{row.itemCode}</Typography></Box>
                      <StatusBadge value={row.status} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: '#475569' }}>{row.brand} • {row.mainGroup || 'Unassigned'}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>HSN {row.hsnCode || '--'} • GST {row.gstRate || '--'}% • Variants {row.variantCount}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton size="small" color="info" onClick={() => navigate(`/items/${row.id}/view`)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="primary" onClick={() => navigate(`/items/${row.id}/edit`)}><EditOutlinedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => dispatch(deleteItem(row.id))}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell><TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell><TableCell sx={{ fontWeight: 700 }}>Brand</TableCell><TableCell sx={{ fontWeight: 700 }}>Group</TableCell><TableCell sx={{ fontWeight: 700 }}>HSN</TableCell><TableCell sx={{ fontWeight: 700 }}>GST</TableCell><TableCell sx={{ fontWeight: 700 }}>Base Color</TableCell><TableCell sx={{ fontWeight: 700 }}>Variants</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell><TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{row.itemCode}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell>{row.brand}</TableCell>
                    <TableCell>{row.mainGroup || '--'}</TableCell>
                    <TableCell>{row.hsnCode || '--'}</TableCell>
                    <TableCell>{row.gstRate || '--'}</TableCell>
                    <TableCell>{row.color || '--'}</TableCell>
                    <TableCell>{row.variantCount}</TableCell>
                    <TableCell><StatusBadge value={row.status} /></TableCell>
                    <TableCell align="right"><IconButton size="small" color="info" onClick={() => navigate(`/items/${row.id}/view`)}><VisibilityOutlinedIcon fontSize="small" /></IconButton><IconButton size="small" color="primary" onClick={() => navigate(`/items/${row.id}/edit`)}><EditOutlinedIcon fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => dispatch(deleteItem(row.id))}><DeleteOutlineIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {!paginatedRows.length ? <TableRow><TableCell colSpan={10} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>No items found for the current filters.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filteredRows.length} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[6, 8, 12, 20]} />
        </Paper>
      )}
    </div>
  );
}

export default ItemListPage;
