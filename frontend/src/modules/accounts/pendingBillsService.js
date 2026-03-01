/**
 * Computes pending purchase bills for a supplier.
 * Outstanding = purchase.netAmount - sum of allocations in bank payments
 */
export function getPendingPurchaseBills(purchases, bankPayments, supplierId) {
  const supplierPurchases = purchases.filter((p) => p.supplierId === supplierId);
  const allocated = bankPayments.reduce((acc, pmt) => {
    if (pmt.supplierId !== supplierId) return acc;
    (pmt.allocatedBills || []).forEach((ab) => {
      acc[ab.purchaseId] = (acc[ab.purchaseId] || 0) + Number(ab.allocated || 0);
    });
    return acc;
  }, {});

  return supplierPurchases.map((p) => {
    const net = Number(p.totals?.netAmount || 0);
    const paid = Number(allocated[p.id] || 0);
    const pending = Math.max(0, net - paid);
    return {
      purchaseId: p.id,
      billNumber: p.billNumber,
      billDate: p.billDate,
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
