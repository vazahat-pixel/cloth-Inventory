const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const grnService = require('../src/modules/grn/grn.service');
const Warehouse = require('../src/models/warehouse.model');
const Item = require('../src/models/item.model');
const GRN = require('../src/models/grn.model');

async function testGRNCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const warehouse = await Warehouse.findOne({ isActive: true });
    if (!warehouse) throw new Error('No active warehouse found');
    console.log('Using warehouse:', warehouse.name, 'ID:', warehouse._id);

    const item = await Item.findOne({ itemCode: '0006947' });
    if (!item) throw new Error('Item 0006947 not found');
    console.log('Using item:', item.itemName, 'ID:', item._id);

    const grnData = {
      grnType: 'GARMENT',
      warehouseId: warehouse._id.toString(),
      purchaseId: '',
      purchaseOrderId: '',
      jobWorkId: '',
      supplierId: '', // EMPTY STRING WHICH PREVIOUSLY FAILED WITH CAST ERROR!
      invoiceNumber: 'TEST-INV-101',
      invoiceDate: new Date(),
      remarks: 'Test GRN empty supplierId verification',
      items: [
        {
          itemId: item._id.toString(),
          variantId: item.sizes[0]._id.toString(),
          sku: item.sizes[0].sku,
          receivedQty: 5,
          costPrice: 100,
          itemName: item.itemName,
          size: item.sizes[0].size,
          color: item.color,
          uom: item.uom
        }
      ]
    };

    console.log('Creating test GRN draft...');
    const result = await grnService.createGRN(grnData, new mongoose.Types.ObjectId());
    console.log('GRN created successfully!');
    console.log('GRN Number:', result.grnNumber);
    console.log('Supplier ID field:', result.supplierId); // should be null

    // Delete the test GRN to keep database clean
    await GRN.findByIdAndDelete(result._id);
    console.log('Cleaned up test GRN.');

  } catch (error) {
    console.error('GRN Creation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

testGRNCreation();
