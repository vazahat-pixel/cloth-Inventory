import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
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
        height: 70,
        px: { xs: 3, sm: 4 },
        py: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 20,
        mx: 3,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 5,
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
        mt: 2,
        mb: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 6, height: 24, borderRadius: 2, background: location.pathname.startsWith('/store') ? 'linear-gradient(to bottom, #ec4899, #f97316)' : 'linear-gradient(to bottom, #4f46e5, #06b6d4)' }} />
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" sx={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>
            {title}
          </Typography>
          <Box sx={{ 
            px: 2, py: 0.75, 
            borderRadius: '24px', 
            bgcolor: location.pathname.startsWith('/store') ? '#ec4899' : '#4f46e5',
            border: '2px solid',
            borderColor: location.pathname.startsWith('/store') ? '#fbcfe8' : '#e0e7ff',
            boxShadow: location.pathname.startsWith('/store') ? '0 4px 14px 0 rgba(236,72,153,0.39)' : '0 4px 14px 0 rgba(79,70,229,0.39)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Typography sx={{ 
              fontSize: '14px', 
              fontWeight: 900, 
              color: '#ffffff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {location.pathname.startsWith('/store') ? 'STORE PANEL' : 'HEAD OFFICE'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={3} alignItems="center">
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ color: '#111827', fontWeight: 800, lineHeight: 1.1, fontSize: 13 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {role || 'No Role'}
          </Typography>
        </Box>

        <Button
          component={Link}
          to={`${basePath}/profile`}
          variant="contained"
          size="small"
          startIcon={<AccountCircleIcon sx={{ fontSize: '18px !important' }} />}
          sx={{
            background: 'rgba(79, 70, 229, 0.1)',
            color: '#4f46e5',
            boxShadow: 'none',
            '&:hover': { background: 'rgba(79, 70, 229, 0.2)', boxShadow: 'none' },
            borderRadius: 100,
            px: 2,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 12
          }}
        >
          Profile
        </Button>

        <Button 
          variant="contained" 
          size="small" 
          onClick={handleLogout}
          sx={{
            background: '#111827',
            color: '#fff',
            '&:hover': { background: '#1f2937' },
            borderRadius: 100,
            px: 2,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 12,
            boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25)'
          }}
        >
          Logout
        </Button>
      </Stack>
    </Box>
  );
}

export default Topbar;
