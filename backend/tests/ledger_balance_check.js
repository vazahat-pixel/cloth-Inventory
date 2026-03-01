require('dotenv').config();
const mongoose = require('mongoose');
const { createSale } = require('../src/modules/sales/sales.service');
const Account = require('../src/models/account.model');
const Product = require('../src/models/product.model');
const Store = require('../src/models/store.model');
const User = require('../src/models/user.model');
const StoreInventory = require('../src/models/storeInventory.model');

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Prepare Environment
        // Ensure system accounts exist
        const accounts = [
            { name: 'Sales Account', type: 'INCOME' },
            { name: 'Accounts Receivable', type: 'ASSET' },
            { name: 'GST Payable', type: 'LIABILITY' },
            { name: 'Loyalty Expense', type: 'EXPENSE' },
            { name: 'Credit Note Control', type: 'LIABILITY' }
        ];

        for (const acc of accounts) {
            await Account.findOneAndUpdate(
                { name: acc.name },
                { $setOnInsert: { ...acc, code: acc.name.toUpperCase().replace(/ /g, '_'), isSystem: true } },
                { upsert: true, new: true }
            );
        }

        // 2. Get/Create Test Data
        let user = await User.findOne({ role: 'admin' });
        if (!user) {
            user = await User.create({ name: 'Test User', email: 'test@test.com', password: 'password', role: 'admin', employeeId: 'TEST001' });
        }

        let store = await Store.findOne();
        if (!store) {
            store = await Store.create({ name: 'Test Store', location: 'Test' });
        }

        let product = await Product.findOne({ isDeleted: false });
        if (!product) {
            product = await Product.create({
                name: 'Test Product',
                sku: 'TEST_SKU_123',
                barcode: '1234567890',
                salePrice: 1000,
                factoryStock: 100
            });
        }

        // Ensure stock in store
        await StoreInventory.findOneAndUpdate(
            { storeId: store._id, productId: product._id },
            { $set: { quantityAvailable: 10 } },
            { upsert: true }
        );

        // 3. Perform Sale with Discount
        console.log("Attempting sale with discount...");
        const saleData = {
            storeId: store._id,
            products: [{
                productId: product._id,
                barcode: product.barcode,
                quantity: 1,
                price: product.salePrice,
                total: product.salePrice // Required by schema
            }],
            subTotal: 1000,
            discount: 100, // 10% discount
            tax: 0,
            grandTotal: 900,
            paymentMode: 'CASH'
        };

        const sale = await createSale(saleData, user._id);
        console.log("✅ SUCCESS: Sale created with balanced ledger.");
        console.log("Sale Number:", sale.saleNumber);
        console.log("Discount Applied:", sale.discount);
        console.log("Grand Total:", sale.grandTotal);

        // Verify the Discount Expense account was created
        const discountAcc = await Account.findOne({ name: 'Discount Expense' });
        if (discountAcc) {
            console.log("✅ SUCCESS: 'Discount Expense' account exists.");
        } else {
            console.error("❌ FAILURE: 'Discount Expense' account NOT found.");
        }

    } catch (err) {
        console.error("❌ TEST FAILED:", err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
