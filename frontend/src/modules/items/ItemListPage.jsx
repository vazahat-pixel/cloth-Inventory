import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
  Box,
  Button,
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
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StatusChip from '../masters/components/StatusChip';
import { deleteItem } from './itemsSlice';

const getTotalStock = (item) =>
  item.variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

function ItemListPage() {
  const navigate = useAppNavigate();
  const dispatch = useDispatch();

  const items = useSelector((state) => state.items.records);
  const brands = useSelector((state) => state.masters?.brands || []);
  const itemGroups = useSelector((state) => state.masters?.itemGroups || []);

  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = query
        ? item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)
        : true;

      const matchesBrand = brandFilter === 'all' ? true : item.brand === brandFilter;
      const matchesCategory = categoryFilter === 'all' ? true : item.category === categoryFilter;

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [brandFilter, categoryFilter, items, searchText]);

  const paginatedItems = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredItems.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredItems, page, rowsPerPage]);

  const handleDeleteItem = () => {
    if (itemToDelete) {
      dispatch(deleteItem(itemToDelete.id));
    }
    setItemToDelete(null);
  };

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                Items
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Manage apparel parent styles and their variant-level pricing and stock.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/items/new')}
            >
              Add Item
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
              placeholder="Search by item name or code"
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
              label="Brand"
              value={brandFilter}
              onChange={(event) => {
                setPage(0);
                setBrandFilter(event.target.value);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All Brands</MenuItem>
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.brandName}>
                  {brand.brandName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              select
              label="Category"
              value={categoryFilter}
              onChange={(event) => {
                setPage(0);
                setCategoryFilter(event.target.value);
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {itemGroups.map((group) => (
                <MenuItem key={group.id} value={group.groupName}>
                  {group.groupName}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {filteredItems.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 170 }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Style Code</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 110 }} align="right">
                      Variants
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 120 }} align="right">
                      Total Stock
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</Typography>
                      </TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.variants.length}</TableCell>
                      <TableCell align="right">{getTotalStock(item)}</TableCell>
                      <TableCell>
                        <StatusChip value={item.status} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.25}>
                          <IconButton size="small" color="info" onClick={() => setViewItem(item)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/items/${item.id}/edit`)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setItemToDelete(item)}>
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
              count={filteredItems.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 8, 10, 20]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, px: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No items found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Add your first parent item style to begin variant-based inventory management.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/items/new')}
            >
              Create Item
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog open={Boolean(itemToDelete)} onClose={() => setItemToDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            Are you sure you want to delete "{itemToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setItemToDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteItem}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(viewItem)} onClose={() => setViewItem(null)} fullWidth maxWidth="sm">
        <DialogTitle>Item Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Typography variant="body2">
              <strong>Name:</strong> {viewItem?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Style Code:</strong> {viewItem?.code}
            </Typography>
            <Typography variant="body2">
              <strong>Brand:</strong> {viewItem?.brand}
            </Typography>
            <Typography variant="body2">
              <strong>Category:</strong> {viewItem?.category}
            </Typography>
            <Typography variant="body2">
              <strong>Total Variants:</strong> {viewItem?.variants?.length || 0}
            </Typography>
            <Typography variant="body2">
              <strong>Total Stock:</strong> {viewItem ? getTotalStock(viewItem) : 0}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {viewItem?.status}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewItem(null)}>Close</Button>
          {viewItem && (
            <Button
              variant="contained"
              onClick={() => {
                const itemId = viewItem.id;
                setViewItem(null);
                navigate(`/items/${itemId}/edit`);
              }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ItemListPage;
