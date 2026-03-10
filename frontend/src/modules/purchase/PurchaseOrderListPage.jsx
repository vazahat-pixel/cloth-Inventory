import { useEffect, useMemo, useState } from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchaseOrders } from './purchaseSlice';
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';

function PurchaseOrderListPage() {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const orders = useSelector((state) => state.purchase.orders || []);
    const suppliers = useSelector((state) => state.masters.suppliers || []);
    const warehouses = useSelector((state) => state.masters.warehouses || []);

    const [searchText, setSearchText] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(fetchPurchaseOrders());
        dispatch(fetchMasters('suppliers'));
        dispatch(fetchMasters('warehouses'));
    }, [dispatch]);

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

        return orders.filter((row) => {
            const supplierName = supplierMap[row.supplierId] || '';
            const matchesSearch = query
                ? (row.orderNumber || '').toLowerCase().includes(query) ||
                supplierName.toLowerCase().includes(query)
                : true;

            const matchesWarehouse =
                warehouseFilter === 'all' ? true : row.warehouseId === warehouseFilter;

            const matchesDateFrom = dateFrom ? row.orderDate >= dateFrom : true;
            const matchesDateTo = dateTo ? row.orderDate <= dateTo : true;

            return matchesSearch && matchesWarehouse && matchesDateFrom && matchesDateTo;
        });
    }, [dateFrom, dateTo, orders, searchText, supplierMap, warehouseFilter]);

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
                                1. Purchase Orders
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                                Create and manage orders to send to your suppliers.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => navigate('/purchase/orders/new')}
                        >
                            Add Purchase Order
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
                            placeholder="Search by order no or supplier"
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
                            label="Warehouse"
                            value={warehouseFilter}
                            onChange={(event) => {
                                setPage(0);
                                setWarehouseFilter(event.target.value);
                            }}
                            sx={{ minWidth: 180 }}
                        >
                            <MenuItem value="all">All Warehouses</MenuItem>
                            {warehouses.map((warehouse) => (
                                <MenuItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </MenuItem>
                            ))}
                        </TextField>

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
                                        <TableCell sx={{ fontWeight: 700 }}>Order Number</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Order Date</TableCell>
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
                                            <TableCell sx={{ fontWeight: 700 }}>{row.orderNumber}</TableCell>
                                            <TableCell>{supplierMap[row.supplierId] || row.supplierName || ''}</TableCell>
                                            <TableCell>{row.orderDate}</TableCell>
                                            <TableCell>{warehouseMap[row.warehouseId] || row.warehouseName || ''}</TableCell>
                                            <TableCell align="right">{row.totals?.totalQuantity ?? '-'}</TableCell>
                                            <TableCell align="right">{row.totals?.netAmount != null ? Number(row.totals.netAmount).toFixed(2) : '-'}</TableCell>
                                            <TableCell>
                                                <OrderStatusChip status={row.status} />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => navigate(`/purchase/orders/${row.id}`)}
                                                        title="Edit / View"
                                                    >
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => navigate(`/purchase/new?orderId=${row.id}`)}
                                                        title="Convert to Bill"
                                                    >
                                                        <ReceiptOutlinedIcon fontSize="small" />
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
                            No purchase orders found.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                            Create your first purchase order for your suppliers.
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/purchase/orders/new')}>
                            Add Purchase Order
                        </Button>
                    </Box>
                )}
            </Paper>
        </>
    );
}

function OrderStatusChip({ status }) {
    const normalized = String(status || '').toLowerCase();
    const color =
        normalized === 'completed'
            ? 'success'
            : normalized === 'pending'
                ? 'warning'
                : 'default';

    return <Chip size="small" color={color} variant="outlined" label={status || 'Pending'} />;
}

export default PurchaseOrderListPage;
