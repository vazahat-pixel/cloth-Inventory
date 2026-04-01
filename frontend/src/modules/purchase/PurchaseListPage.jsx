import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchases, generatePOFromVoucher } from './purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
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
  Alert,
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
  const stores = useSelector((state) => state.masters.stores || []);
  const user = useSelector((state) => state.auth.user);

  const [searchText, setSearchText] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [barcodePrintPurchase, setBarcodePrintPurchase] = useState(null);

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

  const supplierMap = useMemo(() => 
    suppliers.reduce((acc, s) => ({ ...acc, [s._id || s.id]: s.name || s.supplierName }), {}),
  [suppliers]);

  const warehouseMap = useMemo(() => 
    [...warehouses, ...stores].reduce((acc, w) => ({ ...acc, [w._id || w.id]: w.name }), {}),
  [warehouses, stores]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return purchases.filter((row) => {
      const sName = supplierMap[row.supplierId] || '';
      const invNo = row.purchaseNumber || row.invoiceNumber || '';
      const matchesSearch = query ? (invNo.toLowerCase().includes(query) || sName.toLowerCase().includes(query)) : true;
      const matchesWarehouse = warehouseFilter === 'all' ? true : row.storeId === warehouseFilter || row.warehouseId === warehouseFilter;
      const date = row.invoiceDate || row.createdAt;
      const matchesFrom = dateFrom ? date >= dateFrom : true;
      const matchesTo = dateTo ? date <= dateTo : true;
      return matchesSearch && matchesWarehouse && matchesFrom && matchesTo;
    });
  }, [purchases, searchText, supplierMap, warehouseFilter, dateFrom, dateTo]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [filteredRows, page, rowsPerPage]);

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>{pageTitle}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Manage supplier bills and financial voucher entries.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => navigate(purchaseNewPath)}>{addButtonLabel}</Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Search PV # or Supplier"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
              sx={{ flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            {availableLocations.length > 1 && (
              <TextField select size="small" label="Location" value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(0); }} sx={{ minWidth: 180 }}>
                <MenuItem value="all">All Locations</MenuItem>
                {availableLocations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </TextField>
            )}
            <TextField size="small" type="date" label="From" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} />
            <TextField size="small" type="date" label="To" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} InputLabelProps={{ shrink: true }} />
          </Stack>
        </Stack>

        {filteredRows.length > 0 ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Voucher / Bill No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row._id || row.id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{row.purchaseNumber || 'PV-NEW'}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: -0.2 }}>Ref: {row.invoiceNumber || '-'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{supplierMap[row.supplierId] || 'Unknown'}</TableCell>
                      <TableCell>{new Date(row.invoiceDate || row.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{warehouseMap[row.storeId || row.warehouseId] || 'N/A'}</TableCell>
                      <TableCell align="right">{row.totalQuantity || row.totals?.totalQuantity || '-'}</TableCell>
                      <TableCell align="right">₹ {(row.grandTotal || row.totals?.netAmount || 0).toFixed(2)}</TableCell>
                      <TableCell><PurchaseStatusChip status={row.status} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="info" onClick={() => setSelectedPurchase(row)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="primary" onClick={() => navigate(getPurchaseEditPath(row._id || row.id))}><EditOutlinedIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="secondary" onClick={() => setBarcodePrintPurchase(row)}><LocalPrintshopOutlinedIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="warning" onClick={() => navigate(getPurchaseReturnPath(row._id || row.id))}><KeyboardReturnOutlinedIcon fontSize="small" /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={filteredRows.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
          </>
        ) : (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No purchase vouchers found.</Typography>
            <Button variant="contained" onClick={() => navigate(purchaseNewPath)}>{addButtonLabel}</Button>
          </Box>
        )}
      </Paper>

      <PurchaseDetailDialog open={Boolean(selectedPurchase)} onClose={() => setSelectedPurchase(null)} purchase={selectedPurchase} supplierName={selectedPurchase ? supplierMap[selectedPurchase.supplierId] : ''} warehouseName={selectedPurchase ? warehouseMap[selectedPurchase.storeId || selectedPurchase.warehouseId] : ''} />
      {barcodePrintPurchase && <BarcodePrintDialog open={true} onClose={() => setBarcodePrintPurchase(null)} purchase={barcodePrintPurchase} lines={(barcodePrintPurchase?.products || []).map(p => ({ ...p, sku: p.sku, itemName: p.itemName, size: p.size, color: p.color, quantity: p.quantity, rate: p.rate, variantId: p.variantId }))} warehouseMap={warehouseMap} />}
    </>
  );
}

function PurchaseStatusChip({ status }) {
  const s = String(status || '').toUpperCase();
  const color = (s === 'POSTED' || s === 'APPROVED' || s === 'RECEIVED') ? 'success' : s === 'DRAFT' ? 'info' : s === 'CANCELLED' ? 'error' : 'default';
  return <Chip size="small" color={color} variant="filled" label={status || 'Unknown'} sx={{ fontWeight: 600 }} />;
}

export default PurchaseListPage;
