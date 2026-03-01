import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
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

function formatDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return d || '-';
  }
}

function AuditLogPage() {
  const auditLog = useSelector((state) => state.settings.auditLog);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    if (!search?.trim()) return auditLog;
    const s = search.toLowerCase();
    return auditLog.filter(
      (r) =>
        (r.userName || '').toLowerCase().includes(s) ||
        (r.action || '').toLowerCase().includes(s) ||
        (r.module || '').toLowerCase().includes(s) ||
        (r.reference || '').toLowerCase().includes(s) ||
        (r.details || '').toLowerCase().includes(s),
    );
  }, [auditLog, search]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>Audit Log</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Activity history across modules.</Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search by user, action, module..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          />
        </Stack>
      </Stack>
      {filteredRows.length ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.timestamp)}</TableCell>
                    <TableCell>{row.userName || '-'}</TableCell>
                    <TableCell>{row.action || '-'}</TableCell>
                    <TableCell>{row.module || '-'}</TableCell>
                    <TableCell>{row.reference || '-'}</TableCell>
                    <TableCell>{row.details || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 15, 25, 50]}
          />
        </>
      ) : (
        <Box sx={{ py: 7, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            {search ? 'No matching audit entries.' : 'No audit log entries yet.'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default AuditLogPage;
