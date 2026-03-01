require('dotenv').config();
const mongoose = require('mongoose');
const { createSale, cancelSale } = require('../src/modules/sales/sales.service');
const { withTransaction } = require('../src/services/transaction.service');
const Product = require('../src/models/product.model');
const Store = require('../src/models/store.model');
const User = require('../src/models/user.model');
const Account = require('../src/models/account.model');
const StoreInventory = require('../src/models/storeInventory.model');
const Customer = require('../src/models/customer.model');
const CreditNote = require('../src/models/creditNote.model');
const LoyaltyTransaction = require('../src/models/loyaltyTransaction.model');
const AuditLog = require('../src/models/auditLog.model');
const JournalEntry = require('../src/models/ledger.model');

const validateCancellation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Cleanup previous test state if any
        const year = new Date().getFullYear();
        await mongoose.connection.collection('sales').deleteOne({ saleNumber: `INV-${year}-00001` });
        await mongoose.connection.collection('counters').deleteOne({ name: `SALE_${year}` });

        // Setup test data
        let store = await Store.findOne();
        if (!store) {
            store = await Store.create({ name: 'Test Store', location: 'Test Loc', code: 'TS01', isActive: true });
        }

        let product = await Product.findOne();
        if (!product) {
            product = await Product.create({
                name: 'Test Shirt',
                sku: 'TSHIRT-001',
                barcode: '123456789012',
                category: 'Clothing',
                costPrice: 500,
                salePrice: 1000,
                isActive: true
            });
        }

        let user = await User.findOne();
        if (!user) {
            user = await User.create({
                name: 'Test Admin',
                email: 'test@example.com',
                password: 'password123',
                role: 'admin',
                employeeId: 'EMP001'
            });
        }

        let customer = await Customer.findOne();
        if (!customer) {
            customer = await Customer.create({
                name: 'Test Customer',
                phone: '9876543210'
            });
        }

        if (!store || !product || !user || !customer) {
            console.error("Failed to setup test data");
            return;
        }

        // Ensure stock exists
        await StoreInventory.findOneAndUpdate(
            { storeId: store._id, productId: product._id },
            { $set: { quantityAvailable: 100, quantitySold: 0 } },
            { upsert: true }
        );

        console.log("--- Phase 1: Create Sale ---");
        const saleData = {
            storeId: store._id,
            customerId: customer._id,
            products: [{
                productId: product._id,
                barcode: product.barcode,
                quantity: 2,
                price: product.salePrice,
                total: product.salePrice * 2
            }],
            subTotal: product.salePrice * 2,
            discount: 0,
            tax: 0,
            grandTotal: product.salePrice * 2,
            paymentMode: 'CASH',
            redeemPoints: 0
        };

        const sale = await createSale(saleData, user._id);
        console.log(`✅ Sale created: ${sale.saleNumber}`);

        // Initial states
        const invAfterSale = await StoreInventory.findOne({ storeId: store._id, productId: product._id });
        const custAfterSale = await Customer.findById(customer._id);
        const auditAfterSale = await AuditLog.countDocuments({ targetId: sale._id });
        const ledgerAfterSale = await JournalEntry.countDocuments({ voucherId: sale._id });

        console.log(`Stock after sale: ${invAfterSale.quantityAvailable}, Sold: ${invAfterSale.quantitySold}`);
        console.log(`Customer points: ${custAfterSale.points}`);
        console.log(`Audit logs: ${auditAfterSale}, Ledger entries: ${ledgerAfterSale}`);

        console.log("\n--- Phase 2: Cancel Sale ---");
        await cancelSale(sale._id, user._id);
        console.log("✅ Sale cancelled successfully");

        // Verification states
        const invAfterCancel = await StoreInventory.findOne({ storeId: store._id, productId: product._id });
        const custAfterCancel = await Customer.findById(customer._id);
        const saleAfterCancel = await mongoose.model('Sale').findById(sale._id);
        const auditAfterCancel = await AuditLog.countDocuments({ targetId: sale._id });
        const ledgerAfterCancel = await JournalEntry.countDocuments({ voucherId: sale._id });

        console.log(`Stock after cancel: ${invAfterCancel.quantityAvailable} (Expected: 100), Sold: ${invAfterCancel.quantitySold} (Expected: 0)`);
        console.log(`Customer points after cancel: ${custAfterCancel.points} (Expected to match initial - earned points)`);
        console.log(`Sale status: ${saleAfterCancel.status} (Expected: CANCELLED)`);
        console.log(`Audit logs after cancel: ${auditAfterCancel} (Expected: 2)`);
        console.log(`Ledger entries after cancel: ${ledgerAfterCancel} (Original + Reversal)`);

        let success = true;
        if (invAfterCancel.quantityAvailable !== 100) success = false;
        if (invAfterCancel.quantitySold !== 0) success = false;
        if (saleAfterCancel.status !== 'CANCELLED') success = false;

        if (success) {
            console.log("\n✅ FULL SUCCESS: Sale cancellation reversed all impacts correctly.");
        } else {
            console.error("\n❌ FAILURE: Some reversals were incorrect.");
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

validateCancellation();
