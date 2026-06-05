import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';

const headers = [
  'SNO.',
  'BRANCH NAME',
  'ITEM NAME',
  'ITEM CODE',
  'SHADE NAME',
  'ITEM DESCRIPTION',
  'PACK/SIZE',
  'SUB SECTION',
  'TYPE',
  'DESIGN',
  'FABRIC',
  'FABRIC TYPE',
  'VENDOR',
  'NET SALE-1',
  'PUR.RETURN-1',
  'CLOSING STOCK'
];

const headerKeys = [
  'sno',
  'branchName',
  'itemName',
  'itemCode',
  'shadeName',
  'itemDescription',
  'packSize',
  'subSection',
  'type',
  'design',
  'fabric',
  'fabricType',
  'vendor',
  'netSale',
  'purReturn',
  'closingStock'
];

function BranchSalesStockReportPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    warehouseId: 'all',
    warehouseIds: []
  });
  const [hasFetched, setHasFetched] = useState(false);

  const fetchReport = async (currentFilters) => {
    setLoading(true);
    try {
      const f = currentFilters || filters;
      const params = {};
      if (f.dateFrom) params.startDate = f.dateFrom;
      if (f.dateTo) params.endDate = f.dateTo;
      if (f.warehouseIds && f.warehouseIds.length > 0) {
        params.storeId = f.warehouseIds.join(',');
      } else if (f.warehouseId && f.warehouseId !== 'all') {
        params.storeId = f.warehouseId;
      }
      
      const { data } = await api.get('/reports/branch-sales-stock', { params });
      // sendSuccess spreads at root level: { success, message, report: [...] }
      const rows = data.report || data.data?.report || [];
      const mapped = rows.map((row, idx) => ({
        ...row,
        sno: idx + 1
      }));
      setReportData(mapped);
      setPage(0);
      setHasFetched(true);
    } catch (e) {
      console.error('Error fetching Branch Sales & Stock Report:', e);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever store filter changes (but only if already fetched once)
  useEffect(() => {
    if (hasFetched) {
      fetchReport(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.warehouseId, JSON.stringify(filters.warehouseIds || []), filters.dateFrom, filters.dateTo]);

  const paginatedRows = useMemo(() => {
    return reportData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [reportData, page, rowsPerPage]);

  // Total sums for Net Sales, Pur Return and Closing Stock
  const totals = useMemo(() => {
    let totalSales = 0;
    let totalPurReturn = 0;
    let totalStock = 0;

    reportData.forEach((row) => {
      totalSales += Number(row.netSale || 0);
      totalPurReturn += Number(row.purReturn || 0);
      totalStock += Number(row.closingStock || 0);
    });

    return { totalSales, totalPurReturn, totalStock };
  }, [reportData]);

  // Styled helper to render cells
  const renderCellContent = (key, val) => {
    if (val === 'NIL') {
      return (
        <Typography component="span" variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>
          NIL
        </Typography>
      );
    }

    if (key === 'itemCode') {
      return (
        <Typography component="span" variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>
          {val}
        </Typography>
      );
    }

    if (key === 'netSale' || key === 'purReturn' || key === 'closingStock') {
      return (
        <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: key === 'closingStock' && val > 0 ? '#10b981' : '#475569' }}>
          {val}
        </Typography>
      );
    }

    return val;
  };

  return (
    <Box sx={{ p: 1 }}>
      <PageHeader
        title="Branch Sales & Stock Report"
        subtitle="Consolidated report showing exact Sales, Returns, and Stock metrics by variant"
        breadcrumbs={[{ label: 'Reports' }, { label: 'Branch Sales & Stock', active: true }]}
      />

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, p: 3, mb: 3, bgcolor: '#ffffff' }}>
        <ReportFilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          showDateRange={true}
          showWarehouse={true}
          multiSelectWarehouse={true}
          compact={false}
        />
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="medium"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AssessmentOutlinedIcon />}
            onClick={() => fetchReport(filters)}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 700, px: 4, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#ffffff', overflow: 'hidden' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Report Details
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Showing {reportData.length} variant records
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <ReportExportButton
              headers={headers}
              headerKeys={headerKeys}
              rows={reportData}
              filename="branch_sales_stock_report.csv"
            />
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, alignItems: 'center', flexDirection: 'column', gap: 2 }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Loading consolidated records...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {headers.map((h, i) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 800,
                          bgcolor: '#f8fafc',
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                        align={headerKeys[i] === 'netSale' || headerKeys[i] === 'purReturn' || headerKeys[i] === 'closingStock' || headerKeys[i] === 'sno' ? 'right' : 'left'}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headers.length} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary" variant="body2">
                          {hasFetched
                            ? 'No matching stock or sales records found for the selected filters.'
                            : 'Select a branch and click "Generate Report" to load data.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedRows.map((row) => (
                        <TableRow key={row.sno} hover sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfdfe' } }}>
                          {headerKeys.map((key, colIdx) => (
                            <TableCell
                              key={key}
                              sx={{
                                borderBottom: '1px solid #f1f5f9',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                              }}
                              align={key === 'netSale' || key === 'purReturn' || key === 'closingStock' || key === 'sno' ? 'right' : 'left'}
                            >
                              {renderCellContent(key, row[key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                      {/* Summary Row */}
                      <TableRow sx={{ bgcolor: '#f8fafc', fontWeight: 800 }}>
                        <TableCell colSpan={13} sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>
                          TOTAL
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>
                          {totals.totalSales}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b' }}>
                          {totals.totalPurReturn}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#10b981' }}>
                          {totals.totalStock}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={reportData.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}

export default BranchSalesStockReportPage;
