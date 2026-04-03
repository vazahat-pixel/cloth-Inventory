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
  item_code: row.itemCode, item_name: row.itemName, brand: row.brand, hsn_code: row.hsnCode, gst_rate: row.gstRate, color: row.color, fabric: row.fabric, pattern: row.pattern, fit: row.fit, gender: row.gender, season: row.season, occasion: row.occasion, main_group: row.mainGroup, sub_group: row.subGroup, size: row.size, cost_price: row.costPrice, sale_price: row.salePrice, mrp: row.mrp, sku: row.sku, status: row.status,
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
  const [viewMode, setViewMode] = useState('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchMasters('brands'));
    dispatch(fetchMasters('itemGroups'));
  }, [dispatch]);

  const rows = useMemo(() => items.map((item) => {
    const section = item.sectionId?.groupName || item.sectionId?.name || '';
    const category = item.categoryId?.groupName || item.categoryId?.name || '';
    const subCategory = item.subCategoryId?.groupName || item.subCategoryId?.name || '';
    
    // Logic: Main group is usually Section or Category
    const mainGroup = section || category || (item.groupIds?.find(g => g.groupType === 'Section' || g.groupType === 'Category')?.name) || '--';
    const subGroup = subCategory || (item.groupIds?.find(g => g.groupType === 'Sub Category')?.name) || '--';

    return {
      id: item.id || item._id,
      itemCode: item.itemCode || item.code || '',
      itemName: item.itemName || item.name || '',
      brand: item.brand?.brandName || item.brand?.name || (typeof item.brand === 'string' ? item.brand : 'UNSPECIFIED'),
      mainGroup,
      subGroup,
      hsnCode: item.hsCodeId?.code || item.hsCodeId?.hsnCode || '--',
      gstRate: item.hsCodeId?.gstPercent !== undefined ? `${item.hsCodeId.gstPercent}%` : '--',
      color: item.shade || item.color || item.shadeColor || '--',
      variantCount: item.sizes?.length || 0,
      status: item.status || 'Active',
    };
  }), [items]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query ? [row.itemCode, row.itemName, row.brand, row.color].some((value) => String(value).toLowerCase().includes(query)) : true;
      const matchesBrand = brandFilter === 'all' ? true : row.brand === brandFilter;
      const matchesGroup = groupFilter === 'all' ? true : row.mainGroup === groupFilter;
      return matchesSearch && matchesBrand && matchesGroup;
    });
  }, [brandFilter, groupFilter, rows, searchText]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredRows, page, rowsPerPage]);
  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  return (
    <div>
      <PageHeader
        title="Unified Item Master"
        subtitle="One central registry for Men's Wear, Belts, Ties, and Wallets."
        breadcrumbs={[{ label: 'Items', active: true }]}
        actions={[
          <ExportButton key="export" rows={exportRows} columns={itemsExportColumns} filename="unified_item_master" sheetName="Items" />,
          <Button key="add" variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate('/items/new')} sx={{ bgcolor: '#d946ef', px: 3, fontWeight: 700 }}>Add New Item</Button>,
        ]}
      />

      <FilterBar sx={{ mb: 2, mt: 1 }}>
        <TextField size="small" value={searchText} onChange={(e) => { setPage(0); setSearchText(e.target.value); }} placeholder="Search code, name, color..." sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <TextField size="small" select label="Brand" value={brandFilter} onChange={(e) => { setPage(0); setBrandFilter(e.target.value); }} sx={{ minWidth: 160 }}><MenuItem value="all">All Brands</MenuItem>{brands.map((brand) => <MenuItem key={brand.id || brand._id} value={brand.brandName || brand.name}>{brand.brandName || brand.name}</MenuItem>)}</TextField>
        <TextField size="small" select label="Section/Group" value={groupFilter} onChange={(e) => { setPage(0); setGroupFilter(e.target.value); }} sx={{ minWidth: 180 }}><MenuItem value="all">All Sections</MenuItem>{groups.filter(g => g.groupType === 'Section').map((group) => <MenuItem key={group.id || group._id} value={group.groupName || group.name}>{group.groupName || group.name}</MenuItem>)}</TextField>
        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, value) => value && setViewMode(value)}>
          <ToggleButton value="table"><TableRowsRoundedIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="cards"><GridViewRoundedIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </FilterBar>

      {viewMode === 'cards' ? (
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
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>{row.brand} • {row.mainGroup || 'Unassigned'}</Typography>
                    <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, display: 'flex', gap: 2 }}>
                       <Typography variant="caption" sx={{ color: '#64748b' }}>GST <b>{row.gstRate}</b></Typography>
                       <Typography variant="caption" sx={{ color: '#64748b' }}>Variants <b>{row.variantCount}</b></Typography>
                    </Box>
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
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}><TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell><TableCell sx={{ fontWeight: 700 }}>Name</TableCell><TableCell sx={{ fontWeight: 700 }}>Brand</TableCell><TableCell sx={{ fontWeight: 700 }}>Section</TableCell><TableCell sx={{ fontWeight: 700 }}>GST</TableCell><TableCell sx={{ fontWeight: 700 }}>Color</TableCell><TableCell sx={{ fontWeight: 700 }}>Variants</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell><TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#6366f1' }}>{row.itemCode}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                    <TableCell>{row.brand}</TableCell>
                    <TableCell>{row.mainGroup}</TableCell>
                    <TableCell>{row.gstRate}</TableCell>
                    <TableCell>{row.color}</TableCell>
                    <TableCell><b>{row.variantCount}</b></TableCell>
                    <TableCell><StatusBadge value={row.status} /></TableCell>
                    <TableCell align="right">
                        <IconButton size="small" color="info" onClick={() => navigate(`/items/${row.id}/view`)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="primary" onClick={() => navigate(`/items/${row.id}/edit`)}><EditOutlinedIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!paginatedRows.length ? <TableRow><TableCell colSpan={9} sx={{ py: 10, textAlign: 'center', color: '#64748b' }}>No items found.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filteredRows.length} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[8, 12, 20]} />
        </Paper>
      )}
    </div>
  );
}

export default ItemListPage;
