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
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
          Quick Actions
        </Typography>
        <Stack spacing={1.25}>
          {actions?.map((a) => {
            const Icon = a.icon;
            return (
              <Button
                key={a.path}
                component={Link}
                to={`${basePath}${a.path}`}
                variant="outlined"
                fullWidth
                startIcon={<Icon sx={{ fontSize: 20 }} />}
                sx={{
                  py: 1.25,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: `${a.color}.main`,
                    bgcolor: (theme) => theme.palette[a.color].main + '12',
                    color: `${a.color}.dark`,
                  },
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
