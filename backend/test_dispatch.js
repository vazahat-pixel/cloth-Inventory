require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Store = require('./src/models/store.model');
const Product = require('./src/models/product.model');
const dispatchService = require('./src/modules/dispatch/dispatch.service');

async function testDispatch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ email: 'admin@test.com' });
        const store = await Store.findOne({ isActive: true });
        const product = await Product.findOne({ factoryStock: { $gt: 0 } });

        if (!admin || !store || !product) {
            console.log('Missing test data:', { admin: !!admin, store: !!store, product: !!product });
            process.exit(1);
        }

        console.log(`Testing dispatch: Store=${store.name}, Product=${product.name}, Stock=${product.factoryStock}`);

        try {
            const result = await dispatchService.createDispatch({
                storeId: store._id,
                products: [
                    { productId: product._id, quantity: 1 }
                ]
            }, admin._id);
            console.log('✅ Dispatch created successfully:', result.dispatchNumber);
        } catch (err) {
            console.error('❌ Dispatch failed:', err.message);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testDispatch();
