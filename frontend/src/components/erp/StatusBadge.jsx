import { Chip } from '@mui/material';

const STATUS_STYLE_MAP = {
  active: { color: 'success', variant: 'filled', label: 'Active' },
  inactive: { color: 'default', variant: 'outlined', label: 'Inactive' },
  draft: { color: 'default', variant: 'outlined', label: 'Draft' },
  pending: { color: 'warning', variant: 'filled', label: 'Pending' },
  approved: { color: 'success', variant: 'filled', label: 'Approved' },
  cancelled: { color: 'error', variant: 'outlined', label: 'Cancelled' },
  rejected: { color: 'error', variant: 'filled', label: 'Rejected' },
  partial: { color: 'warning', variant: 'outlined', label: 'Partial' },
  completed: { color: 'success', variant: 'filled', label: 'Completed' },
  'in transit': { color: 'info', variant: 'filled', label: 'In Transit' },
  posted: { color: 'success', variant: 'filled', label: 'Posted' },
  low_stock: { color: 'warning', variant: 'filled', label: 'Low Stock' },
  out_of_stock: { color: 'error', variant: 'filled', label: 'Out Of Stock' },
  ok: { color: 'success', variant: 'outlined', label: 'OK' },
  printed: { color: 'success', variant: 'outlined', label: 'Printed' },
  queued: { color: 'warning', variant: 'outlined', label: 'Queued' },
  duplicate: { color: 'error', variant: 'outlined', label: 'Duplicate' },
};

function toStartCase(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function StatusBadge({ value, size = 'small', sx }) {
  const normalized = String(value || 'draft').trim().toLowerCase();
  const config = STATUS_STYLE_MAP[normalized] || {
    color: 'default',
    variant: 'outlined',
    label: toStartCase(value || 'Draft'),
  };

  return (
    <Chip
      size={size}
      label={config.label}
      color={config.color}
      variant={config.variant}
      sx={{ minWidth: 92, fontWeight: 700, ...sx }}
    />
  );
}

export default StatusBadge;

