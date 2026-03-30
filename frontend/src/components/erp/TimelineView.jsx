import { Box, Paper, Stack, Typography } from '@mui/material';
import StatusBadge from './StatusBadge';

function TimelineView({ items = [] }) {
  return (
    <Stack spacing={2}>
      {items.map((item, index) => (
        <Box key={`${item.referenceNumber || item.id || index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '180px 24px 1fr' }, gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, pt: { md: 0.75 } }}>
            {item.dateTime}
          </Typography>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {index < items.length - 1 ? (
              <Box sx={{ position: 'absolute', top: 20, bottom: -24, width: 2, bgcolor: '#dbeafe', borderRadius: 999 }} />
            ) : null}
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#2563eb', mt: 0.75, boxShadow: '0 0 0 6px #fff', zIndex: 1 }} />
          </Box>
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{item.eventType}</Typography>
              <StatusBadge value={item.status || 'active'} />
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', mb: 1.25 }}>
              {item.notes || item.referenceNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Qty: {item.quantity} • From: {item.fromLocation || '-'} • To: {item.toLocation || '-'} • Ref: {item.referenceNumber || '-'} • By: {item.doneBy || '-'}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Stack>
  );
}

export default TimelineView;
