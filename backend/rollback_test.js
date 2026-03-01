require('dotenv').config();
const mongoose = require('mongoose');
const { withTransaction } = require('./src/services/transaction.service');
const Product = require('./src/models/product.model');
const { StockHistoryType } = require('./src/core/enums');
const { adjustStock } = require('./src/services/stock.service');

const testRollback = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Get a product
        const product = await Product.findOne({ isDeleted: false });
        if (!product) {
            console.log("No product found to test with");
            return;
        }

        const initialStock = product.factoryStock;
        console.log(`Initial Stock: ${initialStock}`);

        // 2. Run transaction that fails midway
        try {
            await withTransaction(async (session) => {
                console.log("Starting transaction...");

                // Adjust stock
                await adjustStock({
                    productId: product._id,
                    quantityChange: 10,
                    type: StockHistoryType.ADJUSTMENT,
                    performedBy: product._id, // dummy
                    notes: "Rollback Test",
                    session
                });

                const updatedProduct = await Product.findById(product._id).session(session);
                console.log(`Stock inside transaction: ${updatedProduct.factoryStock}`);

                throw new Error("FAIL_INTENTIONAL");
            });
        } catch (err) {
            if (err.message === "FAIL_INTENTIONAL") {
                console.log("Caught intentional failure.");
            } else {
                throw err;
            }
        }

        // 3. Verify stock is back to initial
        const finalProduct = await Product.findById(product._id);
        console.log(`Final Stock after rollback: ${finalProduct.factoryStock}`);

        if (finalProduct.factoryStock === initialStock) {
            console.log("✅ SUCCESS: Transaction rolled back correctly.");
        } else {
            console.error("❌ FAILURE: Transaction did NOT roll back.");
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

testRollback();
