import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStockOverview } from './inventorySlice';
import { fetchMasters } from '../masters/mastersSlice';
import {
  Box,
  Chip,
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
import StatusChip from '../masters/components/StatusChip';

const LOW_STOCK_THRESHOLD = 10;

function StockOverviewPage() {
  const stockRows = useSelector((state) => state.inventory.stock);
  const warehouses = useSelector((state) => state.inventory.warehouses || []);

  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchStockOverview());
    dispatch(fetchMasters('warehouses'));
  }, [dispatch]);

  const brands = useMemo(
    () => Array.from(new Set(stockRows.map((row) => row.brand))).filter(Boolean),
    [stockRows],
  );
  const categories = useMemo(
    () => Array.from(new Set(stockRows.map((row) => row.category))).filter(Boolean),
    [stockRows],
  );

  const warehouseMap = useMemo(
    () =>
      warehouses.reduce((accumulator, warehouse) => {
        accumulator[warehouse.id] = warehouse.name;
        return accumulator;
      }, {}),
    [warehouses],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return stockRows.filter((row) => {
      const matchesSearch = query
        ? row.itemName?.toLowerCase().includes(query) ||
        row.sku?.toLowerCase().includes(query) ||
        row.styleCode?.toLowerCase().includes(query) ||
        (row.lotNumber && String(row.lotNumber).toLowerCase().includes(query))
        : true;

      const matchesWarehouse = warehouseFilter === 'all' ? true : row.warehouseId === warehouseFilter;
      const matchesBrand = brandFilter === 'all' ? true : row.brand === brandFilter;
      const matchesCategory = categoryFilter === 'all' ? true : row.category === categoryFilter;

      return matchesSearch && matchesWarehouse && matchesBrand && matchesCategory;
    });
  }, [brandFilter, categoryFilter, searchText, stockRows, warehouseFilter]);

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Stock Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            View variant-level stock across warehouses, with available and reserved quantities.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            value={searchText}
            onChange={(event) => {
              setPage(0);
              setSearchText(event.target.value);
            }}
            placeholder="Search by item, style code, or SKU"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            label="Warehouse"
            value={warehouseFilter}
            onChange={(event) => {
              setPage(0);
              setWarehouseFilter(event.target.value);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Warehouses</MenuItem>
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Brand"
            value={brandFilter}
            onChange={(event) => {
              setPage(0);
              setBrandFilter(event.target.value);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Brands</MenuItem>
            {brands.map((brand) => (
              <MenuItem key={brand} value={brand}>
                {brand}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(event) => {
              setPage(0);
              setCategoryFilter(event.target.value);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      {filteredRows.length ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 170 }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 130 }}>Style Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 90 }}>Lot</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 170 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Quantity
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Reserved
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Available
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => {
                  const availableQty = Number(row.quantity) - Number(row.reserved || 0);
                  const isLowStock = availableQty <= LOW_STOCK_THRESHOLD;

                  return (
                    <TableRow key={row.id} hover sx={isLowStock ? { backgroundColor: '#fff7ed' } : undefined}>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{row.itemName}</TableCell>
                      <TableCell>{row.styleCode}</TableCell>
                      <TableCell>{`${row.size} / ${row.color}`}</TableCell>
                      <TableCell>{row.lotNumber || '-'}</TableCell>
                      <TableCell>{row.sku}</TableCell>
                      <TableCell>{warehouseMap[row.warehouseId] || row.warehouseId}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right">{row.reserved}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Typography variant="body2">{availableQty}</Typography>
                          {isLowStock && <Chip size="small" color="warning" label="Low" />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <StatusChip value={row.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
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
        </>
      ) : (
        <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            No stock records found.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Try adjusting filters to view warehouse stock.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default StockOverviewPage;
