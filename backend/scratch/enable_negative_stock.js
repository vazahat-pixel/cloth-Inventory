const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Settings = require('../src/models/settings.model');

async function run() {
    await connectDB();
    
    console.log('Fetching allowNegativeStock setting...');
    let config = await Settings.findOne({ key: 'allowNegativeStock' });
    
    if (config) {
        console.log(`Current setting: ${config.value}`);
        config.value = true;
        await config.save();
        console.log('Setting updated to true!');
    } else {
        console.log('Setting not found. Creating allowNegativeStock = true...');
        config = new Settings({
            key: 'allowNegativeStock',
            value: true,
            type: 'BOOLEAN'
        });
        await config.save();
        console.log('Setting created successfully!');
    }
    
    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
