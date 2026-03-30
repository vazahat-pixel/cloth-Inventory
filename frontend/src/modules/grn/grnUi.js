import { grnSeed } from '../erp/erpUiMocks';
import { formatCurrency, toNumber } from '../purchase/purchaseOrderUi';

export const grnStorageKey = 'grns';
export const grnStatuses = ['Draft', 'Approved', 'Partial', 'Cancelled'];

export const calculateGrnTotals = (lines = []) =>
  lines.reduce(
    (accumulator, line) => {
      accumulator.orderedTotal += toNumber(line.orderedQty, 0);
      accumulator.receivedTotal += toNumber(line.receivedQty, 0);
      accumulator.acceptedTotal += toNumber(line.acceptedQty, 0);
      accumulator.rejectedTotal += toNumber(line.rejectedQty, 0);
      return accumulator;
    },
    { orderedTotal: 0, receivedTotal: 0, acceptedTotal: 0, rejectedTotal: 0 },
  );

export function normalizeGrnRecord(record = {}) {
  const lineItems = (record.lineItems || record.items || []).map((line, index) => ({
    id: line.id || `grn-line-${index + 1}`,
    itemCode: line.itemCode || '',
    itemName: line.itemName || '',
    size: line.size || '',
    orderedQty: toNumber(line.orderedQty || line.qty, 0),
    previouslyReceivedQty: toNumber(line.previouslyReceivedQty, 0),
    receivedQty: toNumber(line.receivedQty, 0),
    rejectedQty: toNumber(line.rejectedQty, 0),
    acceptedQty: toNumber(line.acceptedQty || toNumber(line.receivedQty, 0) - toNumber(line.rejectedQty, 0), 0),
    rate: toNumber(line.rate, 0),
    batchNo: line.batchNo || '',
    barcodeGenerate: Boolean(line.barcodeGenerate),
    remarks: line.remarks || '',
  }));

  return {
    id: record.id || record._id || `grn-${Date.now()}`,
    grnNumber: record.grnNumber || `GRN-${String(Date.now()).slice(-6)}`,
    grnDate: record.grnDate || new Date().toISOString().slice(0, 10),
    poId: record.poId || '',
    poNumber: record.poNumber || '',
    supplierName: record.supplierName || '',
    warehouse: record.warehouse || '',
    invoiceNumber: record.invoiceNumber || '',
    invoiceDate: record.invoiceDate || '',
    transportDetails: record.transportDetails || '',
    remarks: record.remarks || '',
    status: record.status || 'Draft',
    postedBy: record.postedBy || 'HO Admin',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: record.updatedAt || record.createdAt || new Date().toISOString(),
    lineItems,
    totals: calculateGrnTotals(lineItems),
  };
}

export function mergeGrns(...recordSets) {
  const byId = new Map();
  recordSets.flat().forEach((record) => {
    const normalized = normalizeGrnRecord(record);
    byId.set(normalized.id, normalized);
  });
  return Array.from(byId.values()).sort((left, right) => (left.grnDate < right.grnDate ? 1 : -1));
}

export const fallbackGrns = grnSeed.map((record) => normalizeGrnRecord(record));
export { formatCurrency };
