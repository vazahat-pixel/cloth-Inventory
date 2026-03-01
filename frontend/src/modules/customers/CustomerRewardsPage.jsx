import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  IconButton,
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const TRANSACTION_TYPE_LABELS = {
  earned: 'Earned',
  redeemed: 'Redeemed',
  adjusted: 'Adjusted',
};

function CustomerRewardsPage() {
  const customers = useSelector((state) => state.masters.customers);
  const loyaltyTransactions = useSelector((state) => state.customerRewards.loyaltyTransactions);

  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const customerMap = useMemo(
    () => customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}),
    [customers],
  );

  const customerSummary = useMemo(() => {
    const summary = {};
    loyaltyTransactions.forEach((tx) => {
      const cusId = tx.customerId;
      if (!summary[cusId]) {
        const cus = customerMap[cusId];
        summary[cusId] = {
          customerId: cusId,
          customerName: cus?.customerName || 'Unknown',
          mobileNumber: cus?.mobileNumber || '',
          totalEarned: 0,
          totalRedeemed: 0,
          availablePoints: 0,
          lastActivityDate: null,
        };
      }
      if (tx.type === 'earned' || tx.type === 'adjusted') {
        summary[cusId].totalEarned += Math.max(0, tx.points);
        if (tx.type === 'adjusted' && tx.points < 0) {
          summary[cusId].totalRedeemed += Math.abs(tx.points);
        }
      } else if (tx.type === 'redeemed') {
        summary[cusId].totalRedeemed += Math.abs(tx.points);
      }
      const latestTx = loyaltyTransactions
        .filter((t) => t.customerId === cusId)
        .sort((a, b) => (b.date > a.date ? 1 : -1))[0];
      summary[cusId].availablePoints = latestTx?.balance ?? customerMap[cusId]?.loyaltyPoints ?? 0;
      summary[cusId].lastActivityDate = latestTx?.date ?? null;
    });
    customers.forEach((c) => {
      if (!summary[c.id]) {
        summary[c.id] = {
          customerId: c.id,
          customerName: c.customerName,
          mobileNumber: c.mobileNumber || '',
          totalEarned: 0,
          totalRedeemed: 0,
          availablePoints: c.loyaltyPoints ?? 0,
          lastActivityDate: null,
        };
      }
    });
    return Object.values(summary);
  }, [customers, customerMap, loyaltyTransactions]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return customerSummary.filter((row) => {
      const matchesName = query ? row.customerName.toLowerCase().includes(query) : true;
      const matchesMobile = query ? (row.mobileNumber || '').includes(searchText.trim()) : true;
      return matchesName || matchesMobile;
    });
  }, [customerSummary, searchText]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const getCustomerHistory = (customerId) =>
    loyaltyTransactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <>
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
              Customer Rewards
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              View loyalty points summary and history per customer.
            </Typography>
          </Box>

          <TextField
            size="small"
            value={searchText}
            onChange={(e) => {
              setPage(0);
              setSearchText(e.target.value);
            }}
            placeholder="Search by name or mobile"
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

        {filteredRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Total Earned
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Redeemed
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Available
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Activity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow key={row.customerId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.customerName}</TableCell>
                      <TableCell>{row.mobileNumber}</TableCell>
                      <TableCell align="right">{row.totalEarned}</TableCell>
                      <TableCell align="right">{row.totalRedeemed}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {row.availablePoints}
                      </TableCell>
                      <TableCell>{row.lastActivityDate || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() =>
                            setHistoryCustomer({
                              ...row,
                              history: getCustomerHistory(row.customerId),
                            })
                          }
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
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
              rowsPerPageOptions={[5, 10, 20]}
            />
          </>
        ) : (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              No customer rewards found.
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Add customers and loyalty transactions to see rewards summary.
            </Typography>
          </Box>
        )}
      </Paper>

      {historyCustomer && (
        <LoyaltyHistoryDialog
          open={Boolean(historyCustomer)}
          onClose={() => setHistoryCustomer(null)}
          customer={historyCustomer}
        />
      )}
    </>
  );
}

function LoyaltyHistoryDialog({ open, onClose, customer }) {
  if (!customer) return null;
  const transactions = customer.history || [];

  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.5)',
        zIndex: 1300,
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
      onClick={onClose}
    >
      <Paper
        elevation={4}
        sx={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto', p: 3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Loyalty History — {customer.customerName}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
          Available Points: {customer.availablePoints}
        </Typography>
        {transactions.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Points
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Balance
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</TableCell>
                    <TableCell align="right">{tx.points}</TableCell>
                    <TableCell>{tx.reference || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {tx.balance}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" sx={{ color: '#64748b', py: 2 }}>
            No loyalty transactions.
          </Typography>
        )}
        <Button variant="outlined" onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Paper>
    </Box>
  );
}

export default CustomerRewardsPage;
