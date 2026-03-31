import { sizeMasterSeed } from '../modules/erp/erpUiMocks';

const normalizeSizeKey = (value) => String(value ?? '').trim();

export const buildSizeLabelLookup = (sizes = []) => {
  const lookup = new Map();

  [...sizeMasterSeed, ...sizes].forEach((entry) => {
    const code = normalizeSizeKey(entry?.sizeCode || entry?.value || entry?.code || entry?.name);
    const label = normalizeSizeKey(entry?.sizeLabel || entry?.label || entry?.name || code);

    if (code) {
      lookup.set(code, label);
      lookup.set(code.toUpperCase(), label);
    }

    if (label) {
      lookup.set(label, label);
      lookup.set(label.toUpperCase(), label);
    }
  });

  return lookup;
};

export const resolveSizeLabel = (value, lookup) => {
  const key = normalizeSizeKey(value);

  if (!key) {
    return '';
  }

  return lookup?.get(key) || lookup?.get(key.toUpperCase()) || key;
};
