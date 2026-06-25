require('dotenv').config();
const connectDB = require('./src/config/db');
const Scheme = require('./src/models/scheme.model');
const Item = require('./src/models/item.model');
const Product = require('./src/models/product.model');

async function run() {
  await connectDB();
  
  // Get the scheme
  const scheme = await Scheme.findOne({ name: "OWN STORE" });
  if (!scheme) {
    console.log("Scheme 'OWN STORE' not found!");
    process.exit(0);
  }

  // Convert applicableProducts to strings for easy comparison
  const appProdStrings = scheme.applicableProducts.map(id => id.toString());
  console.log(`Scheme has ${appProdStrings.length} applicable products.`);

  // Search Products (from Product model) matching FSH25-0071
  const searchRegex = /FSH25-0071/i;
  const products = await Product.find({
    $or: [
      { name: searchRegex },
      { sku: searchRegex },
      { styleCode: searchRegex },
      { barcode: searchRegex }
    ]
  });

  console.log(`\nFound ${products.length} Products in Product collection matching 'FSH25-0071':`);
  for (const p of products) {
    const isInScheme = appProdStrings.includes(p._id.toString());
    console.log(`- ID: ${p._id}, SKU: ${p.sku}, Style: ${p.styleCode}, Barcode: ${p.barcode}, Size: ${p.size}, Color: ${p.color}, Name: ${p.name}`);
    console.log(`  IsInScheme? ${isInScheme ? 'YES' : 'NO'}`);
  }

  // Let's also print 10 random applicable product IDs from the scheme and find what model they belong to
  console.log(`\nChecking 10 random applicable product IDs from the scheme:`);
  for (const idStr of appProdStrings.slice(0, 10)) {
    const itemMatch = await Item.findById(idStr);
    const prodMatch = await Product.findById(idStr);
    console.log(`- ID ${idStr}: ItemName=${itemMatch?.itemName || 'N/A'}, ProductName=${prodMatch?.name || 'N/A'}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
