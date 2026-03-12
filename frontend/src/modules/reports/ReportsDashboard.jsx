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
import { useSelector } from 'react-redux';

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
    roles: ['admin']
  },
];

function ReportsDashboard() {
  const basePath = useRoleBasePath();
  const user = useSelector((state) => state.auth.user);
  const userRole = user?.role === 'Admin' ? 'admin' : 'store_staff';

  const reportCards = ALL_REPORT_CARDS.filter(card => card.roles.includes(userRole));

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Access {userRole === 'admin' ? 'complete business' : 'store-specific'} insights through sales, purchase, stock, and customer reports.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2}>
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  to={`${basePath}${card.path}`}
                  sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'flex-start' }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ color: '#3b82f6', fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {card.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default ReportsDashboard;
