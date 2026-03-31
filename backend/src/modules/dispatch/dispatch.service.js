const DeliveryChallan = require('../../models/deliveryChallan.model');
const Sale = require('../../models/sale.model');
const Warehouse = require('../../models/warehouse.model');
const Store = require('../../models/store.model');
const { withTransaction } = require('../../services/transaction.service');
const challanService = require('../deliveryChallan/deliveryChallan.service');
const salesService = require('../sales/sales.service');
const { DocumentType } = require('../../core/enums');

/**
 * UNIFIED DISPATCH SYSTEM
 * Routes dispatches between same GSTIN (Delivery Challan)
 * and different GSTIN (Tax Invoice / Sale)
 */
const processDispatch = async (dispatchData, userId) => {
    return await withTransaction(async (session) => {
        const { sourceWarehouseId, destinationStoreId, products, ...rest } = dispatchData;

        // 1. Resolve source and destination entities
        const source = await Warehouse.findById(sourceWarehouseId).session(session) 
                    || await Store.findById(sourceWarehouseId).session(session);
        const destination = await Store.findById(destinationStoreId).session(session);

        if (!source || !destination) {
            throw new Error('Source or Destination not found');
        }

        // 2. Compare GSTINs
        const sourceGst = (source.gstNumber || '').trim();
        const destGst = (destination.gstNumber || '').trim();

        // Standard ERP Logic: Same GSTIN = Stock Transfer (DC), Different GSTIN = Sale (Invoice)
        const isSameEntity = sourceGst === destGst;

        if (isSameEntity) {
            // ACTION: CREATE DELIVERY CHALLAN
            const challan = await challanService.createChallan({
                ...rest,
                storeId: destinationStoreId, // Target
                sourceId: sourceWarehouseId, // From
                items: products,
                type: 'STOCK_TRANSFER'
            }, userId, session);

            return {
                type: 'DELIVERY_CHALLAN',
                documentNumber: challan.dcNumber,
                documentId: challan._id,
                message: 'Successfully created Delivery Challan (Same GSTIN)'
            };
        } else {
            // ACTION: CREATE TAX INVOICE (Internal Sale)
            // We map dispatch items to sale items
            const sale = await salesService.createSale({
                ...rest,
                storeId: sourceWarehouseId, // Stock reduces from source
                destinationStoreId,
                items: products.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.rate || 0, // In internal sales, we usually use cost or transfer price
                })),
                type: 'INTERNAL_SALE',
                customerId: null, // Internal transfer doesn't need retail customer
                paymentMode: 'CREDIT',
                amountPaid: 0,
                discount: 0
            }, userId, session);

            return {
                type: 'TAX_INVOICE',
                documentNumber: sale.saleNumber,
                documentId: sale._id,
                message: 'Successfully created Tax Invoice (Different GSTIN)'
            };
        }
    });
};

module.exports = {
    processDispatch
};
