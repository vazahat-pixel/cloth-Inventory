require('dotenv').config();
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');

async function run() {
  await connectDB();

  console.log("Fetching all active items to check for MRP mismatches within the same itemName...");
  const items = await Item.find({ isActive: true }).lean();
  console.log(`Found ${items.length} total items.`);

  // Group by itemName
  const groups = new Map();
  for (const item of items) {
    if (!item.itemName) continue;
    const key = item.itemName.trim();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }

  console.log(`Grouped into ${groups.size} distinct product names (styles).\n`);
  console.log("Checking for styles with multiple different MRPs in their variants...");

  let mismatchCount = 0;
  const reports = [];

  for (const [itemName, itemDocs] of groups.entries()) {
    // Collect all unique variant MRPs for this item name
    const mrpMap = new Map(); // mrp -> array of { itemCode, sku, size, color }
    
    for (const doc of itemDocs) {
      for (const size of doc.sizes || []) {
        const mrp = size.mrp ?? doc.mrp ?? 0;
        if (!mrpMap.has(mrp)) {
          mrpMap.set(mrp, []);
        }
        mrpMap.get(mrp).push({
          itemCode: doc.itemCode,
          sku: size.sku,
          size: size.size,
          color: size.color,
          itemId: doc._id
        });
      }
    }

    if (mrpMap.size > 1) {
      mismatchCount++;
      const mrpDetails = {};
      for (const [mrp, variants] of mrpMap.entries()) {
        mrpDetails[mrp] = variants;
      }
      reports.push({
        itemName,
        mrpDetails
      });
    }
  }

  console.log(`Found ${mismatchCount} styles with MRP mismatches!`);
  
  // Write a detailed report to a JSON file and print summary
  const fs = require('fs');
  const reportPath = 'mismatch_mrp_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  console.log(`Detailed report saved to: ${reportPath}`);

  // Print first 5 mismatches as sample
  console.log("\n--- Sample of Mismatched Products ---");
  for (const r of reports.slice(0, 5)) {
    console.log(`\nStyle: "${r.itemName}"`);
    for (const [mrp, variants] of Object.entries(r.mrpDetails)) {
      console.log(`  - MRP: ₹${mrp} (${variants.length} variants)`);
      console.log(`    Example SKUs: ${variants.slice(0, 3).map(v => `${v.sku} (${v.color}/${v.size}) [Code: ${v.itemCode}]`).join(', ')}`);
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
