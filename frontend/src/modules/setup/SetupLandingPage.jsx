import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import useRoleBasePath from '../../hooks/useRoleBasePath';
import { setupNavItems } from './setupNavConfig';

function SetupLandingPage() {
  const basePath = useRoleBasePath();

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Setup
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 760 }}>
          The setup subfields are now shown in the small side navigation next to the main sidebar.
          Choose any setup section there to open it here.
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          maxWidth: 720,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: '1px solid #dbe4f0',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
          boxShadow: '0 20px 45px rgba(148, 163, 184, 0.12)',
        }}
      >
        <Stack spacing={1.25}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Setup Navigation Updated
          </Typography>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
            Use the compact setup panel beside the main sidebar to move between Setup Accounts,
            Setup Items, Item Details, Taxes, and Configurations.
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
            This page stays clean while the setup shortcuts remain visible in a smaller side menu.
          </Typography>
        </Stack>
      </Paper>

      <Stack spacing={1.25} sx={{ mt: 3, display: { xs: 'flex', md: 'none' }, maxWidth: 560 }}>
        {setupNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Paper
              key={item.label}
              component={item.disabled ? 'div' : Link}
              to={item.disabled ? undefined : `${basePath}${item.path}`}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                color: 'inherit',
                textDecoration: 'none',
                opacity: item.disabled ? 0.65 : 1,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: '#dbeafe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {item.hint}
                  </Typography>
                </Box>
                {item.disabled ? <Chip label="Soon" size="small" /> : null}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

export default SetupLandingPage;
