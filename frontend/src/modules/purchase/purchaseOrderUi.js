import itemsData from '../items/data';
import { purchaseOrderSeed, supplierSeed } from '../erp/erpUiMocks';

export const purchaseOrderStorageKey = 'purchase-orders';
export const purchaseOrderStatuses = ['Draft', 'Pending', 'Approved', 'Cancelled'];

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const calculatePurchaseOrderLine = (line = {}) => {
  const qty = toNumber(line.qty || line.quantity, 0);
  const rate = toNumber(line.rate, 0);
  const discountPercent = toNumber(line.discountPercent || line.discount, 0);
  const taxPercent = toNumber(line.taxPercent || line.tax, 0);
  const gross = qty * rate;
  const discountAmount = (gross * discountPercent) / 100;
  const taxable = gross - discountAmount;
  const taxAmount = (taxable * taxPercent) / 100;
  const amount = taxable + taxAmount;

  return {
    gross,
    discountAmount,
    taxAmount,
    amount,
  };
};

export const calculatePurchaseOrderTotals = (lines = []) =>
  lines.reduce(
    (accumulator, line) => {
      const result = calculatePurchaseOrderLine(line);
      accumulator.subtotal += result.gross;
      accumulator.discountTotal += result.discountAmount;
      accumulator.taxTotal += result.taxAmount;
      accumulator.grandTotal += result.amount;
      accumulator.totalQty += toNumber(line.qty || line.quantity, 0);
      return accumulator;
    },
    { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0, totalQty: 0 },
  );

export const buildFallbackVariantOptions = () =>
  itemsData.flatMap((item) =>
    (item.variants || []).map((variant) => ({
      id: variant.id,
      itemCode: item.code,
      itemName: item.name,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      rate: variant.costPrice || variant.sellingPrice || 0,
      mrp: variant.mrp || variant.sellingPrice || 0,
      uom: 'PCS',
      status: variant.status || item.status || 'Active',
    })),
  );

export const buildFallbackSuppliers = () =>
  supplierSeed.map((supplier) => ({
    id: supplier.id,
    supplierName: supplier.supplierName,
    city: supplier.city,
    state: supplier.state,
    addressLine1: supplier.addressLine1,
    addressLine2: supplier.addressLine2,
    creditDays: supplier.creditDays,
    status: supplier.status,
  }));

export function normalizePurchaseOrderRecord(record = {}) {
  const items = (record.items || record.lines || []).map((line, index) => {
    const normalized = {
      id: line.id || `po-line-${index + 1}`,
      itemCode: line.itemCode || line.styleCode || line.code || '',
      itemName: line.itemName || line.name || '',
      size: line.size || '',
      color: line.color || '',
      qty: toNumber(line.qty || line.quantity, 0),
      rate: toNumber(line.rate, 0),
      discountPercent: toNumber(line.discountPercent || line.discount, 0),
      taxPercent: toNumber(line.taxPercent || line.tax, 0),
      remarks: line.remarks || '',
    };

    return {
      ...normalized,
      amount: calculatePurchaseOrderLine(normalized).amount,
    };
  });

  const totals =
    record.totals && Object.keys(record.totals).length
      ? {
          subtotal: toNumber(record.totals.subtotal || record.totals.grossAmount, 0),
          discountTotal: toNumber(record.totals.discountTotal || record.totals.lineDiscount, 0),
          taxTotal: toNumber(record.totals.taxTotal || record.totals.taxAmount, 0),
          grandTotal: toNumber(record.totals.grandTotal || record.totals.netAmount, 0),
          totalQty: toNumber(record.totals.totalQty || record.totals.totalQuantity, 0),
        }
      : calculatePurchaseOrderTotals(items);

  return {
    id: record.id || record._id || `po-${Date.now()}`,
    poNumber: record.poNumber || record.orderNumber || `PO-${String(Date.now()).slice(-6)}`,
    poDate: record.poDate || record.orderDate || new Date().toISOString().slice(0, 10),
    supplierId: record.supplierId || '',
    supplierName: record.supplierName || '',
    expectedDeliveryDate: record.expectedDeliveryDate || '',
    billingAddress: record.billingAddress || '',
    deliveryAddress: record.deliveryAddress || '',
    paymentTerms: record.paymentTerms || '',
    notes: record.notes || '',
    status: record.status || 'Draft',
    createdBy: record.createdBy || 'HO Admin',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    items,
    totals,
  };
}

export function mergePurchaseOrders(...orderSets) {
  const byId = new Map();
  orderSets.flat().forEach((order) => {
    const normalized = normalizePurchaseOrderRecord(order);
    byId.set(normalized.id, normalized);
  });
  return Array.from(byId.values()).sort((left, right) => (left.poDate < right.poDate ? 1 : -1));
}

export const fallbackPurchaseOrders = purchaseOrderSeed.map((order) => normalizePurchaseOrderRecord(order));
