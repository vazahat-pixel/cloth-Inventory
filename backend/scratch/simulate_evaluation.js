const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function run() {
    try {
        await mongoose.connect(mongoUri);
        const promotionService = require('../src/modules/pricing/promotion.service');
        const Item = require('../src/models/item.model');

        // Let's find the actual database items corresponding to the ones in the screenshot
        const skus = ['0006139', '0006098', '0006171', '0006134', '0006357'];
        const cartItems = [];

        for (const barcode of skus) {
            const item = await Item.findOne({
                $or: [
                    { "sizes.sku": new RegExp(barcode, 'i') },
                    { "sizes.barcode": new RegExp(barcode, 'i') }
                ]
            }).lean();
            
            if (item) {
                const variant = item.sizes.find(s => 
                    (s.sku && s.sku.includes(barcode)) || 
                    (s.barcode && s.barcode.includes(barcode))
                );
                
                cartItems.push({
                    productId: String(item._id),
                    variantId: String(variant._id),
                    qty: 1,
                    price: variant.mrp || 2999, // default if not specified
                    rate: variant.mrp || 2999,
                    category: String(item.categoryId),
                    categoryName: item.categoryName,
                    brand: String(item.brand),
                    brandName: item.brandName
                });
            }
        }

        console.log(`\n--- Case 1: Evaluating with ${cartItems.length} items (should NOT qualify for Buy 1 Get 5) ---`);
        const result1 = await promotionService.evaluate(cartItems);
        console.log(`Total Discount Applied: ₹${result1.totalDiscount}`);
        console.log('Applied Offers:', JSON.stringify(result1.appliedOffers, null, 2));
        console.log('Items Breakdowns:');
        result1.items.forEach(it => {
            console.log(` - ${it.variantId.substring(0, 8)}... (Price: ₹${it.originalPrice}): Discount: ₹${it.promoDiscount}, Offer applied: "${it.appliedOffer}"`);
        });

        // Let's copy one item to make it 6 items in total
        const sixCartItems = [...cartItems, { ...cartItems[0] }];
        console.log(`\n--- Case 2: Evaluating with ${sixCartItems.length} items (should qualify for Buy 1 Get 5) ---`);
        const result2 = await promotionService.evaluate(sixCartItems);
        console.log(`Total Discount Applied: ₹${result2.totalDiscount}`);
        console.log('Applied Offers:', JSON.stringify(result2.appliedOffers, null, 2));
        console.log('Items Breakdowns:');
        result2.items.forEach((it, idx) => {
            console.log(` - Item ${idx+1}: ${it.variantId.substring(0, 8)}... (Price: ₹${it.originalPrice}): Discount: ₹${it.promoDiscount}, Offer applied: "${it.appliedOffer}"`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
