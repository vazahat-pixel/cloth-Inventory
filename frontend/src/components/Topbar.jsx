import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { getPageTitle } from '../common/navigation';
import { logout } from '../app/features/auth/authSlice';
import useRoleBasePath from '../hooks/useRoleBasePath';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link } from 'react-router-dom';

function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useSelector((state) => state.auth);
  const basePath = useRoleBasePath();

  const title = getPageTitle(location.pathname);

  const handleLogout = () => {
    const isHo = location.pathname.startsWith('/ho');
    dispatch(logout());
    navigate(isHo ? '/login/ho' : '/login/store', { replace: true });
  };

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: -0.5 }}>
            {title}
          </Typography>
          <Box sx={{ 
            px: 1.5, py: 0.5, 
            borderRadius: '6px', 
            bgcolor: location.pathname.startsWith('/store') ? '#fdf2f8' : '#eff6ff',
            border: '1px solid',
            borderColor: location.pathname.startsWith('/store') ? '#fbcfe8' : '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Typography sx={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              color: location.pathname.startsWith('/store') ? '#be185d' : '#1d4ed8',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {location.pathname.startsWith('/store') ? 'Store Panel' : 'Head Office'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2.5} alignItems="center">
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: 11, textTransform: 'capitalize' }}>
            {role || 'No Role'}
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', borderColor: '#e2e8f0' }} />

        <Button
          component={Link}
          to={`${basePath}/profile`}
          variant="text"
          size="small"
          startIcon={<AccountCircleIcon sx={{ fontSize: '20px !important' }} />}
          sx={{
            color: '#475569',
            '&:hover': { color: '#2563eb', backgroundColor: '#f1f5f9' },
            px: 1.5,
            py: 0.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13
          }}
        >
          Profile
        </Button>

        <Button 
          variant="contained" 
          size="small" 
          onClick={handleLogout}
          sx={{
            background: '#0f172a',
            color: '#fff',
            '&:hover': { background: '#1e293b' },
            borderRadius: 6,
            px: 2,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 13,
            boxShadow: 'none'
          }}
        >
          Logout
        </Button>
      </Stack>
    </Box>
  );
}

export default Topbar;
