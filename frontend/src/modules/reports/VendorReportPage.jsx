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
import ReportFilterPanel from './ReportFilterPanel';
import ReportExportButton from './ReportExportButton';
import { SummaryChip } from './SalesReportPage';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function VendorReportPage() {
  const purchases = useSelector((state) => state.purchase?.records || []);
  const suppliers = useSelector((state) => state.masters?.suppliers || []);

  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const vendorRows = useMemo(() => {
    const map = {};
    suppliers.forEach((s) => {
      map[s.id] = {
        supplierId: s.id,
        supplierName: s.supplierName,
        totalPurchases: 0,
        totalAmount: 0,
        outstandingPayable: 0,
        lastPurchaseDate: null,
      };
    });
    purchases.forEach((p) => {
      const supId = p.supplierId;
      if (!map[supId]) {
        map[supId] = {
          supplierId: supId,
          supplierName: 'Unknown',
          totalPurchases: 0,
          totalAmount: 0,
          outstandingPayable: 0,
          lastPurchaseDate: null,
        };
      }
      map[supId].totalPurchases += 1;
      map[supId].totalAmount += toNum(p.totals?.netAmount);
      if (!map[supId].lastPurchaseDate || p.billDate > map[supId].lastPurchaseDate) {
        map[supId].lastPurchaseDate = p.billDate;
      }
    });
    return Object.values(map).filter((r) => r.totalPurchases > 0);
  }, [suppliers, purchases]);

  const supplierMap = useMemo(
    () => suppliers.reduce((acc, s) => ({ ...acc, [s.id]: s.supplierName }), {}),
    [suppliers],
  );

  const enrichedRows = useMemo(() => {
    return vendorRows.map((r) => ({
      ...r,
      supplierName: supplierMap[r.supplierId] || r.supplierName,
    }));
  }, [vendorRows, supplierMap]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return enrichedRows.filter((row) => {
      const matchesSupplier =
        !filters.supplierId || filters.supplierId === 'all' || row.supplierId === filters.supplierId;
      const matchesSearch =
        !query || (row.supplierName || '').toLowerCase().includes(query);
      return matchesSupplier && matchesSearch;
    });
  }, [enrichedRows, filters, searchText]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, page, rowsPerPage],
  );

  const summary = useMemo(() => {
    let totalPurchases = 0;
    let totalAmount = 0;
    filteredRows.forEach((r) => {
      totalPurchases += r.totalPurchases;
      totalAmount += r.totalAmount;
    });
    return {
      totalVendors: filteredRows.length,
      totalPurchases,
      totalAmount,
    };
  }, [filteredRows]);

  const exportRows = useMemo(
    () =>
      filteredRows.map((r) => ({
        'Supplier Name': r.supplierName,
        'Total Purchases': r.totalPurchases,
        'Total Amount': r.totalAmount.toFixed(2),
        Outstanding: r.outstandingPayable.toFixed(2),
        'Last Purchase': r.lastPurchaseDate || '-',
      })),
    [filteredRows],
  );

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Vendor Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Supplier purchases, amounts, and outstanding payables.
          </Typography>
        </Box>

        <ReportFilterPanel filters={filters} onFiltersChange={setFilters} showSupplier />

        <TextField
          size="small"
          value={searchText}
          onChange={(e) => {
            setPage(0);
            setSearchText(e.target.value);
          }}
          placeholder="Search by supplier name"
          sx={{ maxWidth: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
          Summary
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <SummaryChip label="Total Vendors" value={summary.totalVendors} />
          <SummaryChip label="Total Purchases" value={summary.totalPurchases} />
          <SummaryChip label="Total Amount" value={`₹${summary.totalAmount.toFixed(2)}`} strong />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ p: 1.5 }}>
          <ReportExportButton
            headers={['Supplier Name', 'Total Purchases', 'Total Amount', 'Outstanding', 'Last Purchase']}
            headerKeys={['Supplier Name', 'Total Purchases', 'Total Amount', 'Outstanding', 'Last Purchase']}
            rows={exportRows}
            filename="vendor-report.csv"
          />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Supplier Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Total Purchases
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Total Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Outstanding
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Purchase</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row) => (
                <TableRow key={row.supplierId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.supplierName}</TableCell>
                  <TableCell align="right">{row.totalPurchases}</TableCell>
                  <TableCell align="right">₹{row.totalAmount.toFixed(2)}</TableCell>
                  <TableCell align="right">₹{row.outstandingPayable.toFixed(2)}</TableCell>
                  <TableCell>{row.lastPurchaseDate || '-'}</TableCell>
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

export default VendorReportPage;
