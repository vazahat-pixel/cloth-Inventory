/**
 * Scheme engine for evaluating and applying promotional schemes during billing.
 * Evaluates active schemes against bill lines (item, brand, itemGroup applicability)
 * and returns line-level and bill-level benefits.
 */

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const isSchemeActive = (scheme, billDate) => {
  if (String(scheme?.status).toLowerCase() !== 'active') return false;
  const today = billDate ? new Date(billDate).getTime() : Date.now();
  const from = scheme.validity?.from ? new Date(scheme.validity.from).getTime() : 0;
  const to = scheme.validity?.to ? new Date(scheme.validity.to).getTime() : Infinity;
  return today >= from && today <= to;
};

const lineMatchesApplicability = (line, scheme, itemsMap) => {
  const app = scheme.applicability || {};
  const type = app.type || 'item';
  const ids = app.ids || [];
  if (!ids.length) return false;

  const itemInfo = itemsMap[line.variantId] || {};
  const itemId = itemInfo.itemId || line.itemId;
  const brandId = itemInfo.brandId;
  const itemGroupId = itemInfo.itemGroupId;
  const category = itemInfo.category || line.category;
  const brand = itemInfo.brand || line.brand;

  if (type === 'item') return ids.includes(itemId);
  if (type === 'itemGroup') return ids.includes(itemGroupId) || ids.includes(category);
  if (type === 'brand') return ids.includes(brandId) || ids.includes(brand);
  if (type === 'company') return ids.includes(brandId) || ids.includes(brand);
  return false;
};

/**
 * Evaluate schemes against bill lines and return applied benefits.
 * @param {Object[]} schemes - All schemes from state
 * @param {Object[]} lines - Bill lines with variantId, itemId, quantity, rate, amount, etc.
 * @param {Object} itemsMap - Map variantId -> { itemId, brand, category }
 * @param {string} billDate - Bill date for validity check
 * @returns {Object} { schemeDiscounts: [{ schemeId, schemeName, type, amount, lineIds }], freeGifts: [...], lineAdjustments: { lineId: { extraDiscount, schemeName } } }
 */
export function evaluateSchemes(schemes, lines, itemsMap, billDate) {
  const result = {
    schemeDiscounts: [],
    freeGifts: [],
    lineAdjustments: {},
  };

  const activeSchemes = (schemes || []).filter((s) => isSchemeActive(s, billDate));

  for (const scheme of activeSchemes) {
    const matchingLines = lines.filter((l) => lineMatchesApplicability(l, scheme, itemsMap));
    if (!matchingLines.length) continue;

    const totalQty = matchingLines.reduce((sum, l) => sum + toNum(l.quantity), 0);
    const totalValue = matchingLines.reduce((sum, l) => {
      const gross = toNum(l.quantity) * toNum(l.rate);
      const disc = gross * (toNum(l.discount) / 100);
      return sum + (gross - disc);
    }, 0);

    const cond = scheme.conditions || {};
    const minQty = toNum(cond.minQuantity);
    const minVal = toNum(cond.minValue);
    if (totalQty < minQty || totalValue < minVal) continue;

    const ben = scheme.benefit || {};
    const lineIds = matchingLines.map((l) => l.id);

    if (scheme.type === 'percentage_discount') {
      const pct = toNum(ben.discountPercent);
      const discountAmount = matchingLines.reduce((sum, l) => {
        const gross = toNum(l.quantity) * toNum(l.rate);
        const existingDisc = gross * (toNum(l.discount) / 100);
        const taxable = gross - existingDisc;
        return sum + taxable * (pct / 100);
      }, 0);
      if (discountAmount > 0) {
        result.schemeDiscounts.push({
          schemeId: scheme.id,
          schemeName: scheme.name,
          type: 'percentage_discount',
          amount: discountAmount,
          lineIds,
          percent: pct,
        });
        matchingLines.forEach((l) => {
          const gross = toNum(l.quantity) * toNum(l.rate);
          const existingDisc = gross * (toNum(l.discount) / 100);
          const taxable = gross - existingDisc;
          const extraDisc = taxable * (pct / 100);
          result.lineAdjustments[l.id] = {
            ...(result.lineAdjustments[l.id] || {}),
            extraDiscount: (result.lineAdjustments[l.id]?.extraDiscount || 0) + extraDisc,
            schemeName: scheme.name,
          };
        });
      }
    }

    if (scheme.type === 'flat_discount') {
      const flat = toNum(ben.flatAmount);
      if (flat > 0) {
        result.schemeDiscounts.push({
          schemeId: scheme.id,
          schemeName: scheme.name,
          type: 'flat_discount',
          amount: flat,
          lineIds,
        });
        const perLine = flat / matchingLines.length;
        matchingLines.forEach((l) => {
          result.lineAdjustments[l.id] = {
            ...(result.lineAdjustments[l.id] || {}),
            extraDiscount: (result.lineAdjustments[l.id]?.extraDiscount || 0) + perLine,
            schemeName: scheme.name,
          };
        });
      }
    }

    if (scheme.type === 'buy_x_get_y') {
      const buyQty = toNum(ben.buyQty, 1);
      const getQty = toNum(ben.getQty, 1);
      const sets = Math.floor(totalQty / (buyQty + getQty));
      if (sets > 0) {
        const lowestRate = Math.min(...matchingLines.map((l) => toNum(l.rate)));
        const freeValue = sets * getQty * lowestRate;
        result.schemeDiscounts.push({
          schemeId: scheme.id,
          schemeName: scheme.name,
          type: 'buy_x_get_y',
          amount: freeValue,
          lineIds,
          freeQty: sets * getQty,
        });
        const perLine = freeValue / matchingLines.length;
        matchingLines.forEach((l) => {
          result.lineAdjustments[l.id] = {
            ...(result.lineAdjustments[l.id] || {}),
            extraDiscount: (result.lineAdjustments[l.id]?.extraDiscount || 0) + perLine,
            schemeName: scheme.name,
          };
        });
      }
    }

    if (scheme.type === 'free_gift' && scheme.giftItemId) {
      result.freeGifts.push({
        schemeId: scheme.id,
        schemeName: scheme.name,
        giftItemId: scheme.giftItemId,
        giftQuantity: toNum(scheme.giftQuantity, 1),
      });
    }
  }

  return result;
}

/**
 * Compute total scheme discount from line adjustments.
 */
export function getTotalSchemeDiscount(lineAdjustments) {
  if (!lineAdjustments || typeof lineAdjustments !== 'object') return 0;
  return Object.values(lineAdjustments).reduce((sum, adj) => sum + toNum(adj?.extraDiscount), 0);
}
