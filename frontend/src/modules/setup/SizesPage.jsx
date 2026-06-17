import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMasters, addMasterRecord, updateMasterRecord, deleteMasterRecord } from '../masters/mastersSlice';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
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
import sizesExportColumns from '../../config/exportColumns/sizes';

const sanitizeSizeCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);

const sanitizeSizeGroup = (value) =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .slice(0, 40);

const defaultFormValues = {
  id: '',
  sizeCode: '',
  sizeLabel: '',
  sequence: '',
  group: '',
  status: 'Active',
};

const toExportRows = (rows) =>
  rows.map((row) => ({
    size_code: row.sizeCode,
    size_label: row.sizeLabel,
    sequence: row.sequence,
    status: row.status,
  }));

function SizesPage() {
  const dispatch = useDispatch();
  const sizesFromRedux = useSelector((state) => state.masters.sizes);
  const { loading } = useSelector((state) => state.masters);

  const rows = useMemo(() => sizesFromRedux || [], [sizesFromRedux]);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMasters('sizes'));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows
      .filter((row) => {
        const matchesSearch = query
          ? [row.sizeCode, row.sizeLabel].some((value) => String(value).toLowerCase().includes(query))
          : true;
        const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => Number(left.sequence) - Number(right.sequence));
  }, [rows, searchText, statusFilter]);

  const exportRows = useMemo(() => toExportRows(filteredRows), [filteredRows]);

  const openDialog = (row = null) => {
    setFormErrors({});
    setFormValues(
      row
        ? {
            id: row.id || row._id,
            sizeCode: row.sizeCode,
            sizeLabel: row.sizeLabel,
            sequence: row.sequence,
            group: row.group || '',
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
    const code = sanitizeSizeCode(formValues.sizeCode);
    if (!code) {
      nextErrors.sizeCode = 'Size code is required (letters and numbers only).';
    } else if (!/^[A-Z0-9]+$/.test(code)) {
      nextErrors.sizeCode = 'Size code must be alphanumeric.';
    } else if (!formValues.id && rows.some((row) => sanitizeSizeCode(row.sizeCode) === code)) {
      nextErrors.sizeCode = 'This size code already exists.';
  }
    if (!formValues.sizeLabel.trim()) {
      nextErrors.sizeLabel = 'Size label/name is required.';
    }
    const seq = Number(formValues.sequence);
    if (formValues.sequence === '' || Number.isNaN(seq)) {
      nextErrors.sequence = 'Sequence is required.';
    } else if (seq < 0) {
      nextErrors.sequence = 'Sequence cannot be negative.';
    }
    if (formValues.group && !/^[a-zA-Z0-9\s-]+$/.test(formValues.group.trim())) {
      nextErrors.group = 'Size group must be alphanumeric.';
    }
    setFormErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const saveRow = async () => {
    if (!validate()) {
      return;
    }

    try {
      const payload = {
        ...formValues,
        sizeCode: sanitizeSizeCode(formValues.sizeCode),
        group: sanitizeSizeGroup(formValues.group),
        sequence: Math.max(0, Number(formValues.sequence) || 0),
      };
      if (formValues.id) {
        await dispatch(updateMasterRecord({
          entityKey: 'sizes',
          id: formValues.id,
          updates: payload
        })).unwrap();
      } else {
        await dispatch(addMasterRecord({
          entityKey: 'sizes',
          record: payload
        })).unwrap();
      }
      closeDialog();
    } catch (error) {
      alert(error || 'Failed to save size');
    }
  };

  const deleteRow = (row) => {
    if (!window.confirm(`Delete size ${row.sizeCode}?`)) {
      return;
    }

    dispatch(deleteMasterRecord({
      entityKey: 'sizes',
      id: row.id || row._id
    }));
  };

  return (
    <div>
      <PageHeader
        title="Sizes"
        subtitle="Maintain the size master used across item variants, purchase lines, GRN receipts, and transfer documents."
        breadcrumbs={[
          { label: 'Setup' },
          { label: 'Sizes', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={exportRows}
            columns={sizesExportColumns}
            filename="size-master.xlsx"
            sheetName="Sizes"
          />,
          <Button key="add" variant="contained" startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => openDialog()}>
            Add Size
          </Button>,
        ]}
      />

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search size code or label"
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
                <TableCell sx={{ fontWeight: 700 }}>Size Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size Label</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sequence</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{row.sizeCode}</Typography>
                  </TableCell>
                  <TableCell>{row.sizeLabel}</TableCell>
                  <TableCell>{row.group || '--'}</TableCell>
                  <TableCell>{row.sequence}</TableCell>
                  <TableCell><StatusBadge value={row.status} /></TableCell>
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
                  <TableCell colSpan={5} sx={{ py: 5, textAlign: 'center', color: '#64748b' }}>
                    No size records match the current filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{formValues.id ? 'Edit Size' : 'Add Size'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Size Code *"
                placeholder="e.g. S, M, 32"
                value={formValues.sizeCode}
                onChange={(event) => setFormValues((previous) => ({ ...previous, sizeCode: sanitizeSizeCode(event.target.value) }))}
                disabled={Boolean(formValues.id)}
                error={Boolean(formErrors.sizeCode)}
                helperText={formErrors.sizeCode || ' '}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Size Label *"
                placeholder="e.g. Small, Waist 32"
                value={formValues.sizeLabel}
                onChange={(event) => setFormValues((previous) => ({ ...previous, sizeLabel: event.target.value }))}
                error={Boolean(formErrors.sizeLabel)}
                helperText={formErrors.sizeLabel || ' '}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Size Group"
                placeholder="e.g. Adult-Alpha"
                value={formValues.group}
                onChange={(event) => setFormValues((previous) => ({ ...previous, group: sanitizeSizeGroup(event.target.value) }))}
                error={Boolean(formErrors.group)}
                helperText={formErrors.group || ' '}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Sequence *"
                value={formValues.sequence}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val === '') {
                    setFormValues((previous) => ({ ...previous, sequence: '' }));
                    return;
                  }
                  const num = Math.max(0, Number(val) || 0);
                  setFormValues((previous) => ({ ...previous, sequence: num }));
                }}
                inputProps={{ min: 0 }}
                error={Boolean(formErrors.sequence)}
                helperText={formErrors.sequence || ' '}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
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
            {formValues.id ? 'Update Size' : 'Create Size'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default SizesPage;
