import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useRoleBasePath from '../../../hooks/useRoleBasePath';

const allActions = [
  { label: 'New Sale', path: '/sales/new', icon: AddShoppingCartIcon, color: 'primary' },
  { label: 'New Purchase', path: '/purchase/new', icon: LocalShippingIcon, color: 'success' },
  { label: 'Stock Overview', path: '/inventory/stock-overview', icon: Inventory2Icon, color: 'info' },
  { label: 'Reports', path: '/reports', icon: AssessmentIcon, color: 'secondary' },
];

function QuickActions() {
  const basePath = useRoleBasePath();
  const role = useSelector((state) => state.auth.role);
  const actions =
    role === 'Staff'
      ? allActions.filter((a) => a.path === '/sales/new' || a.path === '/inventory/stock-overview')
      : allActions;

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
          <Box sx={{ width: 8, height: 8, borderRadius: 100, bgcolor: '#4f46e5' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>
            Quick Actions
          </Typography>
        </Box>
        <Stack spacing={2}>
          {actions?.map((a) => {
            const Icon = a.icon;
            const colorMap = {
              primary: '#4f46e5',
              success: '#059669',
              info: '#0891b2',
              secondary: '#7c3aed'
            };
            const btnColor = colorMap[a.color] || '#4f46e5';

            return (
              <Button
                key={a.path}
                component={Link}
                to={`${basePath}${a.path}`}
                variant="contained"
                fullWidth
                startIcon={<Icon sx={{ fontSize: '20px !important' }} />}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 100,
                  background: 'rgba(255, 255, 255, 0.6)',
                  color: '#1f2937',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: btnColor,
                    color: '#fff',
                    transform: 'translateX(6px)',
                    boxShadow: `0 10px 20px -5px ${btnColor}40`,
                    '& .MuiButton-startIcon': { color: '#fff' }
                  },
                  '& .MuiButton-startIcon': { color: btnColor, transition: 'color 0.3s' }
                }}
              >
                {a.label}
              </Button>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
