import { Box, Card, CardContent, Typography } from '@mui/material';

function KPICard({ title, value, subtitle, icon: Icon, color = 'primary', onClick }) {
  const colorMap = {
    primary: { main: '#2563eb', bg: '#eff6ff' },
    success: { main: '#10b981', bg: '#ecfdf5' },
    info: { main: '#3b82f6', bg: '#eff6ff' },
    warning: { main: '#f59e0b', bg: '#fffbeb' },
  };

  const style = colorMap[color] || colorMap.primary;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '12px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 6px -1px rgba(0,0,0,0.03)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          borderColor: style.main,
          backgroundColor: '#fff',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)',
          transform: 'translateY(-2px)'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: '4px',
              backgroundColor: style.bg,
              color: style.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#64748b', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.025em', 
              fontSize: '0.65rem' 
            }}
          >
            {title}
          </Typography>
        </Box>
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#0f172a', 
            fontSize: '1.25rem', 
            lineHeight: 1.2,
            mb: 0.5
          }}
        >
          {value}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: style.main, 
            fontWeight: 600, 
            fontSize: '0.7rem',
            display: 'block'
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default KPICard;
