import { Box, Card, CardContent, Typography } from '@mui/material';

function SalesChart({ data, title = 'Sales Trend (Last 7 Days)' }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2.5 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 140, px: 0.5 }}>
          {data.map((d, i) => {
            const barHeight = Math.max(8, (d.value / maxVal) * 100);
            return (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 44,
                    minHeight: 4,
                    height: barHeight,
                    borderRadius: '8px 8px 0 0',
                    bgcolor: 'primary.main',
                    opacity: 0.9,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                  {d.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

export default SalesChart;
