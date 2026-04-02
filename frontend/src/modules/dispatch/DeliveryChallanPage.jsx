import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { fetchChallans, updateChallanStatus } from './dispatchSlice';

function DeliveryChallanPage({
    pageTitle = 'Delivery Challans',
    pageDescription = 'Manage dispatches from warehouse to store and confirm receipts.',
    createPath = '/orders/delivery-challan/new',
    createLabel = 'Create Challan',
}) {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const { records: challans = [], loading, error } = useSelector((state) => state.dispatch);

    useEffect(() => {
        dispatch(fetchChallans());
    }, [dispatch]);

    const handleMarkReceived = (row) => {
        const id = row.id || row._id;
        if (!id) return;
        dispatch(updateChallanStatus({ id, status: 'RECEIVED' }));
    };

    const renderStatusChip = (status) => {
        const value = status || 'PENDING';
        let color = 'default';
        if (value === 'SHIPPED') color = 'warning';
        if (value === 'RECEIVED') color = 'success';
        return <Chip label={value} color={color} size="small" />;
    };

    const canReceive = (row) => {
        const status = row.status || 'PENDING';
        return status === 'SHIPPED';
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
                            {pageTitle}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {pageDescription}
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => navigate(createPath)}
                    >
                        {createLabel}
                    </Button>
                </Stack>

                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}
            </Stack>

            {challans.length > 0 ? (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Challan No</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>To Store</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Vehicle / Driver</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {challans.map((row) => {
                                const status = row.status || 'PENDING';
                                const receiveAllowed = canReceive(row);
                                return (
                                    <TableRow key={row.id || row._id} hover>
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {row.challanNumber || row.dispatchNumber}
                                        </TableCell>
                                        <TableCell>
                                            {row.dispatchedAt ? new Date(row.dispatchedAt).toLocaleDateString() : (row.date || row.dispatchDate || '-')}
                                        </TableCell>
                                        <TableCell>
                                            {row.destinationStoreId?.name || row.storeName || row.destination?.name || 'Store'}
                                        </TableCell>
                                        <TableCell>
                                            {row.vehicleNumber || '-'} / {row.driverName || '-'}
                                        </TableCell>
                                        <TableCell>{renderStatusChip(status)}</TableCell>
                                        <TableCell align="right">
                                            {receiveAllowed && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    disabled={loading}
                                                    onClick={() => handleMarkReceived(row)}
                                                >
                                                    Mark Received
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box sx={{ py: 7, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                        No Delivery Challans Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        You haven't dispatched any items to the stores yet.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate(createPath)}>
                        {createLabel}
                    </Button>
                </Box>
            )}
        </Paper>
    );
}

export default DeliveryChallanPage;
