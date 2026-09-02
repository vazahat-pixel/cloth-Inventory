import { useEffect, useMemo, useState } from 'react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { fetchStockReturns, receiveStockReturn } from './stockReturnSlice';
import { fetchMasters } from '../masters/mastersSlice';

function StoreReturnReceivePage() {
  const dispatch = useDispatch();
  
  const returns = useSelector((state) => state.stockReturn.returns || []);
  const loading = useSelector((state) => state.stockReturn.loading);
  const error = useSelector((state) => state.stockReturn.error);
  
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [scannedItems, setScannedItems] = useState({});
  const [scannerInput, setScannerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchStockReturns());
    dispatch(fetchMasters('stores'));
    dispatch(fetchMasters('warehouses'));
  }, [dispatch]);

  const storeMap = useMemo(() => 
    stores.reduce((acc, s) => ({ ...acc, [s.id || s._id]: s.name || s.storeName }), {}),
    [stores]
  );

  const warehouseMap = useMemo(() => 
    warehouses.reduce((acc, w) => ({ ...acc, [w.id || w._id]: w.name || w.warehouseName }), {}),
    [warehouses]
  );

  const filteredRows = useMemo(() => {
    const query = searchText.toLowerCase().trim();
    return returns.filter((row) => {
      const returnNo = (row.returnNumber || '').toLowerCase();
      const storeName = (row.sourceStoreId?.name || storeMap[row.sourceStoreId] || '').toLowerCase();
      const warehouseName = (row.destinationWarehouseId?.name || warehouseMap[row.destinationWarehouseId] || '').toLowerCase();
      const reason = (row.reason || '').toLowerCase();

      const matchesSearch = returnNo.includes(query) || storeName.includes(query) || warehouseName.includes(query) || reason.includes(query);
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      const matchesStore = storeFilter === 'all' ? true : String(row.sourceStoreId?._id || row.sourceStoreId) === storeFilter;

      return matchesSearch && matchesStatus && matchesStore;
    });
  }, [returns, searchText, statusFilter, storeFilter, storeMap, warehouseMap]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleScan = (barcode) => {
    if (!selectedReturn) return;

    const matchedItem = selectedReturn.items.find(
      (item) => item.variantId?.barcode === barcode || item.variantId?.sku === barcode || item.variantId?._id === barcode
    );

    if (matchedItem) {
      setScannedItems((prev) => ({
        ...prev,
        [matchedItem.variantId?._id || matchedItem.variantId]: true,
      }));
      setScannerInput('');
    } else {
      alert('Barcode/SKU not found in this return!');
      setScannerInput('');
    }
  };

  const handleInwardReturn = async () => {
    if (!selectedReturn) return;
    setSubmitting(true);
    try {
      await dispatch(receiveStockReturn(selectedReturn._id || selectedReturn.id)).unwrap();
      alert('Stock return received and added to warehouse inventory successfully!');
      setSelectedReturn(null);
      setScannedItems({});
    } catch (err) {
      alert(err || 'Failed to receive return');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'RECEIVED':
        return { bgcolor: '#dcfce7', color: '#166534', label: 'RECEIVED' };
      case 'DISPATCHED':
        return { bgcolor: '#eff6ff', color: '#1e40af', label: 'IN TRANSIT' };
      default:
        return { bgcolor: '#f1f5f9', color: '#475569', label: status };
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Store Stock Returns (Inward)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Verify and receive physical stock returned from retail branches back into warehouses.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<AutorenewIcon />} 
          onClick={() => dispatch(fetchStockReturns())}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
          <TextField
            size="small"
            placeholder="Search returns..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
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
            label="Filter by Store"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Stores</MenuItem>
            {stores.map((s) => (
              <MenuItem key={s._id || s.id} value={s._id || s.id}>
                {s.name || s.storeName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="DISPATCHED">In Transit (Dispatched)</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
          </TextField>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, py: 1.5 }}>Initiated Date</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Return Number</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>From Store</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>To Warehouse</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} sx={{ mb: 1 }} />
                    <Typography color="textSecondary">Loading stock returns...</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row) => {
                  const statusInfo = getStatusChipColor(row.status);
                  const totalQty = row.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
                  return (
                    <TableRow key={row._id || row.id} hover>
                      <TableCell sx={{ fontSize: 13, py: 1.5 }}>
                        {row.initiatedAt ? formatDateDDMMYYYY(row.initiatedAt) : formatDateDDMMYYYY(row.createdAt)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {row.returnNumber}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {row.sourceStoreId?.name || storeMap[row.sourceStoreId] || 'Store'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {row.destinationWarehouseId?.name || warehouseMap[row.destinationWarehouseId] || 'Warehouse'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>
                        {totalQty} Pcs
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.reason || '--'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={statusInfo.label} 
                          size="small" 
                          sx={{ bgcolor: statusInfo.bgcolor, color: statusInfo.color, fontWeight: 700, fontSize: 10 }} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={row.status === 'DISPATCHED' ? <CheckCircleOutlineIcon /> : <VisibilityOutlinedIcon />}
                          color={row.status === 'DISPATCHED' ? 'success' : 'primary'}
                          onClick={() => {
                            setSelectedReturn(row);
                            setScannedItems({});
                            setScannerInput('');
                          }}
                        >
                          {row.status === 'DISPATCHED' ? 'Inward / In' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <SyncAltIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                    <Typography color="textSecondary">No store returns found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Return Reception Dialog */}
      <Dialog
        open={Boolean(selectedReturn)}
        onClose={() => !submitting && setSelectedReturn(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Store Return: {selectedReturn?.returnNumber}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                From: {selectedReturn?.sourceStoreId?.name || storeMap[selectedReturn?.sourceStoreId]} | To: {selectedReturn?.destinationWarehouseId?.name || warehouseMap[selectedReturn?.destinationWarehouseId]}
              </Typography>
            </Box>
            <Chip
              label={selectedReturn?.status}
              color={selectedReturn?.status === 'RECEIVED' ? 'success' : 'primary'}
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#fff' }}>
          {selectedReturn?.status === 'DISPATCHED' && (
            <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>
                  Verify Goods Inward
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const allVerified = {};
                    selectedReturn?.items?.forEach((item) => {
                      allVerified[item.variantId?._id || item.variantId] = true;
                    });
                    setScannedItems(allVerified);
                  }}
                >
                  Verify All Items
                </Button>
              </Stack>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Scan variant barcode, SKU or type item code to verify..."
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleScan(scannerInput);
                  }
                }}
                InputProps={{
                  sx: { borderRadius: 2, bgcolor: '#f8fafc' },
                }}
              />
            </Box>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Item Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Return Qty</TableCell>
                  {selectedReturn?.status === 'DISPATCHED' && (
                    <TableCell sx={{ fontWeight: 700 }} align="center">Verification</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedReturn?.items?.map((item, idx) => {
                  const isVerified = scannedItems[item.variantId?._id || item.variantId];
                  return (
                    <TableRow key={idx} sx={{ bgcolor: isVerified ? '#f0fdf4' : 'inherit' }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.variantId?.name || item.variantId?.itemName || 'Returned Item'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                          SKU: {item.variantId?.sku || 'N/A'}{item.variantId?.barcode && item.variantId?.barcode !== item.variantId?.sku ? ` | Barcode: ${item.variantId.barcode}` : ''} | Size: {item.variantId?.size || 'UNI'} | Color: {item.variantId?.color || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {item.qty} Pcs
                      </TableCell>
                      {selectedReturn?.status === 'DISPATCHED' && (
                        <TableCell align="center">
                          {isVerified ? (
                            <Chip label="VERIFIED" color="success" size="small" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Chip label="PENDING" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedReturn?.reason && (
            <Box sx={{ m: 3, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af' }}>
                REASON GIVEN BY STORE:
              </Typography>
              <Typography variant="body2" sx={{ color: '#1e3a8a', mt: 0.5 }}>
                {selectedReturn.reason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setSelectedReturn(null)} color="inherit" disabled={submitting}>
            Close
          </Button>
          {selectedReturn?.status === 'DISPATCHED' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleInwardReturn}
              disabled={submitting || Object.keys(scannedItems).length !== selectedReturn?.items?.length}
              sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
            >
              {submitting ? 'Processing...' : 'Confirm & Inward Stock'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default StoreReturnReceivePage;
