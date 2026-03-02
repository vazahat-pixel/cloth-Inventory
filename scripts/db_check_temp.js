const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));

const User = require('../backend/src/models/user.model');
const Store = require('../backend/src/models/store.model');
const Supplier = require('../backend/src/models/supplier.model');
const Category = require('../backend/src/models/category.model');
const Product = require('../backend/src/models/product.model');
const Customer = require('../backend/src/models/customer.model');
const Dispatch = require('../backend/src/models/dispatch.model');
const Sale = require('../backend/src/models/sale.model');
const Return = require('../backend/src/models/return.model');
const StoreInventory = require('../backend/src/models/storeInventory.model');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const counts = {
            users: await User.countDocuments(),
            stores: await Store.countDocuments(),
            suppliers: await Supplier.countDocuments(),
            categories: await Category.countDocuments(),
            products: await Product.countDocuments(),
            customers: await Customer.countDocuments(),
            dispatches: await Dispatch.countDocuments(),
            sales: await Sale.countDocuments(),
            returns: await Return.countDocuments()
        };

        const sampleProduct = await Product.findOne({}, 'name factoryStock');
        const sampleInventory = await StoreInventory.findOne({});
        const sampleSale = await Sale.findOne({ status: 'COMPLETED' }, 'saleNumber');

        console.log("DB_STATE_REPORT_START");
        console.log(JSON.stringify({
            counts,
            sampleProduct,
            sampleInventory,
            sampleSale
        }, null, 2));
        console.log("DB_STATE_REPORT_END");

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
