const StoreInventory = require('../models/storeInventory.model');
const StockMovement = require('../models/stockMovement.model');
const Sale = require('../models/sale.model');
const { inferExchangeReturnQty } = require('../utils/saleReportUtils');

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

async function resolveReturnLine(storeId, rItem, origSale) {
  const matched = origSale?.items?.find((si) => si.barcode === rItem.barcode);
  if (matched?.itemId && matched?.variantId) {
    return {
      itemId: matched.itemId,
      barcode: rItem.barcode,
      variantId: matched.variantId,
      itemName: matched.itemName || '',
      sku: matched.sku || rItem.barcode,
      quantity: rItem.quantity,
      mrp: rItem.mrp || matched.mrp || 0,
      rate: rItem.rate || matched.rate || 0,
      total: matched.quantity
        ? round2((matched.total / matched.quantity) * rItem.quantity)
        : 0,
    };
  }

  const inv = await StoreInventory.findOne({ storeId, barcode: rItem.barcode })
    .select('itemId variantId')
    .lean();
  if (!inv?.itemId || !inv?.variantId) {
    throw new Error(`Cannot resolve item for barcode ${rItem.barcode}`);
  }
  return {
    itemId: inv.itemId,
    barcode: rItem.barcode,
    variantId: inv.variantId,
    itemName: '',
    sku: rItem.barcode,
    quantity: rItem.quantity,
    mrp: rItem.mrp || 0,
    rate: rItem.rate || 0,
    total: 0,
  };
}

function buildReturnedItemFromOrig(origItem, quantity = origItem.quantity) {
  return {
    itemId: origItem.itemId,
    variantId: origItem.variantId,
    barcode: origItem.barcode,
    itemName: origItem.itemName,
    sku: origItem.sku,
    hsnCode: origItem.hsnCode,
    category: origItem.category,
    brand: origItem.brand,
    size: origItem.size,
    color: origItem.color,
    promoDiscount: 0,
    quantity,
    mrp: origItem.mrp || origItem.rate,
    rate: round2(origItem.total / origItem.quantity),
    discount: origItem.discount || 0,
    extraDiscount: origItem.extraDiscount || 0,
    discountAmount: origItem.discountAmount || 0,
    taxAmount: origItem.taxAmount || 0,
    taxPercentage: origItem.taxPercentage || 0,
    total: round2((origItem.total / origItem.quantity) * quantity),
  };
}

async function buildFromExchangeDetails(sale) {
  const origSale = sale.exchangeDetails?.originalSaleId
    ? await Sale.findById(sale.exchangeDetails.originalSaleId).lean()
    : null;
  const lines = [];
  for (const rItem of sale.exchangeDetails.items || []) {
    lines.push(await resolveReturnLine(sale.storeId, rItem, origSale));
  }
  return lines;
}

async function buildFromStockReturnMovements(sale) {
  const movs = await StockMovement.find({
    referenceId: sale._id,
    type: 'RETURN',
  }).lean();

  const byBarcode = new Map();
  for (const mov of movs) {
    const barcode = mov.barcode || mov.sku;
    if (!barcode) continue;
    const qty = Math.abs(Number(mov.qty || 0));
    if (qty <= 0) continue;
    byBarcode.set(barcode, (byBarcode.get(barcode) || 0) + qty);
  }

  const lines = [];
  for (const [barcode, quantity] of byBarcode.entries()) {
    lines.push(await resolveReturnLine(sale.storeId, { barcode, quantity }, null));
  }
  return lines;
}

async function buildFromParentSale(sale) {
  if (!sale.parentSaleId) return [];
  const parent = await Sale.findById(sale.parentSaleId).lean();
  if (!parent?.items?.length) return [];

  const targetReturnValue = Number(sale.exchangeAdjustment || 0);
  if (targetReturnValue <= 0) return [];

  const returned = [];
  let remaining = targetReturnValue;
  for (const item of parent.items) {
    if (remaining <= 0) break;
    const lineVal = round2(item.total || 0);
    if (lineVal <= 0 || lineVal > remaining + 0.5) continue;
    returned.push(buildReturnedItemFromOrig(item));
    remaining = round2(remaining - lineVal);
  }
  return returned;
}

async function buildInferredPlaceholderLines(sale) {
  const qty = inferExchangeReturnQty(sale);
  if (qty <= 0) return [];

  const gross = (sale.items || []).reduce((n, i) => n + Number(i.quantity || 0), 0);
  if (qty >= gross && gross > 0) {
    return (sale.items || []).map((item) => ({
      itemId: item.itemId,
      variantId: item.variantId,
      barcode: item.barcode,
      itemName: item.itemName || '',
      sku: item.sku || item.barcode,
      quantity: item.quantity,
      mrp: item.mrp || 0,
      rate: item.rate || 0,
      total: round2(item.total || 0),
      _inferredExchange: true,
    }));
  }

  if (sale.items?.length === 1) {
    const item = sale.items[0];
    return [
      {
        itemId: item.itemId,
        variantId: item.variantId,
        barcode: item.barcode,
        itemName: item.itemName || '',
        sku: item.sku || item.barcode,
        quantity: qty,
        mrp: item.mrp || 0,
        rate: item.rate || 0,
        total: round2((item.total / item.quantity) * qty),
        _inferredExchange: true,
      },
    ];
  }

  return [];
}

/**
 * Resolve returnedItems for an exchange bill (no stock movement).
 */
async function resolveExchangeReturnedItems(saleDoc) {
  if ((saleDoc.returnedItems || []).length > 0) return null;

  if (saleDoc.exchangeDetails?.items?.length) {
    return buildFromExchangeDetails(saleDoc);
  }

  const fromMov = await buildFromStockReturnMovements(saleDoc);
  if (fromMov.length) return fromMov;

  const fromParent = await buildFromParentSale(saleDoc);
  if (fromParent.length) return fromParent;

  const inferred = await buildInferredPlaceholderLines(saleDoc);
  if (inferred.length) return inferred;

  return null;
}

module.exports = {
  resolveReturnLine,
  resolveExchangeReturnedItems,
};
