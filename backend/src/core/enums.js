/**
 * enums.js — Enumerations used across models and business logic
 */

const Roles = {
    ADMIN: 'admin',
    STORE_MANAGER: 'store_manager',
    ACCOUNTANT: 'accountant',
    STORE_STAFF: 'store_staff',
};

const MovementType = {
    IN: 'IN',
    OUT: 'OUT',
    ADJUSTMENT: 'ADJUSTMENT',
    DISPATCH: 'DISPATCH',
    SALE: 'SALE',
    AUDIT: 'AUDIT',
    PURCHASE: 'PURCHASE',
    QC_APPROVED: 'QC_APPROVED',
};

const StockMovementType = {
    PURCHASE: 'PURCHASE',
    QC_APPROVED: 'QC_APPROVED',
    SALE: 'SALE',
    TRANSFER: 'TRANSFER',
    RETURN: 'RETURN',
    DAMAGED: 'DAMAGED',
    ADJUSTMENT: 'ADJUSTMENT',
    GRN_RECEIPT: 'GRN_RECEIPT',
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
    PARTIAL: 'PARTIAL',
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

const GrnStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    INVOICED: 'INVOICED',   // GRN has been billed via Purchase Voucher
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const PurchaseStatus = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    POSTED: 'POSTED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const PurchaseOrderStatus = {
    DRAFT: 'DRAFT',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const LoyaltyType = {
    EARN: 'EARN',
    REDEEM: 'REDEEM',
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
    RETURN: 'RETURN',
    PURCHASE: 'PURCHASE',
    DISPATCH: 'DISPATCH',
    GRN: 'GRN'
};

const DocumentStatus = {
    DRAFT: 'DRAFT',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

module.exports = {
    Roles,
    MovementType,
    StockMovementType,
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
    GrnStatus,
    QcStatus: {
        PENDING: 'PENDING',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
    }
};
