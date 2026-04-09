/**
 * Normalizes backend responses to align with frontend expectations.
 * - Converts _id to id
 * - Flattens populated objects into simple IDs + optional name strings
 * - Handles entity-specific mappings (e.g., warehouseId <-> storeId)
 */
export const normalizeResponse = (data, entityType) => {
    if (!data) return data;

    let result;
    if (Array.isArray(data)) {
        result = data.map((item) => normalizeItem(item, entityType));
    } else {
        result = normalizeItem(data, entityType);
    }
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
                    const prod = (p.itemId && typeof p.itemId === 'object') ? p.itemId : ((p.productId && typeof p.productId === 'object') ? p.productId : {});
                    return {
                        ...p,
                        itemId: prod._id || p.itemId?._id || p.itemId,
                        productId: prod._id || p.productId?._id || p.productId || p.itemId?._id || p.itemId,
                        variantId: p.variantId || prod._id || p.productId?._id || p.productId, 
                        itemName: prod.itemName || prod.name || p.itemName || p.name || '',
                        size: prod.size || p.size || '',
                        color: prod.color || p.color || '',
                        sku: prod.sku || p.sku || '',
                        rate: p.rate || p.price || 0,
                        amount: p.total || (p.rate * p.quantity) || 0,
                        tax: p.gstPercent || p.tax || 0,
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
                        size: prod.size || '',
                        color: prod.color || '',
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
            normalized.saleType = (item.type || 'RETAIL').toLowerCase();

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

        case 'return':
            normalized.id = item._id || item.id;
            normalized.storeId = item.storeId?._id || item.storeId;
            normalized.warehouseId = normalized.storeId;
            normalized.saleId = item.referenceSaleId?._id || item.referenceSaleId;
            normalized.date = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '';
            normalized.returnDate = normalized.date;
            normalized.returnNumber = item.returnNumber;
            normalized.type = item.type;
            normalized.reason = item.reason;

            if (item.supplierId && typeof item.supplierId === 'object') {
                normalized.supplierId = item.supplierId._id || item.supplierId.id;
                normalized.supplierName = item.supplierId.supplierName || item.supplierId.name;
            }

            if (item.productId) {
                const p = (typeof item.productId === 'object') ? item.productId : {};
                normalized.items = [{
                    productId: p._id || item.productId,
                    variantId: p._id || item.productId,
                    itemName: p.name || '',
                    sku: p.sku || '',
                    size: p.size || '',
                    color: p.color || '',
                    returnQty: item.quantity || 0,
                    quantity: item.quantity || 0, // Fallback
                    rate: item.rate || 0,
                    amount: item.amount || 0
                }];
            } else if (item.items) {
                // If it already has items (maybe from some other backend structure)
                normalized.items = item.items.map(it => ({
                    ...it,
                    variantId: it.variantId || it.productId?._id || it.productId
                }));
            }
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
                normalized.salePrice = item.productId.salePrice;
                normalized.mrp = item.productId.mrp;
            }
            // Preserve top-level fields if added by manual population
            if (item.salePrice !== undefined) normalized.salePrice = item.salePrice;
            if (item.mrp !== undefined) normalized.mrp = item.mrp;
            const sId = item.storeId?._id || item.storeId?.id || item.storeId || item.warehouseId?._id || item.warehouseId?.id || item.warehouseId;
            normalized.storeId = sId;
            normalized.warehouseId = sId;
            normalized.locationType = item.storeId ? 'STORE' : (item.warehouseId ? 'WAREHOUSE' : item.locationType || '');

            if (item.storeId && typeof item.storeId === 'object') {
                normalized.storeName = item.storeId.name;
                normalized.warehouseName = item.storeId.name;
            } else if (item.warehouseId && typeof item.warehouseId === 'object') {
                normalized.storeName = item.warehouseId.name;
                normalized.warehouseName = item.warehouseId.name;
            }

            normalized.quantity = item.quantityAvailable ?? item.quantity ?? 0;
            normalized.reserved = item.reservedQuantity ?? item.quantityReserved ?? 0;
            normalized.reservedQuantity = normalized.reserved;
            normalized.quantityReserved = normalized.reserved;
            normalized.available = item.quantityAvailable ?? Math.max(Number(item.quantity ?? 0) - Number(normalized.reserved), 0);
            normalized.inTransit = item.quantityInTransit ?? 0;
            normalized.status = normalized.available <= 10 ? 'LOW_STOCK' : 'OK';
            break;

        case 'product': {
            // Map common aliases to ensure UI stability across different models
            normalized.name = item.name;
            normalized.itemName = item.name;
            normalized.sku = item.sku;
            normalized.code = item.sku;
            normalized.styleCode = item.styleCode || item.skuPrefix;
            normalized.itemCode = item.styleCode || item.skuPrefix || item.sku;

            // Populated Object handling
            normalized.brand = item.brand?._id || item.brand;
            normalized.category = item.category?._id || item.category;
            normalized.mainGroup = normalized.category;
            normalized.subGroup = item.subGroup;
            normalized.gstSlabId = item.gstSlabId?._id || item.gstSlabId;
            normalized.hsnCodeId = item.hsnCodeId?._id || item.hsnCodeId;

            // Attribute extraction
            normalized.fabric = item.fabric || item.attributes?.fabric;
            normalized.type = item.fabricType || item.attributes?.type;
            normalized.gender = item.gender || item.attributes?.gender;
            normalized.season = item.season || item.attributes?.season;
            normalized.color = item.color || item.shadeColor || item.attributes?.color;
            normalized.shadeColor = normalized.color;

            // Pricing & Stock
            normalized.salePrice = item.salePrice;
            normalized.costPrice = item.costPrice;
            normalized.mrp = item.mrp;
            normalized.openingStock = item.factoryStock || 0;
            normalized.factoryStock = item.factoryStock || 0;

            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        }

        case 'item': {
            normalized.itemName = item.itemName || item.name;
            normalized.itemCode = item.itemCode || item.sku;
            normalized.brand = item.brand; // Retain object for name display
            normalized.shade = item.shade;
            normalized.shadeColor = item.shade;
            normalized.mainGroup = item.groupIds?.[0]?._id || item.groupIds?.[0];
            normalized.category = normalized.mainGroup;
            normalized.hsnCodeId = item.hsCodeId?._id || item.hsCodeId;
            normalized.gstSlabId = item.gstSlabId?._id || item.gstSlabId;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            normalized.variants = (item.sizes || []).map(v => ({
                ...v,
                id: v._id || v.id,
                qty: v.stock || 0
            }));
            break;
        }

        case 'customer':
            normalized.customerName = item.name;
            normalized.mobileNumber = item.phone;
            normalized.loyaltyPoints = item.points || 0;
            normalized.name = item.name;
            break;

        case 'scheme': {
            // Map Backend flat fields to Frontend nested structure
            const typeMap = {
                'PERCENTAGE': 'percentage_discount',
                'FLAT': 'flat_discount',
                'FREE_GIFT': 'free_gift',
                'BUY_X_GET_Y': 'buy_x_get_y'
            };

            normalized.name = item.name;
            normalized.type = typeMap[item.type] || item.type;
            normalized.status = item.isActive ? 'Active' : 'Inactive';

            // Applicability
            let appType = 'item';
            let appIds = [];
            if (item.applicableProducts?.length) {
                appType = 'item';
                appIds = item.applicableProducts.map(p => p._id || p);
            } else if (item.applicableCategories?.length) {
                appType = 'itemGroup';
                appIds = item.applicableCategories.map(c => c._id || c);
            } else if (item.applicableBrands?.length) {
                appType = 'brand';
                appIds = item.applicableBrands;
            }
            normalized.applicability = { type: appType, ids: appIds };

            // Conditions
            normalized.conditions = {
                minQuantity: item.minPurchaseQuantity || 0,
                minValue: item.minPurchaseAmount || 0
            };

            // Benefit
            normalized.benefit = {
                discountPercent: (item.type === 'PERCENTAGE') ? (item.value || '') : '',
                flatAmount: (item.type === 'FLAT') ? (item.value || '') : '',
                buyQty: item.buyQuantity || '',
                getQty: item.getQuantity || ''
            };

            // Validity
            normalized.validity = {
                from: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
                to: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''
            };

            normalized.giftItemId = item.giftItemId?._id || item.giftItemId || '';
            normalized.giftQuantity = item.giftQuantity || '';
            break;
        }

        case 'coupon': {
            const typeMap = {
                'PERCENTAGE': 'percentage',
                'FLAT': 'amount'
            };
            normalized.code = item.code || '';
            normalized.discountType = typeMap[item.type] || 'percentage';
            normalized.value = item.value || '';
            normalized.minAmount = item.minPurchaseAmount || 0;
            normalized.usageLimit = item.usageLimit || 1;
            normalized.usageCount = item.usedCount || 0;
            normalized.expiry = item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '';
            normalized.status = item.isActive !== false ? 'Active' : 'Expired';
            break;
        }

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
        case 'warehouse':
            normalized.warehouseName = item.name || item.warehouseName;
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
        case 'season':
            normalized.seasonName = item.name;
            normalized.seasonLabel = item.name;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'category':
            normalized.categoryName = item.name;
            normalized.groupName = item.name; // For components expecting groupName
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'group':
            normalized.name = item.name || item.groupName;
            normalized.groupName = item.groupName || item.name;
            normalized.groupType = item.groupType || item.type || '';
            normalized.parentId = item.parentId?._id || item.parentId?.id || item.parentId || null;
            normalized.parentGroupName = item.parentId?.name || item.parentGroupName || '';
            normalized.level = item.level ?? 0;
            normalized.status = item.status || (item.isActive !== false ? 'Active' : 'Inactive');
            break;
        case 'hsnCode':
            normalized.hsnCode = item.code || '';
            normalized.gstRate = item.gstPercent || item.gstRate || 0;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'size':
            normalized.sizeCode = item.code || '';
            normalized.sizeLabel = item.label || '';
            normalized.sequence = item.sequence || 0;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;
        case 'bank':
            normalized.bankName = item.name;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;

        case 'user':
            normalized.userName = item.name;
            normalized.email = item.email;
            normalized.mobile = item.mobile;
            normalized.roleId = item.role;
            normalized.status = item.isActive !== false ? 'Active' : 'Inactive';
            break;

        default:
            break;
    }

    return normalized;
};
