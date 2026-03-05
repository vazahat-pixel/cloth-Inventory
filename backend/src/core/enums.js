/**
 * enums.js — Enumerations used across models and business logic
 */

const Roles = {
    ADMIN: 'admin',
    STORE_STAFF: 'store_staff',
};

const StockHistoryType = {
    IN: 'IN',
    OUT: 'OUT',
    ADJUSTMENT: 'ADJUSTMENT',
    RETURN: 'RETURN',
    DISPATCH: 'DISPATCH',
    SALE: 'SALE',
};

const ProductionStatus = {
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const ProductionStage = {
    MATERIAL_RECEIVED: 'MATERIAL_RECEIVED',
    CUTTING: 'CUTTING',
    FINISHING: 'FINISHING',
    READY: 'READY',
};

const SaleStatus = {
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
};

const DispatchStatus = {
    PENDING: 'PENDING',
    SHIPPED: 'SHIPPED',
    RECEIVED: 'RECEIVED',
};

const PaymentMethod = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI',
    GIFT_VOUCHER: 'GIFT_VOUCHER',
    SPLIT: 'SPLIT',
};

const ReturnType = {
    CUSTOMER_RETURN: 'CUSTOMER_RETURN',
    STORE_TO_FACTORY: 'STORE_TO_FACTORY',
    DAMAGED: 'DAMAGED',
};

const ReturnStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

const GstType = {
    CGST_SGST: "CGST_SGST",
    IGST: "IGST"
};

const PurchaseStatus = {
    DRAFT: 'DRAFT',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

const LoyaltyType = {
    EARN: 'EARN',
    REDEEM: 'REDEEM'
};

const CreditNoteStatus = {
    ACTIVE: 'ACTIVE',
    USED: 'USED',
    CANCELLED: 'CANCELLED'
};

module.exports = {
    Roles,
    StockHistoryType,
    ProductionStatus,
    ProductionStage,
    SaleStatus,
    DispatchStatus,
    PaymentMethod,
    ReturnType,
    ReturnStatus,
    GstType,
    PurchaseStatus,
    LoyaltyType,
    CreditNoteStatus
};
