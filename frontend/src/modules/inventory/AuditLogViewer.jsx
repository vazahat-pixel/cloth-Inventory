import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BugReportIcon from '@mui/icons-material/BugReport';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import api from '../../services/api';

/**
 * AuditLogViewer — Reusable monitor for System Logs and Error Logs.
 */
const AuditLogViewer = ({ type = 'system' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isErrorMode = type === 'error';

  useEffect(() => {
    fetchLogs();
  }, [type]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const endpoint = isErrorMode ? '/inventory/error-logs' : '/inventory/system-logs';
      const res = await api.get(endpoint);
      setData(isErrorMode ? res.data.data.errors : res.data.data.logs);
    } catch (err) {
      console.error(`Log fetch failed [${type}]:`, err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter(item => 
    (item.action || item.message || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.module || item.path || '').toLowerCase().includes(search.toLowerCase())
  );

  const getLogColor = (action) => {
    if (!action) return 'default';
    if (action.includes('REJECT') || action.includes('ERROR') || action.includes('CANCEL')) return 'error';
    if (action.includes('APPROVE') || action.includes('CREATE') || action.includes('POST')) return 'success';
    if (action.includes('PAYMENT') || action.includes('ACCOUNT')) return 'info';
    return 'default';
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
            {isErrorMode ? 'Error Monitoring Panel' : 'System Logs Auditor'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            {isErrorMode 
              ? 'Tracking API failures, validation errors, and system exceptions for development and QA monitoring.' 
              : 'Real-time record of every garment ERP action—purchases, receipts, stock moves, and sales.'
            }
          </Typography>
        </Box>
        <Paper sx={{ p: 0.5, px: 2, display: 'flex', alignItems: 'center', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
           <SearchIcon sx={{ color: '#94a3b8', mr: 1 }} />
           <TextField 
             variant="standard" 
             placeholder={isErrorMode ? "Search errors..." : "Search logs..."} 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             InputProps={{ disableUnderline: true, style: { fontSize: 13, fontWeight: 700 } }} 
             sx={{ width: 250 }}
           />
        </Paper>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: isErrorMode ? '#7f1d1d' : '#1e293b', color: '#fff', fontWeight: 800, py: 2 }}>TIMESTAMP</TableCell>
              <TableCell sx={{ bgcolor: isErrorMode ? '#7f1d1d' : '#1e293b', color: '#fff', fontWeight: 800 }}>{isErrorMode ? 'MESSAGE' : 'ACTION'}</TableCell>
              <TableCell sx={{ bgcolor: isErrorMode ? '#7f1d1d' : '#1e293b', color: '#fff', fontWeight: 800 }}>{isErrorMode ? 'METHOD/PATH' : 'MODULE'}</TableCell>
              <TableCell sx={{ bgcolor: isErrorMode ? '#7f1d1d' : '#1e293b', color: '#fff', fontWeight: 800 }}>USER</TableCell>
              <TableCell sx={{ bgcolor: isErrorMode ? '#7f1d1d' : '#1e293b', color: '#fff', fontWeight: 800, textAlign: 'right' }}>DETAILS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>No records match your scan criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log._id} hover>
                  <TableCell sx={{ fontSize: 11, color: '#64748b' }}>{new Date(log.createdAt || log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    {isErrorMode ? (
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#f43f5e' }}>{log.message}</Typography>
                    ) : (
                      <Chip label={log.action} size="small" color={getLogColor(log.action)} sx={{ height: 20, fontSize: 10, fontWeight: 900 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    {isErrorMode ? (
                      <Chip label={`${log.method || 'GET'} ${log.path}`} size="small" variant="outlined" sx={{ borderStyle: 'dashed', height: 20, fontSize: 10, bgcolor: '#fdf2f2' }} />
                    ) : (
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{log.module}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: '#e2e8f0', color: '#475569' }}>
                        <AccountCircleIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 11 }}>{log.userId?.name || log.userId || 'Guest'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={JSON.stringify(log.details || log.stack || {}, null, 2)}>
                      <IconButton size="small" color="primary">
                        <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AuditLogViewer;
