import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import AttachmentOutlinedIcon from '@mui/icons-material/AttachmentOutlined';
import useAppNavigate from '../../hooks/useAppNavigate';

function GenericVoucherForm({ title, configName, defaultAcc }) {
  const appNavigate = useAppNavigate();
  const [formData, setFormData] = useState({
    branch: 'HO/WAREHOUSE',
    configuration: configName || title?.toUpperCase(),
    bankCashAcc: defaultAcc || 'CASH IN HAND',
    balance: '0.00',
    discountAcc: 'ADD CESS CHARGE',
    bankChargesAcc: 'ADD CESS CHARGE',
    tdsAcc: 'CLOSING STOCK',
    voucherDate: new Date().toISOString().split('T')[0],
    voucherNo: `${title?.substring(0, 2).toUpperCase()}-2026-03-25-1`,
    discountAmount: '0',
    narration: '',
    discountNarration: '',
    remarks1: '',
    remarks2: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box sx={{ p: 1.5, minHeight: '100vh', bgcolor: '#0f172a' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', letterSpacing: -0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            Data entry for {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => appNavigate('/accounts/vouchers')}
            sx={{ borderColor: '#1e293b', color: '#94a3b8', textTransform: 'none', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, textTransform: 'none', borderRadius: 2, px: 2 }}
          >
            Finish (F6)
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 4, bgcolor: '#111827', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        <Grid container spacing={2.5}>
          {/* Main Info */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              select
              size="small"
              variant="outlined"
              sx={fieldStyle}
            >
              <MenuItem value="HO/WAREHOUSE">HO/WAREHOUSE</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Configuration"
              name="configuration"
              value={formData.configuration}
              onChange={handleChange}
              select
              size="small"
              variant="outlined"
              sx={fieldStyle}
            >
              <MenuItem value={formData.configuration}>{formData.configuration}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Bank/Cash A/c"
              name="bankCashAcc"
              value={formData.bankCashAcc}
              onChange={handleChange}
              select
              size="small"
              variant="outlined"
              sx={fieldStyle}
            >
              <MenuItem value={formData.bankCashAcc}>{formData.bankCashAcc}</MenuItem>
              <MenuItem value="HDFC BANK">HDFC BANK</MenuItem>
              <MenuItem value="ICICI BANK">ICICI BANK</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Balance"
              name="balance"
              value={formData.balance}
              disabled
              size="small"
              variant="outlined"
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Discount A/c"
              name="discountAcc"
              value={formData.discountAcc}
              onChange={handleChange}
              select
              size="small"
              variant="outlined"
              sx={fieldStyle}
            >
              <MenuItem value="ADD CESS CHARGE">ADD CESS CHARGE</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Bank Charges A/c"
              name="bankChargesAcc"
              value={formData.bankChargesAcc}
              onChange={handleChange}
              select
              size="small"
              variant="outlined"
              sx={fieldStyle}
            >
              <MenuItem value="ADD CESS CHARGE">ADD CESS CHARGE</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="TDS Receivable A/c"
              name="tdsAcc"
              value={formData.tdsAcc}
              onChange={handleChange}
              select
              size="small"
              variant="outlined"
              sx={fieldStyle}
            >
              <MenuItem value="CLOSING STOCK">CLOSING STOCK</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Voucher Date"
              name="voucherDate"
              type="date"
              value={formData.voucherDate}
              onChange={handleChange}
              size="small"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Voucher No."
              name="voucherNo"
              value={formData.voucherNo}
              onChange={handleChange}
              size="small"
              variant="outlined"
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: '#1e293b' }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Discount Amount"
              name="discountAmount"
              type="number"
              value={formData.discountAmount}
              onChange={handleChange}
              size="small"
              variant="outlined"
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Discount Narration"
              name="discountNarration"
              value={formData.discountNarration}
              onChange={handleChange}
              size="small"
              variant="outlined"
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Narration"
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              size="small"
              variant="outlined"
              multiline
              rows={2}
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Remarks-1"
              name="remarks1"
              value={formData.remarks1}
              onChange={handleChange}
              size="small"
              variant="outlined"
              sx={fieldStyle}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Remarks-2"
              name="remarks2"
              value={formData.remarks2}
              onChange={handleChange}
              size="small"
              variant="outlined"
              sx={fieldStyle}
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<AttachmentOutlinedIcon />}
              sx={{
                bgcolor: '#1e293b',
                color: '#60a5fa',
                '&:hover': { bgcolor: '#334155' },
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Attach Documents
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer Navigation */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button startIcon={<NavigateBeforeIcon />} variant="outlined" sx={footerBtnStyle}>Back</Button>
        <Button endIcon={<NavigateNextIcon />} variant="outlined" sx={footerBtnStyle}>Next</Button>
      </Box>

      {/* Bottom Shortcuts */}
      <Box sx={{ position: 'fixed', bottom: 10, right: 10, display: 'flex', gap: 1 }}>
         <Tooltip title="Form Shortcuts">
           <IconButton sx={{ color: '#60a5fa', bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
             <HelpOutlineOutlinedIcon fontSize="small" />
           </IconButton>
         </Tooltip>
      </Box>
    </Box>
  );
}

const fieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#e2e8f0',
    '& fieldset': { borderColor: '#1e293b' },
    '&:hover fieldset': { borderColor: '#334155' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb' },
    borderRadius: 2,
    background: 'rgba(15, 23, 42, 0.6)',
  },
  '& .MuiInputLabel-root': { color: '#94a3b8' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
  '& .MuiSelect-icon': { color: '#60a5fa' },
};

const footerBtnStyle = {
  borderColor: '#1e293b',
  color: '#cbd5e1',
  textTransform: 'none',
  borderRadius: 2,
  px: 3,
  '&:hover': { borderColor: '#334155', bgcolor: '#1e293b' }
};

export default GenericVoucherForm;
