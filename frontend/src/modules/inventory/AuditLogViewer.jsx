import { useEffect, useMemo, useState } from 'react';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useServerPagination from '../../hooks/useServerPagination';
import ServerTablePagination from '../../components/erp/ServerTablePagination';
import api from '../../services/api';
import { extractPaginationMeta } from '../../utils/paginationMeta';
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
  CircularProgress,
} from '@mui/material';
import PageHeader from '../../components/erp/PageHeader';
import FilterBar from '../../components/erp/FilterBar';
import ExportButton from '../../components/erp/ExportButton';
import StatusBadge from '../../components/erp/StatusBadge';
import SummaryCard from '../../components/erp/SummaryCard';
import systemLogsExportColumns from '../../config/exportColumns/systemLogs';

const toExportRows = (rows = []) =>
  rows.map((row) => ({
    log_id: row._id || row.id,
    date_time: row.createdAt ? formatDateTimeDDMMYYYY(row.createdAt) : formatDateDDMMYYYY(row.dateTime),
    module: row.module,
    action: row.action,
    reference_type: row.targetModel || row.referenceType,
    reference_number: row.targetId || row.referenceNumber,
    user: row.performedBy?.name || row.userId?.name || row.user,
    status: row.status || 'Logged',
    remarks: row.details?.message || row.remarks || '',
  }));

function AuditLogViewer({ type = 'system' }) {
  const isErrorMode = type === 'error';
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, 350);
  const {
    page,
    rowsPerPage,
    resetPage,
    handlePageChange,
    handleRowsPerPageChange,
    buildParams,
    pageSizeOptions,
  } = useServerPagination({ defaultPageSize: 20 });

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const endpoint = isErrorMode ? '/inventory/error-logs' : '/reports/audit-logs';
        const params = buildParams({
          search: debouncedSearch,
          module: moduleFilter,
          action: actionFilter,
          dateFrom,
          dateTo,
        });
        const response = await api.get(endpoint, { params });
        const data = response.data.data || response.data;
        setLogs(data.logs || data.errors || []);
        setTotal(extractPaginationMeta(response.data).total);
      } catch (err) {
        console.error('Failed to load audit logs', err);
        setLogs([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [isErrorMode, debouncedSearch, moduleFilter, actionFilter, dateFrom, dateTo, page, rowsPerPage, buildParams]);

  const moduleOptions = useMemo(() => Array.from(new Set(logs.map((row) => row.module).filter(Boolean))), [logs]);
  const actionOptions = useMemo(() => Array.from(new Set(logs.map((row) => row.action).filter(Boolean))), [logs]);

  return (
    <Box>
      <PageHeader
        title={isErrorMode ? 'Error Monitoring' : 'Audit Logs'}
        subtitle={
          isErrorMode
            ? 'Monitor application errors with server-side pagination.'
            : 'Review user, module, and action activity across the ERP.'
        }
        breadcrumbs={[
          { label: 'Reports' },
          { label: isErrorMode ? 'Error Monitoring' : 'Audit Logs', active: true },
        ]}
        actions={[
          <ExportButton
            key="export"
            rows={toExportRows(logs)}
            columns={systemLogsExportColumns}
            filename={isErrorMode ? 'error-logs.xlsx' : 'audit-logs.xlsx'}
            sheetName={isErrorMode ? 'Error Logs' : 'Audit Logs'}
          />,
        ]}
      />

      <FilterBar sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search module or action..."
          value={searchText}
          onChange={(e) => { resetPage(); setSearchText(e.target.value); }}
          sx={{ flex: 1 }}
        />
        <TextField size="small" select label="Module" value={moduleFilter} onChange={(e) => { resetPage(); setModuleFilter(e.target.value); }} sx={{ minWidth: 160 }}>
          <MenuItem value="all">All Modules</MenuItem>
          {moduleOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField size="small" select label="Action" value={actionFilter} onChange={(e) => { resetPage(); setActionFilter(e.target.value); }} sx={{ minWidth: 160 }}>
          <MenuItem value="all">All Actions</MenuItem>
          {actionOptions.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>
        <TextField size="small" type="date" label="From" value={dateFrom} onChange={(e) => { resetPage(); setDateFrom(e.target.value); }} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="To" value={dateTo} onChange={(e) => { resetPage(); setDateTo(e.target.value); }} InputLabelProps={{ shrink: true }} />
      </FilterBar>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 2 }}>
        <SummaryCard title="Total Records" value={total} />
        <SummaryCard title="Current Page" value={logs.length} />
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date / Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : logs.length ? (
                logs.map((row) => (
                  <TableRow key={row._id || row.id} hover>
                    <TableCell>{row.createdAt ? formatDateTimeDDMMYYYY(row.createdAt) : formatDateDDMMYYYY(row.dateTime)}</TableCell>
                    <TableCell>{row.module}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.performedBy?.name || row.userId?.name || row.user || '—'}</TableCell>
                    <TableCell><StatusBadge value={row.status || 'Logged'} /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ServerTablePagination
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={pageSizeOptions}
          disabled={loading}
        />
      </Paper>
    </Box>
  );
}

export default AuditLogViewer;
