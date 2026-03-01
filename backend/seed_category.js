require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/category.model');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const existing = await Category.findOne({ name: 'Cotton Shirts' });
        if (!existing) {
            await Category.create({
                name: 'Cotton Shirts',
                description: 'High quality cotton shirts',
                status: 'Active'
            });
            console.log('Seeded "Cotton Shirts" category');
        } else {
            console.log('Category already exists');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
