import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import useAppNavigate from '../../hooks/useAppNavigate';
import { inventoryPlaceholderContent } from './inventoryNavConfig';

function InventoryPlaceholderPage({ pageKey }) {
  const navigate = useAppNavigate();
  const section = inventoryPlaceholderContent[pageKey];

  if (!section) {
    return null;
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {section.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 780 }}>
          {section.description}
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

          {section.highlights?.map((highlight) => (
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

          {section.actions?.length ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
              {section.actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant || 'contained'}
                  onClick={() => navigate(action.path)}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}

export default InventoryPlaceholderPage;
