import { Box, Card, Stack, Typography } from '@mui/material';

function SummaryCard({ title, value, icon: Icon, color, trend }) {
    return (
        <Card
            elevation={0}
            sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                p: 2,
                bgcolor: '#ffffff',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderColor: color || '#2563eb',
                },
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 700 }}>
                        {value}
                    </Typography>
                    {trend && (
                        <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 500, display: 'block', mt: 1 }}>
                            {trend}
                        </Typography>
                    )}
                </Box>
                {Icon && (
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: color ? `${color}15` : '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon sx={{ color: color || '#2563eb', fontSize: 24 }} />
                    </Box>
                )}
            </Stack>
        </Card>
    );
}

export default SummaryCard;
