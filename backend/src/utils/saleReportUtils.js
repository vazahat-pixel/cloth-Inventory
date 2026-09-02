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
  REVENUE_EXCLUDED_SALE_NUMBERS.has(String(sale.saleNumber || '').toUpperCase()) ||
  REVENUE_EXCLUDED_SALE_NUMBERS.has(String(sale.invoiceNumber || '').toUpperCase());

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
  // Sahibabad: same total basis as GST (no manual offset; 2-decimal total).
  if (sid === SAHIBABAD_STORE_ID) {
    return Math.round(precise * 100) / 100;
  }
  return perBillRounded;
};

/**
 * Register totals. Qty basis is store-specific: Muktsar counts by SALE DATE (late-entered
 * June bills included); other stores count "bills entered in period" (createdAt). Amount is
 * always by sale date minus phantom bills only — EXCHANGE amounts are included.
 */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const lineGrossAmount = (item = {}) =>
  Number(item.total ?? item.amount ?? 0) ||
  Number(item.rate || 0) * Number(item.quantity || 0);

/** Invoice tax — legacy rows may have totalTax=0 while tax holds the real value. */
const getSaleInvoiceTax = (sale = {}) => {
  const totalTax = Number(sale.totalTax);
  const tax = Number(sale.tax);
  if (Number.isFinite(totalTax) && totalTax > 0) return totalTax;
  if (Number.isFinite(tax) && tax > 0) return tax;
  if (Number.isFinite(totalTax)) return totalTax;
  if (Number.isFinite(tax)) return tax;
  return 0;
};

/** Taxable value aligned with sales register (grandTotal − tax, unless subTotal matches). */
const getSaleInvoiceTaxable = (sale = {}) => {
  const invoiceGrand = Number(sale.grandTotal || 0);
  const invoiceTax = getSaleInvoiceTax(sale);
  const fromGrand = round2(invoiceGrand - invoiceTax);
  const subTotal = Number(sale.subTotal);
  if (Number.isFinite(subTotal) && subTotal > 0 && Math.abs(subTotal - fromGrand) <= 0.05) {
    return round2(subTotal);
  }
  return fromGrand;
};

/**
 * Normalize CGST/SGST/IGST so breakup always matches invoice tax.
 * Legacy rows sometimes store a tiny/stale taxBreakup while tax/totalTax is correct —
 * that made GSTR-1 show ~1% effective GST instead of the real ~5%.
 */
const normalizeSaleGstBreakup = (sale = {}) => {
  const invoiceTax = round2(getSaleInvoiceTax(sale));
  const cgst = Number(sale.taxBreakup?.cgst || 0);
  const sgst = Number(sale.taxBreakup?.sgst || 0);
  const igst = Number(sale.taxBreakup?.igst || 0);
  const breakupSum = round2(cgst + sgst + igst);
  const isInterstate = igst > 0 && cgst <= 0 && sgst <= 0;

  if (invoiceTax > 0 && (breakupSum <= 0 || Math.abs(breakupSum - invoiceTax) > 0.05)) {
    // Prefer IGST only when the stored breakup clearly indicates interstate.
    if (isInterstate || (igst > 0 && igst > cgst + sgst)) {
      return { cgst: 0, sgst: 0, igst: invoiceTax, invoiceTax, isInterstate: true };
    }
    const half = round2(invoiceTax / 2);
    return {
      cgst: half,
      sgst: round2(invoiceTax - half),
      igst: 0,
      invoiceTax,
      isInterstate: false,
    };
  }

  return {
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    invoiceTax,
    isInterstate,
  };
};

/**
 * Allocate invoice GST to line items from invoice totals (same basis as sales register).
 * Legacy sales often lack per-line taxAmount; prorating from the invoice avoids 0-tax
 * lines and negative last-line adjustments in item-wise GST reports.
 */
const allocateInvoiceGstToLineItems = (sale = {}) => {
  const items = sale.items || [];
  if (!items.length) return [];

  const invoiceGrand = Number(sale.grandTotal || 0);
  const breakup = normalizeSaleGstBreakup(sale);
  const invoiceTax = breakup.invoiceTax;
  const invoiceTaxable = getSaleInvoiceTaxable(sale);
  const isInterstate = breakup.isInterstate;
  const invoiceCGST = breakup.cgst;
  const invoiceSGST = breakup.sgst;
  const invoiceIGST = breakup.igst;

  const grosses = items.map((item) => lineGrossAmount(item));
  const lineSum = grosses.reduce((sum, value) => sum + value, 0);

  let taxableSum = 0;
  let taxSum = 0;
  let cgstSum = 0;
  let sgstSum = 0;
  let igstSum = 0;

  return items.map((item, idx) => {
    const gross = grosses[idx];
    const share = lineSum > 0 ? gross / lineSum : 1 / items.length;
    const isLast = idx === items.length - 1;

    let taxable;
    let tax;
    let cgst;
    let sgst;
    let igst;

    if (isLast) {
      taxable = round2(invoiceTaxable - taxableSum);
      tax = round2(invoiceTax - taxSum);
      if (isInterstate) {
        igst = round2(invoiceIGST - igstSum);
        cgst = 0;
        sgst = 0;
      } else {
        cgst = round2(invoiceCGST - cgstSum);
        sgst = round2(invoiceSGST - sgstSum);
        igst = 0;
      }
    } else {
      taxable = round2(invoiceTaxable * share);
      tax = round2(invoiceTax * share);
      if (isInterstate) {
        igst = round2(invoiceIGST * share);
        cgst = 0;
        sgst = 0;
      } else {
        cgst = round2(invoiceCGST * share);
        sgst = round2(invoiceSGST * share);
        igst = 0;
      }
    }

    taxableSum += taxable;
    taxSum += tax;
    cgstSum += cgst;
    sgstSum += sgst;
    igstSum += igst;

    return {
      taxable,
      tax,
      cgst,
      sgst,
      igst,
      netAmount: round2(taxable + tax),
      lineGross: gross,
    };
  });
};

const aggregateRegisterTotals = (saleDateSales = [], entryDateSales = [], storeId = null) => {
  const saleQty = aggregateSalesQty(saleDateSales);
  const entryQty = aggregateSalesQty(entryDateSales);
  const sid = normalizeStoreId(storeId, saleDateSales[0]);
  const registerQty = saleQty;
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
  lineGrossAmount,
  getSaleInvoiceTax,
  getSaleInvoiceTaxable,
  normalizeSaleGstBreakup,
  allocateInvoiceGstToLineItems,
};
