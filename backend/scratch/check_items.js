require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;

const Item = mongoose.model('Item', new mongoose.Schema({
    itemName: String,
    itemCode: String,
    hsCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'HsnCode' },
    hsnCode: String,
    sizes: [{
        size: String,
        barcode: String,
        stock: Number
    }]
}));

const HsnCode = mongoose.model('HsnCode', new mongoose.Schema({
    code: String,
    gstPercent: Number
}));

async function check() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to DB');

        const items = await Item.find({}).limit(5).populate('hsCodeId');
        console.log('--- ITEMS ---');
        items.forEach(i => {
            console.log(`ID: ${i._id}, Name: ${i.itemName}, HSN Ref: ${i.hsCodeId ? i.hsCodeId.code : 'None'}, HSN Plain: ${i.hsnCode}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
