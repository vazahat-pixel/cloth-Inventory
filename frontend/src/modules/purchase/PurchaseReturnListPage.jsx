import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { fetchPurchaseReturns, fetchPurchases } from './purchaseSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { useAppNavigate } from '../../hooks/useAppNavigate';

function PurchaseReturnListPage() {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  
  const returns = useSelector((state) => state.purchase.returns || []);
  const suppliers = useSelector((state) => state.masters.suppliers || []);
  const warehouses = useSelector((state) => state.masters.warehouses || []);
  const stores = useSelector((state) => state.masters.stores || []);

  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchPurchaseReturns());
    dispatch(fetchPurchases());
    dispatch(fetchMasters('suppliers'));
    dispatch(fetchMasters('warehouses'));
    dispatch(fetchMasters('stores'));
  }, [dispatch]);

  const supplierMap = useMemo(() => 
    suppliers.reduce((acc, s) => ({ ...acc, [s.id || s._id]: s.supplierName || s.name }), {}),
    [suppliers]
  );

  const locationMap = useMemo(() => {
    const combined = [...warehouses, ...stores];
    return combined.reduce((acc, l) => ({ ...acc, [l.id || l._id]: l.name || l.warehouseName || l.storeName }), {});
  }, [warehouses, stores]);

  const filteredRows = useMemo(() => {
    const query = searchText.toLowerCase();
    return returns.filter((row) => {
      const returnNo = row.returnNumber?.toLowerCase() || '';
      const supplier = supplierMap[row.supplierId]?.toLowerCase() || '';
      const reason = row.reason?.toLowerCase() || '';
      return returnNo.includes(query) || supplier.includes(query) || reason.includes(query);
    });
  }, [returns, searchText, supplierMap]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>Purchase Returns</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>History of goods returned to suppliers.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/ho/purchase/purchase-voucher')}
        >
          New Return (Select Bill)
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search returns..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Return No.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <TableRow key={row._id || row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.returnNumber}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{locationMap[row.locationId] || row.locationId}</TableCell>
                    <TableCell align="right">₹{Number(row.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{row.reason || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label="Approved" size="small" color="success" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" title="View Details">
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No purchase returns found.</Typography>
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
    </Box>
  );
}

export default PurchaseReturnListPage;
