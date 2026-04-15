import { Link } from 'react-router-dom';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Paper,
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
    roles: ['admin']
  },
  {
    title: 'Daily Inward',
    description: 'Track daily stock receipts and GRNs.',
    path: '/reports/inward',
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
    
    return matchesTitle || matchesDesc || matchesAliases;
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
      <Stack spacing={4}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 4, fontWeight: 500 }}>
              {userRole === 'admin' 
                ? 'Access comprehensive business insights and financial intelligence.' 
                : 'Access store-specific inventory and sales performance reports.'}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <TextField
                    size="medium"
                    placeholder="Quick Search Report (e.g. Sales, Ledger, Stock)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: '100%', maxWidth: 600 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>,
                        sx: { 
                            borderRadius: 4, 
                            bgcolor: '#ffffff',
                            height: 56,
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#3b82f6' }
                        }
                    }}
                />
            </Box>
        </Box>

        {/* Search Results or Welcome Content */}
        {search ? (
            <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#64748b', mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Search Results ({filteredCards.length})
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
                                        borderRadius: 4,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: '#3b82f6',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)',
                                        },
                                    }}
                                >
                                    <CardActionArea component={Link} to={`${basePath}${card.path}`} sx={{ p: 2.5 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#eff6ff' }}>
                                                <Icon sx={{ color: '#2563eb', fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{card.title}</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b' }}>{card.description}</Typography>
                                            </Box>
                                        </Stack>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
                {filteredCards.length === 0 && (
                     <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#94a3b8' }}>No reports found matching your search</Typography>
                     </Box>
                )}
            </Box>
        ) : (
            <Box sx={{ mt: 2 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', height: '100%' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Primary Reports</Typography>
                            <Stack spacing={1.5}>
                                <Button component={Link} to={`${basePath}/reports/sales`} variant="text" startIcon={<PointOfSaleIcon />} sx={{ justifyContent: 'flex-start', color: '#334155' }}>Daily Sales Registry</Button>
                                <Button component={Link} to={`${basePath}/reports/stock`} variant="text" startIcon={<InventoryIcon />} sx={{ justifyContent: 'flex-start', color: '#334155' }}>Current Stock Report</Button>
                                <Button component={Link} to={`${basePath}/reports/collection`} variant="text" startIcon={<PaymentsIcon />} sx={{ justifyContent: 'flex-start', color: '#334155' }}>Collection Analysis</Button>
                                <Button component={Link} to={`${basePath}/reports/ledger`} variant="text" startIcon={<ReceiptLongIcon />} sx={{ justifyContent: 'flex-start', color: '#334155' }}>General Ledger</Button>
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#1e293b' }}>
                                Use the sidebar to explore.
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                                All reports are now organized neatly in the left navigation menu. You can quickly jump to Sale registers, Stock analysis, or Financial statements directly from there.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        )}
      </Stack>
    </Box>
  );
}

export default ReportsDashboard;
