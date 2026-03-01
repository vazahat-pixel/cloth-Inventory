/**
 * invoiceNumber.generator.js — Generates sequential invoice numbers
 * Format: INV-2026-000001
 */

const { INVOICE_PREFIX } = require('./constants');

const generateInvoiceNumber = (sequence) => {
    const year = new Date().getFullYear();
    const padded = String(sequence).padStart(6, '0');
    return `${INVOICE_PREFIX}-${year}-${padded}`;
};

const generatePurchaseOrderNumber = (sequence) => {
    const year = new Date().getFullYear();
    const padded = String(sequence).padStart(6, '0');
    return `PO-${year}-${padded}`;
};

const generatePurchaseNumber = (sequence) => {
    const year = new Date().getFullYear();
    const padded = String(sequence).padStart(6, '0');
    return `PUR-${year}-${padded}`;
};

module.exports = {
    generateInvoiceNumber,
    generatePurchaseOrderNumber,
    generatePurchaseNumber
};
