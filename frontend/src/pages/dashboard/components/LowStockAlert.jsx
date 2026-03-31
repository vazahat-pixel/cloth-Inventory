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
import Inventory2Icon from '@mui/icons-material/Inventory2';

function LowStockAlert({ items, threshold = 10 }) {
  const basePath = useRoleBasePath();
  const lowStock = items.filter((i) => (i.quantity ?? 0) <= threshold && (i.quantity ?? 0) >= 0);
  const displayItems = lowStock.slice(0, 5);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 5,
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 15px 35px -10px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              color: '#fff',
              boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#111827', letterSpacing: -0.5, lineHeight: 1.2 }}>
              Low Stock Alert
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
              Critical inventory updates
            </Typography>
          </Box>
        </Box>

        {displayItems.length ? (
          <>
            <TableContainer sx={{ overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', py: 1.5, fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Item</TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', py: 1.5, fontWeight: 700, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayItems.map((row) => (
                    <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid rgba(0,0,0,0.03)', py: 2 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1f2937', fontSize: 13 }}>
                          {row.itemName || row.sku || '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600, fontSize: 11 }}>
                          {row.sku}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ 
                          display: 'inline-flex', 
                          px: 1.5, 
                          py: 0.5, 
                          borderRadius: 100, 
                          bgcolor: (row.quantity ?? 0) === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: (row.quantity ?? 0) === 0 ? '#ef4444' : '#d97706',
                          fontWeight: 800,
                          fontSize: 12
                        }}>
                          {row.quantity ?? 0}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
              {lowStock.length > 5 ? (
                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, borderRadius: 100, bgcolor: '#9ca3af' }} />
                  +{lowStock.length - 5} more items
                </Typography>
              ) : <Box />}
              <Button
                component={RouterLink}
                to={`${basePath}/inventory/stock-overview`}
                size="small"
                variant="contained"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 800, 
                  fontSize: 12,
                  borderRadius: 100,
                  bgcolor: '#111827',
                  color: '#fff',
                  px: 2,
                  py: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: '#1f2937', transform: 'translateX(4px)' }
                }}
              >
                Full list
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ py: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 2, borderRadius: 100, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Inventory2Icon sx={{ fontSize: 40 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
                Inventory looks healthy!
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', px: 2, fontSize: 13 }}>
                All your stock levels are above the threshold. We'll alert you here if items run low.
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default LowStockAlert;
