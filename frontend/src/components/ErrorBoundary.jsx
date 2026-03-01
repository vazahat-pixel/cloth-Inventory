import { Component } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Error boundary to catch runtime errors and display a fallback UI.
 * Wraps the app to prevent full crash on uncaught errors.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error: this.state.error, retry: this.handleRetry })
          : fallback;
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            backgroundColor: '#f8fafc',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 480,
              p: 4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </Typography>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: '#f1f5f9',
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 120,
                  }}
                >
                  {this.state.error?.message}
                </Box>
              )}
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
              >
                Refresh page
              </Button>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
