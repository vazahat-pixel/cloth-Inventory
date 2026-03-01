import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import { clearAuthError, loginFailure, loginStart, loginSuccess } from '../../app/features/auth/authSlice';
import authService from '../../services/authService';
import { getRoleBasePath } from '../../common/roleConfig';

const ROLE_LABELS = {
  admin: 'Admin Portal',
  manager: 'Manager Portal',
  staff: 'Staff Portal',
};

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
      const response = await authService.login(formValues);
      dispatch(loginSuccess(response));

      const role = response.user?.role;
      const basePath = role ? getRoleBasePath(role) : '/admin';
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

  const panelLabel = urlRole ? ROLE_LABELS[urlRole] || 'Sign In' : 'Sign In';

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 420,
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {panelLabel}
            </Typography>
            {urlRole && (
              <Chip
                label={urlRole}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Stack>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Use admin@clotherp.com, manager@clotherp.com, or staff@clotherp.com with password
            password123.
          </Typography>
        </Box>

        {error && <Alert severity="error" onClose={() => dispatch(clearAuthError())}>{error}</Alert>}

        <TextField
          label="Email"
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

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {loading ? 'Signing In...' : 'Login'}
        </Button>
      </Stack>
    </Paper>
  );
}

export default LoginPage;
