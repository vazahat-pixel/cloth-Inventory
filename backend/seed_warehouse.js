require('dotenv').config();
const mongoose = require('mongoose');
const Warehouse = require('./src/models/warehouse.model');

async function seedWarehouse() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await Warehouse.countDocuments({ isDeleted: false });
        if (count === 0) {
            const headOffice = new Warehouse({
                name: 'Head Office',
                code: 'WH-001',
                contactPerson: 'Admin',
                contactPhone: '9999999999',
                location: {
                    address: 'Main Store Area',
                    city: 'Delhi',
                    state: 'Delhi',
                    pincode: '110001'
                },
                createdBy: '69cb68d069094d1b003a6045',
                isActive: true
            });
            await headOffice.save();
            console.log('Head Office Warehouse created successfully!');
        } else {
            console.log('Warehouse already exists.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Seed Warehouse Failed:', err);
        process.exit(1);
    }
}

seedWarehouse();
