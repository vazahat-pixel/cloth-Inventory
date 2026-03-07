import { Box, Paper, Stack, Typography, Divider } from '@mui/material';

function ReturnSummaryCard({ itemsReturned, subtotal, gst, total }) {
    return (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, bgcolor: '#f8fafc', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 700, mb: 2 }}>
                Return Summary
            </Typography>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Items Returned:</Typography>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>{itemsReturned}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>₹{Number(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>GST:</Typography>
                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>₹{Number(gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                </Stack>
                <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 700 }}>Total Return Amount:</Typography>
                    <Typography variant="subtitle1" sx={{ color: '#2563eb', fontWeight: 700 }}>₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                </Stack>
            </Stack>
        </Paper>
    );
}

export default ReturnSummaryCard;
