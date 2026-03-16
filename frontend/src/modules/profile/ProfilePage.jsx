import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

function ProfilePage() {
  const { user, role } = useSelector((state) => state.auth);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    try {
      // Direct axios call as we might not have a dedicated slice action for this yet
      const response = await axios.patch('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setStatus({ type: 'success', message: 'Password updated successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update password' 
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#0f172a' }}>
        My Profile & Account Settings
      </Typography>

      <Grid container spacing={3}>
        {/* User Info Section */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                mx: 'auto', 
                mb: 2, 
                bgcolor: '#3b82f6', 
                fontSize: 40 
              }}
            >
              <PersonIcon fontSize="inherit" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.name}</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>{user?.email}</Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={1.5} alignItems="flex-start" sx={{ textAlign: 'left' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>ROLE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{role?.toUpperCase()}</Typography>
              </Box>
              {user?.shopName && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>ASSIGNED LOCATION</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>{user.shopName}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Change Password Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <LockIcon sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Change Password</Typography>
            </Stack>

            {status.message && (
              <Alert severity={status.type} sx={{ mb: 3 }}>
                {status.message}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordChange}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <Button 
                  variant="contained" 
                  type="submit" 
                  startIcon={<SaveIcon />}
                  sx={{ 
                    py: 1.2, 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  Update Password
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProfilePage;
