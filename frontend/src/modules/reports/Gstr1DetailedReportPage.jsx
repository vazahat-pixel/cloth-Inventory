import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
} from '@mui/material';
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { getFriendlyErrorMessage } from '../../utils/errorMessageHelper';

function Gstr1DetailedReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const token = useSelector((state) => state.auth.token);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/detailed-gst`, {
        params: {
            startDate: filters.dateFrom,
            endDate: filters.dateTo
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.report);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'GST data load karne mein dikkat hui.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const SummaryStat = ({ label, value, color }) => (
    <Card elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3, flex: 1 }}>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 900, color: color || '#0f172a', mt: 0.5 }}>₹{value?.toLocaleString() || 0}</Typography>
    </Card>
  );

  return (
    <Box>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>GSTR-1 & Tax Audit Report</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Comprehensive item-wise tax tracking, HSN summaries, and B2B/B2C breakdowns.</Typography>
          </Box>
          <ReportExportButton data={data?.itemWise || []} filename="GSTR1_Report" />
        </Box>

        <Paper elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <ReportFilterPanel filters={filters} onFiltersChange={setFilters} />
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !data ? (
          <Alert severity="info">No data found for the selected period.</Alert>
        ) : (
          <>
            <Stack direction="row" spacing={2}>
              <SummaryStat label="Total Taxable Value" value={data.summary.totalTaxable} />
              <SummaryStat label="Total Output GST" value={data.summary.totalTax} color="#3b82f6" />
              <SummaryStat label="B2B Invoices" value={data.summary.totalB2B} color="#10b981" />
              <SummaryStat label="B2C Invoices" value={data.summary.totalB2C} color="#f59e0b" />
            </Stack>

            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Tab label="HSN-Wise Summary" sx={{ fontWeight: 700, px: 4 }} />
                <Tab label="Rate-Wise Summary" sx={{ fontWeight: 700, px: 4 }} />
                <Tab label="Item-Wise Detailed" sx={{ fontWeight: 700, px: 4 }} />
                <Tab label="B2B Invoice List" sx={{ fontWeight: 700, px: 4 }} />
              </Tabs>

              <Box sx={{ p: 0 }}>
                {tab === 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>HSN Code</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800 }}>Total Qty</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Taxable Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>CGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>SGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>IGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Total Tax</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.hsnSummary.map((h, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{h.hsn}</TableCell>
                            <TableCell align="center">{h.qty}</TableCell>
                            <TableCell align="right">₹{h.taxable.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{h.cgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{h.sgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{h.igst.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#3b82f6' }}>₹{h.totalTax.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tab === 1 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Tax Rate (%)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Taxable Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>CGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>SGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>IGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Total Tax</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.rateSummary.map((r, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{r.rate}</TableCell>
                            <TableCell align="right">₹{r.taxable.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{r.cgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{r.sgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{r.igst.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#3b82f6' }}>₹{r.totalTax.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tab === 2 && (
                  <TableContainer sx={{ maxHeight: 600 }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ '& .MuiTableCell-root': { bgcolor: '#f1f5f9', fontWeight: 800 } }}>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Invoice</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Item Name</TableCell>
                          <TableCell>HSN</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Taxable</TableCell>
                          <TableCell align="center">Rate%</TableCell>
                          <TableCell align="right">GST Am</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.itemWise.map((item, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontSize: '12px' }}>{new Date(item.date).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{item.invoice}</TableCell>
                            <TableCell sx={{ fontSize: '12px' }}>{item.customer}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{item.itemName}</TableCell>
                            <TableCell>{item.hsn}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.taxable.toFixed(2)}</TableCell>
                            <TableCell align="center">{item.gstRate}%</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#3b82f6' }}>₹{item.taxAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tab === 3 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Invoice</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>GSTIN</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Taxable</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>IGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>CGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>SGST</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Grand Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.b2b.map((inv, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{inv.invoice}</TableCell>
                            <TableCell>{inv.customer}</TableCell>
                            <TableCell sx={{ color: '#10b981', fontWeight: 600 }}>{inv.gstin}</TableCell>
                            <TableCell align="right">₹{inv.taxable.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.igst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.cgst.toFixed(2)}</TableCell>
                            <TableCell align="right">₹{inv.sgst.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>₹{inv.grandTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}

export default Gstr1DetailedReportPage;
