/** Clamp paired date range when one bound changes. */
export function syncDateRange(currentFrom, currentTo, field, value) {
  if (field === 'from') {
    const dateFrom = value;
    let dateTo = currentTo;
    if (dateFrom && dateTo && dateFrom > dateTo) dateTo = dateFrom;
    return { dateFrom, dateTo };
  }
  const dateTo = value;
  let dateFrom = currentFrom;
  if (dateTo && dateFrom && dateTo < dateFrom) dateFrom = dateTo;
  return { dateFrom, dateTo };
}

export function dateRangeInputProps(dateFrom, dateTo) {
  const today = new Date().toISOString().split('T')[0];
  return {
    from: { max: dateTo || today },
    to: { min: dateFrom || undefined, max: today },
  };
}
