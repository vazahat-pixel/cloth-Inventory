import { Chip } from '@mui/material';

function StatusChip({ value }) {
  const label = value || 'Inactive';
  const isActive = String(label).toLowerCase() === 'active';

  return (
    <Chip
      size="small"
      label={isActive ? 'Active' : 'Inactive'}
      color={isActive ? 'success' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
      sx={{ minWidth: 78 }}
    />
  );
}

export default StatusChip;
