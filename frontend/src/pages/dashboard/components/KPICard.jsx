import { Box, Card, CardContent, Typography } from '@mui/material';

function KPICard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2.5,
        overflow: 'hidden',
        position: 'relative',
        border: 'none',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette[color].main}08 0%, ${theme.palette[color].main}04 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: `${color}.main`,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: (theme) => theme.palette[color].main + '18',
                color: `${color}.main`,
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default KPICard;
