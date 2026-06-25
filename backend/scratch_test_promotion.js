require('dotenv').config();
const connectDB = require('./src/config/db');
const promotionService = require('./src/modules/pricing/promotion.service');
const Item = require('./src/models/item.model');
const Store = require('./src/models/store.model');

async function testPromo() {
  await connectDB();

  // Find GTB Nagar Store
  const store = await Store.findOne({ name: /gtb/i });
  if (!store) {
    console.log("GTB Nagar store not found");
    process.exit(0);
  }

  // Find the DA3462 variant of FSH25-0071 (XXL / R.GREEN)
  const item = await Item.findOne({ itemCode: 'DA3462' });
  if (!item) {
    console.log("Item DA3462 not found");
    process.exit(0);
  }

  const variant = item.sizes[0]; // XXL R.GREEN
  console.log("Testing item:", {
    productId: item._id,
    variantId: variant._id,
    itemName: item.itemName,
    itemCode: item.itemCode,
    price: 999
  });

  // Construct evaluation payload
  const cartItems = [
    {
      productId: item._id.toString(),
      variantId: variant._id.toString(),
      quantity: 1,
      price: 999,
      brand: item.brandName || 'N/A',
      category: item.categoryName || 'N/A'
    }
  ];

  // Evaluate directly using the imported instance
  const result = await promotionService.evaluate(cartItems, store._id.toString());

  console.log("\nEvaluation result:");
  console.log(JSON.stringify(result, null, 2));

  if (result.totalDiscount > 0) {
    console.log("\n✅ SUCCESS: Promotion applied!");
  } else {
    console.log("\n❌ FAILED: Promotion NOT applied.");
  }

  process.exit(0);
}

testPromo().catch(err => {
  console.error(err);
  process.exit(1);
});
