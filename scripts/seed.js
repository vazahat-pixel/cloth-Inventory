#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Use backend's mongoose so models share the same connection instance
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));
const faker = require('@faker-js/faker').faker;
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const User = require('../backend/src/models/user.model');
const Store = require('../backend/src/models/store.model');
const Supplier = require('../backend/src/models/supplier.model');
const Category = require('../backend/src/models/category.model');
const GstSlab = require('../backend/src/models/gstSlab.model');
const Product = require('../backend/src/models/product.model');
const Customer = require('../backend/src/models/customer.model');
const StorePricing = require('../backend/src/models/storePricing.model');
// Transactional collections
const Purchase = require('../backend/src/models/purchase.model');
const Dispatch = require('../backend/src/models/dispatch.model');
const Sale = require('../backend/src/models/sale.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');
const Ledger = require('../backend/src/models/ledger.model');
const Counter = require('../backend/src/models/counter.model');
const CreditNote = require('../backend/src/models/creditNote.model');
const LoyaltyTransaction = require('../backend/src/models/loyaltyTransaction.model');
const StockHistory = require('../backend/src/models/stockHistory.model');
const Invoice = require('../backend/src/models/invoice.model');
const ReturnModel = require('../backend/src/models/return.model');
const AuditLog = require('../backend/src/models/auditLog.model');
const Account = require('../backend/src/models/account.model');

const { Roles, GstType } = require('../backend/src/core/enums');

const argv = yargs(hideBin(process.argv))
    .option('clear', {
        alias: 'c',
        type: 'boolean',
        description: 'Clear database before seeding',
        default: false,
    })
    .help()
    .argv;

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not set in environment');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
}

async function clearDatabase() {
    console.log('  Clearing master data...');
    await Promise.all([
        User.deleteMany({}),
        Store.deleteMany({}),
        Supplier.deleteMany({}),
        Category.deleteMany({}),
        GstSlab.deleteMany({}),
        Product.deleteMany({}),
        Customer.deleteMany({}),
        StorePricing.deleteMany({}),
    ]);
    console.log('  Clearing transactional data + counters...');
    await Promise.all([
        Purchase.deleteMany({}),
        Dispatch.deleteMany({}),
        Sale.deleteMany({}),
        StoreInventory.deleteMany({}),
        Ledger.deleteMany({}),
        Counter.deleteMany({}),
        CreditNote.deleteMany({}),
        LoyaltyTransaction.deleteMany({}),
        StockHistory.deleteMany({}),
        Invoice.deleteMany({}),
        ReturnModel.deleteMany({}),
        AuditLog.deleteMany({}),
        Account.deleteMany({}),
    ]);
    console.log('  ✅ All collections cleared.');
}

async function seed() {
    await connectDB();

    if (argv.clear) {
        console.log('Clearing database...');
        await clearDatabase();
    }

    const summary = {
        users: 0,
        stores: 0,
        suppliers: 0,
        categories: 0,
        gstSlabs: 0,
        products: 0,
        customers: 0,
        storePricingRules: 0,
    };

    try {
        // ── Chart of Accounts ──
        const accountDefs = [
            { name: 'Cash Account', code: '1001', type: 'ASSET', isSystem: true },
            { name: 'Bank Account', code: '1002', type: 'ASSET', isSystem: true },
            { name: 'Inventory Account', code: '1003', type: 'ASSET', isSystem: true },
            { name: 'Accounts Receivable', code: '1004', type: 'ASSET', isSystem: true },
            { name: 'GST Receivable', code: '1005', type: 'ASSET', isSystem: true },
            { name: 'Accounts Payable', code: '2001', type: 'LIABILITY', isSystem: true },
            { name: 'GST Payable', code: '2002', type: 'LIABILITY', isSystem: true },
            { name: 'Credit Note Control', code: '2003', type: 'LIABILITY', isSystem: true },
            { name: 'Sales Account', code: '3001', type: 'INCOME', isSystem: true },
            { name: 'Purchase Account', code: '4001', type: 'EXPENSE', isSystem: true },
            { name: 'Loyalty Expense', code: '4002', type: 'EXPENSE', isSystem: true },
            { name: 'Discount Expense', code: '4003', type: 'EXPENSE', isSystem: true },
        ];
        for (const acc of accountDefs) {
            await Account.findOneAndUpdate({ code: acc.code }, acc, { upsert: true, new: true });
        }
        console.log(`Seeded ${accountDefs.length} chart of accounts.`);

        // Admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            passwordHash: 'Admin@123', // will be hashed by pre-save hook
            role: Roles.ADMIN,
            isActive: true,
        });
        summary.users += 1;

        // Stores
        const stores = [];
        for (let i = 0; i < 5; i++) {
            stores.push({
                name: `Store ${i + 1}`,
                storeCode: `STR${i + 1}`,
                managerName: faker.person.fullName(),
                managerPhone: faker.phone.number('9#########'),
                email: faker.internet.email().toLowerCase(),
                location: {
                    address: faker.location.streetAddress(),
                    city: faker.location.city(),
                    state: faker.location.state(),
                    pincode: faker.location.zipCode(),
                },
                gstNumber: faker.string.alphanumeric(15).toUpperCase(),
                createdBy: admin._id,
            });
        }
        const storeDocs = await Store.insertMany(stores);
        summary.stores = storeDocs.length;

        // Store staff (3 users, attached to random stores)
        // NOTE: Must use User.create() (not insertMany) to trigger bcrypt pre-save hook
        const staffDocs = [];
        for (let i = 0; i < 3; i++) {
            const store = faker.helpers.arrayElement(storeDocs);
            const staffUser = await User.create({
                name: faker.person.fullName(),
                email: `staff${i + 1}@example.com`,
                passwordHash: 'Staff@123',
                role: Roles.STORE_STAFF,
                shopId: store._id,
                shopName: store.name,
                isActive: true,
            });
            staffDocs.push(staffUser);
        }
        summary.users += staffDocs.length;

        // Suppliers
        const suppliers = [];
        for (let i = 0; i < 10; i++) {
            suppliers.push({
                name: `Supplier ${i + 1}`,
                contactPerson: faker.person.fullName(),
                phone: faker.phone.number('9#########'),
                email: faker.internet.email().toLowerCase(),
                address: {
                    street: faker.location.streetAddress(),
                    city: faker.location.city(),
                    state: faker.location.state(),
                    pincode: faker.location.zipCode(),
                },
                gstNumber: faker.string.alphanumeric(15).toUpperCase(),
                createdBy: admin._id,
            });
        }
        const supplierDocs = await Supplier.insertMany(suppliers);
        summary.suppliers = supplierDocs.length;

        // Categories
        const categories = [];
        for (let i = 0; i < 20; i++) {
            categories.push({
                name: `Category ${i + 1}`,
                description: faker.commerce.department(),
                isActive: true,
            });
        }
        const categoryDocs = await Category.insertMany(categories);
        summary.categories = categoryDocs.length;

        // GST Slabs
        const gstConfig = [
            { name: 'GST 0%', percentage: 0 },
            { name: 'GST 5%', percentage: 5 },
            { name: 'GST 12%', percentage: 12 },
            { name: 'GST 18%', percentage: 18 },
            { name: 'GST 28%', percentage: 28 },
        ];

        const gstSlabs = await GstSlab.insertMany(
            gstConfig.map((g) => ({
                ...g,
                type: GstType.CGST_SGST || Object.values(GstType)[0],
                isActive: true,
            }))
        );
        summary.gstSlabs = gstSlabs.length;

        // Products
        const products = [];
        for (let i = 0; i < 200; i++) {
            const costPrice = faker.number.int({ min: 100, max: 1000 });
            const margin = faker.number.int({ min: 10, max: 300 });
            const salePrice = costPrice + margin;
            const gstSlab = faker.helpers.arrayElement(gstSlabs);
            const category = faker.helpers.arrayElement(categoryDocs);

            products.push({
                name: faker.commerce.productName(),
                sku: `SKU${1000 + i}`,
                barcode: `BC${100000 + i}`,
                size: faker.helpers.arrayElement(['S', 'M', 'L', 'XL', 'XXL', 'FREE']),
                color: faker.color.human(),
                category: category.name,
                brand: faker.company.name(),
                costPrice,
                salePrice,
                factoryStock: faker.number.int({ min: 50, max: 200 }),
                minStockLevel: faker.number.int({ min: 5, max: 20 }),
                createdBy: admin._id,
                gstSlabId: gstSlab._id,
                images: [],
            });
        }
        const productDocs = await Product.insertMany(products);
        summary.products = productDocs.length;

        // Customers
        const customers = [];
        for (let i = 0; i < 100; i++) {
            customers.push({
                name: faker.person.fullName(),
                phone: faker.phone.number('9#########'),
                email: faker.internet.email().toLowerCase(),
                address: faker.location.streetAddress(),
                points: 0,
                totalEarned: 0,
                totalRedeemed: 0,
                isActive: true,
            });
        }
        const customerDocs = await Customer.insertMany(customers);
        summary.customers = customerDocs.length;

        // Random store pricing rules
        const pricingRules = [];
        for (const store of storeDocs) {
            const selectedProducts = faker.helpers.arrayElements(productDocs, 20);
            for (const product of selectedProducts) {
                const specialPrice =
                    product.salePrice - faker.number.int({ min: 5, max: 50 });
                pricingRules.push({
                    storeId: store._id,
                    productId: product._id,
                    price: Math.max(0, specialPrice),
                    isActive: true,
                    createdBy: admin._id,
                });
            }
        }
        if (pricingRules.length) {
            const pricingDocs = await StorePricing.insertMany(pricingRules);
            summary.storePricingRules = pricingDocs.length;
        }

        console.log('Seeding completed successfully.');
        console.table(summary);
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();

