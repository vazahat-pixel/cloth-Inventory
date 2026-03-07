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

    // 1. Basic ID normalization: Always map _id to id
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
            // Backend uses storeId for purchase too (factory store)
            normalized.storeId = item.storeId?._id || item.storeId;
            normalized.warehouseId = normalized.storeId;
            if (item.storeId && typeof item.storeId === 'object') {
                normalized.storeName = item.storeId.name;
                normalized.warehouseName = item.storeId.name;
            }

            // Backend fields mapping to Frontend expected names
            normalized.billNumber = item.invoiceNumber || item.purchaseNumber;
            normalized.billDate = item.invoiceDate ? new Date(item.invoiceDate).toISOString().split('T')[0] : '';
            normalized.remarks = item.notes; // Alias for frontend
            normalized.notes = item.notes;

            // Product mapping in purchases
            if (item.products) {
                normalized.items = item.products.map(p => {
                    const prod = (p.productId && typeof p.productId === 'object') ? p.productId : {};
                    return {
                        ...p,
                        productId: prod._id || p.productId,
                        variantId: prod._id || p.productId, // Alias
                        itemName: prod.name || p.name || '',
                        size: prod.size || '',
                        color: prod.color || '',
                        sku: prod.sku || p.sku || '',
                        rate: p.rate || p.price || 0,
                        amount: p.total || (p.rate * p.quantity) || 0,
                        tax: p.gstPercent || 0,
                        discount: p.discount || 0
                    };
                });
            }

            // Calculate totals for the list and detail view
            normalized.totals = {
                totalQuantity: (item.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0),
                grossAmount: item.subTotal || (normalized.items || []).reduce((sum, i) => sum + (i.rate * i.quantity), 0),
                totalTax: item.totalTax || (normalized.items || []).reduce((sum, i) => sum + (i.gstAmount || 0), 0),
                totalDiscount: item.totalDiscount || 0,
                otherCharges: item.otherCharges || 0,
                netAmount: item.grandTotal || item.total || 0
            };
            break;

        case 'sale':
            // Backend "storeId" -> Frontend "storeId"
            normalized.storeId = item.storeId?._id || item.storeId;
            normalized.warehouseId = normalized.storeId; // Alias for frontend
            if (item.storeId && typeof item.storeId === 'object') {
                normalized.storeName = item.storeId.name;
                normalized.warehouseName = item.storeId.name;
            }

            // Customer
            if (item.customerId && typeof item.customerId === 'object') {
                normalized.customerId = item.customerId._id || item.customerId.id;
                normalized.customerName = item.customerId.name;
                normalized.customerMobile = item.customerId.phone;
            }

            // Products
            if (item.products) {
                normalized.items = item.products.map(p => {
                    const prod = (p.productId && typeof p.productId === 'object') ? p.productId : {};
                    return {
                        ...p,
                        productId: prod._id || p.productId,
                        variantId: prod._id || p.productId,
                        itemName: prod.name || p.name || '',
                        sku: prod.sku || p.barcode || '',
                        rate: p.price || p.appliedPrice || 0,
                        amount: p.total || 0,
                        quantity: p.quantity || 0
                    };
                });
            }

            // Totals
            normalized.totals = {
                subTotal: item.subTotal,
                grossAmount: item.subTotal,
                tax: item.tax || item.totalTax || 0,
                taxAmount: item.tax || item.totalTax || 0,
                discount: item.discount || 0,
                lineDiscount: item.lineDiscount || 0,
                billDiscount: item.billDiscount || item.discount || 0,
                grandTotal: item.grandTotal,
                netPayable: item.grandTotal, // Expected by SalesListPage
                totalQuantity: (item.products || []).reduce((sum, p) => sum + (p.quantity || 0), 0),
                loyaltyRedeemed: item.loyaltyRedeemed || 0,
                redeemPoints: item.loyaltyRedeemed || 0
            };

            normalized.date = item.saleDate ? new Date(item.saleDate).toISOString().split('T')[0] : '';
            normalized.invoiceNumber = item.saleNumber;

            // Payment object for list and detail view
            normalized.payment = {
                status: item.status === 'COMPLETED' ? 'Paid' : (item.status || 'Pending'),
                amountPaid: item.grandTotal || 0,
                dueAmount: 0,
                changeReturned: 0,
                mode: item.paymentMode || 'CASH'
            };

            normalized.salesmanName = item.cashierId?.name || '';
            break;

        case 'dispatch':
            normalized.storeId = item.storeId?._id || item.storeId;
            if (item.products) {
                normalized.items = item.products.map(p => ({
                    ...p,
                    productId: p.productId?._id || p.productId,
                    name: p.productId?.name
                }));
            }
            normalized.dispatchDate = item.dispatchDate;
            normalized.dispatchNumber = item.dispatchNumber;
            normalized.status = item.status;
            break;

        case 'inventory':
            if (item.productId && typeof item.productId === 'object') {
                normalized.productId = item.productId._id || item.productId.id;
                normalized.itemName = item.productId.name;
                normalized.sku = item.productId.sku || item.productId.barcode;
                normalized.barcode = item.productId.barcode;
                normalized.styleCode = item.productId.sku;
                normalized.size = item.productId.size;
                normalized.color = item.productId.color;
                normalized.brand = item.productId.brand;
                normalized.category = item.productId.category;
            }
            if (item.storeId && typeof item.storeId === 'object') {
                normalized.storeId = item.storeId._id || item.storeId.id;
                normalized.warehouseId = normalized.storeId; // Backwards compat
                normalized.storeName = item.storeId.name;
                normalized.warehouseName = normalized.storeName;
            } else {
                normalized.warehouseId = item.storeId;
            }
            normalized.quantity = item.quantityAvailable;
            normalized.reserved = item.quantityReserved;
            normalized.status = (item.quantityAvailable <= 10) ? 'LOW_STOCK' : 'OK';
            break;

        case 'product':
            normalized.name = item.name;
            normalized.itemName = item.name;
            normalized.sku = item.sku;
            normalized.code = item.sku; // Backwards compat for code column
            normalized.salePrice = item.salePrice;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;

        case 'customer':
            normalized.customerName = item.name;
            normalized.mobileNumber = item.phone;
            normalized.loyaltyPoints = item.points || 0;
            normalized.name = item.name;
            break;

        case 'scheme':
            normalized.name = item.name;
            normalized.status = item.isActive ? 'Active' : 'Inactive';
            break;

        case 'coupon':
            normalized.code = item.code;
            normalized.status = item.isActive ? 'Active' : 'Inactive';
            break;

        case 'voucher': {
            normalized.code = item.voucherNumber;
            // status enum ['ACTIVE', 'EXPIRED', 'USED', 'CANCELLED'] -> ['Active', 'Expired', 'Redeemed', 'Cancelled']
            const statusMap = {
                'ACTIVE': 'Active',
                'EXPIRED': 'Expired',
                'USED': 'Redeemed',
                'CANCELLED': 'Cancelled'
            };
            normalized.status = statusMap[item.status] || item.status;
            normalized.amount = item.remainingValue;
            break;
        }

        case 'supplier':
            normalized.supplierName = item.name;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'store':
            normalized.storeName = item.name;
            normalized.warehouseName = item.name; // Backwards compat
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'brand':
            normalized.brandName = item.name;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'category':
            normalized.categoryName = item.name;
            normalized.groupName = item.name; // For components expecting groupName
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;

        default:
            break;
    }

    return normalized;
};
