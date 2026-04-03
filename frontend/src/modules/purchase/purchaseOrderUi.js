export const purchaseOrderStorageKey = 'purchase-orders';
export const purchaseOrderStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'];

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
      accumulator.totalReceivedQty += toNumber(line.receivedQty, 0);
      accumulator.totalBilledQty += toNumber(line.billedQty, 0);
      return accumulator;
    },
    { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0, totalQty: 0, totalReceivedQty: 0, totalBilledQty: 0 },
  );



export function normalizePurchaseOrderRecord(record = {}) {
  const items = (record.items || record.lines || []).map((line, index) => {
    const itemInfo = line.itemId && typeof line.itemId === 'object' ? line.itemId : {};
    
    // Find variant details if itemId is populated
    let variantDetails = {};
    if (itemInfo.sizes && itemInfo.sizes.length > 0 && line.variantId) {
      variantDetails = itemInfo.sizes.find(s => {
        const sid = String(s._id || s.id || '').trim();
        const vid = String(line.variantId || '').trim();
        return sid === vid;
      }) || {};
    }

    const normalized = {
      id: line._id || line.id || `po-line-${index + 1}`,
      itemId: line.itemId?._id || line.itemId,
      variantId: line.variantId,
      itemCode: line.itemCode || itemInfo.itemCode || '',
      itemName: line.itemName || itemInfo.itemName || '',
      size: line.size || variantDetails.size || '--',
      color: line.color || itemInfo.shade || '',
      sku: line.sku || variantDetails.sku || '',
      qty: toNumber(line.qty || line.quantity, 0),
      receivedQty: toNumber(line.receivedQty, 0),
      billedQty: toNumber(line.billedQty, 0),
      rate: toNumber(line.price || line.rate, 0),
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
          totalReceivedQty: toNumber(record.totals.totalReceivedQty || record.receivedQty, 0),
          totalBilledQty: toNumber(record.totals.totalBilledQty || record.billedQty, 0),
        }
      : {
          subtotal: toNumber(record.subTotal || record.grossAmount, 0),
          discountTotal: toNumber(record.discountAmount || record.lineDiscount, 0),
          taxTotal: toNumber(record.taxAmount || record.taxAmount, 0),
          grandTotal: toNumber(record.totalAmount || record.netAmount, 0),
          totalQty: toNumber(record.totalQty || record.totalQuantity, 0),
          totalReceivedQty: toNumber(record.receivedQty || 0),
          totalBilledQty: toNumber(record.billedQty || 0),
        };

  // If both are zero, re-calculate as safety fallback
  const finalTotals = (totals.grandTotal === 0 && totals.totalQty === 0 && items.length > 0) 
    ? calculatePurchaseOrderTotals(items) 
    : totals;

  return {
    id: record.id || record._id || `po-${Date.now()}`,
    poNumber: record.poNumber || record.orderNumber || `PO-${String(Date.now()).slice(-6)}`,
    poDate: record.poDate ? new Date(record.poDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    supplierId: typeof record.supplierId === 'object' ? record.supplierId?._id : (record.supplierId || ''),
    supplierName: record.supplierName || (typeof record.supplierId === 'object' ? record.supplierId?.name : (record.supplierName || '')),
    expectedDeliveryDate: record.expectedDeliveryDate ? new Date(record.expectedDeliveryDate).toISOString().slice(0, 10) : '',
    billingAddress: record.billingAddress || '',
    deliveryAddress: record.deliveryAddress || '',
    paymentTerms: record.paymentTerms || '',
    notes: record.notes || '',
    status: record.status || 'DRAFT',
    warehouseId: record.warehouseId?._id || record.warehouseId || '',
    createdBy: (typeof record.createdBy === 'object' ? record.createdBy?.name : record.createdBy) || 'HO Admin',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    items,
    totals: finalTotals,
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


