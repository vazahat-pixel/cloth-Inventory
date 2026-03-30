import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import hsnCodesExportColumns from '../../config/exportColumns/hsnCodes';
import api from '../../services/api';
import { hsnSeed } from '../erp/erpUiMocks';

const defaultFormValues = {
  id: '',
  hsnCode: '',
  description: '',
  gstRate: '',
  status: 'Active',
};

const toExportRows = (rows) =>
  rows.map((row) => ({
    hsn_code: row.hsnCode,
    description: row.description,
    gst_rate: row.gstRate,
    status: row.status,
    created_at: row.createdAt || '',
    updated_at: row.updatedAt || '',
  }));

function HSNCodePage() {
  const [rows, setRows] = useState(hsnSeed);
  const [searchText, setSearchText] = useState('');
  const [gstFilter, setGstFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formErrors, setFormErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRows = async () => {
      try {
        const response = await api.get('/setup/hsn');
        const data = response.data?.data || response.data?.hsns || response.data?.data?.hsns || [];
        if (!isMounted || !data.length) {
          return;
        }

        setRows(
          data.map((item) => ({
            id: item._id || item.id,
            hsnCode: item.code || item.hsnCode,
            description: item.description || '',
            gstRate: item.gstSlabId?.percentage || item.gstRate || 0,
            status: item.status || (item.isActive === false ? 'Inactive' : 'Active'),
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || '',
          })),
        );
      } catch (error) {
        console.error('Using frontend HSN fallback data.', error);
      }
    };

    loadRows();

    return () => {
      isMounted = false;
    };
  }, []);

  const gstOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => Number(row.gstRate)).filter((value) => !Number.isNaN(value)))),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = query
        ? [row.hsnCode, row.description].some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesGst = gstFilter === 'all' ? true : Number(row.gstRate) === Number(gstFilter);
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesGst && matchesStatus;
    });
  }, [gstFilter, rows, searchText, statusFilter]);

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  const openDialog = (row = null) => {
    setFormErrors({});
    setFormValues(
      row
        ? {
            id: row.id,
            hsnCode: row.hsnCode,
            description: row.description,
            gstRate: row.gstRate,
            status: row.status,
          }
        : defaultFormValues,
    );
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormValues(defaultFormValues);
  };

  const validate = () => {
    const nextErrors = {};
    if (!formValues.hsnCode.trim()) {
      nextErrors.hsnCode = 'HSN Code is required.';
    }
    if (!formValues.description.trim()) {
      nextErrors.description = 'Description is required.';
    }
    if (formValues.gstRate === '') {
      nextErrors.gstRate = 'GST Rate is required.';
    }
    setFormErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const saveRow = async () => {
    if (!validate()) {
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const payload = {
      ...formValues,
      hsnCode: formValues.hsnCode.trim(),
      description: formValues.description.trim(),
      gstRate: Number(formValues.gstRate),
      updatedAt: timestamp,
      createdAt: formValues.id ? rows.find((row) => row.id === formValues.id)?.createdAt || timestamp : timestamp,
    };

    try {
      if (formValues.id) {
        await api.patch(`/setup/hsn/${formValues.id}`, {
          code: payload.hsnCode,
          description: payload.description,
          gstRate: payload.gstRate,
          status: payload.status,
        });
      } else {
        await api.post('/setup/hsn', {
          code: payload.hsnCode,
          description: payload.description,
          gstRate: payload.gstRate,
          status: payload.status,
        });
      }
    } catch (error) {
      console.error('Saving HSN failed, retaining frontend state.', error);
    }

    setRows((previous) => (
      formValues.id
        ? previous.map((row) => (row.id === formValues.id ? { ...row, ...payload } : row))
        : [{ ...payload, id: `hsn-${Date.now()}` }, ...previous]
    ));
    closeDialog();
  };

  const deleteRow = async (row) => {
    if (!window.confirm(`Delete HSN ${row.hsnCode}?`)) {
      return;
    }

    try {
      await api.delete(`/setup/hsn/${row.id}`);
    } catch (error) {
      console.error('Deleting HSN failed, removing locally only.', error);
    }

    setRows((previous) => previous.filter((item) => item.id !== row.id));
  };

  return (
    <Box>
      <PageHeader
        title="HSN Codes"
        subtitle="Manage HSN code mapping, GST slabs, and export-ready tax master data for garment transactions."
        breadcrumbs={[
          { label: 'Setup' },
          { label: 'HSN Codes', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={exportRows}
            columns={hsnCodesExportColumns}
            filename="hsn-codes.xlsx"
            sheetName="HSN Codes"
          />,
          <Button key="add" variant="contained" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => openDialog()}>
            Add HSN
          </Button>,
        ]}
      />

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      ) : null}

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search HSN code or description"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
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
          label="GST Slab"
          value={gstFilter}
          onChange={(event) => setGstFilter(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All GST Rates</MenuItem>
          {gstOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}%
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </TextField>
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>HSN Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>GST Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{row.hsnCode}</Typography>
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{row.gstRate}%</TableCell>
                  <TableCell><StatusBadge value={row.status} /></TableCell>
                  <TableCell>{row.createdAt || '--'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => openDialog(row)}>
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteRow(row)}>
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredRows.length ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                    No HSN records found for the current filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{formValues.id ? 'Edit HSN Code' : 'Add HSN Code'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="HSN Code *"
                value={formValues.hsnCode}
                onChange={(event) => setFormValues((previous) => ({ ...previous, hsnCode: event.target.value }))}
                error={Boolean(formErrors.hsnCode)}
                helperText={formErrors.hsnCode || ' '}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="GST Rate *"
                value={formValues.gstRate}
                onChange={(event) => setFormValues((previous) => ({ ...previous, gstRate: event.target.value }))}
                error={Boolean(formErrors.gstRate)}
                helperText={formErrors.gstRate || ' '}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Description *"
                multiline
                minRows={3}
                value={formValues.description}
                onChange={(event) => setFormValues((previous) => ({ ...previous, description: event.target.value }))}
                error={Boolean(formErrors.description)}
                helperText={formErrors.description || ' '}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                value={formValues.status}
                onChange={(event) => setFormValues((previous) => ({ ...previous, status: event.target.value }))}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveRow}>
            {formValues.id ? 'Update HSN' : 'Create HSN'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HSNCodePage;
