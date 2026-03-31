import { Paper, Stack, Typography } from '@mui/material';

function SummaryCard({ label, value, helper, tone = 'default' }) {
  const palette = {
    default: { bg: '#ffffff', border: '#e2e8f0', label: '#64748b', value: '#0f172a' },
    info: { bg: '#eff6ff', border: '#bfdbfe', label: '#2563eb', value: '#1d4ed8' },
    success: { bg: '#f0fdf4', border: '#bbf7d0', label: '#15803d', value: '#166534' },
    warning: { bg: '#fff7ed', border: '#fed7aa', label: '#c2410c', value: '#9a3412' },
  };

  const styles = palette[tone] || palette.default;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${styles.border}`,
        bgcolor: styles.bg,
        minHeight: 112,
      }}
    >
      <Stack spacing={0.75}>
        <Typography variant="caption" sx={{ color: styles.label, fontWeight: 700 }}>
          {label}
        </Typography>
        {['string', 'number'].includes(typeof value) || (value && value.$$typeof) ? (
          <Typography variant="h5" sx={{ color: styles.value, fontWeight: 800 }}>
            {value}
          </Typography>
        ) : null}
        {helper ? (
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {helper}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default SummaryCard;
