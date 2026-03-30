require('dotenv').config();
const mongoose = require('mongoose');
const { withTransaction } = require('./src/services/transaction.service');
const Product = require('./src/models/product.model');
const Warehouse = require('./src/models/warehouse.model');
const WarehouseInventory = require('./src/models/warehouseInventory.model');
const { StockMovementType } = require('./src/core/enums');
const { adjustWarehouseStock } = require('./src/services/stock.service');

const testRollback = async () => {
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

        const initialInventory = await WarehouseInventory.findOne({
            warehouseId: warehouse._id,
            productId: product._id,
        });
        const initialStock = initialInventory ? initialInventory.quantity : 0;
        console.log(`Initial Stock: ${initialStock}`);

        try {
            await withTransaction(async (session) => {
                console.log('Starting transaction...');

                await adjustWarehouseStock({
                    productId: product._id,
                    warehouseId: warehouse._id,
                    quantityChange: 10,
                    type: StockMovementType.ADJUSTMENT,
                    referenceId: new mongoose.Types.ObjectId(),
                    referenceModel: 'Adjustment',
                    performedBy: product._id,
                    notes: 'Rollback Test',
                    session,
                });

                const updatedInventory = await WarehouseInventory.findOne({
                    warehouseId: warehouse._id,
                    productId: product._id,
                }).session(session);
                console.log(`Stock inside transaction: ${updatedInventory ? updatedInventory.quantity : 0}`);

                throw new Error('FAIL_INTENTIONAL');
            });
        } catch (err) {
            if (err.message === 'FAIL_INTENTIONAL') {
                console.log('Caught intentional failure.');
            } else {
                throw err;
            }
        }

        const finalInventory = await WarehouseInventory.findOne({
            warehouseId: warehouse._id,
            productId: product._id,
        });
        const finalStock = finalInventory ? finalInventory.quantity : 0;
        console.log(`Final Stock after rollback: ${finalStock}`);

        if (finalStock === initialStock) {
            console.log('SUCCESS: Transaction rolled back correctly.');
        } else {
            console.error('FAILURE: Transaction did NOT roll back.');
        }
    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

testRollback();
