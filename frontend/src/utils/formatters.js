export function formatDateDDMMYYYY(value) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const direct = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (direct) return `${direct[3]}/${direct[2]}/${direct[1]}`;
    return String(value);
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
