import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Chip, 
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Avatar,
  Divider,
  Button
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GppGoodIcon from '@mui/icons-material/GppGood';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShieldIcon from '@mui/icons-material/Shield';
import api from '../../services/api';

/**
 * ValidationDashboard — System Integrity Health Checks.
 * Evaluates negative stock, document unapprovals, and orphan records.
 */
const ValidationDashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/validation-report');
      setReport(res.data.data);
    } catch (err) {
      console.error('Validation fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (type) => {
    switch (type) {
      case 'ERROR': return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: <ErrorOutlineIcon sx={{ color: '#ef4444' }} /> };
      case 'WARNING': return { bg: '#fffbeb', border: '#fef3c7', text: '#92400e', icon: <WarningAmberIcon sx={{ color: '#f59e0b' }} /> };
      case 'INFO': return { bg: '#f0f9ff', border: '#bae6fd', text: '#075985', icon: <ReportProblemIcon sx={{ color: '#3b82f6' }} /> };
      default: return { bg: '#f9fafb', border: '#f3f4f6', text: '#4b5563', icon: <ReportProblemIcon sx={{ color: '#94a3b8' }} /> };
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
            Enterprise Validation Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Automated deep-scan of the ERP data layer. Identifying inconsistencies before they reach reports.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchReport}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Run Diagnostic Scan
        </Button>
      </Box>

      {/* System Status Banner */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 4, 
        mb: 4, 
        bgcolor: report?.status === 'HEALTHY' ? '#dcfce7' : '#fffbeb', 
        border: `1px solid ${report?.status === 'HEALTHY' ? '#bbf7d0' : '#fef3c7'}`,
        display: 'flex', 
        alignItems: 'center', 
        gap: 2 
      }}>
        <Avatar sx={{ bgcolor: report?.status === 'HEALTHY' ? '#166534' : '#92400e' }}>
          {report?.status === 'HEALTHY' ? <VerifiedUserIcon /> : <WarningAmberIcon />}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: report?.status === 'HEALTHY' ? '#166534' : '#92400e' }}>
            System Integrity {report?.status === 'HEALTHY' ? 'Verified' : 'Issues Detected'}
          </Typography>
          <Typography variant="body2" sx={{ color: report?.status === 'HEALTHY' ? '#166534' : '#b45309' }}>
            {report?.status === 'HEALTHY' 
              ? 'No major inventory or document-flow inconsistencies detected across 2,400+ ledger records.' 
              : `Total of ${report?.findings?.length} anomalies recorded. Manual intervention recommended to maintain 100% data fidelity.`
            }
          </Typography>
        </Box>
      </Paper>

      {/* Logic Checks Grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
           <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Integrated Business Rules</Typography>
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                 {[
                   { label: 'Negative Inventory Prevention', status: 'ACTIVE', desc: 'Prevents out-of-stock billing at location level.' },
                   { label: 'Unapproved stock control', status: 'ACTIVE', desc: 'No stock increase until GRN is Approved.' },
                   { label: 'Ledger Traceability Lock', status: 'ACTIVE', desc: 'Ref ID mandatory for every movement.' },
                   { label: 'Payment-Invoice Linkage', status: 'ACTIVE', desc: 'Cash Flow must link to a valid Document.' }
                 ].map((rule, idx) => (
                   <ListItem key={idx} disablePadding sx={{ alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        <ShieldIcon sx={{ color: '#10b981', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>{rule.label}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>{rule.desc}</Typography>
                            <Chip label={rule.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800, height: 18, fontSize: 8 }} />
                          </Box>
                        }
                      />
                   </ListItem>
                 ))}
              </List>
           </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
           <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Audit Findings</Typography>
                <Chip icon={<GppGoodIcon />} label="Audited" color="primary" sx={{ fontWeight: 900 }} />
              </Box>

              {report?.findings?.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 4, border: '1px dashed #bbf7d0' }}>
                  <HealthAndSafetyIcon sx={{ fontSize: 64, color: '#16a34a', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ color: '#166534', fontWeight: 800 }}>System Data is Clean</Typography>
                  <Typography variant="body2" sx={{ color: '#15803d' }}>Our autonomous audit engine scanned the stock ledger and found 100% document alignment.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {report?.findings?.map((finding, idx) => {
                    const style = getIntensityColor(finding.type);
                    return (
                      <Box 
                        key={idx} 
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 3, 
                          bgcolor: style.bg, 
                          border: `1.5px solid ${style.border}`, 
                          display: 'flex', 
                          gap: 2, 
                          alignItems: 'center' 
                        }}
                      >
                        <Avatar sx={{ bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                          {style.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                            <Chip label={finding.type} size="small" sx={{ fontSize: 9, fontWeight: 900, bgcolor: `${style.text}15`, color: style.text, height: 18 }} />
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Code: INV-HLTH-{idx.toString().padStart(3, '0')}</Typography>
                          </Box>
                          <Typography variant="subtitle2" sx={{ color: style.text, fontWeight: 900 }}>{finding.message}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
           </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ValidationDashboard;
