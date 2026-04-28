const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkSchemes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Scheme = mongoose.model('Scheme', new mongoose.Schema({}, { strict: false }));
        const schemes = await Scheme.find().lean();
        console.log('Schemes in DB:', JSON.stringify(schemes, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchemes();
