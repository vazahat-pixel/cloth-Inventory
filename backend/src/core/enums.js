/**
 * enums.js — Enumerations used across models and business logic
 */

const Roles = {
    ADMIN: 'admin',
    STORE_STAFF: 'store_staff',
};

const MovementType = {
    IN: 'IN',
    OUT: 'OUT',
    ADJUSTMENT: 'ADJUSTMENT',
    RETURN: 'RETURN',
    DISPATCH: 'DISPATCH',
    SALE: 'SALE',
    AUDIT: 'AUDIT',
    PURCHASE: 'PURCHASE',
    QC_APPROVED: 'QC_APPROVED',
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
    DISPATCHED: 'DISPATCHED',
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
    SALES_RETURN: 'SALES_RETURN',
    PURCHASE_RETURN: 'PURCHASE_RETURN',
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
    PENDING_QC: 'PENDING_QC',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

const PurchaseOrderStatus = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    SENT: 'SENT',
    CLOSED: 'CLOSED'
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

const DocumentType = {
    PO: 'PO',
    GRN: 'GRN',
    QC: 'QC',
    SALE: 'SALE',
    PURCHASE: 'PURCHASE',
    DISPATCH: 'DISPATCH',
};

const DocumentStatus = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

module.exports = {
    Roles,
    MovementType,
    ProductionStatus,
    ProductionStage,
    SaleStatus,
    DispatchStatus,
    PaymentMethod,
    ReturnType,
    ReturnStatus,
    GstType,
    PurchaseStatus,
    PurchaseOrderStatus,
    LoyaltyType,
    CreditNoteStatus,
    DocumentType,
    DocumentStatus,
    GrnStatus: {
        PENDING: 'PENDING',
        COMPLETED: 'COMPLETED',
    },
    QcStatus: {
        PENDING: 'PENDING',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
    }
};
