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
import { fetchStockOverview, clearStoreInventory } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';

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
  const backendRows = useSelector((state) => state.inventory.stock || []);
  const totalRows = useSelector((state) => state.inventory.total || 0);
  const totalQuantity = useSelector((state) => state.inventory.totalQuantity || 0);
  const sizes = useSelector((state) => state.masters.sizes || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [itemFilter, setItemFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Debounced effect to fetch from backend when filters change
  useEffect(() => {
    const params = {
      page: 1, // Always fetch first page when limit is high (local pagination)
      limit: 50000, 
      search: searchText,
      type: typeFilter === 'all' ? undefined : typeFilter,
    };
    
    dispatch(fetchStockOverview(params));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('sizes'));
  }, [dispatch, searchText, typeFilter]); // Removed page from dependencies

  // Auto-select Head Office warehouse by default (Only for non-store staff)
  useEffect(() => {
    if (isStoreStaff) {
      setWarehouseFilter('all');
      return;
    }
    if (warehouses && warehouses.length > 0 && warehouseFilter === 'all') {
      const hoWarehouse = warehouses.find(w => 
        (w.warehouseName || w.name || '').toLowerCase().includes('head office') || 
        (w.warehouseName || w.name || '').toLowerCase().includes('rebel')
      );
      if (hoWarehouse) {
        setWarehouseFilter(hoWarehouse.warehouseName || hoWarehouse.name);
      } else {
        setWarehouseFilter(warehouses[0].warehouseName || warehouses[0].name);
      }
    }
  }, [warehouses, warehouseFilter, isStoreStaff]);

  const sizeLabelLookup = useMemo(() => buildSizeLabelLookup(sizes), [sizes]);
  const getSizeLabel = (value) => resolveSizeLabel(value, sizeLabelLookup);

  const rows = useMemo(() => {
    const normalized = normalizeStockRows(backendRows);
    // Remove the restrictive garment filter for HO/Admin users
    return isStoreStaff ? normalized.filter((r) => r.type === 'GARMENT') : normalized;
  }, [backendRows, isStoreStaff]);

  const itemOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.itemCode).filter(Boolean))), [rows]);
  const sizeOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.size).filter(Boolean))), [rows]);
  const warehouseOptions = useMemo(
    () => Array.from(new Set([...rows.map((row) => row.warehouse), ...warehouses.map((warehouse) => warehouse.warehouseName || warehouse.name)]).values()).filter(Boolean),
    [rows, warehouses],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      // Local filtering still applied for UI responsiveness
      const matchesSearch = query
        ? [row.itemCode, row.itemName, row.color, row.warehouse, row.brand, row.category]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesWarehouse = warehouseFilter === 'all' ? true : row.warehouse === warehouseFilter;
      const matchesItem = itemFilter === 'all' ? true : row.itemCode === itemFilter;
      const matchesSize = sizeFilter === 'all' ? true : row.size === sizeFilter;
      const matchesType = typeFilter === 'all' ? true : row.type === typeFilter;
      const matchesStock =
        stockFilter === 'low'
          ? row.availableStock <= row.reorderLevel
          : stockFilter === 'out'
            ? row.availableStock <= 0
            : true;
      return matchesSearch && matchesWarehouse && matchesItem && matchesSize && matchesType && matchesStock;
    });
  }, [itemFilter, rows, searchText, sizeFilter, stockFilter, warehouseFilter, typeFilter]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(
    () => {
      const isLocalFiltered = warehouseFilter !== 'all' || itemFilter !== 'all' || sizeFilter !== 'all' || stockFilter !== 'all';
      
      const rawTotalQuantity = isLocalFiltered || searchText 
        ? filteredRows.reduce((sum, row) => sum + Number(row.availableStock || 0), 0) 
        : totalQuantity;

      return {
        // Use filtered rows for rows/qty ONLY if local filters (warehouse/item/size) are active
        // Otherwise use the global totals from backend
        totalRows: isLocalFiltered || searchText ? filteredRows.length : totalRows,
        totalQuantity: Math.round(Number(rawTotalQuantity)),
        lowStock: filteredRows.filter((row) => row.availableStock <= row.reorderLevel && row.availableStock > 0).length,
        outOfStock: filteredRows.filter((row) => row.availableStock <= 0).length,
        inTransit: filteredRows.reduce((sum, row) => sum + Number(row.inTransit || 0), 0),
      };
    },
    [filteredRows, totalRows, totalQuantity, searchText, warehouseFilter, itemFilter, sizeFilter, typeFilter, stockFilter],
  );

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
          <ExportButton key="export" rows={exportRows} columns={stockOverviewExportColumns} filename="stock-overview.xlsx" sheetName="Stock Overview" />,
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
        <TextField size="small" select label="Item Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="GARMENT">Finished Garments</MenuItem>
          {!isStoreStaff && (
            <>
              <MenuItem value="FABRIC">Fabric (Thaan)</MenuItem>
              <MenuItem value="ACCESSORY">Accessories</MenuItem>
            </>
          )}
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
