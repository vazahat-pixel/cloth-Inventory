const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = '69ef4aef761ce0ce3fffe083';
    
    const Sale = mongoose.model('Sale', new mongoose.Schema({}, { strict: false }));
    const Dispatch = mongoose.model('Dispatch', new mongoose.Schema({}, { strict: false }));
    
    const sale = await Sale.findById(id);
    if (sale) {
        console.log(`ID ${id} is a SALE. Status: ${sale.status}, SaleNumber: ${sale.saleNumber}`);
    } else {
        const dispatch = await Dispatch.findById(id);
        if (dispatch) {
            console.log(`ID ${id} is a DISPATCH. Status: ${dispatch.status}, DispatchNumber: ${dispatch.dispatchNumber}`);
        } else {
            console.log(`ID ${id} not found in Sales or Dispatches.`);
        }
    }
    
    process.exit(0);
}
check();
