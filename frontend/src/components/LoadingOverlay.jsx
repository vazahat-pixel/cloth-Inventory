import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Overlay shown during async/network operations.
 * Use with loading state from auth, API calls, etc.
 */
function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 4,
        px: 2,
      }}
    >
      <CircularProgress size={40} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingOverlay;
