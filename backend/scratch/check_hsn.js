require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;

const HsnCode = mongoose.model('HsnCode', new mongoose.Schema({
    code: String,
    gstPercent: Number
}));

async function check() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to DB');

        const codes = await HsnCode.find({});
        console.log('--- HSN CODES ---');
        console.log('Total HSN Codes:', codes.length);
        codes.slice(0, 10).forEach(c => {
            console.log(`ID: ${c._id}, Code: ${c.code}, GST: ${c.gstPercent}%`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
