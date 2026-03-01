require('dotenv').config();
const mongoose = require('mongoose');
const { withTransaction } = require('./src/services/transaction.service');
const Product = require('./src/models/product.model');
const AuditLog = require('./src/models/auditLog.model');
const { createAuditLog } = require('./src/middlewares/audit.middleware');
const { StockHistoryType } = require('./src/core/enums');
const { adjustStock } = require('./src/services/stock.service');

const testAuditRollback = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Get a product
        const product = await Product.findOne({ isDeleted: false });
        if (!product) {
            console.log("No product found to test with");
            return;
        }

        const initialAuditCount = await AuditLog.countDocuments({ targetId: product._id });
        console.log(`Initial Audit Logs for product: ${initialAuditCount}`);

        // 2. Run transaction that fails after creating audit log
        try {
            await withTransaction(async (session) => {
                console.log("Starting transaction...");

                // Adjust stock
                await adjustStock({
                    productId: product._id,
                    quantityChange: 5,
                    type: StockHistoryType.ADJUSTMENT,
                    performedBy: product._id,
                    notes: "Audit Rollback Test",
                    session
                });

                // Create Audit Log with session
                await createAuditLog({
                    action: 'TEST_ROLLBACK',
                    module: 'TEST',
                    performedBy: product._id,
                    targetId: product._id,
                    targetModel: 'Product',
                    after: { test: true },
                    session
                });

                console.log("Audit log created inside transaction. Now failing...");
                throw new Error("FAIL_INTENTIONAL");
            });
        } catch (err) {
            if (err.message === "FAIL_INTENTIONAL") {
                console.log("Caught intentional failure.");
            } else {
                throw err;
            }
        }

        // 3. Verify audit log count is back to initial
        const finalAuditCount = await AuditLog.countDocuments({ targetId: product._id });
        console.log(`Final Audit Logs after rollback: ${finalAuditCount}`);

        if (finalAuditCount === initialAuditCount) {
            console.log("✅ SUCCESS: Audit log rolled back correctly. No ghost logs created.");
        } else {
            console.error("❌ FAILURE: Audit log was NOT rolled back.");
            // Print the ghost log if it exists
            const ghostLogs = await AuditLog.find({ targetId: product._id, action: 'TEST_ROLLBACK' });
            console.log("Ghost Logs:", ghostLogs);
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

testAuditRollback();
