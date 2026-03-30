import { stockTransferSeed } from '../erp/erpUiMocks';
import { toNumber } from '../purchase/purchaseOrderUi';

export const stockTransferStorageKey = 'stock-transfers';

export function normalizeStockTransfer(record = {}) {
  const items = (record.items || []).map((item, index) => ({
    id: item.id || `transfer-line-${index + 1}`,
    itemCode: item.itemCode || '',
    itemName: item.itemName || '',
    size: item.size || '',
    availableQty: toNumber(item.availableQty, 0),
    transferQty: toNumber(item.transferQty, 0),
    uom: item.uom || 'PCS',
    remarks: item.remarks || '',
  }));

  return {
    id: record.id || record._id || `transfer-${Date.now()}`,
    transferNumber: record.transferNumber || `TRN-${String(Date.now()).slice(-6)}`,
    transferDate: record.transferDate || new Date().toISOString().slice(0, 10),
    fromLocation: record.fromLocation || '',
    toLocation: record.toLocation || '',
    notes: record.notes || '',
    vehicleDetails: record.vehicleDetails || '',
    transferType: record.transferType || 'HO_TO_STORE',
    status: record.status || 'Draft',
    createdBy: record.createdBy || 'Warehouse Admin',
    createdAt: record.createdAt || new Date().toISOString(),
    items,
    totalQty: items.reduce((sum, item) => sum + Number(item.transferQty || 0), 0),
    totalItems: items.length,
  };
}

export function mergeStockTransfers(...recordSets) {
  const byId = new Map();
  recordSets.flat().forEach((record) => {
    const normalized = normalizeStockTransfer(record);
    byId.set(normalized.id, normalized);
  });
  return Array.from(byId.values()).sort((left, right) => (left.transferDate < right.transferDate ? 1 : -1));
}

export const fallbackStockTransfers = stockTransferSeed.map((record) => normalizeStockTransfer(record));
