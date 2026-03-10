import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import {
    Box,
    Button,
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
import { fetchChallans } from './dispatchSlice';

function DeliveryChallanPage() {
    const navigate = useAppNavigate();
    const dispatch = useDispatch();
    const challans = useSelector((state) => state.dispatch.records || []);

    useEffect(() => {
        dispatch(fetchChallans());
    }, [dispatch]);

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
                            Delivery Challans
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Manage dispatches from warehouse to store.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => navigate('/orders/delivery-challan/new')}
                    >
                        Create Challan
                    </Button>
                </Stack>
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {challans.map((row) => (
                                <TableRow key={row.id || row._id} hover>
                                    <TableCell sx={{ fontWeight: 700 }}>{row.challanNumber || row.dispatchNumber}</TableCell>
                                    <TableCell>{row.date || row.dispatchDate}</TableCell>
                                    <TableCell>{row.storeName || row.destination?.name || 'Store'}</TableCell>
                                    <TableCell>{row.vehicleNumber || '-'} / {row.driverName || '-'}</TableCell>
                                    <TableCell>{row.status || 'Pending'}</TableCell>
                                </TableRow>
                            ))}
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
                    <Button variant="contained" onClick={() => navigate('/orders/delivery-challan/new')}>
                        Create Delivery Challan
                    </Button>
                </Box>
            )}
        </Paper>
    );
}

export default DeliveryChallanPage;
