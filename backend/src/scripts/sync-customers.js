const mongoose = require('mongoose');
require('dotenv').config();
const Sale = require('../models/sale.model');
const Customer = require('../models/customer.model');

async function syncCustomers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const sales = await Sale.find({ 
            customerMobile: { $exists: true, $ne: '' } 
        });
        
        console.log(`Found ${sales.length} sales with mobile numbers. Starting sync...`);

        let count = 0;
        for (const sale of sales) {
            const mobile = sale.customerMobile;
            const existing = await Customer.findOne({ mobileNumber: mobile });
            
            if (!existing) {
                await Customer.create({
                    customerName: sale.customerName || 'Walk-in Customer',
                    mobileNumber: mobile,
                    status: 'active',
                    loyaltyPoints: 0, // Points will be recalculated in next step
                    createdBy: sale.cashierId
                });
                count++;
            }
        }

        console.log(`Successfully imported ${count} new customers from past store sales!`);
        process.exit(0);
    } catch (error) {
        console.error('Error syncing customers:', error);
        process.exit(1);
    }
}

syncCustomers();
