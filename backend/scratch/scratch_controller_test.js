const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const itemController = require('../src/modules/items/item.controller');

async function testController() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const req = {
      params: {
        barcode: '0006947-XL'
      }
    };

    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };

    await itemController.scanItemByBarcode(req, res);

    console.log('Controller status code:', res.statusCode || 200);
    console.log('Controller body:', JSON.stringify(res.body, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

testController();
