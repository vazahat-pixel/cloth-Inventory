require('dotenv').config();
const mongoose = require('mongoose');
const dashboardService = require('./src/modules/dashboard/dashboard.service');

const run_test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to Mongo.");
        const metrics = await dashboardService.getDashboardMetrics();
        console.log("Metrics:", metrics);
        const recent = await dashboardService.getRecentSales();
        console.log("Recent:", recent);
    } catch (err) {
        console.error("ERROR CAUGHT:");
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

run_test();
