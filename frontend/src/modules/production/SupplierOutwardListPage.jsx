import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Chip, Divider,
    Grid, IconButton, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';

import { fetchOutwards } from './productionSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';

function SupplierOutwardListPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const { outwards, loading } = useSelector((s) => s.production);

    useEffect(() => {
        dispatch(fetchOutwards());
    }, [dispatch]);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Job Work / Production Issues
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Track raw materials issued to tailors and manufacturing units.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`${basePath}/production/outwards/new`)}
                    sx={{ px: 3, borderRadius: 2, fontWeight: 700 }}
                >
                    New Material Issue
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {/* Stats Summary */}
                <Grid item xs={12} md={3}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, textAlign: 'center', p: 1 }}>
                        <CardContent>
                            <Typography variant="h3" sx={{ fontWeight: 900, color: '#2563eb' }}>{outwards.length}</Typography>
                            <Typography variant="subtitle2" sx={{ color: '#64748b' }}>Total Outwards</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={9}>
                    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Outward #</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Job Worker (Tailor)</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {outwards.map((row) => (
                                        <TableRow key={row._id} hover>
                                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.outwardNumber}</TableCell>
                                            <TableCell>{new Date(row.outwardDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.supplierId?.name || row.supplierId?.supplierName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>{row.warehouseId?.name}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {row.items?.length} Items
                                                <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                                                    {row.items?.[0]?.itemId?.itemName}...
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.status}
                                                    size="small"
                                                    color={row.status === 'COMPLETED' ? 'success' : 'warning'}
                                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={() => navigate(`${basePath}/production/outwards/view/${row._id}`)}>
                                                    <VisibilityOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {outwards.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                <HistoryToggleOffIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                                                <Typography variant="body2" sx={{ color: '#94a3b8' }}>No job work records found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default SupplierOutwardListPage;
