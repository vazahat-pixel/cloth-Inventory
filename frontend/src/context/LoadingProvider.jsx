import React, { createContext, useContext, useState, useCallback } from 'react';
import { Backdrop, CircularProgress, Typography, Stack } from '@mui/material';

const LoadingContext = createContext(null);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Processing...');

  const showLoading = useCallback((msg = 'Processing...') => {
    setMessage(msg);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 999,
          flexDirection: 'column',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)'
        }}
        open={loading}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" size={60} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
            {message}
          </Typography>
        </Stack>
      </Backdrop>
    </LoadingContext.Provider>
  );
};
