/** Rows that were merged into a combined DSP master — hide from billing register */
export const isCombinedChildDispatch = (row) =>
    Boolean(row?.isCombinedChild) || String(row?.notes || '').includes('[Combined into');

/** Finalized dispatches eligible for the unified Transfer Bill / Tax Invoice register */
export const isBillingRegisterRow = (row) => {
    const status = row?.status || 'PENDING';
    if (!['DISPATCHED', 'RECEIVED'].includes(status)) return false;
    if (isCombinedChildDispatch(row)) return false;
    return true;
};

export const getDispatchRef = (row) => row?.dispatchNumber || row?.challanNumber || '-';

export const getBillingDocNumber = (row) => row?.billingDocNumber || '-';

export const getBillingDocType = (row) => {
    if (row?.billingDocType) return row.billingDocType;
    if (row?.referenceType === 'DeliveryChallan') return 'TRANSFER_BILL';
    if (row?.referenceType === 'Sale') return 'TAX_INVOICE';
    return null;
};

export const getBillingTypeLabel = (type) => {
    if (type === 'TRANSFER_BILL') return 'Transfer Bill';
    if (type === 'TAX_INVOICE') return 'Tax Invoice';
    return 'Pending Bill';
};

export const getBillingTypeChipColor = (type) => {
    if (type === 'TRANSFER_BILL') return 'success';
    if (type === 'TAX_INVOICE') return 'primary';
    return 'default';
};

export const getDispatchDate = (row) => {
    const raw = row?.dispatchedAt || row?.createdAt || row?.date || row?.dispatchDate;
    if (!raw) return '-';
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString();
};

export const getDispatchStatusLabel = (status) => {
    if (status === 'RECEIVED') return 'STOCK IN';
    if (status === 'DISPATCHED') return 'IN TRANSIT';
    return status || 'PENDING';
};

export const filterBillingRegisterRows = (rows, billTypeFilter = 'ALL') => {
    let list = (rows || []).filter(isBillingRegisterRow);
    if (billTypeFilter === 'TRANSFER_BILL') {
        list = list.filter((r) => getBillingDocType(r) === 'TRANSFER_BILL');
    } else if (billTypeFilter === 'TAX_INVOICE') {
        list = list.filter((r) => getBillingDocType(r) === 'TAX_INVOICE');
    }
    return list.sort((a, b) => new Date(b.dispatchedAt || b.createdAt) - new Date(a.dispatchedAt || a.createdAt));
};
