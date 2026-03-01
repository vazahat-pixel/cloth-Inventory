/**
 * constants.js — Application-wide constants
 */

module.exports = {
    // Pagination
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Token
    TOKEN_HEADER: 'Authorization',
    TOKEN_PREFIX: 'Bearer',

    // Barcode
    BARCODE_FORMAT: 'CODE128',

    // Invoice prefix
    INVOICE_PREFIX: 'INV',
    PURCHASE_PREFIX: 'PO',

    // Date formats
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',

    // Loyalty System
    LOYALTY_EARNING_RATIO: 100, // 1 point per ₹100
    LOYALTY_POINT_VALUE: 1,      // 1 point = ₹1
    MIN_REDEEM_POINTS: 50,
};
