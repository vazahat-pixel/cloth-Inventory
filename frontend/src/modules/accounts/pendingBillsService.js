/**
 * Computes pending purchase bills for a supplier.
 * Outstanding = purchase.netAmount - sum of allocations in bank payments
 */
export function getPendingPurchaseBills(purchases, bankPayments, supplierId) {
  // Only include POSTED or APPROVED purchase vouchers for payment
  const supplierPurchases = (purchases || []).filter((p) => {
    const sId = (p.supplierId?._id || p.supplierId || "").toString();
    const selId = (supplierId || "").toString();
    return sId === selId && (p.status === 'POSTED' || p.status === 'APPROVED');
  });

  const allocated = (bankPayments || []).reduce((acc, pmt) => {
    const pId = (pmt.supplierId?._id || pmt.supplierId || "").toString();
    const selId = (supplierId || "").toString();
    if (pId !== selId) return acc;
    (pmt.allocatedBills || []).forEach((ab) => {
      acc[ab.purchaseId] = (acc[ab.purchaseId] || 0) + Number(ab.allocated || 0);
    });
    return acc;
  }, {});

  return supplierPurchases.map((p) => {
    const net = Number(p.grandTotal || 0);
    const pId = (p._id || p.id).toString();
    const paid = Number(allocated[pId] || 0);
    const pending = Math.max(0, net - paid);
    return {
      purchaseId: pId,
      billNumber: p.purchaseNumber || p.invoiceNumber,
      billDate: p.invoiceDate?.slice(0, 10),
      netAmount: net,
      paidAmount: paid,
      pendingAmount: pending,
    };
  }).filter((b) => b.pendingAmount > 0);
}

/**
 * Computes pending sale bills for a customer.
 * Outstanding = sale.netPayable - sum of allocations in bank receipts
 */
export function getPendingSaleBills(sales, bankReceipts, customerId) {
  const customerSales = sales.filter((s) => s.customerId === customerId);
  const allocated = bankReceipts.reduce((acc, rcpt) => {
    if (rcpt.customerId !== customerId) return acc;
    (rcpt.allocatedBills || []).forEach((ab) => {
      acc[ab.saleId] = (acc[ab.saleId] || 0) + Number(ab.allocated || 0);
    });
    return acc;
  }, {});

  return customerSales.map((s) => {
    const net = Number(s.totals?.netPayable || 0);
    const received = Number(allocated[s.id] || 0);
    const pending = Math.max(0, net - received);
    return {
      saleId: s.id,
      invoiceNumber: s.invoiceNumber,
      date: s.date,
      netAmount: net,
      receivedAmount: received,
      pendingAmount: pending,
    };
  }).filter((b) => b.pendingAmount > 0);
}
