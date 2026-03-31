const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GRN = require('../src/models/grn.model');
const { addStock } = require('../src/services/stock.service');

async function syncGrnStock() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the latest approved GRN
    const grn = await GRN.findOne({ status: 'APPROVED' }).sort({ updatedAt: -1 });
    
    if (!grn) {
        console.log('No Approved GRN found to sync.');
        process.exit(1);
    }
    
    console.log('Syncing GRN:', grn.grnNumber);
    
    for (const item of grn.items) {
        console.log(`Adding stock for Product: ${item.productId} Qty: ${item.receivedQty}`);
        try {
            await addStock({
                variantId: item.productId,
                locationId: grn.warehouseId,
                locationType: 'WAREHOUSE',
                qty: item.receivedQty,
                type: 'GRN_RECEIPT',
                referenceId: grn._id,
                referenceType: 'GRN',
                performedBy: grn.receivedBy || '69cb68d069094d1b003a6045'
            });
            console.log('Added stock successfully.');
        } catch (err) {
            console.error('Error adding stock:', err.message);
        }
    }
    
    mongoose.disconnect();
}

syncGrnStock();
