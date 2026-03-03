import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { clearAuthError, registerUser } from '../../app/features/auth/authSlice';
import { getRoleBasePath } from '../../common/roleConfig';

function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [role, setRole] = useState('Staff');
    const [formValues, setFormValues] = useState({
        name: '',
        email: '',
        password: '',
        adminSecret: '',
        shopName: '',
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            name: formValues.name,
            email: formValues.email,
            password: formValues.password,
        };

        if (role === 'Admin') {
            payload.adminSecret = formValues.adminSecret;
        } else {
            payload.shopName = formValues.shopName;
        }

        dispatch(registerUser({ role, data: payload }))
            .unwrap()
            .then((response) => {
                const responseRole = response.user?.role;
                const basePath = responseRole === 'admin' ? '/admin' : '/staff';
                navigate(basePath, { replace: true });
            })
            .catch(() => {
                // Error handled by redux state
            });
    };

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
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
                        Create Account
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Join the Cloth Inventory ERP system.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" onClose={() => dispatch(clearAuthError())}>
                        {error}
                    </Alert>
                )}

                <TextField
                    select
                    label="Account Type"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    size="small"
                    fullWidth
                    required
                >
                    <MenuItem value="Staff">Store Staff</MenuItem>
                    <MenuItem value="Admin">Administrator</MenuItem>
                </TextField>

                <TextField
                    label="Full Name"
                    name="name"
                    size="small"
                    value={formValues.name}
                    onChange={handleChange}
                    fullWidth
                    required
                />

                <TextField
                    label="Email Address"
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

                {role === 'Admin' ? (
                    <TextField
                        label="Admin Secret Key"
                        type="password"
                        name="adminSecret"
                        size="small"
                        value={formValues.adminSecret}
                        onChange={handleChange}
                        fullWidth
                        required
                        helperText="Required to register as an administrator"
                    />
                ) : (
                    <TextField
                        label="Shop/Store Name"
                        name="shopName"
                        size="small"
                        value={formValues.shopName}
                        onChange={handleChange}
                        fullWidth
                        helperText="Optional: Your primary store location"
                    />
                )}

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                >
                    {loading ? 'Registering...' : 'Sign Up'}
                </Button>

                <Typography variant="body2" align="center" sx={{ color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                        Login here
                    </Link>
                </Typography>
            </Stack>
        </Paper>
    );
}

export default RegisterPage;
