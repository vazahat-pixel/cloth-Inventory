import { Box, Breadcrumbs, Stack, Typography } from '@mui/material';

function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions = null,
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ alignItems: { md: 'flex-start' }, justifyContent: 'space-between', mb: 2.5 }}
    >
      <Box>
        {breadcrumbs.length ? (
          <Breadcrumbs separator="/" sx={{ mb: 1 }}>
            {breadcrumbs.map((item) => (
              <Typography
                key={`${item.label}-${item.path || item.label}`}
                variant="caption"
                sx={{
                  color: item.active ? '#0f172a' : '#64748b',
                  fontWeight: item.active ? 700 : 600,
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Breadcrumbs>
        ) : null}
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 920 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {actions ? <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>{actions}</Stack> : null}
    </Stack>
  );
}

export default PageHeader;

