import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Card,
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from '@mui/icons-material/FilterList';

import { fetchRawMaterials, deleteRawMaterial } from './rawMaterialSlice';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/erp/PageHeader';

const RawMaterialListPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const basePath = useRoleBasePath();

    const { records, loading } = useSelector((s) => s.rawMaterial);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        dispatch(fetchRawMaterials({ type: typeFilter, search: searchTerm }));
    }, [dispatch, typeFilter, searchTerm]);

    const filteredRecords = useMemo(() => {
        return records.filter(r =>
            (typeFilter === 'all' || r.materialType === typeFilter) &&
            (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [records, typeFilter, searchTerm]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            await dispatch(deleteRawMaterial(id));
        }
    };

    return (
        <Box>
            <PageHeader
                title="Raw Material Registry"
                subtitle="Manage factory supplies including Fabric, Threads, Button, and Packaging."
                breadcrumbs={[{ label: 'Inventory' }, { label: 'Raw Materials', active: true }]}
                actions={[
                    <Button
                        key="add"
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => navigate(`${basePath}/inventory/raw-materials/new`)}
                        sx={{ bgcolor: '#2563eb' }}
                    >
                        Create New Material
                    </Button>
                ]}
            />

            <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, mb: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ p: 2.5 }}>
                        <TextField
                            placeholder="🔍 Search by name or code..."
                            size="small"
                            fullWidth
                            sx={{ maxWidth: 400 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                            }}
                        />
                        <TextField
                            select
                            label="Filter Category"
                            size="small"
                            sx={{ width: 220 }}
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Materials</MenuItem>
                            <MenuItem value="FABRIC">Fabrics</MenuItem>
                            <MenuItem value="ACCESSORY">Accessories</MenuItem>
                            <MenuItem value="PACKAGING">Packaging</MenuItem>
                        </TextField>
                    </Stack>

                    <TableContainer>
                        <Table stickyHeader size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Material Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Current Stock</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                    <TableRow key={row._id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>{row.composition || row.shadeNo || '-'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.materialType} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9', fontSize: '0.65rem' }} />
                                        </TableCell>
                                        <TableCell>{row.uom}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: row.currentStock <= row.reorderLevel ? '#ef4444' : '#10b981' }}>
                                            {row.currentStock} {row.uom}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status}
                                                size="small"
                                                color={row.status === 'Active' ? 'success' : 'default'}
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <IconButton size="small" color="primary" onClick={() => navigate(`${basePath}/inventory/raw-materials/edit/${row._id}`)}>
                                                    <EditOutlinedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}>
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>No factory materials found matching filters.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filteredRecords.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                    />
                </Card>
            </Box>
        </Box>
    );
};

export default RawMaterialListPage;
