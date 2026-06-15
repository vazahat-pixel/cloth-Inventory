import { Box, LinearProgress } from '@mui/material';
import { memo } from 'react';

/**
 * Minimal route transition indicator — avoids full-page spinner flicker.
 */
function RouteFallback() {
  return (
    <Box sx={{ width: '100%', minHeight: 2 }}>
      <LinearProgress
        sx={{
          height: 2,
          borderRadius: 0,
          bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' },
        }}
      />
    </Box>
  );
}

export default memo(RouteFallback);
