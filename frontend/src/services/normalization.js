/**
 * Normalizes backend responses to align with frontend expectations.
 * - Converts _id to id
 * - Flattens populated objects into simple IDs + optional name strings
 * - Handles entity-specific mappings (e.g., warehouseId <-> storeId)
 */
export const normalizeResponse = (data, entityType) => {
    if (!data) return data;
    console.log(`[DEBUG] normalizeResponse(${entityType}) input:`, data);

    let result;
    if (Array.isArray(data)) {
        result = data.map((item) => normalizeItem(item, entityType));
    } else {
        result = normalizeItem(data, entityType);
    }
    console.log(`[DEBUG] normalizeResponse(${entityType}) output:`, result);
    return result;
};

const normalizeItem = (item, entityType) => {
    if (!item || typeof item !== 'object') return item;

    // 1. Basic ID normalization
    const normalized = {
        ...item,
        id: item._id || item.id,
    };

    // 2. Entity-specific normalization
    switch (entityType) {
        case 'purchase':
            // Flatten populated supplierId
            if (item.supplierId && typeof item.supplierId === 'object') {
                normalized.supplierId = item.supplierId._id || item.supplierId.id;
                normalized.supplierName = item.supplierId.name || item.supplierId.supplierName;
            }
            // Flatten populated warehouseId
            if (item.warehouseId && typeof item.warehouseId === 'object') {
                normalized.warehouseId = item.warehouseId._id || item.warehouseId.id;
                normalized.warehouseName = item.warehouseId.name;
            }
            // Backend uses 'notes', frontend might use 'remarks' (though we aligned to 'notes' already)
            normalized.remarks = item.notes;

            // Support for table display
            normalized.supplier = normalized.supplierName || normalized.supplierId;
            normalized.warehouse = normalized.warehouseName || normalized.warehouseId;
            break;

        case 'sale':
            // Backend uses 'storeId', Frontend uses 'warehouseId'
            normalized.warehouseId = item.storeId?._id || item.storeId;
            if (item.storeId && typeof item.storeId === 'object') {
                normalized.warehouseName = item.storeId.name;
            }

            // Flatten populated customerId
            if (item.customerId && typeof item.customerId === 'object') {
                normalized.customerId = item.customerId._id || item.customerId.id;
                normalized.customerName = item.customerId.name || item.customerId.customerName;
                normalized.customerMobile = item.customerId.phone || item.customerId.mobileNumber;
            }

            // Backend uses 'cashierId', Frontend might expect 'salesmanId'
            if (item.cashierId && typeof item.cashierId === 'object') {
                normalized.salesmanId = item.cashierId._id || item.cashierId.id;
                normalized.salesmanName = item.cashierId.name;
            }

            // Format items array to match frontend 'items' expectation
            if (item.products) {
                normalized.items = item.products.map(p => ({
                    ...p,
                    variantId: p.productId?._id || p.productId,
                    itemName: p.productId?.name,
                    sku: p.productId?.sku || p.barcode,
                    size: p.productId?.size,
                    color: p.productId?.color,
                    amount: p.total
                }));
            }

            // Normalize totals
            normalized.totals = {
                grossAmount: item.subTotal,
                taxAmount: item.totalTax,
                netPayable: item.grandTotal,
                billDiscount: item.discount,
                loyaltyRedeemed: item.loyaltyRedeemed,
                creditNoteApplied: item.creditNoteApplied
            };

            normalized.date = item.saleDate;
            normalized.invoiceNumber = item.saleNumber;
            break;

        case 'dispatch':
            normalized.warehouseId = item.storeId?._id || item.storeId;
            if (item.storeId && typeof item.storeId === 'object') {
                normalized.warehouseName = item.storeId.name;
            }
            if (item.products) {
                normalized.items = item.products.map(p => ({
                    ...p,
                    variantId: p.productId?._id || p.productId,
                    itemName: p.productId?.name,
                    sku: p.productId?.sku
                }));
            }
            normalized.date = item.dispatchDate;
            normalized.transferNumber = item.dispatchNumber;
            break;

        case 'product':
            // If product is flat (backend model), just ensure id
            // Alias name/sku for compatibility
            normalized.name = item.name;
            normalized.sku = item.sku;
            break;

        case 'supplier':
            normalized.supplierName = item.name;
            normalized.name = item.name;
            break;
        case 'customer':
            normalized.customerName = item.name;
            normalized.name = item.name;
            normalized.loyaltyPoints = item.points || 0;
            break;
        case 'store':
        case 'warehouse':
            normalized.warehouseName = item.name;
            normalized.name = item.name;
            break;
        case 'category':
        case 'itemGroup':
            normalized.groupName = item.name;
            normalized.name = item.name;
            break;
        case 'brand':
            normalized.brandName = item.name;
            normalized.name = item.name;
            break;
        case 'user':
        case 'salesman':
            normalized.salesmanName = item.name;
            normalized.name = item.name;
            break;

        default:
            break;
    }

    return normalized;
};
