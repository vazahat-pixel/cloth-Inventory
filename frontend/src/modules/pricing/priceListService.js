/**
 * Price list service - resolve selling rate for a variant based on customer and active price lists.
 */

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const isPriceListValid = (pl, billDate) => {
  if (String(pl?.status).toLowerCase() !== 'active') return false;
  const today = billDate ? new Date(billDate).getTime() : Date.now();
  const from = pl.validity?.from ? new Date(pl.validity.from).getTime() : 0;
  const to = pl.validity?.to ? new Date(pl.validity.to).getTime() : Infinity;
  return today >= from && today <= to;
};

const customerMatchesPriceList = (priceList, customerId, customerGroupId) => {
  const app = priceList.applicableCustomers || 'all';
  if (app === 'all') return true;
  if (app === 'selected') {
    const ids = priceList.selectedCustomerIds || [];
    return ids.includes(customerId);
  }
  if (app === 'group' && priceList.customerGroupId) {
    return priceList.customerGroupId === customerGroupId;
  }
  return false;
};

const variantInPriceListScope = (priceList, variantId, itemId, itemCategory) => {
  const app = priceList.applicableItems || 'all';
  if (app === 'all') return true;
  if (app === 'selected') {
    const rules = priceList.rules || [];
    return rules.some((r) => r.variantId === variantId || r.itemId === itemId);
  }
  if (app === 'group' && priceList.itemGroupId) {
    return priceList.itemGroupId === itemCategory;
  }
  return false;
};

/**
 * Get selling rate for a variant based on customer and price lists.
 * @param {Object} params
 * @param {Object[]} params.priceLists - All price lists
 * @param {string|null} params.customerId - Selected customer id
 * @param {string} params.customerGroupId - Customer's group id (if any)
 * @param {string} params.variantId - Variant id
 * @param {string} params.itemId - Parent item id
 * @param {string} params.itemCategory - Item category/group id
 * @param {Object} params.variant - Variant with mrp, sellingPrice, costPrice
 * @param {string} params.billDate - Bill date for validity
 * @returns {{ rate: number, priceListName?: string } | null} Resolved rate and price list name if matched
 */
export function getVariantRateFromPriceLists({
  priceLists,
  customerId,
  customerGroupId,
  variantId,
  itemId,
  itemCategory,
  variant,
  billDate,
}) {
  const activeLists = (priceLists || []).filter(
    (pl) =>
      isPriceListValid(pl, billDate) &&
      (customerId ? customerMatchesPriceList(pl, customerId, customerGroupId) : true) &&
      variantInPriceListScope(pl, variantId, itemId, itemCategory),
  );

  if (!activeLists.length) return null;

  const pl = activeLists[0];
  const mrp = toNum(variant?.mrp || variant?.sellingPrice);
  const cost = toNum(variant?.costPrice);
  const rules = pl.rules || [];
  const rule = rules.find((r) => r.variantId === variantId || r.itemId === itemId);

  if (rule && Number.isFinite(rule.finalPrice)) {
    return { rate: toNum(rule.finalPrice), priceListName: pl.name };
  }

  const method = pl.pricingMethod || 'fixed';
  if (method === 'fixed' && pl.fixedValue != null) {
    return { rate: toNum(pl.fixedValue), priceListName: pl.name };
  }
  if (method === 'discount_mrp') {
    const disc = toNum(pl.discountPercent, 0) / 100;
    return { rate: mrp * (1 - disc), priceListName: pl.name };
  }
  if (method === 'markup_cost') {
    const markup = toNum(pl.markupPercent, 0) / 100;
    return { rate: cost * (1 + markup), priceListName: pl.name };
  }

  return null;
}
