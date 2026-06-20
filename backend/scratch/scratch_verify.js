const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const itemService = require('../src/modules/items/item.service');

async function verify() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB successfully!');

    // Test barcode scan for variant SKU "0006947-XL"
    const barcode = '0006947-XL';
    console.log(`Scanning barcode: ${barcode}`);
    const scanResult = await itemService.scanItemByBarcode(barcode);

    if (scanResult) {
      console.log('Scan result found!');
      console.log('Item ID:', scanResult.item?._id);
      console.log('Item Name:', scanResult.item?.itemName);
      console.log('Variant ID:', scanResult.variant?._id);
      console.log('Variant SKU:', scanResult.variant?.sku);
      console.log('Variant Size:', scanResult.variant?.size);
    } else {
      console.log('Scan result: NOT FOUND');
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('DB disconnected.');
  }
}

verify();
