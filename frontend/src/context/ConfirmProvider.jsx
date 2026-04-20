import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  Typography,
  Box
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    severity: 'primary' // 'primary' | 'error' | 'warning'
  });

  const resolver = useRef(null);

  const showConfirm = useCallback((params = {}) => {
    setOptions((prev) => ({ ...prev, ...params }));
    setOpen(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleClose = useCallback((value) => {
    setOpen(false);
    if (resolver.current) {
      resolver.current(value);
      resolver.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 1, minWidth: 400 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          {options.severity === 'error' && <WarningAmberIcon color="error" />}
          {options.severity === 'warning' && <WarningAmberIcon color="warning" />}
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {options.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <DialogContentText sx={{ color: '#475569', fontSize: '1.05rem' }}>
            {options.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => handleClose(false)} 
            variant="text" 
            sx={{ fontWeight: 700, px: 3, color: '#64748b' }}
          >
            {options.cancelText}
          </Button>
          <Button 
            onClick={() => handleClose(true)} 
            variant="contained" 
            color={options.severity === 'error' ? 'error' : 'primary'}
            sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
            autoFocus
          >
            {options.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
};
