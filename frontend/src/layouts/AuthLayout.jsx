import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'linear-gradient(135deg, #f6f8fb 0%, #eef2f7 100%)',
      }}
    >
      <Outlet />
    </Box>
  );
}

export default AuthLayout;
