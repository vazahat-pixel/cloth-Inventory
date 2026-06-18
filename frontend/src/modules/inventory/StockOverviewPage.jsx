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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
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
import { fetchStockOverview, clearStoreInventory, clearWarehouseInventory } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import { REPORT_FETCH_PARAMS } from '../reports/reportConstants';
import useDebouncedValue from '../../hooks/useDebouncedValue';

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
      status: (() => {
        const avail = Number(row.available ?? 0);
        const reorder = Number(row.reorderLevel || 0);
        if (avail <= 0) return 'OUT_OF_STOCK';
        if (reorder > 0 && avail <= reorder) return 'LOW_STOCK';
        return row.status || 'OK';
      })(),
      type: row.type || 'GARMENT',
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
  const authUser = useSelector((state) => state.auth?.user);
  const userRole = (authUser?.role || '').toLowerCase();
  const isStoreStaff = userRole.includes('staff') || userRole.includes('manager') || userRole.includes('accountant');
  const shopId = authUser?.shopId;
  const backendRows = useSelector((state) => state.inventory.storeStock || state.inventory.stock || []);
  const loading = useSelector((state) => state.inventory.loading);
  const totalRows = useSelector((state) => state.inventory.total || 0);
  const totalQuantity = useSelector((state) => state.inventory.totalQuantity || 0);
  const sizes = useSelector((state) => state.masters.sizes || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [searchText, setSearchText] = useState('');
  const debouncedApiSearch = useDebouncedValue(searchText, 400);
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [stockDetailRow, setStockDetailRow] = useState(null);

  // Clear Inventory States
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleClearInventory = async () => {
    if (clearConfirmText !== 'DELETE') return;
    setIsClearing(true);
    try {
      const result = await dispatch(clearStoreInventory(shopId)).unwrap();
      setSnackbar({
        open: true,
        message: `Successfully cleared store inventory! Deleted ${result?.deletedCount || 0} records safely.`,
        severity: 'success'
      });
      setOpenClearDialog(false);
      setClearConfirmText('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || 'Failed to clear store inventory.',
        severity: 'error'
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Clear Warehouse Inventory States (HO/Admin Only)
  const [openClearWarehouseDialog, setOpenClearWarehouseDialog] = useState(false);
  const [clearWarehouseConfirmText, setClearWarehouseConfirmText] = useState('');
  const [selectedWarehouseToClear, setSelectedWarehouseToClear] = useState('');

  const handleClearWarehouseInventory = async () => {
    if (clearWarehouseConfirmText !== 'DELETE' || !selectedWarehouseToClear) return;
    setIsClearing(true);
    try {
      const result = await dispatch(clearWarehouseInventory(selectedWarehouseToClear)).unwrap();
      setSnackbar({
        open: true,
        message: `Successfully cleared warehouse inventory! Deleted ${result?.deletedCount || 0} records safely.`,
        severity: 'success'
      });
      setOpenClearWarehouseDialog(false);
      setClearWarehouseConfirmText('');
      setSelectedWarehouseToClear('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: err || 'Failed to clear warehouse inventory.',
        severity: 'error'
      });
    } finally {
      setIsClearing(false);
    }
  };


  useEffect(() => {
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('sizes'));
  }, [dispatch]);

  const apiSearch = useMemo(() => {
    const parts = [
      debouncedApiSearch,
      itemFilter !== 'all' ? itemFilter : '',
      sizeFilter !== 'all' ? sizeFilter : '',
    ].filter(Boolean);
    return parts.join(' ').trim() || undefined;
  }, [debouncedApiSearch, itemFilter, sizeFilter]);

  useEffect(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: apiSearch,
      type: typeFilter === 'all' ? undefined : typeFilter,
      warehouseId: warehouseFilter === 'all' ? undefined : warehouseFilter,
      lowStock: stockFilter === 'low' ? 'true' : undefined,
      outOfStock: stockFilter === 'out' ? 'true' : undefined,
    };

    dispatch(fetchStockOverview(params));
  }, [dispatch, page, rowsPerPage, apiSearch, typeFilter, warehouseFilter, stockFilter]);

  // Removed auto-select Head Office logic to prevent empty views when warehouse names don't match exactly.
  // Users can now see all stock by default and filter as needed.

  const sizeLabelLookup = useMemo(() => buildSizeLabelLookup(sizes), [sizes]);
  const getSizeLabel = (value) => resolveSizeLabel(value, sizeLabelLookup);

  const rows = useMemo(() => {
    const normalized = normalizeStockRows(backendRows);
    return isStoreStaff ? normalized.filter((r) => r.type === 'GARMENT') : normalized;
  }, [backendRows, isStoreStaff]);

  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({
      id: String(w.id || w._id),
      label: `[Warehouse] ${w.warehouseName || w.name}`,
    })),
    [warehouses],
  );
  const itemOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.itemCode).filter(Boolean))), [rows]);
  const sizeOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.size).filter(Boolean))), [rows]);

  const paginatedRows = rows;

  const summary = useMemo(
    () => ({
      totalRows,
      totalQuantity: Math.round(Number(totalQuantity)),
      lowStock: rows.filter((row) => row.availableStock > 0 && (
        (row.reorderLevel > 0 && row.availableStock <= row.reorderLevel)
        || String(row.status || '').toUpperCase() === 'LOW_STOCK'
      )).length,
      outOfStock: rows.filter((row) => row.availableStock <= 0 || String(row.status || '').toUpperCase() === 'OUT_OF_STOCK').length,
      inTransit: rows.reduce((sum, row) => sum + Number(row.inTransit || 0), 0),
    }),
    [rows, totalRows, totalQuantity],
  );

  const loadExportRows = async () => {
    const params = {
      ...REPORT_FETCH_PARAMS,
      search: apiSearch,
      type: typeFilter === 'all' ? undefined : typeFilter,
      warehouseId: warehouseFilter === 'all' ? undefined : warehouseFilter,
      lowStock: stockFilter === 'low' ? 'true' : undefined,
      outOfStock: stockFilter === 'out' ? 'true' : undefined,
    };
    const result = await dispatch(fetchStockOverview(params)).unwrap();
    const exportSource = isStoreStaff
      ? (result.stock || []).filter((r) => (r.type || 'GARMENT') === 'GARMENT')
      : (result.stock || []);
    return toExportRows(normalizeStockRows(exportSource));
  };

  const exportRows = useMemo(() => toExportRows(rows), [rows]);

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
          isStoreStaff && shopId && (
            <Button
              key="clear-inventory"
              variant="contained"
              color="error"
              onClick={() => setOpenClearDialog(true)}
              sx={{ fontWeight: 700, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
            >
              Clear Store Inventory
            </Button>
          ),
          !isStoreStaff && (
            <Button
              key="clear-warehouse-inventory"
              variant="contained"
              color="error"
              onClick={() => {
                 setSelectedWarehouseToClear('');
                 setOpenClearWarehouseDialog(true);
              }}
              sx={{ fontWeight: 700, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
            >
              Clear Warehouse Inventory
            </Button>
          ),
          <ExportButton key="export" rows={exportRows} loadRows={loadExportRows} columns={stockOverviewExportColumns} filename="stock-overview.xlsx" sheetName="Stock Overview" />,
        ].filter(Boolean)}
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Total Stock Qty" value={summary.totalQuantity} helper="Sum of all available units." tone="info" />
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
        <TextField size="small" select label="Location" value={warehouseFilter} onChange={(event) => { setPage(0); setWarehouseFilter(event.target.value); }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Locations</MenuItem>
          {warehouseOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Item" value={itemFilter} onChange={(event) => { setPage(0); setItemFilter(event.target.value); }} sx={{ minWidth: 170 }}>
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
          onChange={(event) => { setPage(0); setSizeFilter(event.target.value); }}
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
        <TextField size="small" select label="Item Type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setPage(0); }} sx={{ minWidth: 140 }}>
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="GARMENT">Finished Garments</MenuItem>
          {!isStoreStaff && (
            <>
              <MenuItem value="FABRIC">Fabric (Thaan)</MenuItem>
              <MenuItem value="ACCESSORY">Accessories</MenuItem>
            </>
          )}
        </TextField>
        <TextField size="small" select label="Stock State" value={stockFilter} onChange={(event) => { setPage(0); setStockFilter(event.target.value); }} sx={{ minWidth: 160 }}>
          <MenuItem value="all">All Rows</MenuItem>
          <MenuItem value="low">Low stock only</MenuItem>
          <MenuItem value="out">Out of stock only</MenuItem>
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ position: 'relative' }}>
          {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
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
                  <TableCell>
                    <Box 
                      sx={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        px: 1, py: 0.25, 
                        borderRadius: 1, 
                        display: 'inline-block',
                        bgcolor: row.type === 'GARMENT' ? '#e0f2fe' : row.type === 'FABRIC' ? '#fef3c7' : '#f3f4f6',
                        color: row.type === 'GARMENT' ? '#0369a1' : row.type === 'FABRIC' ? '#92400e' : '#374151'
                      }}
                    >
                      {row.type}
                    </Box>
                  </TableCell>
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
                        onClick={() => setStockDetailRow(row)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => navigate(`/inventory/movements?item=${encodeURIComponent(row.itemCode || '')}`)}
                      >
                        <TimelineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !paginatedRows.length ? (
                <TableRow>
                  <TableCell colSpan={11} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      No stock rows available
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Adjust filters or check connection. Total rows in database: {totalRows}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog open={Boolean(stockDetailRow)} onClose={() => setStockDetailRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Stock Details</DialogTitle>
        <DialogContent dividers>
          {stockDetailRow && (
            <Stack spacing={1.5}>
              <Typography><strong>Item Code:</strong> {stockDetailRow.itemCode}</Typography>
              <Typography><strong>Item Name:</strong> {stockDetailRow.itemName}</Typography>
              <Typography><strong>Type:</strong> {stockDetailRow.type}</Typography>
              <Typography><strong>Size:</strong> {getSizeLabel(stockDetailRow.size) || '--'}</Typography>
              <Typography><strong>Color:</strong> {stockDetailRow.color || '--'}</Typography>
              <Typography><strong>Location:</strong> {stockDetailRow.warehouse}</Typography>
              <Typography><strong>Brand:</strong> {stockDetailRow.brand || '--'}</Typography>
              <Typography><strong>Category:</strong> {stockDetailRow.category || '--'}</Typography>
              <Typography><strong>Available Stock:</strong> {stockDetailRow.availableStock}</Typography>
              <Typography><strong>In Transit:</strong> {stockDetailRow.inTransit}</Typography>
              <Typography><strong>Reorder Level:</strong> {stockDetailRow.reorderLevel}</Typography>
              <Typography><strong>Status:</strong> {stockDetailRow.status}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDetailRow(null)}>Close</Button>
          {stockDetailRow && (
            <Button
              variant="contained"
              onClick={() => {
                navigate(`/inventory/audit-view?item=${encodeURIComponent(stockDetailRow.itemCode)}&warehouse=${encodeURIComponent(stockDetailRow.warehouse)}`);
                setStockDetailRow(null);
              }}
            >
              View Full Audit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Clear Store Inventory Confirmation Dialog */}
      <Dialog
        open={openClearDialog}
        onClose={() => !isClearing && setOpenClearDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚠️ CRITICAL ACTION Required
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
            You are about to delete ALL inventory stock records for this store.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.875rem', color: '#64748b', mb: 3 }}>
            This will completely wipe your local store inventory. It will **NOT** affect HO (Head Office) or warehouse stocks. This action is irreversible.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', mb: 1 }}>
            Please type <span style={{ color: '#dc2626', fontWeight: 800 }}>DELETE</span> to confirm:
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            placeholder="DELETE"
            value={clearConfirmText}
            onChange={(e) => setClearConfirmText(e.target.value)}
            disabled={isClearing}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setOpenClearDialog(false);
              setClearConfirmText('');
            }}
            disabled={isClearing}
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearInventory}
            disabled={clearConfirmText !== 'DELETE' || isClearing}
            variant="contained"
            color="error"
            sx={{
              fontWeight: 700,
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              '&:disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' }
            }}
          >
            {isClearing ? 'Clearing...' : 'Clear All Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Warehouse Inventory Confirmation Dialog */}
      <Dialog
        open={openClearWarehouseDialog}
        onClose={() => !isClearing && setOpenClearWarehouseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚠️ CRITICAL ACTION: Clear Warehouse Inventory
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#1e293b', fontWeight: 600, mb: 2 }}>
            You are about to delete ALL inventory stock records for a warehouse.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.875rem', color: '#64748b', mb: 3 }}>
            This will completely wipe the warehouse inventory. It will **NOT** delete the item master records, only the stock balances. This action is irreversible.
          </DialogContentText>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#0f172a' }}>
              Select Warehouse to Clear
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedWarehouseToClear}
              onChange={(e) => setSelectedWarehouseToClear(e.target.value)}
              disabled={isClearing}
            >
              <MenuItem value="" disabled>Select a Warehouse</MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w._id || w.id} value={w._id || w.id}>
                  {w.warehouseName || w.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <DialogContentText sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', mb: 1 }}>
            Please type <span style={{ color: '#dc2626', fontWeight: 800 }}>DELETE</span> to confirm:
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            placeholder="DELETE"
            value={clearWarehouseConfirmText}
            onChange={(e) => setClearWarehouseConfirmText(e.target.value)}
            disabled={isClearing || !selectedWarehouseToClear}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setOpenClearWarehouseDialog(false);
              setClearWarehouseConfirmText('');
              setSelectedWarehouseToClear('');
            }}
            disabled={isClearing}
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearWarehouseInventory}
            disabled={clearWarehouseConfirmText !== 'DELETE' || !selectedWarehouseToClear || isClearing}
            variant="contained"
            color="error"
            sx={{
              fontWeight: 700,
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              '&:disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' }
            }}
          >
            {isClearing ? 'Clearing...' : 'Clear All Warehouse Stock'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar Alert feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default StockOverviewPage;
