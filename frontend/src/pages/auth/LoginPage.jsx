import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography, Divider } from '@mui/material';
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

// Static branding text for login screen.
// Update these strings to match your real company details.
const COMPANY_NAME = 'Barcode Cloth ERP';
const COMPANY_TAGLINE = 'Apparel & Retail Management Suite';
const COMPANY_ADDRESS_LINE1 = 'Your Address Line 1';
const COMPANY_ADDRESS_LINE2 = 'City, State, PIN';

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
      // Support friendly route aliases:
      // /login/ho => admin API role
      // /login/store, /login/store_staff, /login/staff => store_staff API role
      const apiRole =
        urlRole === 'ho'
          ? 'admin'
          : urlRole === 'store' || urlRole === 'staff'
          ? 'store_staff'
          : urlRole || undefined;

      const response = await authService.login({ ...formValues, role: apiRole });
      dispatch(loginSuccess(response));

      const responseRole = response.user?.role;
      const basePath = responseRole ? getRoleBasePath(responseRole) : '/admin';
      const intendedPath = location.state?.from?.pathname;

      if (intendedPath && intendedPath.startsWith(basePath)) {
        navigate(intendedPath, { replace: true });
      } else {
        navigate(basePath, { replace: true });
      }
    } catch (serviceError) {
      dispatch(loginFailure(serviceError.message));
    }
  };

  // Plain /login route (no urlRole) defaults to HO Login (admin)
  const panelLabel = urlRole ? ROLE_LABELS[urlRole] || 'HO Login' : 'HO Login';

  const isStorePortal =
    urlRole === 'store_staff' || urlRole === 'store' || urlRole === 'staff';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 980,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '5fr 4fr' },
        gap: { xs: 3, md: 4 },
        alignItems: 'stretch',
      }}
    >
      {/* Left branding / hero (company name & address) */}
      <Paper
        elevation={0}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #34d399 0%, #22c1c3 50%, #10b981 100%)',
          color: '#e5e7eb',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '30%',
              background:
                'conic-gradient(from 160deg at 30% 30%, #22d3ee, #6366f1, #22c55e, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f172a',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            B
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: 0.6, color: '#f9fafb', lineHeight: 1.1 }}
            >
              {COMPANY_NAME}
            </Typography>
            <Typography variant="caption" sx={{ color: '#ecfdf5' }}>
              {COMPANY_TAGLINE}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f9fafb', mb: 1 }}>
            Welcome
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#e0f2f1', maxWidth: 380 }}>
            Sign in to continue access pages for your{' '}
            {isStorePortal ? 'store billing and stock' : 'head office dashboard and reports'}.
          </Typography>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="overline" sx={{ color: '#bbf7d0', letterSpacing: 1 }}>
            ACTIVE PORTAL
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#e5e7eb', mt: 0.5, textTransform: 'uppercase' }}
          >
            {isStorePortal ? 'Store Panel' : 'Head Office Panel'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#dcfce7', mt: 1, maxWidth: 320 }}>
            Use your registered credentials to sign in. Access is role-based and secure.
          </Typography>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Divider sx={{ borderColor: 'rgba(16, 185, 129, 0.45)', mb: 2 }} />
          <Typography variant="caption" sx={{ color: '#ecfdf5', display: 'block' }}>
            {COMPANY_ADDRESS_LINE1}
          </Typography>
          <Typography variant="caption" sx={{ color: '#d1fae5', display: 'block' }}>
            {COMPANY_ADDRESS_LINE2}
          </Typography>
          <Typography variant="caption" sx={{ color: '#a7f3d0', display: 'block', mt: 1 }}>
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </Typography>
        </Box>
      </Paper>

      {/* Right login card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
        }}
      >
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                  {panelLabel}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Sign in to continue to your {isStorePortal ? 'store' : 'head office'} workspace.
                </Typography>
              </Box>

              {urlRole && (
                <Chip
                  label={isStorePortal ? 'Store' : 'Head Office'}
                  size="small"
                  color={isStorePortal ? 'secondary' : 'primary'}
                  variant="outlined"
                  sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}
                />
              )}
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => dispatch(clearAuthError())}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Work Email"
              placeholder="you@company.com"
              type="email"
              name="email"
              size="small"
              value={formValues.email}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              name="password"
              size="small"
              value={formValues.password}
              onChange={handleChange}
              fullWidth
              required
            />
          </Stack>

          <Box>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                mt: 1,
                py: 1.1,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 999,
              }}
            >
              {loading ? 'Signing you in…' : 'Sign in'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default LoginPage;
