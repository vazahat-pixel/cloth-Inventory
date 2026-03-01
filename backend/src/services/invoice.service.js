/** invoice.service.js — Invoice number and generation stub */
const Invoice = require('../models/invoice.model');
const { getNextSequence } = require('./sequence.service');
const { INVOICE_PREFIX } = require('../core/constants');

const getNextInvoiceNumber = async (session = null) => {
    const year = new Date().getFullYear();
    const seq = await getNextSequence(`INVOICE_${year}`, session);
    const prefix = INVOICE_PREFIX || 'INV';
    return `${prefix}-${year}-${seq.toString().padStart(6, '0')}`;
};

module.exports = { getNextInvoiceNumber };
