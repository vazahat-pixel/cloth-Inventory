const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Build lookup: variantId / sku / barcode -> item master fields */
export function buildVariantItemMap(items = [], itemGroups = []) {
  const groupNameById = itemGroups.reduce((acc, g) => {
    const id = g.id || g._id;
    if (id) acc[id] = g.groupName || g.name || '';
    return acc;
  }, {});

  const map = {};
  items.forEach((item) => {
    const styleId = item.styleId?.id || item.styleId?._id || item.styleId;
    const modelName =
      item.categoryName ||
      (styleId ? groupNameById[styleId] : '') ||
      item.customFields?.modelName ||
      item.customFields?.model ||
      '';

    const sizes = item.variants || item.sizes || [];
    const setSize1 = sizes[0]?.size || '';

    const base = {
      itemCode: item.itemCode || '',
      itemName: item.itemName || item.name || '',
      description: item.description || '',
      type: item.type || '',
      design: item.pattern || item.customFields?.design || '',
      fabric: item.fabric || '',
      fabricType: item.composition || item.customFields?.fabricType || '',
      color: item.color || item.shade || '',
      modelName,
      setSize1,
      itemId: item.id || item._id,
    };

    const registerKey = (key, variantMrp) => {
      if (!key) return;
      const k = String(key);
      if (!map[k]) {
        map[k] = { ...base, mrp: toNum(variantMrp) || toNum(item.mrp) };
      }
    };

    sizes.forEach((v) => {
      const mrp = toNum(v.mrp) || toNum(item.mrp);
      registerKey(v.id || v._id, mrp);
      registerKey(v.sku, mrp);
      registerKey(v.barcode, mrp);
    });
    registerKey(item.itemCode, item.mrp);
  });

  return map;
}

/** variantId + locationId -> closing stock qty */
export function buildClosingStockMap(stock = []) {
  const map = {};
  stock.forEach((s) => {
    const variantId = String(
      s.productId?._id || s.productId?.id || s.productId || s.variantId?._id || s.variantId?.id || s.variantId || '',
    ).trim();
    const locationId = String(s.storeId || s.warehouseId || '').trim();
    if (!variantId || !locationId) return;
    const key = `${variantId}_${locationId}`;
    map[key] = toNum(s.available ?? s.quantity ?? 0);
  });
  return map;
}

export function lookupVariantMeta(variantMap, line = {}) {
  const keys = [line.variantId, line.sku, line.barcode, line.productId].filter(Boolean);
  for (const key of keys) {
    const meta = variantMap[String(key)];
    if (meta) return meta;
  }
  return null;
}

export function enrichSaleDetailRow(row, { variantMap, closingStockMap, locationMap }) {
  const meta = lookupVariantMeta(variantMap, row) || {};
  const locationId = row.warehouseId || row.storeId || '';
  const variantKey = String(row.variantId || row.sku || '').trim();
  const closingKey = variantKey && locationId ? `${variantKey}_${locationId}` : '';

  return {
    ...row,
    branchName: locationMap[locationId] || row.storeGroupName || 'Main Office',
    itemCode: meta.itemCode || row.sku || '',
    modelName: meta.modelName || '',
    itemDescription: meta.description || '',
    packSize: row.size || meta.setSize1 || '',
    mrpPrice: toNum(row.mrp) || meta.mrp || toNum(row.rate),
    itemType: meta.type || '',
    design: meta.design || '',
    fabric: meta.fabric || '',
    fabricType: meta.fabricType || '',
    color: row.color || meta.color || '',
    setSize1: meta.setSize1 || row.size || '',
    purReturn: row.isReturn ? Math.abs(toNum(row.quantity)) : 0,
    closingStock: closingKey ? (closingStockMap[closingKey] ?? '') : '',
  };
}

export const SALE_REGISTER_EXPORT_HEADERS = [
  'BRANCH NAME',
  'ITEM NAME',
  'ITEM CODE',
  'MODEL NAME',
  'ITEM DESCRIPTION',
  'PACK/SIZE',
  'MRP PRICE',
  'TYPE',
  'DESIGN',
  'FABRIC',
  'FABRIC TYPE',
  'COLOR',
  'SET SIZE-1',
  'SALE QTY',
  'SALE AMOUNT',
  'PUR. RETURN',
  'CLOSING STOCK',
  'INVOICE',
  'DATE',
  'CUSTOMER',
];

export function toSaleRegisterExportRow(row) {
  return {
    'BRANCH NAME': row.branchName || '',
    'ITEM NAME': row.itemName || '',
    'ITEM CODE': row.itemCode || '',
    'MODEL NAME': row.modelName || '',
    'ITEM DESCRIPTION': row.itemDescription || '',
    'PACK/SIZE': row.packSize || '',
    'MRP PRICE': row.mrpPrice ?? '',
    TYPE: row.itemType || '',
    DESIGN: row.design || '',
    FABRIC: row.fabric || '',
    'FABRIC TYPE': row.fabricType || '',
    COLOR: row.color || '',
    'SET SIZE-1': row.setSize1 || '',
    'SALE QTY': row.quantity ?? '',
    'SALE AMOUNT': row.amount != null ? Number(row.amount).toFixed(2) : '',
    'PUR. RETURN': row.purReturn ?? '',
    'CLOSING STOCK': row.closingStock ?? '',
    INVOICE: row.invoiceNumber || '',
    DATE: row.date || '',
    CUSTOMER: row.customerName || '',
  };
}

export function buildPaymentSplitValues(payments = [], fallbackMode = '', fallbackAmount = 0) {
  const splitValues = { cash: 0, card: 0, upi: 0, 'gift voucher': 0 };
  const activePayments = (Array.isArray(payments) ? payments : []).filter((p) => toNum(p.amount) > 0);

  activePayments.forEach((p) => {
    const m = String(p.mode || '').toLowerCase().replace(/_/g, ' ');
    const amount = toNum(p.amount);
    if (m === 'cash') splitValues.cash += amount;
    else if (m === 'card') splitValues.card += amount;
    else if (m === 'upi') splitValues.upi += amount;
    else if (m === 'gift voucher') splitValues['gift voucher'] += amount;
  });

  const activeModes = ['cash', 'card', 'upi', 'gift voucher'].filter((k) => toNum(splitValues[k]) > 0);
  const isSplit = activeModes.length > 1;

  if (!activeModes.length && fallbackMode) {
    const m = String(fallbackMode).toLowerCase().replace(/_/g, ' ');
    const amount = toNum(fallbackAmount);
    if (m === 'cash') splitValues.cash = amount;
    else if (m === 'card') splitValues.card = amount;
    else if (m === 'upi') splitValues.upi = amount;
    else if (m === 'gift voucher') splitValues['gift voucher'] = amount;
  }

  return { splitValues, isSplit, activePayments };
}

export function formatPaymentDisplay(payment, rawPayments = []) {
  if (!payment && !rawPayments?.length) return '-';

  const sourcePayments = rawPayments?.length ? rawPayments : payment?.payments || [];
  const { splitValues, isSplit } = buildPaymentSplitValues(
    sourcePayments,
    payment?.mode || payment?.paymentMode,
    payment?.amountPaid,
  );

  const parts = [];
  if (toNum(splitValues.cash) > 0) parts.push(`Cash ₹${toNum(splitValues.cash).toFixed(2)}`);
  if (toNum(splitValues.card) > 0) parts.push(`Card ₹${toNum(splitValues.card).toFixed(2)}`);
  if (toNum(splitValues.upi) > 0) parts.push(`UPI ₹${toNum(splitValues.upi).toFixed(2)}`);
  if (toNum(splitValues['gift voucher']) > 0) parts.push(`Voucher ₹${toNum(splitValues['gift voucher']).toFixed(2)}`);

  if (parts.length > 1 || isSplit) return parts.join(' | ');
  if (parts.length === 1) return parts[0];
  return payment?.mode || '-';
}

export function matchesLocationFilter(sale, warehouseIds = []) {
  const locationId = String(sale.warehouseId || sale.storeId || '');
  if (!warehouseIds.length) return true;
  return warehouseIds.some((id) => String(id) === locationId);
}
