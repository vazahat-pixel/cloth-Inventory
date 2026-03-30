import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
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
import { fetchMasters } from '../masters/mastersSlice';

const MOVEMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SALE', label: 'Sale' },
  { value: 'RETURN', label: 'Return' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'QC_APPROVED', label: 'QC Approved' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
];

function MovementHistoryPage() {
  const dispatch = useDispatch();
  const movements = useSelector((state) => state.inventory.movements);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);

  useEffect(() => {
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
  }, [dispatch]);

  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const warehouseMap = useMemo(
    () =>
      [...warehouses, ...stores].reduce((accumulator, warehouse) => {
        accumulator[String(warehouse.id || warehouse._id)] = warehouse.name;
        return accumulator;
      }, {}),
    [warehouses, stores],
  );

  const filteredMovements = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return movements
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .filter((movement) => {
        const matchesSearch = query
          ? (movement.itemName || '').toLowerCase().includes(query) ||
          (movement.sku || '').toLowerCase().includes(query) ||
          (movement.styleCode || '').toLowerCase().includes(query)
          : true;

        const movementLocationIds = [movement.warehouseId, movement.fromLocation, movement.toLocation]
          .filter(Boolean)
          .map((value) => String(value));
        const matchesWarehouse =
          warehouseFilter === 'all' ? true : movementLocationIds.includes(String(warehouseFilter));

        const matchesType =
          movementTypeFilter === 'all' ? true : movement.type === movementTypeFilter;

        const matchesFrom = dateFrom ? String(movement.date) >= dateFrom : true;
        const matchesTo = dateTo ? String(movement.date) <= dateTo : true;

        return matchesSearch && matchesWarehouse && matchesType && matchesFrom && matchesTo;
      });
  }, [dateFrom, dateTo, movementTypeFilter, movements, searchText, warehouseFilter]);

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredMovements.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredMovements, page, rowsPerPage]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Movement History
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track stock movement events for transfers, audits, adjustments, purchases, and sales.
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
            placeholder="Search by item, SKU, or style code"
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
            label="Location"
            value={warehouseFilter}
            onChange={(event) => {
              setPage(0);
              setWarehouseFilter(event.target.value);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Locations</MenuItem>
            {[...warehouses, ...stores].map((warehouse) => (
              <MenuItem key={warehouse.id || warehouse._id} value={warehouse.id || warehouse._id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Type"
            value={movementTypeFilter}
            onChange={(event) => {
              setPage(0);
              setMovementTypeFilter(event.target.value);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            {MOVEMENT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="From"
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setPage(0);
              setDateFrom(event.target.value);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={dateTo}
            onChange={(event) => {
              setPage(0);
              setDateTo(event.target.value);
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Stack>

      {filteredMovements.length ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 190 }}>Item / Variant</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 130 }} align="right">
                    Qty Change
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 90 }}>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((movement) => (
                  <TableRow key={movement.id || movement._id} hover>
                      <TableCell>{movement.date}</TableCell>
                      <TableCell>{`${movement.itemName || ''} (${movement.size || ''}/${movement.color || ''})`}</TableCell>
                    <TableCell>{warehouseMap[String(movement.warehouseId)] || movement.warehouseId}</TableCell>
                      <TableCell>{movement.type}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                        color: movement.quantityChange >= 0 ? '#15803d' : '#b91c1c',
                        }}
                      >
                      {movement.quantityChange >= 0
                        ? `+${movement.quantityChange}`
                        : movement.quantityChange}
                      </TableCell>
                      <TableCell>{movement.reference}</TableCell>
                    <TableCell>{movement.user || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredMovements.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </>
      ) : (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No movement records match your filters.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default MovementHistoryPage;
