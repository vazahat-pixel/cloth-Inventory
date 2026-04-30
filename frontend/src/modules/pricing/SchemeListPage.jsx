import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  IconButton,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { setSchemeStatus, fetchSchemes, deleteScheme } from './pricingSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

const SCHEME_TYPE_LABELS = {
  PERCENTAGE: 'Percentage Discount',
  PERCENTAGE_DISCOUNT: 'Percentage Discount',
  FLAT: 'Flat Discount',
  FLAT_DISCOUNT: 'Flat Discount',
  BOGO: 'BOGO (Buy 1 Get 1)',
  BUY_X_GET_Y: 'Buy X Get Y',
  FIXED_PRICE: 'Fixed Price Bundle',
  FLAT_PRICE: 'Flat Price (Target)',
  FREE_GIFT: 'Free Gift on Purchase',
  MANUAL: 'Manual Discount',
};

const APPLICABILITY_LABELS = {
  item: 'Specific Items',
  category: 'Categories',
  brand: 'Brands',
  all: 'Store Wide',
};

function SchemeListPage() {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSchemes());
    dispatch(fetchMasters('categories'));
    dispatch(fetchMasters('brands'));
    dispatch(fetchItems());
  }, [dispatch]);

  const schemes = useSelector((state) => state.pricing.schemes);
  const items = useSelector((state) => state.items.records);
  const categories = useSelector((state) => state.masters.categories || []);
  const brands = useSelector((state) => state.masters.brands || []);

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const categoryMap = useMemo(
    () => categories.reduce((acc, c) => ({ ...acc, [c.id]: c.name || c.categoryName }), {}),
    [categories]
  );
  const brandMap = useMemo(
    () => brands.reduce((acc, b) => ({ ...acc, [b.id]: b.name || b.brandName }), {}),
    [brands]
  );

  const getApplicabilityLabel = (scheme) => {
    if (scheme.applicableProducts?.length) return `Items (${scheme.applicableProducts.length})`;
    if (scheme.applicableCategories?.length) return `Categories (${scheme.applicableCategories.length})`;
    if (scheme.applicableBrands?.length) return `Brands (${scheme.applicableBrands.length})`;
    return 'All Products';
  };

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return schemes.filter((row) => {
      const matchesSearch = query ? row.name.toLowerCase().includes(query) : true;
      const matchesType = typeFilter === 'all' || row.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'ACTIVE' ? row.isActive : !row.isActive);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [schemes, searchText, typeFilter, statusFilter]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleToggleStatus = (row) => {
    dispatch(
      setSchemeStatus({
        id: row.id || row._id,
        status: row.isActive ? 'INACTIVE' : 'ACTIVE',
      }),
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this scheme?')) {
      dispatch(deleteScheme(id));
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Promotional Schemes
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Create and manage discounts, BOGO, and buy-X-get-Y offers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/pricing/schemes/new')}
          sx={{ borderRadius: 2.5, px: 3, py: 1.2, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
        >
          Create New Scheme
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by scheme name..."
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2.5, bgcolor: '#f8fafc' }
            }}
          />
          <TextField
            size="small"
            select
            label="Scheme Type"
            value={typeFilter}
            onChange={(e) => {
              setPage(0);
              setTypeFilter(e.target.value);
            }}
            sx={{ minWidth: 200 }}
            SelectProps={{ native: true }}
            InputProps={{ sx: { borderRadius: 2.5 } }}
          >
            <option value="all">All Types</option>
            {Object.entries(SCHEME_TYPE_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Display Status"
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
            sx={{ minWidth: 160 }}
            SelectProps={{ native: true }}
            InputProps={{ sx: { borderRadius: 2.5 } }}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </TextField>
        </Stack>

        {filteredRows.length ? (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Scheme Information</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Benefit / Value</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Applicable On</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id || row._id} hover>
                      <TableCell sx={{ py: 2.5 }}>
                        <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{row.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Validity: {row.startDate ? new Date(row.startDate).toLocaleDateString() : 'Always'} — {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'No Expiry'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={SCHEME_TYPE_LABELS[row.type?.toUpperCase()] || row.type} 
                          size="small" 
                          sx={{ fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {(row.type?.toUpperCase() === 'PERCENTAGE' || row.type?.toUpperCase() === 'PERCENTAGE_DISCOUNT') && `${row.value}% OFF`}
                          {(row.type?.toUpperCase() === 'FLAT' || row.type?.toUpperCase() === 'FLAT_DISCOUNT') && `₹${row.value} OFF`}
                          {row.type?.toUpperCase() === 'BOGO' && 'Buy 1 Get 1'}
                          {row.type?.toUpperCase() === 'BUY_X_GET_Y' && `Buy ${row.buyQuantity} Get ${row.getQuantity}`}
                          {row.type?.toUpperCase() === 'FREE_GIFT' && 'Free Gift'}
                          {row.type?.toUpperCase() === 'FLAT_PRICE' && `Target ₹${row.value}`}
                          {row.type?.toUpperCase() === 'MANUAL' && `₹${row.value} (Manual)`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          {getApplicabilityLabel(row)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={row.isActive ? 'success' : 'default'}
                          variant="outlined"
                          label={row.isActive ? 'ACTIVE' : 'INACTIVE'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/pricing/schemes/${row.id || row._id}/edit`)}
                            sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={row.isActive ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(row)}
                            sx={{ 
                              bgcolor: row.isActive ? '#fff7ed' : '#f0fdf4',
                              '&:hover': { bgcolor: row.isActive ? '#ffedd5' : '#dcfce7' }
                            }}
                          >
                            {row.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(row.id || row._id)}
                            sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
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
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20]}
              sx={{ borderTop: '1px solid #f1f5f9' }}
            />
          </>
        ) : (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>No schemes found</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1, mb: 3 }}>
              Try adjusting your search or filters to find what you're looking for.
            </Typography>
            <Button variant="outlined" onClick={() => { setSearchText(''); setTypeFilter('all'); setStatusFilter('all'); }}>
              Clear All Filters
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default SchemeListPage;
