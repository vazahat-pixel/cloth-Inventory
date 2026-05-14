require('dotenv').config();
const mongoose = require('mongoose');

const collectionsToClear = [
  'items', 'products', 'rawmaterials', 'fabrics', 
  'sales', 'invoices', 'purchases', 'grns', 
  'storeinventories', 'warehouseinventories', 
  'stockhistories', 'stockledgers', 'stockmovements', 
  'supplierinventories', 'accountingvouchers', 
  'banktransactions', 'batchbarcodes', 'creditnotes', 
  'deliverychallans', 'dispatches', 'formulas', 
  'loyaltytransactions', 'materialconsumptions', 
  'payments', 'productionbatches', 'purchaseorders', 
  'purchasereturns', 'qcs', 'returns', 'saleorders', 
  'salesreturns', 'stockreturns', 'supplieroutwards', 
  'vouchers', 'workflowlogs', 'auditlogs', 'systemlogs', 
  'errorlogs', 'documents', 'dailyclosures', 'customers', 'suppliers'
];

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const collectionName of collectionsToClear) {
      try {
        await mongoose.connection.collection(collectionName).deleteMany({});
        console.log(`Cleared collection: ${collectionName}`);
      } catch (err) {
        console.log(`Skipped or Error in ${collectionName}: ${err.message}`);
      }
    }

    console.log('All specified data cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

clearData();
