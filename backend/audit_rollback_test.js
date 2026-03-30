require('dotenv').config();
const mongoose = require('mongoose');
const { withTransaction } = require('./src/services/transaction.service');
const Product = require('./src/models/product.model');
const Warehouse = require('./src/models/warehouse.model');
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const AuditLog = require('./src/models/auditLog.model');
const { createAuditLog } = require('./src/middlewares/audit.middleware');
const { StockMovementType } = require('./src/core/enums');
const { adjustWarehouseStock } = require('./src/services/stock.service');

const testAuditRollback = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const product = await Product.findOne({ isDeleted: false });
        if (!product) {
            console.log('No product found to test with');
            return;
        }

        const warehouse = await Warehouse.findOne({ isDeleted: false, isActive: true });
        if (!warehouse) {
            console.log('No warehouse found to test with');
            return;
        }

        const initialAuditCount = await AuditLog.countDocuments({ targetId: product._id });
        const initialInventory = await WarehouseInventory.findOne({
            warehouseId: warehouse._id,
            productId: product._id,
        });
        const initialStock = initialInventory ? initialInventory.quantity : 0;

        console.log(`Initial Audit Logs for product: ${initialAuditCount}`);
        console.log(`Initial Stock: ${initialStock}`);

        try {
            await withTransaction(async (session) => {
                console.log('Starting transaction...');

                await adjustWarehouseStock({
                    productId: product._id,
                    warehouseId: warehouse._id,
                    quantityChange: 5,
                    type: StockMovementType.ADJUSTMENT,
                    referenceId: new mongoose.Types.ObjectId(),
                    referenceModel: 'Audit',
                    performedBy: product._id,
                    notes: 'Audit Rollback Test',
                    session,
                });

                await createAuditLog({
                    action: 'TEST_ROLLBACK',
                    module: 'TEST',
                    performedBy: product._id,
                    targetId: product._id,
                    targetModel: 'Product',
                    after: { test: true },
                    session,
                });

                const updatedInventory = await WarehouseInventory.findOne({
                    warehouseId: warehouse._id,
                    productId: product._id,
                }).session(session);
                console.log(`Stock inside transaction: ${updatedInventory ? updatedInventory.quantity : 0}`);

                console.log('Audit log created inside transaction. Now failing...');
                throw new Error('FAIL_INTENTIONAL');
            });
        } catch (err) {
            if (err.message === 'FAIL_INTENTIONAL') {
                console.log('Caught intentional failure.');
            } else {
                throw err;
            }
        }

        const finalAuditCount = await AuditLog.countDocuments({ targetId: product._id });
        const finalInventory = await WarehouseInventory.findOne({
            warehouseId: warehouse._id,
            productId: product._id,
        });
        const finalStock = finalInventory ? finalInventory.quantity : 0;

        console.log(`Final Audit Logs after rollback: ${finalAuditCount}`);
        console.log(`Final Stock after rollback: ${finalStock}`);

        if (finalAuditCount === initialAuditCount && finalStock === initialStock) {
            console.log('SUCCESS: Audit log rolled back correctly. No ghost logs created.');
        } else {
            console.error('FAILURE: Audit log was NOT rolled back.');
            const ghostLogs = await AuditLog.find({ targetId: product._id, action: 'TEST_ROLLBACK' });
            console.log('Ghost Logs:', ghostLogs);
        }
    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

testAuditRollback();
