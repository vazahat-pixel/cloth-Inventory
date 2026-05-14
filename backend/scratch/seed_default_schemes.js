const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../src/config/db');
const Scheme = require('../src/models/scheme.model');

async function seedDefaultSchemes() {
    await connectDB();
    try {
        console.log("Cleaning up existing schemes...");
        await Scheme.deleteMany({});

        const defaultSchemes = [
            {
                name: "Buy 1 Get 5",
                description: "Buy any 1 item and get 5 items of equal or lesser value absolutely free!",
                type: "BUY_X_GET_Y",
                buyQuantity: 1,
                getQuantity: 5,
                value: 0,
                startDate: new Date("2026-01-01"),
                endDate: new Date("2030-12-31"),
                isActive: true,
                isUniversal: true
            },
            {
                name: "Buy 1 Get 1 Free (BOGO)",
                description: "Buy 1 item and get 1 item free!",
                type: "BOGO",
                buyQuantity: 1,
                getQuantity: 1,
                value: 0,
                startDate: new Date("2026-01-01"),
                endDate: new Date("2030-12-31"),
                isActive: true,
                isUniversal: true
            },
            {
                name: "FLAT 10% OFF",
                description: "Flat 10% discount on all items in the store.",
                type: "PERCENTAGE",
                value: 10,
                startDate: new Date("2026-01-01"),
                endDate: new Date("2030-12-31"),
                isActive: true,
                isUniversal: true
            }
        ];

        console.log(`Inserting ${defaultSchemes.length} standard corporate schemes...`);
        const res = await Scheme.insertMany(defaultSchemes);
        console.log("Successfully seeded corporate schemes:", res.map(s => s.name));

    } catch (e) {
        console.error("Seeding Schemes Error:", e);
    } finally {
        await mongoose.connection.close();
    }
}

seedDefaultSchemes();
