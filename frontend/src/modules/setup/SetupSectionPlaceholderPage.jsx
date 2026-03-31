import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import useRoleBasePath from '../../hooks/useRoleBasePath';

function SetupSectionPlaceholderPage({
  sectionTitle,
  navItems = [],
}) {
  const navigate = useAppNavigate();
  const location = useLocation();
  const basePath = useRoleBasePath();

  const localPath = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || '/'
    : location.pathname;

  const currentItem = navItems.find((item) => (
    localPath === item.path || localPath.startsWith(`${item.path}/`)
  ));

  const title = currentItem?.label || sectionTitle;
  const firstItemPath = navItems[0]?.path;
  const sectionDescription = currentItem
    ? `${title} is now available inside the ${sectionTitle} setup flow on the frontend.`
    : `This frontend section is ready inside the ${sectionTitle} setup flow.`;

  const highlights = [
    sectionDescription,
    'The route and sidebar entry are now connected, so this page opens directly from setup navigation.',
    'You can keep building the detailed form, table, or workflow here without changing the route structure.',
  ];

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 780 }}>
          {sectionDescription}
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          maxWidth: 860,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: '1px solid #dbe4f0',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
          boxShadow: '0 20px 45px rgba(148, 163, 184, 0.12)',
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Frontend Section Ready
          </Typography>

          {highlights.map((highlight) => (
            <Box
              key={highlight}
              sx={{
                px: 1.5,
                py: 1.2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
              }}
            >
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                {highlight}
              </Typography>
            </Box>
          ))}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
            {firstItemPath && localPath !== firstItemPath ? (
              <Button
                variant="contained"
                onClick={() => navigate(firstItemPath)}
              >
                Open First Section
              </Button>
            ) : null}

            <Button
              variant="outlined"
              onClick={() => navigate('/setup')}
            >
              Back to Setup
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export default SetupSectionPlaceholderPage;
