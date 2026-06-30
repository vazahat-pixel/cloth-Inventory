import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../../utils/formatters';
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
    branchName: locationMap[String(locationId)] || row.storeGroupName || 'Main Office',
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
    DATE: formatDateDDMMYYYY(row.date) || '',
    CUSTOMER: row.customerName || '',
  };
}

const SPLIT_MODE_KEYS = ['cash', 'card', 'upi', 'gift voucher'];

export function getReportRegisterAmount(sale) {
  return toNum(sale?.totals?.netPayable ?? sale?.totals?.grandTotal ?? sale?.payment?.amountPaid);
}

export function isReportableRetailSale(sale) {
  if (!sale || sale.isDeleted) return false;
  if (['CANCELLED', 'REFUNDED'].includes(sale.status)) return false;
  const t = String(sale.type || sale.saleType || 'RETAIL').toUpperCase().replace(/-/g, '_');
  if (t === 'INTERNAL_SALE') return false;
  return true;
}

export function formatCollectionMode(raw) {
  if (!raw) return 'Cash';
  const r = String(raw).toUpperCase().replace(/-/g, '_');
  if (r === 'CASH') return 'Cash';
  if (r === 'CARD') return 'Card';
  if (r === 'UPI') return 'UPI';
  if (r === 'GIFT_VOUCHER') return 'Gift Voucher';
  if (r === 'CREDIT') return 'Credit';
  if (r === 'CHEQUE') return 'Cheque';
  if (r === 'SPLIT') return 'Split';
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
}

function scaleSplitValuesToTarget(splitValues, targetAmount) {
  const target = toNum(targetAmount);
  if (target <= 0) return splitValues;

  const rawSum = SPLIT_MODE_KEYS.reduce((sum, key) => sum + toNum(splitValues[key]), 0);
  if (rawSum <= 0 || Math.abs(rawSum - target) < 0.01) return splitValues;

  const factor = target / rawSum;
  SPLIT_MODE_KEYS.forEach((key) => {
    splitValues[key] = Math.round(toNum(splitValues[key]) * factor * 100) / 100;
  });

  const scaledSum = SPLIT_MODE_KEYS.reduce((sum, key) => sum + toNum(splitValues[key]), 0);
  const drift = Math.round((target - scaledSum) * 100) / 100;
  if (Math.abs(drift) >= 0.01) {
    const adjustKey = [...SPLIT_MODE_KEYS].reverse().find((key) => toNum(splitValues[key]) > 0) || 'cash';
    splitValues[adjustKey] = Math.round((toNum(splitValues[adjustKey]) + drift) * 100) / 100;
  }

  return splitValues;
}

export function buildPaymentSplitValues(
  payments = [],
  fallbackMode = '',
  fallbackAmount = 0,
  registerAmount = null,
) {
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

  let activeModes = SPLIT_MODE_KEYS.filter((k) => toNum(splitValues[k]) > 0);
  const registerTarget = registerAmount != null ? toNum(registerAmount) : toNum(fallbackAmount);

  if (!activeModes.length && fallbackMode) {
    const m = String(fallbackMode).toLowerCase().replace(/_/g, ' ');
    const amount = registerTarget;
    if (m === 'cash') splitValues.cash = amount;
    else if (m === 'card') splitValues.card = amount;
    else if (m === 'upi') splitValues.upi = amount;
    else if (m === 'gift voucher') splitValues['gift voucher'] = amount;
    activeModes = SPLIT_MODE_KEYS.filter((k) => toNum(splitValues[k]) > 0);
  } else if (registerTarget > 0) {
    scaleSplitValuesToTarget(splitValues, registerTarget);
    activeModes = SPLIT_MODE_KEYS.filter((k) => toNum(splitValues[k]) > 0);
  }

  const isSplit = activeModes.length > 1;

  return { splitValues, isSplit, activePayments };
}

const COLLECTION_MODE_LABELS = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  'gift voucher': 'Gift Voucher',
};

export function buildCollectionRowsFromSales(sales = [], { customerMap = {}, dateFrom = '', dateTo = '' } = {}) {
  const inRange = (d) => (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  const list = [];

  sales.forEach((sale) => {
    if (!isReportableRetailSale(sale) || !inRange(sale.date)) return;

    const registerAmt = getReportRegisterAmount(sale);
    if (registerAmt <= 0) return;

    const rawPayments = sale.payment?.payments?.length ? sale.payment.payments : sale.payments || [];
    const { splitValues, isSplit } = buildPaymentSplitValues(
      rawPayments,
      sale.payment?.mode,
      sale.payment?.amountPaid || registerAmt,
      registerAmt,
    );

    const base = {
      date: sale.date,
      source: sale.invoiceNumber,
      sourceType: 'Invoice',
      customerId: sale.customerId,
      customerName: sale.customerName || customerMap[sale.customerId] || 'Walk-in',
    };

    if (isSplit) {
      SPLIT_MODE_KEYS.forEach((key) => {
        const amt = toNum(splitValues[key]);
        if (amt > 0) {
          list.push({ ...base, amount: amt, mode: COLLECTION_MODE_LABELS[key] });
        }
      });
      return;
    }

    const singleModeKey = SPLIT_MODE_KEYS.find((key) => toNum(splitValues[key]) > 0);
    list.push({
      ...base,
      amount: registerAmt,
      mode: singleModeKey ? COLLECTION_MODE_LABELS[singleModeKey] : formatCollectionMode(sale.payment?.mode),
    });
  });

  list.sort((a, b) => a.date.localeCompare(b.date));
  return list;
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
