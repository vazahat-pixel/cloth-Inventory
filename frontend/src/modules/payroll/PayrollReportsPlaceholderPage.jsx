import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Divider,
  Grid,
  Checkbox,
  FormControlLabel,
  TextField,
  IconButton,
} from '@mui/material';
import {
  FileDownloadOutlined as XlsIcon,
  PictureAsPdfOutlined as PdfIcon,
  TableChartOutlined as PivotIcon,
  SettingsOutlined as ConfigIcon,
  ArrowBackIosNewOutlined as BackIcon,
  CloseOutlined as CloseIcon,
  QrCodeScannerOutlined as BarcodeIcon,
} from '@mui/icons-material';
import useAppNavigate from '../../hooks/useAppNavigate';
import { payrollReportsPlaceholderContent } from './payrollReportsNavConfig';
import ReportFilterPanel from '../reports/ReportFilterPanel';

function PayrollReportsPlaceholderPage({ pageKey }) {
  const navigate = useAppNavigate();
  const section = payrollReportsPlaceholderContent[pageKey];

  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    enablePaging: true,
    pageSize: 100,
  });

  if (!section) {
    return null;
  }

  const employees = [
    { id: 1, name: 'John Doe', code: 'EMP001' },
    { id: 2, name: 'Jane Smith', code: 'EMP002' },
    { id: 3, name: 'Mike Johnson', code: 'EMP003' },
    { id: 4, name: 'Sarah Williams', code: 'EMP004' },
    { id: 5, name: 'Robert Brown', code: 'EMP005' },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header & Toolbar */}
      <Paper elevation={0} sx={{ p: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
            {section.title}
          </Typography>
          <Stack direction="row" spacing={3}>
            <ToolbarButton icon={<ConfigIcon />} label="Create" />
            <ToolbarButton icon={<PivotIcon />} label="Pivot" />
            <ToolbarButton icon={<XlsIcon />} label="Xls" />
            <ToolbarButton icon={<PdfIcon />} label="Pdf" />
            <ToolbarButton icon={<BarcodeIcon />} label="Barcode" />
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <ToolbarButton icon={<BackIcon />} label="Back" onClick={() => navigate(-1)} />
            <ToolbarButton icon={<CloseIcon />} label="Close" />
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content Area */}
        <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                Configuration
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Please Choose:</Typography>
            </Stack>

            <ReportFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              showDateRange
              showReportType
              showAttendanceStatus={pageKey.includes('attendance')}
            />

            <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      size="small" 
                      checked={filters.enablePaging} 
                      onChange={(e) => setFilters(f => ({ ...f, enablePaging: e.target.checked }))} 
                    />
                  }
                  label={<Typography variant="body2">Enable Paging</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ color: '#64748b', whiteSpace: 'nowrap' }}>Page Size</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={filters.pageSize}
                    onChange={(e) => setFilters(f => ({ ...f, pageSize: e.target.value }))}
                    sx={{ width: 100 }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Placeholder for Data Table */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 8, 
              border: '1px dashed #cbd5e1', 
              borderRadius: 2, 
              bgcolor: '#f1f5f9',
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" sx={{ color: '#94a3b8' }}>
              No data to display. Adjust filters and apply configurations.
            </Typography>
          </Paper>
        </Box>

        {/* Right Sidebar - Employee Selection */}
        <Paper 
          elevation={0} 
          sx={{ 
            width: 260, 
            borderLeft: '1px solid #e2e8f0', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: '#ffffff'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b' }}>
              Employee Selection
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {employees.map((emp) => (
              <Box 
                key={emp.id} 
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  '&:hover': { bgcolor: '#f8fafc' }
                }}
              >
                <Checkbox size="small" />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>{emp.code}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
            <Button fullWidth variant="outlined" size="small">Select All</Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function ToolbarButton({ icon, label, onClick }) {
  return (
    <Stack alignItems="center" sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }} onClick={onClick}>
      <IconButton size="small" sx={{ color: '#475569', p: 0 }}>
        {icon}
      </IconButton>
      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>
        {label}
      </Typography>
    </Stack>
  );
}

export default PayrollReportsPlaceholderPage;
