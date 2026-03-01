import { Link as RouterLink } from 'react-router-dom';
import useRoleBasePath from '../../../hooks/useRoleBasePath';
import {
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function RecentSalesTable({ sales }) {
  const basePath = useRoleBasePath();
  const recent = sales.slice(0, 5);

  const formatCurrency = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-';
  };

  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    } catch {
      return d || '-';
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Recent Sales
          </Typography>
        </Box>
        {recent.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', py: 1, fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }}>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent.map((row) => (
                    <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid', borderColor: 'action.hover', py: 1.25 } }}>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`${basePath}/sales/${row.id}`}
                          underline="hover"
                          sx={{ fontWeight: 600, color: 'primary.main' }}
                        >
                          {row.invoiceNumber || row.id}
                        </Link>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.customerName || 'Walk-in'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(row.totals?.netPayable ?? row.totals?.grossAmount ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Link component={RouterLink} to={`${basePath}/sales`} underline="none">
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{ mt: 2, textTransform: 'none', fontWeight: 600, px: 0 }}
              >
                View all sales
              </Button>
            </Link>
          </>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No recent sales.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentSalesTable;
