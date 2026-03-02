import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPriceLists } from './pricingSlice';
import { fetchItems } from '../items/itemsSlice';
import { fetchMasters } from '../masters/mastersSlice';
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { setPriceListStatus } from './pricingSlice';

const PRICING_METHOD_LABELS = {
  fixed: 'Fixed Price',
  discount_mrp: 'Discount on MRP (%)',
  markup_cost: 'Markup on Cost (%)',
};

const APPLICABLE_CUSTOMERS_LABELS = {
  all: 'All Customers',
  selected: 'Selected Customers',
  group: 'Customer Group',
};

const APPLICABLE_ITEMS_LABELS = {
  all: 'All Items',
  selected: 'Selected Items',
  group: 'Item Group',
};

function PriceListPage() {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const priceLists = useSelector((state) => state.pricing.priceLists);
  const customers = useSelector((state) => state.masters.customers || []);
  const itemGroups = useSelector((state) => state.masters.itemGroups);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDetails, setViewDetails] = useState(null);

  useEffect(() => {
    dispatch(fetchPriceLists());
    dispatch(fetchItems());
    dispatch(fetchMasters('customers'));
    dispatch(fetchMasters('itemGroups'));
  }, [dispatch]);

  const customerMap = useMemo(
    () => customers.reduce((acc, c) => ({ ...acc, [c.id]: c.customerName }), [customers]),
  );

  const itemGroupMap = useMemo(
    () => itemGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.groupName }), [itemGroups]),
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return priceLists.filter((row) => {
      const matchesSearch = query ? row.name.toLowerCase().includes(query) : true;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [priceLists, searchText, statusFilter]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleToggleStatus = (row) => {
    dispatch(
      setPriceListStatus({
        id: row.id,
        status: row.status === 'Active' ? 'Inactive' : 'Active',
      }),
    );
  };

  const getApplicableCustomersLabel = (row) => {
    if (row.applicableCustomers === 'all') return APPLICABLE_CUSTOMERS_LABELS.all;
    if (row.applicableCustomers === 'group' && row.customerGroupId) {
      return itemGroupMap[row.customerGroupId] || 'Customer Group';
    }
    if (row.applicableCustomers === 'selected' && row.selectedCustomerIds?.length) {
      return `${row.selectedCustomerIds.length} customer(s)`;
    }
    return APPLICABLE_CUSTOMERS_LABELS[row.applicableCustomers] || row.applicableCustomers;
  };

  const getApplicableItemsLabel = (row) => {
    if (row.applicableItems === 'all') return APPLICABLE_ITEMS_LABELS.all;
    if (row.applicableItems === 'group' && row.itemGroupId) {
      return itemGroupMap[row.itemGroupId] || 'Item Group';
    }
    if (row.applicableItems === 'selected' && row.selectedItemIds?.length) {
      return `${row.selectedItemIds.length} item(s)`;
    }
    return APPLICABLE_ITEMS_LABELS[row.applicableItems] || row.applicableItems;
  };

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
                Price Lists
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage price lists, discounts, and markup rules for items and customers.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/pricing/price-lists/new')}
            >
              Add Price List
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
              placeholder="Search by name"
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
                    <TableCell sx={{ fontWeight: 700 }}>Price List Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Applicable To</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Applicable Items</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Pricing Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Valid From</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Valid To</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell>{getApplicableCustomersLabel(row)}</TableCell>
                      <TableCell>{getApplicableItemsLabel(row)}</TableCell>
                      <TableCell>{PRICING_METHOD_LABELS[row.pricingMethod] || row.pricingMethod}</TableCell>
                      <TableCell>{row.validity?.from || '-'}</TableCell>
                      <TableCell>{row.validity?.to || '-'}</TableCell>
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
                            color="info"
                            onClick={() => setViewDetails(row)}
                            title="View details"
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/pricing/price-lists/${row.id}/edit`)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={row.status === 'Active' ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(row)}
                            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
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
              No price lists found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Create a price list to define pricing rules for items and customers.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/pricing/price-lists/new')}>
              Add Price List
            </Button>
          </Box>
        )}
      </Paper>

      {viewDetails && (
        <PriceListDetailDialog
          open={Boolean(viewDetails)}
          onClose={() => setViewDetails(null)}
          priceList={viewDetails}
          customerMap={customerMap}
          itemGroupMap={itemGroupMap}
          getApplicableCustomersLabel={getApplicableCustomersLabel}
          getApplicableItemsLabel={getApplicableItemsLabel}
        />
      )}
    </>
  );
}

function PriceListDetailDialog({
  open,
  onClose,
  priceList,
  customerMap,
  itemGroupMap,
  getApplicableCustomersLabel,
  getApplicableItemsLabel,
}) {
  const items = useSelector((state) => state.items.records);
  const variantMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      item.variants?.forEach((v) => {
        map[v.id] = `${item.name} (${v.size}/${v.color})`;
      });
    });
    return map;
  }, [items]);

  if (!priceList) return null;

  const assignedCustomers =
    priceList.applicableCustomers === 'selected' && priceList.selectedCustomerIds?.length
      ? priceList.selectedCustomerIds.map((id) => customerMap[id] || id)
      : [];

  const assignedItems =
    priceList.rules?.length &&
    priceList.rules.map((r) => ({
      variant: variantMap[r.variantId] || r.variantId,
      basePrice: r.basePrice,
      discount: r.discountPercent,
      finalPrice: r.finalPrice,
    }));

  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.5)',
        zIndex: 1300,
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      onClick={onClose}
    >
      <Paper
        elevation={4}
        sx={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', p: 3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          {priceList.name}
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Applicable To
            </Typography>
            <Typography variant="body2">{getApplicableCustomersLabel(priceList)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              Applicable Items
            </Typography>
            <Typography variant="body2">{getApplicableItemsLabel(priceList)}</Typography>
          </Box>
          {assignedCustomers.length ? (
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                Assigned Customers
              </Typography>
              <Typography variant="body2">{assignedCustomers.join(', ')}</Typography>
            </Box>
          ) : null}
        </Stack>
        {assignedItems?.length ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Item-wise Pricing
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item / Variant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Base Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Discount %
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Final Price
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedItems.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{r.variant}</TableCell>
                      <TableCell align="right">{r.basePrice}</TableCell>
                      <TableCell align="right">{r.discount ?? '-'}</TableCell>
                      <TableCell align="right">{r.finalPrice?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Paper>
    </Box>
  );
}

export default PriceListPage;
