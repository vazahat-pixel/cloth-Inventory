import { Box, Button, Stack, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getRoleBasePath } from '../common/roleConfig';

function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const basePath = getRoleBasePath(role) || '/admin';

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate(basePath, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 360,
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: 80, sm: 120 },
          fontWeight: 800,
          color: '#e2e8f0',
          lineHeight: 1,
          mb: 1,
        }}
      >
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
        Page not found
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3, maxWidth: 360 }}>
        The page <code>{location.pathname}</code> does not exist or you don&apos;t have access to it.
      </Typography>
      <Button
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={handleGoHome}
        size="large"
      >
        {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
      </Button>
    </Box>
  );
}

export default NotFoundPage;
