import { Box, Paper, Typography } from '@mui/material';

function FormSection({ title, subtitle, children, action, sx = {} }) {
  return (
    <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, ...sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action || null}
      </Box>
      {children}
    </Paper>
  );
}

export default FormSection;
