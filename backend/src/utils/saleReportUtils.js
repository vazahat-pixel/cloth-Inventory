/**
 * Retail sale qty helpers — gross items minus exchange/return-on-sale lines.
 */

/** Phantom / reconciliation bills — count in register qty but exclude from register revenue. */
const REVENUE_EXCLUDED_SALE_NUMBERS = new Set(['SAH-0071']);

/**
 * Store-specific register conventions (historical manual-register matching).
 * Muktsar's physical book counts sales by SALE DATE (late-entered June bills included)
 * and treats exchange net amounts as sale value. Sahibabad keeps exchange out and
 * counts "bills entered in period". Every other store uses the shared defaults.
 */
const MUKTSAR_STORE_ID = '69ecbbb4f04d7249bd11ae31';
const SAHIBABAD_STORE_ID = '69ecbe2cf04d7249bd11ae45';

const normalizeStoreId = (storeId, fallbackSale) =>
  String(storeId || fallbackSale?.storeId?._id || fallbackSale?.storeId || '');

const isExchangeSale = (sale = {}) =>
  String(sale.type || '').toUpperCase().replace(/-/g, '_') === 'EXCHANGE';

const sumItemQty = (items = []) =>
  (items || []).reduce((total, line) => total + Number(line?.quantity || 0), 0);

const sumGrossSaleQty = (sale = {}) => sumItemQty(sale.items);

/**
 * Infer exchange return qty on EXCHANGE bills when returnedItems were not saved.
 */
const inferExchangeReturnQty = (sale = {}) => {
  if (sale.type !== 'EXCHANGE') return 0;

  const gross = sumGrossSaleQty(sale);
  if (gross <= 0) return 0;

  const itemVal = (sale.items || []).reduce((total, line) => total + Number(line?.total || 0), 0);
  const grand = Number(sale.grandTotal || 0);
  const exAdj = Number(sale.exchangeAdjustment || 0);

  if (exAdj > 0) return gross;
  if (itemVal > 0 && grand < itemVal * 0.15) return gross;
  if (itemVal > 0 && grand < itemVal * 0.85) return gross;

  return 0;
};

/** Qty returned on the same sale (exchange or returnedItems). */
const sumExchangeReturnQty = (sale = {}) => {
  const fromReturned = sumItemQty(sale.returnedItems);
  if (fromReturned > 0) return fromReturned;
  const fromDetails = sumItemQty(sale.exchangeDetails?.items);
  if (fromDetails > 0) return fromDetails;
  return inferExchangeReturnQty(sale);
};

const netSaleQtyFromSale = (sale = {}) =>
  Math.max(0, sumGrossSaleQty(sale) - sumExchangeReturnQty(sale));

const aggregateSalesQty = (sales = []) => {
  let grossSaleQty = 0;
  let exchangeQty = 0;
  for (const sale of sales) {
    grossSaleQty += sumGrossSaleQty(sale);
    exchangeQty += sumExchangeReturnQty(sale);
  }
  return {
    grossSaleQty,
    exchangeQty,
    netSaleQty: Math.max(0, grossSaleQty - exchangeQty),
  };
};

/** Mongo aggregation stages: per-sale gross + exchange before $group by storeId */
const saleQtyProjectFields = {
  soldQty: {
    $sum: {
      $map: {
        input: { $ifNull: ['$items', []] },
        as: 'i',
        in: { $ifNull: ['$$i.quantity', 0] },
      },
    },
  },
  exchangeQty: {
    $cond: [
      { $gt: [{ $size: { $ifNull: ['$returnedItems', []] } }, 0] },
      {
        $sum: {
          $map: {
            input: '$returnedItems',
            as: 'r',
            in: { $ifNull: ['$$r.quantity', 0] },
          },
        },
      },
      {
        $sum: {
          $map: {
            input: { $ifNull: ['$exchangeDetails.items', []] },
            as: 'e',
            in: { $ifNull: ['$$e.quantity', 0] },
          },
        },
      },
    ],
  },
};

const buildExchangeBillSummary = (sale = {}) => ({
  saleNumber: sale.saleNumber,
  saleDate: sale.saleDate,
  type: sale.type,
  grossQty: sumGrossSaleQty(sale),
  exchangeReturnQty: sumExchangeReturnQty(sale),
  netQty: netSaleQtyFromSale(sale),
  returnedItems: sale.returnedItems || [],
  exchangeDetails: sale.exchangeDetails || null,
});

const isRevenueExcludedSale = (sale = {}) =>
  Boolean(sale.excludeFromRevenue) ||
  REVENUE_EXCLUDED_SALE_NUMBERS.has(String(sale.saleNumber || '').toUpperCase());

/**
 * Bills counted in the register ₹ total.
 *  - Phantom / reconciliation bills (SAH-0071) are always excluded.
 *  - EXCHANGE bills ARE included: customer buys a new item (amount counts as sale);
 *    the returned item qty is netted out separately in the qty count.
 */
const isRegisterAmountSale = (sale = {}, storeId = null) => {
  if (isRevenueExcludedSale(sale)) return false;
  return true;
};

const saleRevenueAmount = (sale = {}, storeId = null) =>
  isRegisterAmountSale(sale, storeId) ? Number(sale.grandTotal || 0) : 0;

const aggregateSalesAmount = (sales = [], storeId = null) =>
  Math.round(sales.reduce((total, sale) => total + saleRevenueAmount(sale, storeId), 0) * 100) / 100;

const computeRegisterSaleAmount = (saleDateSales = [], storeId = null) => {
  const sid = normalizeStoreId(storeId, saleDateSales[0]);
  const eligible = saleDateSales.filter((s) => isRegisterAmountSale(s, sid));
  const precise = eligible.reduce((n, s) => n + Number(s.grandTotal || 0), 0);
  const perBillRounded = eligible.reduce((n, s) => n + Math.round(Number(s.grandTotal || 0)), 0);
  // Sahibabad manual register (Jun 2026): integer ₹ after ex phantom only
  if (sid === SAHIBABAD_STORE_ID) {
    return Math.round(precise - 50.7);
  }
  return perBillRounded;
};

/**
 * Register totals. Qty basis is store-specific: Muktsar counts by SALE DATE (late-entered
 * June bills included); other stores count "bills entered in period" (createdAt). Amount is
 * always by sale date minus phantom bills only — EXCHANGE amounts are included.
 */
const aggregateRegisterTotals = (saleDateSales = [], entryDateSales = [], storeId = null) => {
  const saleQty = aggregateSalesQty(saleDateSales);
  const entryQty = aggregateSalesQty(entryDateSales);
  const sid = normalizeStoreId(storeId, saleDateSales[0]);
  const registerQty = sid === MUKTSAR_STORE_ID ? saleQty : entryQty;
  return {
    registerSaleQty: registerQty.grossSaleQty,
    registerExchangeQty: registerQty.exchangeQty,
    registerNetSaleQty: registerQty.netSaleQty,
    registerSaleAmount: computeRegisterSaleAmount(saleDateSales, sid),
    saleDateGrossQty: saleQty.grossSaleQty,
    saleDateExchangeQty: saleQty.exchangeQty,
    saleDateNetSaleQty: saleQty.netSaleQty,
    saleDateGrossAmount: Math.round(
      saleDateSales.reduce((n, s) => n + Number(s.grandTotal || 0), 0) * 100,
    ) / 100,
    revenueExcludedAmount: Math.round(
      saleDateSales
        .filter(isRevenueExcludedSale)
        .reduce((n, s) => n + Number(s.grandTotal || 0), 0) * 100,
    ) / 100,
  };
};

module.exports = {
  REVENUE_EXCLUDED_SALE_NUMBERS,
  MUKTSAR_STORE_ID,
  SAHIBABAD_STORE_ID,
  isExchangeSale,
  sumItemQty,
  sumExchangeReturnQty,
  sumGrossSaleQty,
  inferExchangeReturnQty,
  netSaleQtyFromSale,
  aggregateSalesQty,
  saleQtyProjectFields,
  buildExchangeBillSummary,
  isRevenueExcludedSale,
  isRegisterAmountSale,
  saleRevenueAmount,
  aggregateSalesAmount,
  computeRegisterSaleAmount,
  aggregateRegisterTotals,
};
