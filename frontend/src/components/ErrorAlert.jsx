import { Alert, Button } from '@mui/material';

/**
 * Displays an error message from network operations.
 * Optionally supports retry callback.
 */
function ErrorAlert({ message, onRetry, retryLabel = 'Retry' }) {
  return (
    <Alert
      severity="error"
      sx={{ width: '100%' }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null
      }
    >
      {message}
    </Alert>
  );
}

export default ErrorAlert;
