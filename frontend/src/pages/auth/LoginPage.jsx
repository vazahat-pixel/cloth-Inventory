import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Alert, 
  Box, 
  Button, 
  CircularProgress, 
  Paper, 
  Stack, 
  TextField, 
  Typography, 
  Avatar,
  AvatarGroup,
  InputAdornment
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

// Branding configuration
const COMPANY_NAME = 'Inventory ERP'; // Consistently using the remote identifier
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

      // Smart redirection: Allow landing on specific sub-panels if intended (useful for admins jumping to /store)
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
        p: 2,
      }}
    >
      {/* Abstract Background Blobs */}
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
          maxWidth: 1040,
          minHeight: 640,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' },
          borderRadius: '28px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
          zIndex: 1,
          position: 'relative',
        }}
      >
        {/* Left Section: Branding & Visuals */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 6,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle overlay shapes */}
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
                  width: 42,
                  height: 42,
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: '1.4rem' }}>H</Typography>
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1, fontSize: '1.25rem' }}
                >
                  {COMPANY_NAME}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
                  {COMPANY_TAGLINE}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ zIndex: 1, mt: 4 }}>
            <Typography
              variant="h2"
              sx={{ fontWeight: 900, mb: 2, letterSpacing: -1.5, fontSize: '3.5rem' }}
            >
              Welcome back!
            </Typography>
            <Typography
              variant="h6"
              sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 440, lineHeight: 1.6, mb: 4 }}
            >
              Streamline your apparel operations with our industrial-grade ERP suite designed for speed and precision.
            </Typography>

            {/* Floating Avatars for premium look */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
              <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, border: '2px solid #10b981' } }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.4)' }} />
              </AvatarGroup>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.9 }}>
                Trusted by 500+ Retailers
              </Typography>
            </Box>
          </Box>

          <Box sx={{ zIndex: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} {COMPANY_NAME}. Industrial Excellence.
            </Typography>
          </Box>
        </Box>

        {/* Right Section: Login Form */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: { xs: 4, sm: 6, md: 8 },
            backgroundColor: '#ffffff',
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: '#111827', mb: 1, letterSpacing: -0.5 }}
              >
                {panelLabel}
              </Typography>
              <Typography variant="body1" sx={{ color: '#6b7280', fontWeight: 500 }}>
                Sign in to continue to your {isStorePortal ? 'store' : 'head office'} workspace.
              </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                onClose={() => dispatch(clearAuthError())}
                sx={{ mb: 4, borderRadius: '12px', fontWeight: 500 }}
              >
                {error}
              </Alert>
            )}

            <Stack spacing={3}>
              <TextField
                label="Work Email"
                placeholder="you@company.com"
                type="email"
                name="email"
                fullWidth
                required
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
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                }}
              />
              <TextField
                label="Password"
                placeholder="••••••••"
                type="password"
                name="password"
                fullWidth
                required
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
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                }}
              />

              <Box sx={{ pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{
                    py: 1.6,
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
                    }
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign in to Account'}
                </Button>
              </Box>
            </Stack>

            <Box sx={{ mt: 5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Having trouble signing in? <Box component="span" sx={{ color: '#10b981', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>Contact Administrator</Box>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
