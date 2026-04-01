import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonGroup,
  InputAdornment,
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
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';
import { LOW_STOCK_THRESHOLD } from './data';
import { fetchStockOverview, fetchMovements } from '../inventory/inventorySlice';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function StockReportPage() {
  const dispatch = useDispatch();
  const stock = useSelector((state) => state.inventory?.stock || []);
  const warehouses = useSelector((state) => state.masters?.warehouses || []);
  const items = useSelector((state) => state.items?.records || []);
  const brands = useSelector((state) => state.masters?.brands || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);
  const movements = useSelector((state) => state.inventory?.movements || []);
  const auth = useSelector((state) => state.auth || {});
  const currentUser = auth.user || {};
  const isAdmin = currentUser.role?.toLowerCase() === 'admin' || currentUser.role === 'HO';

  useEffect(() => {
    dispatch(fetchStockOverview());
    dispatch(fetchMovements());
  }, [dispatch]);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('detail'); // 'detail' | 'groupWise'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const variantPriceMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      item.variants?.forEach((v) => {
        map[v.id] = { cost: toNum(v.costPrice), selling: toNum(v.sellingPrice) };
      });
    });
    return map;
  }, [items]);

  const warehouseMap = useMemo(
    () => warehouses.reduce((acc, w) => ({ ...acc, [w.id]: w.name }), {}),
    [warehouses],
  );

  const movementBuckets = useMemo(() => {
    const buckets = {};

    const ensureBucket = (locationId) => {
      const key = String(locationId);
      if (!buckets[key]) {
        buckets[key] = {
          purchaseIn: 0,
          qcIn: 0,
          saleOut: 0,
          returnIn: 0,
          returnOut: 0,
          transferIn: 0,
          transferOut: 0,
          adjustmentIn: 0,
          adjustmentOut: 0,
        };
      }
      return buckets[key];
    };

    movements.forEach((movement) => {
      const qty = Math.abs(toNum(movement.qty));
      const type = String(movement.type || '').toUpperCase();
      const fromId = movement.fromLocation?._id || movement.fromLocation?.id || movement.fromLocation || '';
      const toId = movement.toLocation?._id || movement.toLocation?.id || movement.toLocation || '';

      if (type === 'DAMAGED') return;

      if (toId) {
        const bucket = ensureBucket(toId);
        if (type === 'PURCHASE') bucket.purchaseIn += qty;
        if (type === 'QC_APPROVED') bucket.qcIn += qty;
        if (type === 'RETURN') bucket.returnIn += qty;
        if (type === 'TRANSFER') bucket.transferIn += qty;
        if (type === 'ADJUSTMENT') bucket.adjustmentIn += qty;
      }

      if (fromId) {
        const bucket = ensureBucket(fromId);
        if (type === 'SALE') bucket.saleOut += qty;
        if (type === 'RETURN') bucket.returnOut += qty;
        if (type === 'TRANSFER') bucket.transferOut += qty;
        if (type === 'ADJUSTMENT') bucket.adjustmentOut += qty;
      }
    });

    return buckets;
  }, [movements]);

  const stockRows = useMemo(() => {
    return stock.map((s) => {
      const prices = variantPriceMap[String(s.productId || s.variantId || '')] || {};
      const closingStock = toNum(s.quantity);
      const value = closingStock * (prices.cost || prices.selling || 0);
      const locationId = s.storeId || s.warehouseId || s.id;
      const mov = movementBuckets[String(locationId)] || {
        purchaseIn: 0,
        qcIn: 0,
        saleOut: 0,
        returnIn: 0,
        returnOut: 0,
        transferIn: 0,
        transferOut: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
      };

      const added = mov.purchaseIn + mov.qcIn + mov.returnIn;
      const removed = mov.saleOut + mov.returnOut;
      const transferNet = mov.transferIn - mov.transferOut;
      const adjustmentNet = mov.adjustmentIn - mov.adjustmentOut;
      const movementNet = added - removed + transferNet + adjustmentNet;
      const openingStock = Math.max(0, closingStock - movementNet);
      return {
        ...s,
        warehouseName: warehouseMap[s.warehouseId] || warehouseMap[s.storeId],
        openingStock,
        added,
        removed,
        transferNet,
        adjustmentNet,
        damaged: toNum(s.damagedQuantity || 0),
        closingStock,
        value,
        isLowStock: closingStock <= LOW_STOCK_THRESHOLD,
      };
    });
  }, [stock, variantPriceMap, warehouseMap, movementBuckets]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const selectedBrand = brands.find((b) => b.id === filters.brandId);
    const selectedGroup = itemGroups.find((g) => g.id === filters.categoryId);
    return stockRows.filter((row) => {
      const matchesWarehouse =
        !filters.warehouseId || filters.warehouseId === 'all' || row.warehouseId === filters.warehouseId;
      const matchesBrand =
        !filters.brandId ||
        filters.brandId === 'all' ||
        row.brand === selectedBrand?.brandName ||
        row.brand === selectedBrand?.id ||
        row.brand === selectedBrand?._id;
      const matchesCategory =
        !filters.categoryId ||
        filters.categoryId === 'all' ||
        row.category === selectedGroup?.groupName ||
        row.category === selectedGroup?.id ||
        row.category === selectedGroup?._id;
      const matchesSearch =
        !query ||
        (row.itemName || '').toLowerCase().includes(query) ||
        (row.sku || '').toLowerCase().includes(query) ||
        (row.warehouseName || '').toLowerCase().includes(query);
      return matchesWarehouse && matchesBrand && matchesCategory && matchesSearch;
    });
  }, [stockRows, filters, searchText, brands, itemGroups]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let totalClosing = 0;
    let totalValue = 0;
    filteredRows.forEach((r) => {
      totalClosing += r.closingStock;
      totalValue += r.value;
    });
    return {
      totalVariants: filteredRows.length,
      totalClosingStock: totalClosing,
      totalValue,
      lowStockCount: filteredRows.filter((r) => r.isLowStock).length,
    };
  }, [filteredRows]);

  const groupWiseRows = useMemo(() => {
    const byGroup = {};
    filteredRows.forEach((r) => {
      const group = r.category || 'Ungrouped';
      if (!byGroup[group]) byGroup[group] = { group, quantity: 0, value: 0, variants: 0 };
      byGroup[group].quantity += r.closingStock;
      byGroup[group].value += r.value;
      byGroup[group].variants += 1;
    });
    return Object.values(byGroup).sort((a, b) => b.value - a.value);
  }, [filteredRows]);

  const paginatedGroupWise = useMemo(
    () => groupWiseRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [groupWiseRows, page, rowsPerPage],
  );

  const exportGroupWiseRows = useMemo(
    () => groupWiseRows.map((r) => ({ 'Item Group': r.group, Variants: r.variants, Quantity: r.quantity, Value: r.value.toFixed(2) })),
    [groupWiseRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Stock Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Current inventory, movements, and stock value.
          </Typography>
        </Box>

        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showWarehouse
          showBrand
          showCategory
        />

        <ButtonGroup size="small" sx={{ mb: 1 }}>
          <Button variant={viewMode === 'detail' ? 'contained' : 'outlined'} onClick={() => { setViewMode('detail'); setPage(0); }}>
            Detail
          </Button>
          <Button variant={viewMode === 'groupWise' ? 'contained' : 'outlined'} onClick={() => { setViewMode('groupWise'); setPage(0); }}>
            By Group
          </Button>
        </ButtonGroup>

        <TextField
          size="small"
          value={searchText}
          onChange={(e) => {
            setPage(0);
            setSearchText(e.target.value);
          }}
          placeholder="Search by item, SKU or warehouse"
          sx={{ maxWidth: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Variants" value={summary.totalVariants} />
          <SummaryChip label="Closing Stock" value={summary.totalClosingStock} />
          <SummaryChip label="Stock Value" value={`₹${summary.totalValue.toFixed(2)}`} strong />
          <SummaryChip
            label="Low Stock Items"
            value={summary.lowStockCount}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {viewMode === 'groupWise' && (
          <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
            <ReportExportButton
              headers={['Item Group', 'Variants', 'Quantity', 'Value']}
              headerKeys={['Item Group', 'Variants', 'Quantity', 'Value']}
              rows={exportGroupWiseRows}
              filename="group-wise-stock.csv"
            />
          </Stack>
        )}
        <TableContainer>
          <Table size="small">
            {viewMode === 'groupWise' ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item Group</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Variants</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGroupWise.map((row) => (
                    <TableRow key={row.group} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.group}</TableCell>
                      <TableCell align="right">{row.variants}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{row.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            ) : (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Opening</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Added</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Removed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Transfer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Adjust</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Damaged</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Closing</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        bgcolor: row.isLowStock ? 'rgba(239, 68, 68, 0.06)' : undefined,
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{row.itemName}</TableCell>
                      <TableCell>{`${row.size} / ${row.color}`}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{row.sku}</TableCell>
                      <TableCell>{row.warehouseName}</TableCell>
                      <TableCell align="right">{row.openingStock}</TableCell>
                      <TableCell align="right">{row.added}</TableCell>
                      <TableCell align="right">{row.removed}</TableCell>
                      <TableCell align="right">{row.transferNet}</TableCell>
                      <TableCell align="right">{row.adjustmentNet}</TableCell>
                      <TableCell align="right">{row.damaged}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {row.closingStock}
                        {row.isLowStock && ' ⚠'}
                      </TableCell>
                      <TableCell align="right">₹{row.value.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={viewMode === 'groupWise' ? groupWiseRows.length : filteredRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}

export default StockReportPage;
