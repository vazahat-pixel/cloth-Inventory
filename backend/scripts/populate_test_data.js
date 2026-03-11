const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const User = require('../src/models/user.model');
const Store = require('../src/models/store.model');
const Warehouse = require('../src/models/warehouse.model');
const Product = require('../src/models/product.model');
const Supplier = require('../src/models/supplier.model');
const Customer = require('../src/models/customer.model');
const Brand = require('../src/models/brand.model');
const Category = require('../src/models/category.model');
const GstSlab = require('../src/models/gstSlab.model');
const HsnCode = require('../src/models/hsnCode.model');
const AccountGroup = require('../src/models/accountGroup.model');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (arr) => arr[randomInt(0, arr.length - 1)];

async function populateData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Get Admin User
        const admin = await User.findOne({ email: 'admin@test.com' });
        if (!admin) {
            console.error('❌ Admin user (admin@test.com) not found!');
            process.exit(1);
        }

        // 2. Clear collections
        const collectionsToClear = [
            Store, Warehouse, Product, Supplier, Customer, Brand, Category, GstSlab, HsnCode, AccountGroup
        ];
        for (const model of collectionsToClear) {
            await model.deleteMany({});
            console.log(`🗑️ Cleared ${model.modelName}`);
        }

        // 3. Seed GstSlabs
        console.log('🌱 Seeding GstSlabs...');
        const slabs = await GstSlab.insertMany([
            { percentage: 0, name: 'Exempt', type: 'CGST_SGST' },
            { percentage: 5, name: '5%', type: 'CGST_SGST' },
            { percentage: 12, name: '12%', type: 'CGST_SGST' },
            { percentage: 18, name: '18%', type: 'CGST_SGST' },
            { percentage: 28, name: '28%', type: 'CGST_SGST' }
        ]);

        // 4. Seed HsnCodes
        console.log('🌱 Seeding HsnCodes...');
        await HsnCode.insertMany([
            { code: '6109', description: 'T-Shirts (Cotton)', gstSlabId: slabs[1]._id },
            { code: '6205', description: 'Shirts (Synthetic)', gstSlabId: slabs[1]._id },
            { code: '6203', description: 'Trousers/Denim', gstSlabId: slabs[2]._id }
        ]);

        // 5. Seed Account Groups
        console.log('🌱 Seeding Account Groups...');
        const groups = await AccountGroup.insertMany([
            { name: 'Trade Payables', description: 'Accounts for vendors/suppliers' },
            { name: 'Trade Receivables', description: 'Accounts for customers' },
            { name: 'Operating Expenses', description: 'Monthly business costs' }
        ]);

        // 6. Seed Brands & Categories
        console.log('🌱 Seeding Brands & Categories...');
        const brands = await Brand.insertMany([
            { name: 'ARROW', shortName: 'ARR', description: 'Premium Office Wear' },
            { name: 'RAYMOND', shortName: 'RYM', description: 'The Complete Man' },
            { name: 'LEVIS', shortName: 'LVS', description: 'Classic Denim' },
            { name: 'NIKE', shortName: 'NKE', description: 'Just Do It' },
            { name: 'ADIDAS', shortName: 'ADI', description: 'Impossible is Nothing' }
        ]);
        const categories = await Category.insertMany([
            { name: 'SHIRTS', description: 'Formal and Casual Shirts' },
            { name: 'T-SHIRTS', description: 'Cotton and Polyster Tees' },
            { name: 'JEANS', description: 'Denim and Cotton Trousers' },
            { name: 'JACKETS', description: 'Winter and Leather Jackets' },
            { name: 'TROUSERS', description: 'Formal Dress Pants' }
        ]);

        // 7. Seed Stores & Warehouses
        console.log('🌱 Seeding Stores & Warehouses...');
        await Store.insertMany([
            {
                name: 'Main Store Indore',
                storeCode: 'IND-01',
                managerName: 'Ravi Kumar',
                managerPhone: '9876543210',
                email: 'store1@test.com',
                location: { address: 'Plot 45, Vijay Nagar', city: 'Indore', state: 'MP', pincode: '452010' },
                createdBy: admin._id,
                gstNumber: '23ABCDE1234F1Z1'
            },
            {
                name: 'Bhopal Branch',
                storeCode: 'BHP-02',
                managerName: 'Anita Singh',
                managerPhone: '9876543211',
                email: 'store2@test.com',
                location: { address: 'MP Nagar Zone 1', city: 'Bhopal', state: 'MP', pincode: '462001' },
                createdBy: admin._id,
                gstNumber: '23ABCDE5678F1Z2'
            }
        ]);
        await Warehouse.insertMany([
            {
                name: 'Central Warehouse',
                code: 'CWH-01',
                contactPerson: 'Suresh Raina',
                contactPhone: '9988776655',
                email: 'warehouse@test.com',
                location: { address: 'Industrial Area Sector A', city: 'Indore', state: 'MP', pincode: '452003' },
                createdBy: admin._id
            }
        ]);

        // 8. Seed Suppliers & Customers
        console.log('🌱 Seeding Suppliers & Customers...');
        await Supplier.insertMany([
            { 
                name: 'Arrow Clothing Ltd', 
                supplierCode: 'SUP-001',
                phone: '9000011122', 
                email: 'arrow@suppliers.com', 
                address: '12-B Industrial Estate, Mumbai', 
                createdBy: admin._id, 
                gstNumber: '27AABCA5678K1Z5',
                bankDetails: 'HDFC Bank, A/c: 50100223344, IFSC: HDFC0001234',
                groupId: groups[0]._id
            },
            { 
                name: 'Raymond Textiles', 
                supplierCode: 'SUP-002',
                phone: '9000033344', 
                email: 'raymond@suppliers.com', 
                address: 'Vapi Industrial Park, Surat', 
                createdBy: admin._id, 
                gstNumber: '24BBCCA1234M1Z2',
                bankDetails: 'SBI, A/c: 3211223344, IFSC: SBIN0005678',
                groupId: groups[0]._id
            }
        ]);
        await Customer.insertMany([
            { name: 'Walk-in Customer', phone: '0000000000', city: 'Various', state: 'MP', address: 'N/A', createdBy: admin._id, points: 0 },
            { name: 'John Doe', phone: '9822334455', email: 'john@example.com', city: 'Indore', state: 'MP', address: 'MG Road, Indore', createdBy: admin._id, points: 150 }
        ]);

        // 9. Seed Products (30 items)
        console.log('🌱 Seeding Products...');
        const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        const colors = ['NAVY', 'BLACK', 'WHITE', 'GREY', 'RED', 'BLUE'];
        
        const hsns = await HsnCode.find();

        const productsToInsert = [];
        for (let i = 1; i <= 30; i++) {
            const brand = randomFrom(brands);
            const category = randomFrom(categories);
            const size = randomFrom(sizes);
            const color = randomFrom(colors);
            const hsn = randomFrom(hsns);
            const cost = randomInt(400, 1500);
            
            productsToInsert.push({
                name: `${brand.name} ${category.name} ${size} ${color}`,
                sku: `JKT25-${String(i).padStart(4, '0')}`,
                barcode: `DA${3600 + i}`,
                size: size,
                color: color,
                category: category.name,
                brand: brand.name,
                costPrice: cost,
                salePrice: cost + randomInt(500, 2000),
                createdBy: admin._id,
                factoryStock: randomInt(10, 100),
                gstSlabId: hsn.gstSlabId
            });
        }
        await Product.insertMany(productsToInsert);

        console.log('\n✅ Data Population Successful!');
        console.log(`- Brands: ${brands.length}`);
        console.log(`- Categories: ${categories.length}`);
        console.log(`- Products: 30`);
        console.log(`- Stores: 2`);
        console.log(`- Warehouse: 1`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Population Failed:', err);
        process.exit(1);
    }
}

populateData();
