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
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function LowStockAlert({ items, threshold = 10 }) {
  const basePath = useRoleBasePath();
  const lowStock = items.filter((i) => (i.quantity ?? 0) <= threshold && (i.quantity ?? 0) >= 0);
  const displayItems = lowStock.slice(0, 5);

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
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Low Stock Alert
          </Typography>
        </Box>
        {displayItems.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', py: 1, fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' } }}>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayItems.map((row) => (
                    <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid', borderColor: 'action.hover', py: 1.25 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.itemName || row.sku || '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {row.sku}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: (row.quantity ?? 0) === 0 ? 'error.main' : 'warning.dark',
                          }}
                        >
                          {row.quantity ?? 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {lowStock.length > 5 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                +{lowStock.length - 5} more
              </Typography>
            )}
            <Link component={RouterLink} to={`${basePath}/inventory/stock-overview`} underline="none">
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{ mt: 2, textTransform: 'none', fontWeight: 600, px: 0 }}
              >
                View stock
              </Button>
            </Link>
          </>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No low stock items.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default LowStockAlert;
