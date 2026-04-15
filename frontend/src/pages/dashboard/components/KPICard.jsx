import { Box, Card, CardContent, Typography } from '@mui/material';

function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', onClick }) {
  const colorMap = {
    primary: { main: '#6366f1', bg: '#f5f7ff' },
    success: { main: '#10b981', bg: '#f1fdf4' },
    info: { main: '#0ea5e9', bg: '#f0f9ff' },
    warning: { main: '#f59e0b', bg: '#fffbeb' },
  };

  const style = colorMap[color] || colorMap.primary;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #f1f5f9',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
        } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ bgcolor: style.main, height: 6 }} />
      <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '14px',
              backgroundColor: style.bg,
              color: style.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 20px -8px ${style.main}40`,
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: style.main, fontWeight: 700, fontSize: 11, display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 900, 
            color: '#1e293b', 
            letterSpacing: '-0.04em', 
            fontSize: { xs: '2rem', md: '2.5rem' }, 
            lineHeight: 1,
            mb: 2
          }}
        >
          {value}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pt: 2, borderTop: '1.5px solid #f8fafc' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: style.main, opacity: 0.6 }} />
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: 11.5 }}>
            Live Performance Metrics
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default KPICard;
