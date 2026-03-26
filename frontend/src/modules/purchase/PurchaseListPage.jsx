import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchases } from './purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import {
  Box,
  Button,
  Chip,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';
import PurchaseDetailDialog from './PurchaseDetailDialog';
import BarcodePrintDialog from './BarcodePrintDialog';
import useRoleBasePath from '../../hooks/useRoleBasePath';

function PurchaseListPage() {
  const navigate = useAppNavigate();
  const basePath = useRoleBasePath();
  const dispatch = useDispatch();
  const purchases = useSelector((state) => state.purchase.records || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);

  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [barcodePrintPurchase, setBarcodePrintPurchase] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const stores = useSelector((state) => state.masters.stores || []);

  const isStoreStaff = user?.role !== 'Admin';
  const purchaseNewPath = basePath === '/ho' ? '/purchase/purchase-voucher/new' : '/purchase/new';
  const getPurchaseEditPath = (purchaseId) => (
    basePath === '/ho' ? `/purchase/purchase-voucher/${purchaseId}` : `/purchase/${purchaseId}`
  );
  const getPurchaseReturnPath = (purchaseId) => (
    basePath === '/ho' ? `/purchase/purchase-return/${purchaseId}` : `/purchase/${purchaseId}/return`
  );
  const pageTitle = basePath === '/ho' ? 'Purchase Voucher' : 'Purchase Bills';
  const addButtonLabel = basePath === '/ho' ? 'Add Purchase Voucher' : 'Add Purchase';

  useEffect(() => {
    dispatch(fetchPurchases());
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
  }, [dispatch]);

  const availableLocations = useMemo(() => {
    const combined = [...warehouses, ...stores];
    if (isStoreStaff && user?.shopId) {
      return combined.filter(l => l.id === user.shopId);
    }
    return combined;
  }, [warehouses, stores, isStoreStaff, user?.shopId]);

  const supplierMap = useMemo(
    () =>
      suppliers.reduce((acc, supplier) => {
        acc[supplier.id] = supplier.supplierName;
        return acc;
      }, {}),
    [suppliers],
  );

  const warehouseMap = useMemo(
    () =>
      warehouses.reduce((acc, warehouse) => {
        acc[warehouse.id] = warehouse.name;
        return acc;
      }, {}),
    [warehouses],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return purchases.filter((row) => {
      const supplierName = supplierMap[row.supplierId] || '';
      const invoiceNo = row.invoiceNumber || row.billNumber || '';
      const matchesSearch = query
        ? invoiceNo.toLowerCase().includes(query) ||
        supplierName.toLowerCase().includes(query)
        : true;

      const matchesWarehouse =
        warehouseFilter === 'all' ? true : row.warehouseId === warehouseFilter;

      const invoiceDate = row.invoiceDate || row.billDate || '';
      const matchesDateFrom = dateFrom ? invoiceDate >= dateFrom : true;
      const matchesDateTo = dateTo ? invoiceDate <= dateTo : true;

      return matchesSearch && matchesWarehouse && matchesDateFrom && matchesDateTo;
    });
  }, [dateFrom, dateTo, purchases, searchText, supplierMap, warehouseFilter]);

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                {pageTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage supplier purchase entries and stock inward transactions.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate(purchaseNewPath)}
            >
              {addButtonLabel}
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              value={searchText}
              onChange={(event) => {
                setPage(0);
                setSearchText(event.target.value);
              }}
              placeholder="Search by bill no or supplier"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {availableLocations.length > 1 && (
              <TextField
                size="small"
                select
                label="Location"
                value={warehouseFilter}
                onChange={(event) => {
                  setPage(0);
                  setWarehouseFilter(event.target.value);
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {availableLocations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              size="small"
              type="date"
              label="From"
              value={dateFrom}
              onChange={(event) => {
                setPage(0);
                setDateFrom(event.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={dateTo}
              onChange={(event) => {
                setPage(0);
                setDateTo(event.target.value);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Stack>

        {filteredRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Total Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Net Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{row.invoiceNumber || row.billNumber || '-'}</TableCell>
                      <TableCell>{supplierMap[row.supplierId] || (row.supplierId?.name) || ''}</TableCell>
                      <TableCell>{row.invoiceDate || row.billDate || '-'}</TableCell>
                      <TableCell>{warehouseMap[row.warehouseId] || (typeof row.warehouseId === 'object' ? row.warehouseId.name : row.warehouseName) || ''}</TableCell>
                      <TableCell align="right">{row.totals?.totalQuantity ?? '-'}</TableCell>
                      <TableCell align="right">{row.totals?.netAmount != null ? Number(row.totals.netAmount).toFixed(2) : '-'}</TableCell>
                      <TableCell>
                        <PurchaseStatusChip status={row.status} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="info" onClick={() => setSelectedPurchase(row)} title="View">
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(getPurchaseEditPath(row.id))}
                            title="Edit"
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => setBarcodePrintPurchase(row)}
                            title="Print Barcodes"
                          >
                            <LocalPrintshopOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => navigate(getPurchaseReturnPath(row.id))}
                            title="Return"
                          >
                            <KeyboardReturnOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredRows.length}
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
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No purchase bills found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Create your first supplier bill to begin procurement workflow.
            </Typography>
            <Button variant="contained" onClick={() => navigate(purchaseNewPath)}>
              {addButtonLabel}
            </Button>
          </Box>
        )}
      </Paper>

      <BarcodePrintDialog
        open={Boolean(barcodePrintPurchase)}
        onClose={() => setBarcodePrintPurchase(null)}
        purchase={barcodePrintPurchase}
        lines={(barcodePrintPurchase?.items || barcodePrintPurchase?.products || []).map((item) => {
          // Support both raw (productId is an object) and normalized item structures
          const prod = item.productId && typeof item.productId === 'object' ? item.productId : {};
          return {
            sku: item.sku || prod.sku || '',
            itemName: item.itemName || item.name || prod.name || '',
            size: item.size || prod.size || '',
            color: item.color || item.colour || prod.color || '',
            category: item.category || item.group || prod.category || '',
            type: item.type || prod.type || 'REGULAR PLAIN',
            design: item.design || item.itemName || prod.name || '',
            mrp: item.mrp || prod.salePrice || prod.sellingPrice || item.rate || '',
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            variantId: item.variantId || prod._id || item.productId || '',
          };
        })}
        warehouseMap={warehouseMap}
      />

      <PurchaseDetailDialog
        open={Boolean(selectedPurchase)}
        onClose={() => setSelectedPurchase(null)}
        purchase={selectedPurchase}
        supplierName={
          selectedPurchase ? supplierMap[selectedPurchase.supplierId] : ''
        }
        warehouseName={
          selectedPurchase ? warehouseMap[selectedPurchase.warehouseId] : ''
        }
      />
    </>
  );
}

function PurchaseStatusChip({ status }) {
  const normalized = String(status || '').toLowerCase();
  const color =
    normalized === 'received'
      ? 'success'
      : normalized === 'partially returned'
        ? 'warning'
        : 'default';

  return <Chip size="small" color={color} variant="outlined" label={status || 'Unknown'} />;
}

export default PurchaseListPage;
