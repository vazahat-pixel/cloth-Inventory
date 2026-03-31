const mongoose = require('mongoose');
const Item = require('./src/models/item.model');
const Brand = require('./src/models/brand.model');
const Season = require('./src/models/season.model');
const Group = require('./src/models/group.model');
const HsnCode = require('./src/models/hsnCode.model');
require('dotenv').config();

const seedSmartItems = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-inventory');
        console.log('✅ Connected!');

        // 1. Fetch available dropdown data
        const brands = await Brand.find();
        const seasons = await Season.find();
        const hsnCodes = await HsnCode.find();

        // Fetch hierarchy steps
        const sections = await Group.find({ groupType: 'Section' });
        
        if (!brands.length || !sections.length) {
            console.error('❌ Error: Necessary data missing in DB (Brands or Sections). Please create them in the UI first.');
            process.exit(1);
        }

        console.log(`📊 Found ${brands.length} Brands, ${sections.length} Sections.`);

        const itemsToInsert = [];

        // 2. Generate items based on REAL data
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            
            // Find a category for this section
            const category = await Group.findOne({ parentId: section._id, groupType: 'Category' });
            if (!category) continue;

            const brand = brands[i % brands.length];
            const season = seasons[i % seasons.length] || null;
            const hsn = hsnCodes[0] || null;

            const baseCode = `SMART-${section.name.substring(0, 1).toUpperCase()}${category.name.substring(0, 2).toUpperCase()}-${i + 100}`;
            
            itemsToInsert.push({
                itemCode: baseCode,
                itemName: `${brand.name} ${section.name} ${category.name}`,
                brand: brand._id.toString(),
                session: season ? season._id.toString() : 'NONE',
                shade: 'Standard',
                description: `Smart seeded item for ${section.name} > ${category.name}`,
                groupIds: [section._id, category._id],
                hsCodeId: hsn ? hsn._id : null,
                sizes: [
                    { size: 'S', barcode: `${baseCode}-S`, costPrice: 400, salePrice: 999, mrp: 1299 },
                    { size: 'M', barcode: `${baseCode}-M`, costPrice: 400, salePrice: 999, mrp: 1299 },
                    { size: 'L', barcode: `${baseCode}-L`, costPrice: 450, salePrice: 1099, mrp: 1499 }
                ],
                isActive: true
            });
        }

        if (itemsToInsert.length === 0) {
            console.log('⚠️ No valid Section-Category pairs found to create items.');
        } else {
            console.log(`🚀 Seeding ${itemsToInsert.length} items using DB dropdown values...`);
            await Item.deleteMany({ itemCode: { $regex: /^SMART-/ } }); // Clear previous smart seeds
            await Item.insertMany(itemsToInsert);
            console.log('✨ Smart Seeding Completed Successfully!');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedSmartItems();
