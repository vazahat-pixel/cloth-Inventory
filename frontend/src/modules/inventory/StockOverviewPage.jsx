import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import { buildSizeLabelLookup, resolveSizeLabel } from '../../common/sizeDisplay';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import stockOverviewExportColumns from '../../config/exportColumns/stockOverview';
import { fetchStockOverview } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import api from '../../services/api';

const normalizeStockRows = (rows = []) =>
  rows.map((row, index) => {
    return {
      id: row.id || row._id || `stock-${index + 1}`,
      itemCode: row.itemCode || row.sku || row.styleCode || row.barcode || '',
      itemName: row.itemName || '',
      size: row.size || '',
      color: row.color || '',
      warehouse: row.warehouseName || '',
      brand: row.brand?.name || row.brand || '',
      category: row.category?.name || row.category || '',
      availableStock: Number(row.available ?? 0),
      inTransit: Number(row.inTransit || 0),
      reorderLevel: Number(row.reorderLevel || 0),
      status: row.status || 'OK',
    };
  });

const toExportRows = (rows = []) =>
  rows.map((row) => ({
    item_code: row.itemCode,
    item_name: row.itemName,
    size: row.size,
    color: row.color,
    warehouse: row.warehouse,
    available_stock: row.availableStock,
    in_transit: row.inTransit,
    reorder_level: row.reorderLevel,
    status: row.status,
  }));

function StockOverviewPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const backendRows = useSelector((state) => state.inventory.stock || []);
  const sizes = useSelector((state) => state.masters.sizes || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchStockOverview());
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('sizes'));
  }, [dispatch]);

  const sizeLabelLookup = useMemo(() => buildSizeLabelLookup(sizes), [sizes]);
  const getSizeLabel = (value) => resolveSizeLabel(value, sizeLabelLookup);

  const rows = useMemo(() => {
    return normalizeStockRows(backendRows);
  }, [backendRows]);

  const itemOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.itemCode).filter(Boolean))), [rows]);
  const sizeOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.size).filter(Boolean))), [rows]);
  const warehouseOptions = useMemo(
    () => Array.from(new Set([...rows.map((row) => row.warehouse), ...warehouses.map((warehouse) => warehouse.warehouseName || warehouse.name)]).values()).filter(Boolean),
    [rows, warehouses],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query
        ? [row.itemCode, row.itemName, row.color, row.warehouse, row.brand, row.category]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesWarehouse = warehouseFilter === 'all' ? true : row.warehouse === warehouseFilter;
      const matchesItem = itemFilter === 'all' ? true : row.itemCode === itemFilter;
      const matchesSize = sizeFilter === 'all' ? true : row.size === sizeFilter;
      const matchesStock =
        stockFilter === 'low'
          ? row.availableStock <= row.reorderLevel
          : stockFilter === 'out'
            ? row.availableStock <= 0
            : true;
      return matchesSearch && matchesWarehouse && matchesItem && matchesSize && matchesStock;
    });
  }, [itemFilter, rows, searchText, sizeFilter, stockFilter, warehouseFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(
    () => ({
      totalRows: filteredRows.length,
      lowStock: filteredRows.filter((row) => row.availableStock <= row.reorderLevel && row.availableStock > 0).length,
      outOfStock: filteredRows.filter((row) => row.availableStock <= 0).length,
      inTransit: filteredRows.reduce((sum, row) => sum + Number(row.inTransit || 0), 0),
    }),
    [filteredRows],
  );

  const [pendingShipments, setPendingShipments] = useState(0);
  const authUser = useSelector((state) => state.auth?.user);
  const isStoreStaff = authUser?.role === 'store_staff';
  const shopId = authUser?.shopId;

  useEffect(() => {
    const checkPendingShipments = async () => {
      if (!shopId) return;
      try {
        const res = await api.get('/dispatch', { 
          params: { destinationId: shopId, status: 'DISPATCHED' } 
        });
        setPendingShipments(res.data?.dispatches?.length || 0);
      } catch (err) {
        console.error('Failed to fetch pending shipments', err);
      }
    };

    if (isStoreStaff) {
      checkPendingShipments();
    }
  }, [shopId, isStoreStaff]);

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  return (
    <Box>
      <PageHeader
        title="Stock Overview"
        subtitle="Review item, size, color, warehouse, transit, and reorder visibility before moving into audit or journey drilldowns."
        breadcrumbs={[
          { label: 'Inventory' },
          { label: 'Stock Overview', active: true },
        ]}
        actions={[
          <ExportButton key="export" rows={exportRows} columns={stockOverviewExportColumns} filename="stock-overview.xlsx" sheetName="Stock Overview" />,
        ]}
      />

      {isStoreStaff && !shopId && (
        <Paper 
          sx={{ 
            p: 2, mb: 2, 
            bgcolor: '#fee2e2', 
            border: '1px solid #ef4444', 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography sx={{ color: '#991b1b', fontWeight: 700 }}>
            ⚠️ LOGOUT & LOGIN REQUIRED: Your session is missing the Store Link. Please login again to see your store's stock.
          </Typography>
          <Button variant="contained" color="error" size="small" onClick={() => navigate('/logout')}>
            Logout Now
          </Button>
        </Paper>
      )}

      {pendingShipments > 0 && (
        <Paper 
          sx={{ 
            p: 2, mb: 2, 
            bgcolor: '#eff6ff', 
            border: '1px solid #3b82f6', 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography sx={{ color: '#1e40af', fontWeight: 700 }}>
            📦 You have {pendingShipments} pending inbound shipments from Head Office.
          </Typography>
          <Button variant="contained" color="primary" size="small" onClick={() => navigate('/store/receipt')}>
            Go to Receive Stock
          </Button>
        </Paper>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Stock Rows" value={summary.totalRows} helper="Visible variant/location rows." />
        <SummaryCard label="Low Stock" value={summary.lowStock} helper="Rows at or below reorder level." tone="warning" />
        <SummaryCard label="Out Of Stock" value={summary.outOfStock} helper="Rows requiring urgent replenishment." tone="warning" />
        <SummaryCard label="In Transit" value={summary.inTransit} helper="Units moving between locations." tone="info" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          value={searchText}
          onChange={(event) => {
            setPage(0);
            setSearchText(event.target.value);
          }}
          placeholder="Search code, name, color, location, brand or category"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField size="small" select label="Location" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Locations</MenuItem>
          {warehouseOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Item" value={itemFilter} onChange={(event) => setItemFilter(event.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All Items</MenuItem>
          {itemOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Size"
          value={sizeFilter}
          onChange={(event) => setSizeFilter(event.target.value)}
          sx={{ minWidth: 120 }}
          SelectProps={{
            renderValue: (selected) => (selected === 'all' ? 'All Sizes' : getSizeLabel(selected)),
          }}
        >
          <MenuItem value="all">All Sizes</MenuItem>
          {sizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {getSizeLabel(option)}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Stock State" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="all">All Rows</MenuItem>
          <MenuItem value="low">Low stock only</MenuItem>
          <MenuItem value="out">Out of stock only</MenuItem>
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Available Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">In Transit</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Reorder Level</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{row.itemCode}</TableCell>
                  <TableCell>{row.itemName}</TableCell>
                  <TableCell>{getSizeLabel(row.size) || '--'}</TableCell>
                  <TableCell>{row.color || '--'}</TableCell>
                  <TableCell>{row.warehouse}</TableCell>
                  <TableCell align="right">{row.availableStock}</TableCell>
                  <TableCell align="right">{row.inTransit}</TableCell>
                  <TableCell align="right">{row.reorderLevel}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
                      <IconButton 
                        size="small" 
                        color="info" 
                        onClick={() => navigate(`/inventory/audit-view?item=${row.itemCode}&warehouse=${row.warehouse}`)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => navigate(`/inventory/item-journey?item=${row.itemCode}`)}
                      >
                        <TimelineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!paginatedRows.length ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      No stock rows available
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Adjust filters to review location-wise stock or inward activity.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}

export default StockOverviewPage;
