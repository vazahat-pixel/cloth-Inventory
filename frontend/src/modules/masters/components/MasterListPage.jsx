import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Breadcrumbs,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import { addMasterRecord, deleteMasterRecord, updateMasterRecord, fetchMasters } from '../mastersSlice';
import DeleteConfirmDialog from './DeleteConfirmDialog';

function MasterListPage({
  entityKey,
  title,
  singularLabel,
  description,
  primaryField,
  searchKeys,
  columns,
  FormDialogComponent,
  addButtonLabel,
}) {
  const dispatch = useDispatch();
  const records = useSelector((state) => state.masters?.[entityKey] || []);

  const [searchText, setSearchText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const singular = singularLabel || title;

  const activeSearchKeys = searchKeys?.length ? searchKeys : [primaryField];

  const filteredRecords = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return records;
    }

    return records.filter((record) =>
      activeSearchKeys.some((key) =>
        String(record[key] ?? '')
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [activeSearchKeys, records, searchText]);

  useEffect(() => {
    dispatch(fetchMasters(entityKey));
  }, [dispatch, entityKey]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRow(null);
  };

  const openAddDialog = () => {
    setEditingRow(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (row) => {
    setEditingRow(row);
    setIsDialogOpen(true);
  };

  const handleSaveRecord = (payload) => {
    if (editingRow) {
      dispatch(
        updateMasterRecord({
          entityKey,
          id: editingRow.id || editingRow._id,
          updates: payload,
        }),
      );
    } else {
      dispatch(addMasterRecord({ entityKey, record: payload }));
    }

    closeDialog();
  };

  const askDeleteRecord = (row) => {
    setDeleteCandidate(row);
  };

  const cancelDeleteRecord = () => {
    setDeleteCandidate(null);
  };

  const confirmDeleteRecord = () => {
    if (deleteCandidate) {
      dispatch(
        deleteMasterRecord({
          entityKey,
          id: deleteCandidate.id || deleteCandidate._id,
        }),
      );
    }

    cancelDeleteRecord();
  };

  const hasRows = records.length > 0;
  const hasFilteredRows = filteredRecords.length > 0;

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Breadcrumbs separator="/" aria-label="masters-breadcrumb">
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              Masters
            </Typography>
            <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700 }}>
              {title}
            </Typography>
          </Breadcrumbs>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {description}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={`Search ${title.toLowerCase()}`}
                sx={{ width: { xs: '100%', sm: 260 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={openAddDialog}
              >
                {addButtonLabel}
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {hasFilteredRows ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      sx={{
                        fontWeight: 700,
                        color: '#334155',
                        minWidth: column.minWidth || 120,
                        whiteSpace: 'nowrap',
                      }}
                      align={column.align || 'left'}
                    >
                      {column.headerName}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 700, color: '#334155', width: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((row) => (
                  <TableRow key={row.id} hover>
                    {columns.map((column) => (
                      <TableCell
                        key={`${row.id}-${column.field}`}
                        align={column.align || 'left'}
                        sx={{ color: '#0f172a' }}
                      >
                        {column.render ? column.render(row[column.field], row) : row[column.field] || '--'}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label={`edit-${row[primaryField] || row.id}`}
                          onClick={() => openEditDialog(row)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`delete-${row[primaryField] || row.id}`}
                          onClick={() => askDeleteRecord(row)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              {hasRows ? 'No matching records found.' : `No ${title.toLowerCase()} available.`}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2.5 }}>
              {hasRows
                ? 'Adjust your search and try again.'
                : `Create your first ${singular.toLowerCase()} to get started.`}
            </Typography>
            {!hasRows && (
              <Button variant="contained" onClick={openAddDialog} startIcon={<AddCircleOutlineIcon />}>
                {addButtonLabel}
              </Button>
            )}
          </Box>
        )}
      </Paper>

      <FormDialogComponent
        open={isDialogOpen}
        onClose={closeDialog}
        onSubmit={handleSaveRecord}
        initialValues={editingRow}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteCandidate)}
        title={`Delete ${singular}`}
        content={`Are you sure you want to delete "${deleteCandidate?.[primaryField] || ''}"?`}
        onCancel={cancelDeleteRecord}
        onConfirm={confirmDeleteRecord}
      />
    </>
  );
}

export default MasterListPage;
