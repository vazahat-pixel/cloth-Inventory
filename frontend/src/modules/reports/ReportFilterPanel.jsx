import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Collapse,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useState } from 'react';

function ReportFilterPanel({
  filters,
  onFiltersChange,
  showDateRange = true,
  showWarehouse = false,
  showBrand = false,
  showCategory = false,
  showCustomer = false,
  showSupplier = false,
  showSalesman = false,
  showPaymentStatus = false,
  compact = false,
}) {
  const [expanded, setExpanded] = useState(!compact);

  const warehouses = useSelector((state) => state.inventory?.warehouses || []);
  const brands = useSelector((state) => state.masters?.brands || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);
  const customers = useSelector((state) => state.masters?.customers || []);
  const suppliers = useSelector((state) => state.masters?.suppliers || []);
  const salesmen = useSelector((state) => state.masters?.salesmen || []);

  const update = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const hasActiveFilters = useMemo(() => {
    const f = filters || {};
    return !!(
      (f.dateFrom && f.dateFrom !== '') ||
      (f.dateTo && f.dateTo !== '') ||
      (f.warehouseId && f.warehouseId !== 'all') ||
      (f.brandId && f.brandId !== 'all') ||
      (f.categoryId && f.categoryId !== 'all') ||
      (f.customerId && f.customerId !== 'all') ||
      (f.supplierId && f.supplierId !== 'all') ||
      (f.salesmanId && f.salesmanId !== 'all') ||
      (f.paymentStatus && f.paymentStatus !== 'all')
    );
  }, [filters]);

  const handleClear = () => {
    const cleared = { ...filters };
    if (showDateRange) {
      cleared.dateFrom = '';
      cleared.dateTo = '';
    }
    if (showWarehouse) cleared.warehouseId = 'all';
    if (showBrand) cleared.brandId = 'all';
    if (showCategory) cleared.categoryId = 'all';
    if (showCustomer) cleared.customerId = 'all';
    if (showSupplier) cleared.supplierId = 'all';
    if (showSalesman) cleared.salesmanId = 'all';
    if (showPaymentStatus) cleared.paymentStatus = 'all';
    onFiltersChange?.(cleared);
  };

  const content = (
    <Grid container spacing={2}>
      {showDateRange && (
        <>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              value={filters?.dateFrom || ''}
              onChange={(e) => update('dateFrom', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              value={filters?.dateTo || ''}
              onChange={(e) => update('dateTo', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </>
      )}
      {showWarehouse && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Warehouse"
            value={filters?.warehouseId || 'all'}
            onChange={(e) => update('warehouseId', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {warehouses.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {showBrand && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Brand"
            value={filters?.brandId || 'all'}
            onChange={(e) => update('brandId', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.brandName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {showCategory && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Category / Item Group"
            value={filters?.categoryId || 'all'}
            onChange={(e) => update('categoryId', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {itemGroups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.groupName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {showCustomer && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Customer"
            value={filters?.customerId || 'all'}
            onChange={(e) => update('customerId', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.customerName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {showSupplier && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Supplier"
            value={filters?.supplierId || 'all'}
            onChange={(e) => update('supplierId', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.supplierName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {showSalesman && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Salesman"
            value={filters?.salesmanId || 'all'}
            onChange={(e) => update('salesmanId', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
                {salesmen.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name || s.salesmanName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
      {showPaymentStatus && (
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            select
            label="Payment Status"
            value={filters?.paymentStatus || 'all'}
            onChange={(e) => update('paymentStatus', e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Partial">Partial</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </TextField>
        </Grid>
      )}
      {hasActiveFilters && (
        <Grid item xs={12} sm={6} md={3}>
          <Button variant="outlined" size="small" onClick={handleClear}>
            Clear Filters
          </Button>
        </Grid>
      )}
    </Grid>
  );

  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        <Button
          size="small"
          startIcon={<FilterListIcon />}
          onClick={() => setExpanded((e) => !e)}
          sx={{ mb: 1 }}
        >
          {expanded ? 'Hide Filters' : 'Show Filters'}
        </Button>
        <Collapse in={expanded}>{content}</Collapse>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <FilterListIcon fontSize="small" sx={{ color: '#64748b' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b' }}>
          Filters
        </Typography>
      </Stack>
      {content}
    </Box>
  );
}

export default ReportFilterPanel;
