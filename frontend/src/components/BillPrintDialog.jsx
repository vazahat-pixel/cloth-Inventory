import { Box, Button, Dialog, DialogActions, DialogContent, Stack } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

/**
 * BillPrintDialog - A shared wrapper to print any document.
 * @param {boolean} open - Dialog open state.
 * @param {function} onClose - Function to close the dialog.
 * @param {ReactNode} children - The printable content (e.g., <StandardInvoicePrint />).
 * @param {string} title - Optional title for the dialog.
 */
function BillPrintDialog({ open, onClose, children }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, bgcolor: '#f1f5f9', maxHeight: '85vh' }}>
        <Box sx={{ p: 4, bgcolor: '#fff', minHeight: '100%' }}>
          {children}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            startIcon={<CloseIcon />} 
            onClick={onClose}
            sx={{ fontWeight: 700 }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint}
            sx={{ 
                px: 4, 
                fontWeight: 800,
                bgcolor: '#1e293b',
                '&:hover': { bgcolor: '#0f172a' }
            }}
          >
            Print / Download PDF
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default BillPrintDialog;
