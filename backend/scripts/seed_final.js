const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Enums
const {
    Roles,
    SaleStatus,
    DispatchStatus,
    PaymentMethod,
    ReturnType,
    ReturnStatus,
    PurchaseStatus,
    GstType
} = require('../src/core/enums');

// Models
const Supplier = require('../src/models/supplier.model');
const Customer = require('../src/models/customer.model');
const Product = require('../src/models/product.model');
const Category = require('../src/models/category.model');
const Brand = require('../src/models/brand.model');
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const PurchaseOrder = require('../src/models/purchaseOrder.model');
const Purchase = require('../src/models/purchase.model');
const Dispatch = require('../src/models/dispatch.model');
const Sale = require('../src/models/sale.model');
const Return = require('../src/models/return.model');
const WarehouseInventory = require('../src/models/warehouseInventory.model');
const StoreInventory = require('../src/models/storeInventory.model');
const CreditNote = require('../src/models/creditNote.model');
const LoyaltyTransaction = require('../src/models/loyaltyTransaction.model');
const User = require('../src/models/user.model');
const Settings = require('../src/models/settings.model');
const GstSlab = require('../src/models/gstSlab.model');
const HsnCode = require('../src/models/hsnCode.model');
const Account = require('../src/models/account.model');
const AccountGroup = require('../src/models/accountGroup.model');
const BillingCounter = require('../src/models/billingCounter.model');

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Database Reset (Keeping Admin)
        const collectionsToClear = [
            Supplier, Customer, Product, Category, Brand, Store, Warehouse,
            PurchaseOrder, Purchase, Dispatch, Sale, Return,
            WarehouseInventory, StoreInventory, CreditNote, LoyaltyTransaction,
            Settings, GstSlab, HsnCode, Account, AccountGroup, BillingCounter
        ];

        console.log('🧹 Clearing existing business data...');
        for (const model of collectionsToClear) {
            await model.deleteMany({});
            console.log(`   - Cleared ${model.modelName}`);
        }

        // We also want to clear all users for a clean seed
        console.log('👤 Cleaning all users...');
        await User.deleteMany({});

        // Ensure Admin exists
        let adminUser = await User.findOne({ email: 'admin@test.com' });
        if (!adminUser) {
            console.log('✨ Creating default Admin (admin@test.com)...');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            adminUser = await User.create({
                name: 'System Admin',
                email: 'admin@test.com',
                passwordHash: 'admin123',
                role: Roles.ADMIN,
                isActive: true
            });
        }
        const adminId = adminUser._id;

        // 2. Seed Settings
        console.log('⚙️  Seeding Settings...');
        await Settings.create({
            key: 'company_profile',
            value: {
                companyName: 'Vazahat Pixel ERP',
                address: 'Indore, MP, India',
                phone: '9123456789',
                email: 'info@vazahatpixel.com',
                gstin: '23AAAAA1234A1Z5',
                footerText: 'Thank you for shopping!'
            },
            updatedBy: adminId
        });

        // 3. Seed GST Slabs & HSN Codes
        console.log('📉 Seeding GST & HSN...');
        const slabsData = [
            { name: 'GST 0%', percentage: 0, type: GstType.CGST_SGST },
            { name: 'GST 5%', percentage: 5, type: GstType.CGST_SGST },
            { name: 'GST 12%', percentage: 12, type: GstType.CGST_SGST },
            { name: 'GST 18%', percentage: 18, type: GstType.CGST_SGST }
        ];
        const slabs = await GstSlab.insertMany(slabsData);

        const hsnsData = [
            { code: '6203', description: 'Men\'s Suits/Trousers', gstSlabId: slabs[1]._id },
            { code: '6109', description: 'T-shirts/Vests', gstSlabId: slabs[1]._id },
            { code: '6204', description: 'Women\'s Suits/Trousers', gstSlabId: slabs[2]._id }
        ];
        const hsns = await HsnCode.insertMany(hsnsData);

        // 4. Seed Accounts & Groups
        console.log('💰 Seeding Accounts...');
        const groupsData = [
            { name: 'Direct Income', description: 'Operating Income' },
            { name: 'Direct Expense', description: 'Operating Expense' },
            { name: 'Current Assets', description: 'Cash, Bank, stock' },
            { name: 'Current Liabilities', description: 'Taxes, Payables' }
        ];
        const groups = await AccountGroup.insertMany(groupsData);

        const accountsData = [
            { name: 'Sales Account', type: 'INCOME', code: 'SALES', isSystem: true, groupId: groups[0]._id },
            { name: 'Accounts Receivable', type: 'ASSET', code: 'AR', isSystem: true, groupId: groups[2]._id },
            { name: 'GST Payable', type: 'LIABILITY', code: 'GST_PAY', isSystem: true, groupId: groups[3]._id },
            { name: 'Inventory Account', type: 'ASSET', code: 'INV', isSystem: true, groupId: groups[2]._id },
            { name: 'Cash in Hand', type: 'ASSET', code: 'CASH', isSystem: true, groupId: groups[2]._id }
        ];
        await Account.insertMany(accountsData);

        // 5. Seed Master Data
        console.log('📦 Seeding Master Data...');

        // Suppliers (5)
        const suppliersData = [
            { name: 'Fashion Hub', contactPerson: 'Amit Sharma', phone: '9876543210', email: 'amit@fashionhub.com', address: 'Mumbai, MH', gstNumber: '27AAAAA0000A1Z5', supplierCode: 'SUP-001', createdBy: adminId },
            { name: 'Cotton World', contactPerson: 'Rahul Verma', phone: '9876543211', email: 'rahul@cottonworld.com', address: 'Surat, GJ', gstNumber: '24BBBBB1111B1Z6', supplierCode: 'SUP-002', createdBy: adminId },
            { name: 'Elite Garments', contactPerson: 'Suresh Gupta', phone: '9876543212', email: 'suresh@elite.com', address: 'Ludhiana, PB', gstNumber: '03CCCCC2222C1Z7', supplierCode: 'SUP-003', createdBy: adminId },
            { name: 'Trends Inc', contactPerson: 'Priya Singh', phone: '9876543213', email: 'priya@trends.com', address: 'Bangalore, KA', gstNumber: '29DDDDD3333D1Z8', supplierCode: 'SUP-004', createdBy: adminId },
            { name: 'Royal Textiles', contactPerson: 'Vikram Mehta', phone: '9876543214', email: 'vikram@royal.com', address: 'Indore, MP', gstNumber: '23EEEEE4444E1Z9', supplierCode: 'SUP-005', createdBy: adminId }
        ];
        const suppliers = await Supplier.insertMany(suppliersData);

        // Categories (6)
        const categoriesData = [
            { name: 'Men\'s Wear', description: 'Comprehensive range of apparel for men including formal and casual attire.', createdBy: adminId, status: 'Active' },
            { name: 'Women\'s Wear', description: 'Latest trending fashion and traditional wear for women.', createdBy: adminId, status: 'Active' },
            { name: 'Kids Wear', description: 'Comfortable and stylish clothes specifically designed for children of all ages.', createdBy: adminId, status: 'Active' },
            { name: 'Formal wear', description: 'Professional office attire and black-tie event clothing.', createdBy: adminId, status: 'Active' },
            { name: 'Casual Wear', description: 'Everyday comfortable clothing including t-shirts, jeans, and hoodies.', createdBy: adminId, status: 'Active' },
            { name: 'Ethnic Wear', description: 'Traditional Indian clothing and accessories for special occasions.', createdBy: adminId, status: 'Active' }
        ];
        const categories = await Category.insertMany(categoriesData);

        // Brands (5)
        const brandsData = [
            { name: 'Levis', createdBy: adminId, shortName: 'LEV', description: 'World famous denim brand known for high quality jeans and casual wear.' },
            { name: 'Peter England', createdBy: adminId, shortName: 'PE', description: 'India\'s leading menswear brand offering premium formal and semi-formal shirts.' },
            { name: 'Manyavar', createdBy: adminId, shortName: 'MAN', description: 'The go-to brand for magnificent ethnic wear and Indian wedding attire.' },
            { name: 'Allen Solly', createdBy: adminId, shortName: 'AS', description: "Pioneer of Friday Dressing wear, bringing relaxed professional style to the workplace." },
            { name: 'Biba', createdBy: adminId, shortName: 'BIBA', description: 'Contemporary ethnic fashion brand for women offering stylish Kurtas and sets.' }
        ];
        const brands = await Brand.insertMany(brandsData);

        // 6. Store Setup (16)
        console.log('🏪 Setting up 16 Stores...');
        const storesList = [
            'Indore', 'Bhopal', 'Pithampur', 'Dewas', 'Ujjain', 'Ratlam', 'Mandsaur', 'Neemuch',
            'Dhar', 'Khargone', 'Khandwa', 'Sehore', 'Hoshangabad', 'Betul', 'Harda', 'Itarsi'
        ];
        const stores = [];
        for (let i = 0; i < storesList.length; i++) {
            const city = storesList[i];
            const store = await Store.create({
                name: `Store ${i + 1} – ${city}`,
                storeCode: `ST${String(i + 1).padStart(3, '0')}`,
                managerName: `MGR ${city}`,
                managerPhone: `99000000${String(i).padStart(2, '0')}`,
                email: `store${i + 1}@clotherper.com`,
                location: {
                    address: `Main Street, ${city}`,
                    city: city,
                    state: 'Madhya Pradesh',
                    pincode: '452001'
                },
                isActive: true,
                isDeleted: false,
                createdBy: adminId
            });
            stores.push(store);

            // 7. Billing Counter for each store
            await BillingCounter.create({
                name: `Counter 1 - ${city}`,
                storeId: store._id,
                code: `BC-${store.storeCode}-01`,
                status: 'Active'
            });
        }

        // 8. Seed Store Staff User (store@test.com)
        console.log('👤 Seeding Store Staff User...');
        const hashedStorePassword = await bcrypt.hash('store123', 12);
        const storeStaff = await User.create({
            name: 'Indore Store Manager',
            email: 'store@test.com',
            passwordHash: 'store123',
            role: Roles.STORE_STAFF,
            shopId: stores[0]._id,
            shopName: stores[0].name,
            isActive: true
        });

        // 9. Warehouse Setup
        console.log('🏭 Setting up Central Warehouse...');
        const warehouse = await Warehouse.create({
            name: 'Central Warehouse HO',
            code: 'WH-HO-01',
            contactPerson: 'Warehouse Manager',
            contactPhone: '9893098930',
            email: 'ho-warehouse@clotherper.com',
            location: {
                address: 'Indore Bypass Industrial Area',
                city: 'Indore',
                state: 'Madhya Pradesh',
                pincode: '452016'
            },
            isActive: true,
            isDeleted: false,
            createdBy: adminId
        });

        // 10. Product Creation (50)
        console.log('👕 Creating 50 Products...');
        const productsData = [];
        let barcodeBase = 780;
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        for (let i = 0; i < 50; i++) {
            const cat = categories[i % categories.length];
            const brand = brands[i % brands.length];
            const slab = slabs[i % slabs.length];
            productsData.push({
                name: `${brand.name} ${cat.name} Spec ${i + 1}`,
                sku: `SKU-${1000 + i}`,
                barcode: `DA0${barcodeBase + i}`,
                size: sizes[i % sizes.length],
                color: 'Multicolor',
                category: cat.name,
                brand: brand.name,
                costPrice: 500 + (i * 10),
                salePrice: 1200 + (i * 20),
                gstSlabId: slab._id,
                isActive: true,
                isDeleted: false,
                createdBy: adminId
            });
        }
        const products = await Product.insertMany(productsData);

        // 11. Purchase Order Creation (10)
        console.log('📝 Creating Purchase Orders...');
        const pos = [];
        for (let i = 0; i < 10; i++) {
            const supplier = suppliers[i % suppliers.length];
            const poItems = [];
            for (let j = 0; j < 5; j++) {
                const product = products[(i * 5 + j) % products.length];
                poItems.push({
                    productId: product._id,
                    quantity: 100,
                    rate: product.costPrice
                });
            }
            const po = await PurchaseOrder.create({
                poNumber: `PO-2024-${String(i + 1).padStart(3, '0')}`,
                supplierId: supplier._id,
                storeId: warehouse._id,
                items: poItems,
                status: 'RECEIVED',
                poDate: new Date(),
                createdBy: adminId
            });
            pos.push(po);
        }

        // 12. Purchase Invoice & Stock Increase
        console.log('🧾 Creating Purchase Invoices & Stock...');
        for (let i = 0; i < pos.length; i++) {
            const po = pos[i];
            const purchaseProducts = po.items.map(item => {
                const taxableAmount = item.quantity * item.rate;
                const gstAmount = taxableAmount * 0.05;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    rate: item.rate,
                    taxableAmount: taxableAmount,
                    gstPercent: 5,
                    gstAmount: gstAmount,
                    total: taxableAmount + gstAmount
                };
            });

            const subTotal = purchaseProducts.reduce((sum, p) => sum + p.taxableAmount, 0);
            const totalTax = purchaseProducts.reduce((sum, p) => sum + p.gstAmount, 0);

            await Purchase.create({
                purchaseNumber: `PUR-2024-${String(i + 1).padStart(3, '0')}`,
                supplierId: po.supplierId,
                invoiceNumber: `INV-${1000 + i}`,
                invoiceDate: new Date(),
                products: purchaseProducts,
                subTotal,
                totalTax,
                grandTotal: subTotal + totalTax,
                status: PurchaseStatus.COMPLETED,
                createdBy: adminId
            });

            // Warehouse Stock
            for (const item of po.items) {
                await WarehouseInventory.findOneAndUpdate(
                    { warehouseId: warehouse._id, productId: item.productId },
                    { $inc: { quantity: item.quantity }, lastUpdated: new Date() },
                    { upsert: true }
                );
            }
        }

        // 13. Dispatch (W -> Stores)
        console.log('🚚 Creating Dispatches...');
        for (let i = 0; i < 5; i++) {
            const store = stores[i];
            const dispatchItems = [];
            for (let j = 0; j < 10; j++) {
                const product = products[j];
                dispatchItems.push({
                    productId: product._id,
                    quantity: 20,
                    price: product.costPrice
                });

                // Warehouse Decr
                await WarehouseInventory.findOneAndUpdate(
                    { warehouseId: warehouse._id, productId: product._id },
                    { $inc: { quantity: -20 } }
                );

                // Store Incr
                await StoreInventory.findOneAndUpdate(
                    { storeId: store._id, productId: product._id },
                    { $inc: { quantity: 20 }, quantityAvailable: 20, lastUpdated: new Date() },
                    { upsert: true }
                );
            }

            await Dispatch.create({
                dispatchNumber: `DSP-2024-${String(i + 1).padStart(3, '0')}`,
                sourceWarehouseId: warehouse._id,
                destinationStoreId: store._id,
                products: dispatchItems,
                status: DispatchStatus.RECEIVED,
                dispatchDate: new Date(),
                receivedDate: new Date(),
                createdBy: adminId
            });
        }

        // 14. Random Stock for remaining stores
        console.log('📦 Final stock sync for all stores...');
        for (const store of stores) {
            for (let k = 0; k < 5; k++) {
                const product = products[Math.floor(Math.random() * products.length)];
                await StoreInventory.findOneAndUpdate(
                    { storeId: store._id, productId: product._id },
                    { $inc: { quantity: 10, quantityAvailable: 10 }, lastUpdated: new Date() },
                    { upsert: true }
                );
            }
        }

        // 15. POS Sales
        console.log('💰 Creating POS Sales...');
        for (let i = 0; i < 5; i++) {
            const store = stores[i];
            const product = products[i];
            await Sale.create({
                saleNumber: `SALE-2024-${String(i + 1).padStart(4, '0')}`,
                storeId: store._id,
                cashierId: adminId,
                products: [{
                    productId: product._id,
                    barcode: product.barcode,
                    quantity: 1,
                    price: product.salePrice,
                    total: product.salePrice,
                    appliedPrice: product.salePrice
                }],
                subTotal: product.salePrice,
                grandTotal: product.salePrice,
                paymentMode: PaymentMethod.CASH,
                status: SaleStatus.COMPLETED,
                saleDate: new Date()
            });

            await StoreInventory.findOneAndUpdate(
                { storeId: store._id, productId: product._id },
                { $inc: { quantity: -1, quantityAvailable: -1, quantitySold: 1 } }
            );
        }

        // 16. Return
        console.log('↩️  Creating Return...');
        const lastSale = await Sale.findOne().sort({ createdAt: -1 });
        await Return.create({
            returnNumber: 'RET-2024-001',
            type: ReturnType.CUSTOMER_RETURN,
            referenceSaleId: lastSale._id,
            storeId: lastSale.storeId,
            productId: lastSale.products[0].productId,
            quantity: 1,
            reason: 'Defective piece',
            status: ReturnStatus.APPROVED,
            createdBy: adminId
        });
        await StoreInventory.findOneAndUpdate(
            { storeId: lastSale.storeId, productId: lastSale.products[0].productId },
            { $inc: { quantity: 1, quantityAvailable: 1, quantityReturned: 1 } }
        );

        // 17. Customers
        console.log('👤 Seeding Customers...');
        await Customer.insertMany([
            { name: 'John Doe', phone: '9000000001', address: 'Indore, MP', email: 'john@gmail.com' },
            { name: 'Jane Smith', phone: '9000000002', address: 'Bhopal, MP', email: 'jane@gmail.com' },
            { name: 'Vijay Kumar', phone: '9000000003', address: 'Ujjain, MP', email: 'vijay@gmail.com' }
        ]);

        console.log('\n✨ SEEDING SUCCESSFUL!');
        console.log('--------------------------------------');
        console.log('CREDENTIALS:');
        console.log('Admin User: admin@test.com / admin123');
        console.log('Store User: store@test.com / store123 (Indore Store)');
        console.log('--------------------------------------');

        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
