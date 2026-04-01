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
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import LocalPrintshopOutlinedIcon from '@mui/icons-material/LocalPrintshopOutlined';
import PurchaseDetailDialog from './PurchaseDetailDialog';
import BarcodePrintDialog from './BarcodePrintDialog';
import { postPurchase } from './purchaseSlice';
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
  const purchaseNewPath = '/purchase/purchase-voucher/new';
  const getPurchaseEditPath = (purchaseId) => `/purchase/purchase-voucher/${purchaseId}`;
  const getPurchaseReturnPath = (purchaseId) => `/purchase/purchase-return/${purchaseId}`;
  const pageTitle = "Purchase Voucher";
  const addButtonLabel = "Add Purchase Voucher";

  useEffect(() => {
    dispatch(fetchPurchases());
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
  }, [dispatch]);

  const availableLocations = useMemo(() => {
    // Procurement receipts (Purchases) go to Warehouses only
    return warehouses.map(w => ({ ...w, _id: w._id || w.id, name: w.name }));
  }, [warehouses]);

  const supplierMap = useMemo(() => 
    suppliers.reduce((acc, s) => ({ ...acc, [s._id || s.id]: s.name || s.supplierName }), {}),
  [suppliers]);

  const locationMap = useMemo(() => {
    const combined = [...warehouses, ...stores];
    return combined.reduce((acc, l) => ({ ...acc, [l._id || l.id]: l.name }), {});
  }, [warehouses, stores]);

  // Resolve location name from populated object or ID map
  const resolveLocation = (row) => {
    // Try populated object first (storeId is now populated from backend)
    const storeObj = row.storeId;
    if (storeObj && typeof storeObj === 'object') return storeObj.name || '—';
    // Fallback to ID map
    const id = storeObj || row.warehouseId;
    return locationMap[id] || '—';
  };

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return (purchases || []).filter((row) => {
      if (!row) return false; // guard against undefined entries in Redux state
      const sName = supplierMap[row.supplierId?._id || row.supplierId] || '';
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
                  {paginatedRows.filter(Boolean).map((row) => (
                    <TableRow key={row._id || row.id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{row.purchaseNumber || 'PV-NEW'}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: -0.2 }}>Ref: {row.invoiceNumber || '-'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{supplierMap[row.supplierId?._id || row.supplierId] || row.supplierId?.name || row.supplierId?.supplierName || 'Unknown'}</TableCell>
                      <TableCell>{new Date(row.invoiceDate || row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell>{resolveLocation(row)}</TableCell>
                      <TableCell align="right">{row.totalQuantity || row.totals?.totalQuantity || '-'}</TableCell>
                      <TableCell align="right">₹ {(row.grandTotal || row.totals?.netAmount || 0).toFixed(2)}</TableCell>
                      <TableCell><PurchaseStatusChip status={row.status} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="info" onClick={() => setSelectedPurchase(row)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                          <IconButton 
                            size="small" color="primary" 
                            disabled={row.status === 'CANCELLED' || row.status === 'POSTED' || row.status === 'APPROVED'}
                            onClick={() => navigate(getPurchaseEditPath(row._id || row.id))}
                            title="Edit Draft"
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          
                          {row.status === 'DRAFT' && (
                            <IconButton 
                              size="small" color="success" 
                              onClick={() => {
                                if(window.confirm('Post this voucher to accounts? This will lock the record.')) {
                                  dispatch(postPurchase(row._id || row.id));
                                }
                              }}
                              title="Post to Accounts"
                            >
                              <CheckCircleOutlinedIcon fontSize="small" />
                            </IconButton>
                          )}

                           <IconButton 
                                size="small" color="secondary" 
                                disabled={row.status === 'DRAFT' || row.status === 'CANCELLED'}
                                onClick={() => setBarcodePrintPurchase(row)} 
                                title={row.status === 'DRAFT' ? "Wait: Post voucher to enable barcode printing" : "Print Barcodes"}
                           >
                             <LocalPrintshopOutlinedIcon fontSize="small" />
                           </IconButton>
                          <IconButton 
                            size="small" color="warning" 
                            disabled={row.status === 'CANCELLED'}
                            onClick={() => navigate(getPurchaseReturnPath(row._id || row.id))}
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
            <TablePagination component="div" count={filteredRows.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
          </>
        ) : (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No purchase vouchers found.</Typography>
            <Button variant="contained" onClick={() => navigate(purchaseNewPath)}>{addButtonLabel}</Button>
          </Box>
        )}
      </Paper>

      <PurchaseDetailDialog 
        open={Boolean(selectedPurchase)} 
        onClose={() => setSelectedPurchase(null)} 
        purchase={selectedPurchase} 
        supplierName={selectedPurchase ? (supplierMap[selectedPurchase.supplierId?._id || selectedPurchase.supplierId] || selectedPurchase.supplierId?.name || '') : ''} 
        warehouseName={selectedPurchase ? locationMap[selectedPurchase.storeId || selectedPurchase.warehouseId] : ''} 
        onPrintBarcodes={setBarcodePrintPurchase}
      />
      {barcodePrintPurchase && <BarcodePrintDialog open={true} onClose={() => setBarcodePrintPurchase(null)} purchase={barcodePrintPurchase} lines={(barcodePrintPurchase?.products || []).map(p => ({ ...p, sku: p.sku, itemName: p.itemName, size: p.size, color: p.color, quantity: p.quantity, rate: p.rate, variantId: p.variantId }))} warehouseMap={locationMap} />}
    </>
  );
}

function PurchaseStatusChip({ status }) {
  const s = String(status || '').toUpperCase();
  const color = (s === 'POSTED' || s === 'APPROVED' || s === 'RECEIVED') ? 'success' : s === 'DRAFT' ? 'info' : s === 'CANCELLED' ? 'error' : 'default';
  return <Chip size="small" color={color} variant="filled" label={status || 'Unknown'} sx={{ fontWeight: 600 }} />;
}

export default PurchaseListPage;
