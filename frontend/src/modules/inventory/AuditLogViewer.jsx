import { useMemo, useState } from 'react';
import {
  Box,
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
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import systemLogsExportColumns from '../../config/exportColumns/systemLogs';
import { systemLogSeed } from '../erp/erpUiMocks';

const errorSeed = [
  {
    id: 'err-1',
    dateTime: '2026-03-27 17:30',
    module: 'Barcode',
    action: 'GENERATE_FAIL',
    referenceType: 'BARCODE_BATCH',
    referenceNumber: 'BT-2026-007',
    user: 'Inventory Clerk',
    status: 'Rejected',
    remarks: 'Duplicate serial range used in preview generation',
  },
];

const toExportRows = (rows = []) =>
  rows.map((row) => ({
    log_id: row.id,
    date_time: row.dateTime,
    module: row.module,
    action: row.action,
    reference_type: row.referenceType,
    reference_number: row.referenceNumber,
    user: row.user,
    status: row.status,
    remarks: row.remarks,
  }));

function AuditLogViewer({ type = 'system' }) {
  const isErrorMode = type === 'error';
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const rows = isErrorMode ? errorSeed : systemLogSeed;

  const moduleOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.module).filter(Boolean))), [rows]);
  const actionOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.action).filter(Boolean))), [rows]);
  const userOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.user).filter(Boolean))), [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesModule = moduleFilter === 'all' ? true : row.module === moduleFilter;
        const matchesAction = actionFilter === 'all' ? true : row.action === actionFilter;
        const matchesUser = userFilter === 'all' ? true : row.user === userFilter;
        const matchesDateFrom = dateFrom ? String(row.dateTime).slice(0, 10) >= dateFrom : true;
        const matchesDateTo = dateTo ? String(row.dateTime).slice(0, 10) <= dateTo : true;
        return matchesModule && matchesAction && matchesUser && matchesDateFrom && matchesDateTo;
      }),
    [actionFilter, dateFrom, dateTo, moduleFilter, rows, userFilter],
  );

  return (
    <Box>
      <PageHeader
        title={isErrorMode ? 'Error Monitoring' : 'System Logs'}
        subtitle={
          isErrorMode
            ? 'Monitor frontend-visible exceptions and validation failures while keeping the existing error route intact.'
            : 'Review user, module, action, reference, and status activity across barcode, GRN, transfer, and inventory events.'
        }
        breadcrumbs={[
          { label: 'Inventory' },
          { label: isErrorMode ? 'Error Monitoring' : 'System Logs', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={toExportRows(filteredRows)}
            columns={systemLogsExportColumns}
            filename={isErrorMode ? 'error-logs.xlsx' : 'system-logs.xlsx'}
            sheetName={isErrorMode ? 'Error Logs' : 'System Logs'}
          />,
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        <SummaryCard label="Log Rows" value={filteredRows.length} helper="Visible log entries after filters." />
        <SummaryCard label="Modules" value={moduleOptions.length} helper="Distinct modules in the current result set." tone="info" />
        <SummaryCard label="Actions" value={actionOptions.length} helper="Unique actions available for review." tone="warning" />
        <SummaryCard label="Users" value={userOptions.length} helper="Users represented in the selected date range." tone="success" />
      </Box>

      <FilterBar sx={{ mb: 2 }}>
        <TextField size="small" select label="Module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Modules</MenuItem>
          {moduleOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="Action" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Actions</MenuItem>
          {actionOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" select label="User" value={userFilter} onChange={(event) => setUserFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Users</MenuItem>
          {userOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="date" label="From" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="To" value={dateTo} onChange={(event) => setDateTo(event.target.value)} InputLabelProps={{ shrink: true }} />
      </FilterBar>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Log ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.id}</TableCell>
                  <TableCell>{row.dateTime}</TableCell>
                  <TableCell>{row.module}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.referenceType}</TableCell>
                  <TableCell>{row.referenceNumber}</TableCell>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>
                    <StatusBadge value={row.status} />
                  </TableCell>
                  <TableCell>{row.remarks}</TableCell>
                </TableRow>
              ))}
              {!filteredRows.length ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center', color: '#64748b' }}>
                    No log records match the selected filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default AuditLogViewer;
