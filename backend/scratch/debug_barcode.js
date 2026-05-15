const mongoose = require('mongoose');
const Item = require('../src/models/item.model');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkItem() {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const barcode = 'TS25-0033 B.GREEN';
    const upperBarcode = barcode.toUpperCase().trim();
    
    console.log('Searching for:', upperBarcode);

    // Try direct
    let item = await Item.findOne({ 
        $or: [
            { itemCode: upperBarcode }, 
            { itemName: upperBarcode },
            { 'sizes.sku': upperBarcode }, 
            { 'sizes.barcode': upperBarcode }
        ] 
    });

    if (item) {
        console.log('Found Direct Match!');
        console.log('Item Code:', item.itemCode);
        console.log('Item Name:', item.itemName);
        console.log('Shade No:', item.shadeNo);
        console.log('Color:', item.color);
        console.log('Item ID:', item._id);
        console.log('Sizes/Variants:');
        item.sizes.forEach(s => {
            console.log(`- Size: ${s.size}, SKU: ${s.sku}, Barcode: ${s.barcode}`);
        });
    } else {
        console.log('No direct match. Trying composite...');
        const parts = upperBarcode.split(/\s+/).filter(Boolean);
        console.log('Parts:', parts);
        if (parts.length >= 2) {
            const potentialCode = parts[0];
            const potentialShade = parts.slice(1).join(' ');
            console.log('Code:', potentialCode, 'Shade:', potentialShade);
            
            item = await Item.findOne({ 
                itemCode: potentialCode,
                $or: [
                    { shadeNo: { $regex: new RegExp(`^${potentialShade}$`, 'i') } },
                    { color: { $regex: new RegExp(`^${potentialShade}$`, 'i') } }
                ]
            });
            
            if (item) {
                console.log('Found Composite Match:', item.itemCode, 'Shade:', item.shadeNo || item.color);
            } else {
                console.log('Composite Match Failed.');
                // Check if code exists at all
                const codeOnly = await Item.findOne({ itemCode: potentialCode });
                if (codeOnly) {
                    console.log('Item code exists but shade mismatch. Item Shade:', codeOnly.shadeNo, 'Item Color:', codeOnly.color);
                } else {
                    console.log('Item code not found at all:', potentialCode);
                }
            }
        }
    }

    await mongoose.disconnect();
}

checkItem();
