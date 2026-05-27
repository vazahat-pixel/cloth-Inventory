/**
 * GST rate labels for HSN master — clarifies slab vs fixed rates.
 * Billing still uses Tax Rules + MRP via calculateGST().
 */

const formatInr = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/** Fallback when Tax Rules are not loaded (matches default seed). */
export const DEFAULT_APPAREL_SLABS = [
  { min: 0, max: 2249, gst: 5, name: 'Apparel Low Slab' },
  { min: 2250, max: null, gst: 18, name: 'Apparel High Slab' },
];

const FIXED_GST_OPTIONS = [
  { value: 0, label: '0% — Fixed (exempt / zero-rated)', kind: 'fixed' },
  { value: 12, label: '12% — Fixed (har MRP par same)', kind: 'fixed' },
  { value: 28, label: '28% — Fixed (har MRP par same)', kind: 'fixed' },
];

export const buildSlabLabel = (rule) => {
  const rate = Number(rule.gst ?? rule.percentage ?? 0);
  const min = Number(rule.min ?? 0);
  const max = rule.max === null || rule.max === undefined ? null : Number(rule.max);

  if (max === null) {
    return `${rate}% — MRP ${formatInr(min)} se upar (slab)`;
  }
  if (min <= 0) {
    return `${rate}% — MRP ${formatInr(max)} tak (slab)`;
  }
  return `${rate}% — MRP ${formatInr(min)} se ${formatInr(max)} (slab)`;
};

export const buildGstRateOptionsFromTaxRules = (taxRules = []) => {
  const slabRules = (taxRules || [])
    .filter((r) => (r.type || '').toUpperCase() === 'SLAB' && r.isActive !== false)
    .sort((a, b) => Number(a.min || 0) - Number(b.min || 0));

  const slabOptions = (slabRules.length ? slabRules : DEFAULT_APPAREL_SLABS).map((rule) => ({
    value: Number(rule.gst),
    label: buildSlabLabel(rule),
    kind: 'slab',
  }));

  const slabRates = new Set(slabOptions.map((o) => o.value));
  const fixedOptions = FIXED_GST_OPTIONS.filter((o) => !slabRates.has(o.value));

  return [...slabOptions, ...fixedOptions];
};

export const getGstRateLabel = (rate, taxRules = []) => {
  const numeric = Number(rate);
  if (Number.isNaN(numeric)) return '—';

  const options = buildGstRateOptionsFromTaxRules(taxRules);
  const match = options.find((o) => o.value === numeric);
  if (match) return match.label;

  return `${numeric}%`;
};

export const GST_SLAB_INFO_MESSAGE =
  'Garment par GST MRP ke hisaab se lagti hai (slab). Yahan jo % select karte ho wo reference / default hai — bill, GRN aur dispatch par asli rate Tax Rules + item rate se calculate hoti hai.';
