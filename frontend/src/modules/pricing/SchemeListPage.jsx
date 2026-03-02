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
import { setSchemeStatus, fetchSchemes } from './pricingSlice';
import { fetchMasters } from '../masters/mastersSlice';
import { fetchItems } from '../items/itemsSlice';

const SCHEME_TYPE_LABELS = {
  percentage_discount: 'Percentage Discount',
  flat_discount: 'Flat Discount',
  buy_x_get_y: 'Buy X Get Y',
  free_gift: 'Free Gift',
};

const APPLICABILITY_LABELS = {
  item: 'Item',
  itemGroup: 'Item Group',
  brand: 'Brand',
  company: 'Company',
};

function SchemeListPage() {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSchemes());
    dispatch(fetchMasters('itemGroups'));
    dispatch(fetchMasters('brands'));
    dispatch(fetchItems());
  }, [dispatch]);

  const schemes = useSelector((state) => state.pricing.schemes);
  const items = useSelector((state) => state.items.records);
  const itemGroups = useSelector((state) => state.masters.itemGroups);
  const brands = useSelector((state) => state.masters.brands || []);

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const itemMap = useMemo(
    () => items.reduce((acc, i) => ({ ...acc, [i.id]: i.name }), [items]),
  );
  const itemGroupMap = useMemo(
    () => itemGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.groupName }), [itemGroups]),
  );
  const brandMap = useMemo(
    () => (brands?.length ? brands.reduce((acc, b) => ({ ...acc, [b.id]: b.brandName }), {}) : {}),
    [brands],
  );

  const getApplicabilityLabel = (scheme) => {
    const type = scheme.applicability?.type || 'item';
    const ids = scheme.applicability?.ids || [];
    const label = APPLICABILITY_LABELS[type] || type;
    if (ids.length === 0) return label;
    if (type === 'item') return `${label} (${ids.length})`;
    if (type === 'itemGroup' && ids[0]) return itemGroupMap[ids[0]] || label;
    if (type === 'brand' && ids[0]) return brandMap[ids[0]] || label;
    return `${label} (${ids.length})`;
  };

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return schemes.filter((row) => {
      const matchesSearch = query ? row.name.toLowerCase().includes(query) : true;
      const matchesType = typeFilter === 'all' || row.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
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
        id: row.id,
        status: row.status === 'Active' ? 'Inactive' : 'Active',
      }),
    );
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Promotional Schemes
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Manage percentage discounts, flat discounts, buy X get Y, and free gift offers.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate('/pricing/schemes/new')}
          >
            Add Scheme
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by scheme name"
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
            size="small"
            select
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setPage(0);
              setTypeFilter(e.target.value);
            }}
            sx={{ minWidth: 180 }}
            SelectProps={{ native: true }}
          >
            <option value="all">All Types</option>
            {Object.entries(SCHEME_TYPE_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>
                {lbl}
              </option>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setPage(0);
              setStatusFilter(e.target.value);
            }}
            sx={{ minWidth: 140 }}
            SelectProps={{ native: true }}
          >
            <option value="all">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </TextField>
        </Stack>
      </Stack>

      {filteredRows.length ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Scheme Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Applicable On</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Validity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{SCHEME_TYPE_LABELS[row.type] || row.type}</TableCell>
                    <TableCell>{getApplicabilityLabel(row)}</TableCell>
                    <TableCell>
                      {row.validity?.from} — {row.validity?.to}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={row.status === 'Active' ? 'success' : 'default'}
                        variant="outlined"
                        label={row.status}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/pricing/schemes/${row.id}/edit`)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={row.status === 'Active' ? 'warning' : 'success'}
                          onClick={() => handleToggleStatus(row)}
                          title={row.status === 'Active' ? 'Disable' : 'Enable'}
                        >
                          {row.status === 'Active' ? (
                            <ToggleOffIcon fontSize="small" />
                          ) : (
                            <ToggleOnIcon fontSize="small" />
                          )}
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
          />
        </>
      ) : (
        <Box sx={{ py: 7, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            No schemes found.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Create promotional schemes for discounts and free gifts.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/pricing/schemes/new')}>
            Add Scheme
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default SchemeListPage;
