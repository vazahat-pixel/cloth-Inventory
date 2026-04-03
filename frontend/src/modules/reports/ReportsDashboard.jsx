import { Link } from 'react-router-dom';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';

const ALL_REPORT_CARDS = [
  {
    title: 'Sales Reports',
    description: 'View sales invoices, revenue, and payment details.',
    path: '/reports/sales',
    icon: PointOfSaleIcon,
    roles: ['admin', 'store_staff']
  },
  {
    title: 'Purchase Reports',
    description: 'Track purchase bills, costs, and supplier transactions.',
    path: '/reports/purchase',
    icon: ShoppingCartIcon,
    roles: ['admin', 'store_staff']
  },
  {
    title: 'Ledger',
    description: 'Account-wise ledger with debit, credit, and running balance.',
    path: '/reports/ledger',
    icon: ReceiptLongIcon,
    roles: ['admin', 'store_staff']
  },
  {
    title: 'Bank Book',
    description: 'Bank-wise receipts and payments with running balance.',
    path: '/reports/bank-book',
    icon: AccountBalanceIcon,
    roles: ['admin']
  },
  {
    title: 'Collection Report',
    description: 'Cash and cheque collections from sales and bank receipts.',
    path: '/reports/collection',
    icon: PaymentsIcon,
    roles: ['admin', 'store_staff']
  },
  {
    title: 'Stock Reports',
    description: 'Current inventory, movements, and stock value.',
    path: '/reports/stock',
    icon: InventoryIcon,
    roles: ['admin', 'store_staff']
  },
  {
    title: 'Profit Analysis',
    description: 'Margin analysis, cost vs revenue, profit percentage.',
    path: '/reports/profit',
    icon: TrendingUpIcon,
    roles: ['admin', 'store_staff']
  },
  {
    title: 'Customer Reports',
    description: 'Customer activity, purchase history, loyalty points.',
    path: '/reports/customers',
    icon: PeopleIcon,
    roles: ['admin']
  },
  {
    title: 'Vendor Reports',
    description: 'Supplier purchases, amounts, and outstanding payables.',
    path: '/reports/vendors',
    icon: BusinessIcon,
    roles: ['admin']
  },
  {
    title: 'Movement & Alerts',
    description: 'Fast-moving and slow-moving items.',
    path: '/reports/movement',
    icon: TimelineIcon,
    roles: ['admin']
  },
  {
    title: 'Age Analysis',
    description: 'Stock age distribution by 0-10, 10-30, 30-60, 60-90, 90+ days.',
    path: '/reports/age-analysis',
    icon: HourglassEmptyIcon,
    roles: ['admin'],
    aliases: ['inventory age', 'slow moving']
  },
  {
    title: 'Production Yield Analysis',
    description: 'Track fabrication efficiency and contractor wastage.',
    path: '/reports/production/yield',
    icon: PrecisionManufacturingIcon,
    roles: ['admin'],
    aliases: ['wastage', 'yield', 'production']
  },
  {
    title: 'Consolidated Stock (Multi-Store)',
    description: 'Live global stock visibility across all showrooms and warehouses.',
    path: '/reports/inventory/consolidated',
    icon: Inventory2Icon,
    roles: ['admin'],
    aliases: ['global stock', 'multi store', 'full stock']
  },
  {
    title: 'Store Closure Audit (Z-Report)',
    description: 'Monitor daily cash reconciliations and variances across all showrooms.',
    path: '/reports/closure-history',
    icon: PointOfSaleIcon,
    roles: ['admin'],
    aliases: ['z-report', 'day end', 'cash audit', 'closure']
  },
];

const DAILY_REPORTS = [
    { title: 'Daily Sale Registry', path: '/reports/sales', description: 'Real-time sales for today.', icon: PointOfSaleIcon },
    { title: 'Daily Purchase Registry', path: '/reports/purchase', description: 'Goods received today.', icon: ShoppingCartIcon },
    { title: 'Current Stock (Daily)', path: '/reports/stock', description: 'Live inventory levels.', icon: InventoryIcon },
];

function ReportsDashboard() {
  const basePath = useRoleBasePath();
  const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState('');
  const userRole = user?.role === 'Admin' || user?.role === 'admin' ? 'admin' : 'store_staff';

  const filteredCards = ALL_REPORT_CARDS.filter(card => {
    const hasRole = card.roles.includes(userRole);
    if (!hasRole) return false;
    
    const query = search.toLowerCase();
    const matchesTitle = card.title.toLowerCase().includes(query);
    const matchesDesc = card.description.toLowerCase().includes(query);
    const matchesAliases = card.aliases?.some(a => a.toLowerCase().includes(query));
    
    // Add Hindi aliases support
    const isDaily = query === 'daily' || query === 'har din' || query === 'rozana';
    if (isDaily && card.title.match(/Sale|Purchase|Stock/i)) return true;

    return matchesTitle || matchesDesc || matchesAliases;
  });

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
              Reports & Analytics / रिपोट्स
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Access {userRole === 'admin' ? 'complete business' : 'store-specific'} insights. Search for "Daily Sale", "Stock", etc.
            </Typography>
          </Box>
          
          <TextField
            size="small"
            placeholder="Search Report... (e.g. Daily Sale)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              sx: { borderRadius: 2, bgcolor: '#ffffff' }
            }}
          />
        </Box>
      </Stack>

      {!search && (
          <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Quick Daily Reports / आज की रिपोर्ट
              </Typography>
              <Grid container spacing={2}>
                  {DAILY_REPORTS.map((card) => {
                      const Icon = card.icon;
                      return (
                          <Grid item xs={12} sm={4} key={card.title}>
                              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, '&:hover': { borderColor: '#10b981', bgcolor: '#f0fdf4' } }}>
                                  <CardActionArea component={Link} to={`${basePath}${card.path}`} sx={{ p: 2 }}>
                                      <Stack direction="row" spacing={2} alignItems="center">
                                          <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#ecfdf5' }}>
                                              <Icon sx={{ color: '#059669', fontSize: 24 }} />
                                          </Box>
                                          <Box>
                                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{card.title}</Typography>
                                              <Typography variant="caption" sx={{ color: '#64748b' }}>{card.description}</Typography>
                                          </Box>
                                      </Stack>
                                  </CardActionArea>
                              </Card>
                          </Grid>
                      );
                  })}
              </Grid>
          </Box>
      )}

      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {search ? `Search Results (${filteredCards.length})` : 'All Reports / सभी रिपोर्ट'}
      </Typography>

      <Grid container spacing={2}>
        {filteredCards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={`${basePath}${card.path}`}
                  sx={{ p: 2, height: '100%' }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2.5,
                        bgcolor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ color: '#475569', fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.25 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {card.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
        {filteredCards.length === 0 && (
            <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        No reports found for "{search}". Try searching for Sale, Stock or Purchase.
                    </Typography>
                </Box>
            </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default ReportsDashboard;
