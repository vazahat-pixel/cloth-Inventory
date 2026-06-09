const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const Dispatch = require('../src/models/dispatch.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const Item = require('../src/models/item.model');

async function run() {
    await connectDB();
    const dispatchIds = ['6a27afb38f276d34abea88ca', '6a27b1f68f276d34abea89c6'];
    const dispatches = await Dispatch.find({ _id: { $in: dispatchIds } });
    
    console.log(`Loaded ${dispatches.length} dispatches.`);
    
    // Merge items
    const itemMap = new Map();
    const sourceWarehouseId = dispatches[0].sourceWarehouseId;
    
    for (const d of dispatches) {
        for (const item of d.items) {
            const key = item.variantId.toString();
            if (itemMap.has(key)) {
                itemMap.get(key).qty += item.qty;
            } else {
                itemMap.set(key, {
                    itemId: item.itemId,
                    variantId: item.variantId,
                    barcode: item.barcode,
                    qty: item.qty
                });
            }
        }
    }
    
    console.log(`Consolidated items: ${itemMap.size} variants.`);
    
    console.log('\n--- VARIANT COMPARISON: REQUESTED VS CURRENT STOCK ---');
    for (const [varId, details] of itemMap.entries()) {
        const itemDoc = await Item.findOne({ "sizes._id": details.variantId });
        const variantDoc = itemDoc ? itemDoc.sizes.id(details.variantId) : null;
        const itemName = itemDoc ? itemDoc.itemName : 'Unknown Item';
        const sizeName = variantDoc ? variantDoc.size : 'N/A';
        const colorName = variantDoc ? variantDoc.color : 'N/A';
        
        // Find warehouse inventory
        const inv = await WarehouseInventory.findOne({
            warehouseId: sourceWarehouseId,
            $or: [
                { barcode: details.barcode },
                { variantId: details.variantId }
            ]
        });
        
        const currentStock = inv ? inv.quantity : 0;
        if (currentStock < details.qty) {
            console.log(`⚠️ INSUFFICIENT: Barcode: ${details.barcode} | ${itemName} (${colorName}/${sizeName}) | Req: ${details.qty} | Current Warehouse Stock: ${currentStock}`);
        } else {
            console.log(`   Sufficient: Barcode: ${details.barcode} | ${itemName} (${colorName}/${sizeName}) | Req: ${details.qty} | Current Warehouse Stock: ${currentStock}`);
        }
    }
    
    await mongoose.disconnect();
}

run().catch(console.error);
