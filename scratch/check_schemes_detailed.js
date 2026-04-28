const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkSchemes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Scheme = mongoose.model('Scheme', new mongoose.Schema({}, { strict: false }));
        const schemes = await Scheme.find().lean();
        console.log('--- SCHEMES DEBUG ---');
        schemes.forEach(s => {
            console.log(`Name: ${s.name}`);
            console.log(`Type: ${s.type} (Typeof: ${typeof s.type})`);
            console.log(`isActive: ${s.isActive} (Typeof: ${typeof s.isActive})`);
            console.log(`startDate: ${s.startDate} (${new Date(s.startDate).toISOString()})`);
            console.log(`endDate: ${s.endDate} (${s.endDate ? new Date(s.endDate).toISOString() : 'N/A'})`);
            console.log(`Applicable On: Products=${s.applicableProducts?.length}, Categories=${s.applicableCategories?.length}, Brands=${s.applicableBrands?.length}`);
            console.log('--------------------');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchemes();
