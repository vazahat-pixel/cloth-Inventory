import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  InputAdornment,
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
import SearchIcon from '@mui/icons-material/Search';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function InvoiceTaxReportPage() {
  const sales = useSelector((state) => state.sales?.records || []);
  const customers = useSelector((state) => state.masters?.customers || []);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const rows = useMemo(() => {
    return sales.map((sale) => {
      const gross = toNum(sale.totals?.grossAmount);
      const lineDisc = toNum(sale.totals?.lineDiscount) + toNum(sale.totals?.billDiscount);
      const taxableValue = gross - lineDisc;
      const taxAmount = toNum(sale.totals?.taxAmount);
      const netAmount = toNum(sale.totals?.netPayable);
      const cgst = taxAmount / 2;
      const sgst = taxAmount / 2;
      return {
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        customerId: sale.customerId || null,
        customer: sale.customerName || 'Walk-in Customer',
        taxableValue,
        cgst,
        sgst,
        igst: 0,
        totalTax: taxAmount,
        netAmount,
      };
    });
  }, [sales]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesDateFrom = !filters.dateFrom || row.date >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || row.date <= filters.dateTo;
      const matchesCustomer =
        !filters.customerId || filters.customerId === 'all'
          ? true
          : row.customerId === filters.customerId;
      const matchesSearch =
        !query ||
        (row.invoiceNumber || '').toLowerCase().includes(query) ||
        (row.customer || '').toLowerCase().includes(query);
      return matchesDateFrom && matchesDateTo && matchesCustomer && matchesSearch;
    });
  }, [rows, filters, searchText]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let taxableValue = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;
    let netAmount = 0;
    filteredRows.forEach((r) => {
      taxableValue += r.taxableValue;
      cgst += r.cgst;
      sgst += r.sgst;
      igst += r.igst;
      totalTax += r.totalTax;
      netAmount += r.netAmount;
    });
    return { taxableValue, cgst, sgst, igst, totalTax, netAmount };
  }, [filteredRows]);

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Invoice Tax Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Tax breakdown of sales invoices.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            type="date"
            label="From"
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={filters.dateTo || ''}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            select
            label="Customer"
            value={filters.customerId || 'all'}
            onChange={(e) => setFilters((f) => ({ ...f, customerId: e.target.value }))}
            sx={{ minWidth: 200 }}
          >
            <option value="all">All</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customerName}
              </option>
            ))}
          </TextField>
          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search invoice or customer"
            sx={{ flex: 1, maxWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Taxable Value" value={`₹${summary.taxableValue.toFixed(2)}`} />
          <SummaryChip label="CGST" value={`₹${summary.cgst.toFixed(2)}`} />
          <SummaryChip label="SGST" value={`₹${summary.sgst.toFixed(2)}`} />
          <SummaryChip label="IGST" value={`₹${summary.igst.toFixed(2)}`} />
          <SummaryChip label="Total Tax" value={`₹${summary.totalTax.toFixed(2)}`} />
          <SummaryChip label="Net Amount" value={`₹${summary.netAmount.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Taxable Value
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  CGST
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  SGST
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  IGST
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Total Tax
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Net Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.invoiceNumber}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell align="right">₹{row.taxableValue.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.cgst.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.sgst.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.igst.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.totalTax.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{row.netAmount.toFixed(2)}
                  </TableCell>
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
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}

function SummaryChip({ label, value, strong }) {
  return (
    <Box
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: 1.5,
        px: 2,
        py: 1,
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: strong ? 800 : 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default InvoiceTaxReportPage;
