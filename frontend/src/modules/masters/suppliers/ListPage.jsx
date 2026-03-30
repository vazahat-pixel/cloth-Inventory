import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import PageHeader from '../../../components/erp/PageHeader';
import FilterBar from '../../../components/erp/FilterBar';
import ExportButton from '../../../components/erp/ExportButton';
import StatusBadge from '../../../components/erp/StatusBadge';
import suppliersExportColumns from '../../../config/exportColumns/suppliers';
import { fetchMasters } from '../mastersSlice';
import { supplierSeed } from '../../erp/erpUiMocks';

const defaultFormValues = {
  id: '',
  supplierName: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  gstNo: '',
  panNo: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  openingBalance: '',
  creditDays: '',
  supplierType: 'General',
  status: 'Active',
  notes: '',
};

const toLocalRows = (rows) =>
  rows.map((row) => ({
    id: row.id || row._id,
    supplierName: row.supplierName || row.name || '',
    contactPerson: row.contactPerson || '',
    phone: row.phone || '',
    alternatePhone: row.alternatePhone || '',
    email: row.email || '',
    gstNo: row.gstNo || row.gstNumber || '',
    panNo: row.panNo || '',
    addressLine1: row.addressLine1 || row.address || '',
    addressLine2: row.addressLine2 || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    country: row.country || 'India',
    openingBalance: row.openingBalance || 0,
    creditDays: row.creditDays || 0,
    supplierType: row.supplierType || 'General',
    status: row.status || 'Active',
    notes: row.notes || '',
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
  }));

const toExportRows = (rows) =>
  rows.map((row) => ({
    supplier_name: row.supplierName,
    contact_person: row.contactPerson,
    phone: row.phone,
    alternate_phone: row.alternatePhone,
    email: row.email,
    gst_no: row.gstNo,
    pan_no: row.panNo,
    address_line_1: row.addressLine1,
    address_line_2: row.addressLine2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country,
    opening_balance: row.openingBalance,
    credit_days: row.creditDays,
    supplier_type: row.supplierType,
    status: row.status,
    notes: row.notes,
    created_at: row.createdAt || '',
    updated_at: row.updatedAt || '',
  }));

function SuppliersListPage() {
  const dispatch = useDispatch();
  const masterRows = useSelector((state) => state.masters?.suppliers || []);

  const [rows, setRows] = useState(supplierSeed);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMasters('suppliers'));
  }, [dispatch]);

  useEffect(() => {
    if (masterRows.length) {
      setRows(toLocalRows(masterRows));
    }
  }, [masterRows]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = query
        ? [row.supplierName, row.contactPerson, row.phone, row.gstNo, row.city, row.state]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;
      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchText, statusFilter]);

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  const openDialog = (row = null) => {
    setFormErrors({});
    setFormValues(row ? { ...row } : defaultFormValues);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormValues(defaultFormValues);
  };

  const validate = () => {
    const nextErrors = {};
    ['supplierName', 'phone', 'gstNo', 'supplierType', 'status'].forEach((field) => {
      if (!String(formValues[field] || '').trim()) {
        nextErrors[field] = 'This field is required.';
      }
    });
    setFormErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const saveRow = () => {
    if (!validate()) {
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const payload = {
      ...formValues,
      openingBalance: Number(formValues.openingBalance || 0),
      creditDays: Number(formValues.creditDays || 0),
      updatedAt: timestamp,
      createdAt: formValues.id ? formValues.createdAt || timestamp : timestamp,
    };

    setRows((previous) => (
      formValues.id
        ? previous.map((row) => (row.id === formValues.id ? { ...row, ...payload } : row))
        : [{ ...payload, id: `sup-ui-${Date.now()}` }, ...previous]
    ));
    closeDialog();
  };

  const deleteRow = (row) => {
    if (!window.confirm(`Delete supplier ${row.supplierName}?`)) {
      return;
    }
    setRows((previous) => previous.filter((item) => item.id !== row.id));
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Maintain supplier profiles, contact details, credit terms, and procurement metadata without leaving the existing masters flow."
        breadcrumbs={[
          { label: 'Setup' },
          { label: 'Masters' },
          { label: 'Suppliers', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={exportRows}
            columns={suppliersExportColumns}
            filename="suppliers.xlsx"
            sheetName="Suppliers"
          />,
          <Button key="add" variant="contained" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => openDialog()}>
            Add Supplier
          </Button>,
        ]}
      />

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search supplier, contact, GST, phone, or city"
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
                <TableCell sx={{ fontWeight: 700 }}>Supplier Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>GST No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{row.supplierName}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>{row.contactPerson || 'No contact person'}</Typography>
                  </TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.gstNo}</TableCell>
                  <TableCell>{row.city || '--'}</TableCell>
                  <TableCell>{row.state || '--'}</TableCell>
                  <TableCell>{row.supplierType}</TableCell>
                  <TableCell><StatusBadge value={row.status} /></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="info" onClick={() => setViewRow(row)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
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
                  <TableCell colSpan={8} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                    No suppliers found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{formValues.id ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {[
              { key: 'supplierName', label: 'Supplier Name *' },
              { key: 'contactPerson', label: 'Contact Person' },
              { key: 'phone', label: 'Phone *' },
              { key: 'alternatePhone', label: 'Alternate Phone' },
              { key: 'email', label: 'Email' },
              { key: 'gstNo', label: 'GST No *' },
              { key: 'panNo', label: 'PAN No' },
              { key: 'addressLine1', label: 'Address Line 1' },
              { key: 'addressLine2', label: 'Address Line 2' },
              { key: 'city', label: 'City' },
              { key: 'state', label: 'State' },
              { key: 'pincode', label: 'Pincode' },
              { key: 'country', label: 'Country' },
            ].map((field) => (
              <Grid key={field.key} item xs={12} md={field.key.includes('address') ? 12 : 6}>
                <TextField
                  fullWidth
                  size="small"
                  label={field.label}
                  value={formValues[field.key]}
                  onChange={(event) => setFormValues((previous) => ({ ...previous, [field.key]: event.target.value }))}
                  error={Boolean(formErrors[field.key])}
                  helperText={formErrors[field.key] || ' '}
                />
              </Grid>
            ))}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Opening Balance"
                value={formValues.openingBalance}
                onChange={(event) => setFormValues((previous) => ({ ...previous, openingBalance: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Credit Days"
                value={formValues.creditDays}
                onChange={(event) => setFormValues((previous) => ({ ...previous, creditDays: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                select
                label="Supplier Type *"
                value={formValues.supplierType}
                onChange={(event) => setFormValues((previous) => ({ ...previous, supplierType: event.target.value }))}
                error={Boolean(formErrors.supplierType)}
                helperText={formErrors.supplierType || ' '}
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Fabric">Fabric</MenuItem>
                <MenuItem value="Trim">Trim</MenuItem>
                <MenuItem value="Finished Goods">Finished Goods</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status *"
                value={formValues.status}
                onChange={(event) => setFormValues((previous) => ({ ...previous, status: event.target.value }))}
                error={Boolean(formErrors.status)}
                helperText={formErrors.status || ' '}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                minRows={3}
                value={formValues.notes}
                onChange={(event) => setFormValues((previous) => ({ ...previous, notes: event.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={saveRow}>
            {formValues.id ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(viewRow)} onClose={() => setViewRow(null)} fullWidth maxWidth="sm">
        <DialogTitle>Supplier Details</DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Grid container spacing={1.5}>
              {[
                ['Supplier Name', viewRow.supplierName],
                ['Contact Person', viewRow.contactPerson],
                ['Phone', viewRow.phone],
                ['Alternate Phone', viewRow.alternatePhone],
                ['Email', viewRow.email],
                ['GST No', viewRow.gstNo],
                ['PAN No', viewRow.panNo],
                ['Address', `${viewRow.addressLine1 || ''} ${viewRow.addressLine2 || ''}`.trim()],
                ['City / State', `${viewRow.city || '--'} / ${viewRow.state || '--'}`],
                ['Pincode', viewRow.pincode],
                ['Country', viewRow.country],
                ['Opening Balance', viewRow.openingBalance],
                ['Credit Days', viewRow.creditDays],
                ['Supplier Type', viewRow.supplierType],
                ['Status', viewRow.status],
                ['Notes', viewRow.notes],
              ].map(([label, value]) => (
                <Grid key={label} item xs={12} md={6}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>{value || '--'}</Typography>
                </Grid>
              ))}
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewRow(null)}>Close</Button>
          {viewRow ? (
            <Button
              variant="contained"
              onClick={() => {
                const row = viewRow;
                setViewRow(null);
                openDialog(row);
              }}
            >
              Edit
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default SuppliersListPage;
