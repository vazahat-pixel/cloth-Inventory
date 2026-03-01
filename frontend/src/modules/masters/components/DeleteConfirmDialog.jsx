import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

function DeleteConfirmDialog({ open, title, content, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{title || 'Delete Record'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#475569' }}>
          {content || 'This action cannot be undone.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteConfirmDialog;
