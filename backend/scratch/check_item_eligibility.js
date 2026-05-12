const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function run() {
    try {
        await mongoose.connect(mongoUri);
        const Scheme = require('../src/models/scheme.model');
        const Item = require('../src/models/item.model');
        
        const scheme = await Scheme.findOne({ name: 'buy 1 get 5' }).lean();
        if (!scheme) {
            console.log('Scheme "buy 1 get 5" not found!');
            process.exit(1);
        }

        const barcodes = ['0006139', '0006098', '0006171', '0006134', '0006357'];
        console.log(`Checking eligibility for barcodes containing: ${barcodes.join(', ')}`);
        
        for (const barcode of barcodes) {
            // Find item where sizes has sku or barcode matching the pattern
            const item = await Item.findOne({
                $or: [
                    { "sizes.sku": new RegExp(barcode, 'i') },
                    { "sizes.barcode": new RegExp(barcode, 'i') }
                ]
            }).lean();
            
            if (item) {
                // Find the exact variant matching
                const variant = item.sizes.find(s => 
                    (s.sku && s.sku.includes(barcode)) || 
                    (s.barcode && s.barcode.includes(barcode))
                );
                
                const variantIdStr = String(variant?._id);
                const productIdStr = String(item._id);

                const inProducts = scheme.applicableProducts.some(id => 
                    String(id) === variantIdStr || String(id) === productIdStr
                );
                
                console.log(`Item: ${item.itemName} (ID: ${item._id})`);
                console.log(`  - Variant ID: ${variantIdStr}`);
                console.log(`  - Variant SKU: ${variant?.sku}`);
                console.log(`  - Category: ${item.categoryId || item.categoryName}`);
                console.log(`  - Brand: ${item.brandName}`);
                console.log(`  - In Scheme Products List: ${inProducts}`);
            } else {
                console.log(`No item found for barcode: ${barcode}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
