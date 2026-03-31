import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { clearAuthError, loginFailure, loginStart, loginSuccess } from '../../app/features/auth/authSlice';
import authService from '../../services/authService';
import { getRoleBasePath } from '../../common/roleConfig';

const ROLE_LABELS = {
  admin: 'HO Login',
  ho: 'HO Login',
  store_staff: 'Store Login',
  store: 'Store Login',
  staff: 'Store Login',
};

const COMPANY_NAME = 'Inventory ERP';
const COMPANY_TAGLINE = 'Apparel & Retail Management Suite';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { role: urlRole } = useParams();
  const { loading, error } = useSelector((state) => state.auth);

  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    dispatch(loginStart());

    try {
      const apiRole =
        urlRole === 'ho'
          ? 'admin'
          : urlRole === 'store' || urlRole === 'staff'
            ? 'store_staff'
            : urlRole || undefined;

      const response = await authService.login({ ...formValues, role: apiRole });
      dispatch(loginSuccess(response));

      const responseRole = response.user?.role;
      const basePath = responseRole ? getRoleBasePath(responseRole) : '/ho';
      const intendedPath = location.state?.from?.pathname;

      if (intendedPath && intendedPath !== '/' && intendedPath !== basePath) {
        navigate(intendedPath, { replace: true });
      } else {
        navigate(basePath, { replace: true });
      }
    } catch (serviceError) {
      dispatch(loginFailure(serviceError.message));
    }
  };

  const panelLabel = urlRole ? ROLE_LABELS[urlRole] || 'HO Login' : 'HO Login';
  const isStorePortal = urlRole === 'store_staff' || urlRole === 'store' || urlRole === 'staff';

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.05) 100%)',
          borderRadius: '100%',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-5%',
          left: '-5%',
          width: '30%',
          height: '30%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.05) 100%)',
          borderRadius: '100%',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 920,
          minHeight: { xs: 'auto', md: 560 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
          borderRadius: '24px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 22px 45px -18px rgba(15, 23, 42, 0.18)',
          zIndex: 1,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { md: 4.5, lg: 5 },
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '-20%',
              left: '-20%',
              width: '80%',
              height: '80%',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '100%',
              zIndex: 0,
            }}
          />

          <Box sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: '1.35rem' }}>H</Typography>
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, fontSize: '1.1rem' }}
                >
                  {COMPANY_NAME}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500, fontSize: '0.72rem' }}>
                  {COMPANY_TAGLINE}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ zIndex: 1, mt: 3 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 1.5,
                letterSpacing: -1.2,
                fontSize: { md: '2.75rem', lg: '3.1rem' },
                lineHeight: 1.02,
              }}
            >
              Welcome back!
            </Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                fontWeight: 400,
                maxWidth: 380,
                lineHeight: 1.55,
                mb: 3,
                fontSize: { md: '1.05rem', lg: '1.15rem' },
              }}
            >
              Streamline your apparel operations with our industrial-grade ERP suite designed for speed and
              precision.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, gap: 1.5 }}>
              <AvatarGroup
                max={4}
                sx={{ '& .MuiAvatar-root': { width: 28, height: 28, border: '2px solid #10b981' } }}
              >
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.4)' }} />
              </AvatarGroup>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.9, fontSize: '0.95rem' }}>
                Trusted by 500+ Retailers
              </Typography>
            </Box>
          </Box>

          <Box sx={{ zIndex: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.72, fontSize: '0.78rem' }}>
              Copyright {new Date().getFullYear()} {COMPANY_NAME}. Industrial Excellence.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 3, sm: 4, md: 5 },
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem' }}>H</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{COMPANY_NAME}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {COMPANY_TAGLINE}
              </Typography>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#111827',
                  mb: 1,
                  letterSpacing: -0.5,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                {panelLabel}
              </Typography>
              <Typography variant="body1" sx={{ color: '#6b7280', fontWeight: 500, maxWidth: 360 }}>
                Sign in to continue to your {isStorePortal ? 'store' : 'head office'} workspace.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => dispatch(clearAuthError())} sx={{ mb: 3, borderRadius: '12px', fontWeight: 500 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2.25}>
              <TextField
                label="Work Email"
                placeholder="you@company.com"
                type="email"
                name="email"
                fullWidth
                required
                size="small"
                value={formValues.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    minHeight: 54,
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                  },
                  '& .MuiOutlinedInput-input': {
                    py: 1.6,
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                }}
              />
              <TextField
                label="Password"
                placeholder="********"
                type="password"
                name="password"
                fullWidth
                required
                size="small"
                value={formValues.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    minHeight: 54,
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                  },
                  '& .MuiOutlinedInput-input': {
                    py: 1.6,
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                }}
              />

              <Box sx={{ pt: 0.5 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    py: 1.3,
                    borderRadius: '14px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 20px -5px rgba(16, 185, 129, 0.4)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign in to Account'}
                </Button>
              </Box>
            </Stack>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Having trouble signing in?{' '}
                <Box
                  component="span"
                  sx={{
                    color: '#10b981',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Contact Administrator
                </Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
