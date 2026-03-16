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
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <Box
      component="header"
      sx={{
        height: 60,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        px: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
        {title}
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 700, lineHeight: 1.1 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
            {role || 'No Role'}
          </Typography>
        </Box>

        <Button
          component={Link}
          to={`${basePath}/profile`}
          variant="text"
          size="small"
          startIcon={<AccountCircleIcon />}
          sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}
        >
          My Profile
        </Button>

        <Button variant="outlined" size="small" onClick={handleLogout}>
          Logout
        </Button>
      </Stack>
    </Box>
  );
}

export default Topbar;
