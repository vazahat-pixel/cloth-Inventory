import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import sizesExportColumns from '../../config/exportColumns/sizes';
import { sizeMasterSeed } from '../erp/erpUiMocks';

const defaultFormValues = {
  id: '',
  sizeCode: '',
  sizeLabel: '',
  sequence: '',
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
  const [rows, setRows] = useState(sizeMasterSeed);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formErrors, setFormErrors] = useState({});

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
            id: row.id,
            sizeCode: row.sizeCode,
            sizeLabel: row.sizeLabel,
            sequence: row.sequence,
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
    if (!formValues.sizeCode.trim()) {
      nextErrors.sizeCode = 'Size code is required.';
    }
    if (!formValues.sizeLabel.trim()) {
      nextErrors.sizeLabel = 'Size label is required.';
    }
    if (formValues.sequence === '') {
      nextErrors.sequence = 'Sequence is required.';
    }
    setFormErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const saveRow = () => {
    if (!validate()) {
      return;
    }

    const payload = {
      ...formValues,
      sizeCode: formValues.sizeCode.trim().toUpperCase(),
      sizeLabel: formValues.sizeLabel.trim(),
      sequence: Number(formValues.sequence),
    };

    setRows((previous) => (
      formValues.id
        ? previous.map((row) => (row.id === formValues.id ? { ...row, ...payload } : row))
        : [{ ...payload, id: `size-${Date.now()}` }, ...previous]
    ));
    closeDialog();
  };

  const deleteRow = (row) => {
    if (!window.confirm(`Delete size ${row.sizeCode}?`)) {
      return;
    }

    setRows((previous) => previous.filter((item) => item.id !== row.id));
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
          <FilterBar sx={{ boxShadow: 'none', p: 0, border: 'none' }}>
            <TextField
              fullWidth
              size="small"
              label="Size Code *"
              value={formValues.sizeCode}
              onChange={(event) => setFormValues((previous) => ({ ...previous, sizeCode: event.target.value }))}
              error={Boolean(formErrors.sizeCode)}
              helperText={formErrors.sizeCode || ' '}
            />
            <TextField
              fullWidth
              size="small"
              label="Size Label *"
              value={formValues.sizeLabel}
              onChange={(event) => setFormValues((previous) => ({ ...previous, sizeLabel: event.target.value }))}
              error={Boolean(formErrors.sizeLabel)}
              helperText={formErrors.sizeLabel || ' '}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Sequence *"
              value={formValues.sequence}
              onChange={(event) => setFormValues((previous) => ({ ...previous, sequence: event.target.value }))}
              error={Boolean(formErrors.sequence)}
              helperText={formErrors.sequence || ' '}
            />
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
          </FilterBar>
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
