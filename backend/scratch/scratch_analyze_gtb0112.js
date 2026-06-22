const mongoose = require('mongoose');
require('dotenv').config();

const Sale = require('../src/models/sale.model');

async function checkExchanges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check for any exchange sales related to this customer or date
    const customerExchanges = await Sale.find({ 
      customerName: /manal/i,
      type: 'EXCHANGE'
    }).lean();

    console.log('Exchanges for manal trading:', customerExchanges.length);
    customerExchanges.forEach(ex => console.log('Exchange:', ex.saleNumber, 'Date:', ex.saleDate));

    // Also check any exchanges in GTB on 14th June or recently
    const gtbExchanges = await Sale.find({
        storeId: '69ecb1d9f04d7249bd11adf4',
        type: 'EXCHANGE'
    }).sort({ saleDate: -1 }).limit(5).lean();

    console.log('Recent exchanges in GTB Nagar:');
    gtbExchanges.forEach(ex => console.log('Exchange:', ex.saleNumber, 'Date:', ex.saleDate, 'Customer:', ex.customerName));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkExchanges();
