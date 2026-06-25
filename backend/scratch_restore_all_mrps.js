require('dotenv').config();
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');
const Sale = require('./src/models/sale.model');
const Grn = require('./src/models/grn.model');
const SystemLog = require('./src/models/systemLog.model');

async function run() {
  await connectDB();

  console.log("🟢 Phase 1: Extracting pricing history from database transactions...");
  const barcodePrices = new Map(); // barcode -> Price

  function addPrice(barcode, mrp) {
    if (!barcode || !mrp) return;
    const cleanBarcode = String(barcode).trim();
    const numPrice = Number(mrp);
    if (isNaN(numPrice) || numPrice <= 0) return;

    if (!barcodePrices.has(cleanBarcode) || numPrice > barcodePrices.get(cleanBarcode)) {
      barcodePrices.set(cleanBarcode, numPrice);
    }
  }

  // 1. Extract from Sales
  const sales = await Sale.find({}).lean();
  console.log(`- Extracted from ${sales.length} sales records.`);
  sales.forEach(sale => {
    if (Array.isArray(sale.products)) {
      sale.products.forEach(p => {
        addPrice(p.barcode || p.sku, p.mrp || p.rate);
      });
    }
  });

  // 2. Extract from GRNs
  const grns = await Grn.find({}).lean();
  console.log(`- Extracted from ${grns.length} GRN records.`);
  grns.forEach(grn => {
    if (Array.isArray(grn.items)) {
      grn.items.forEach(item => {
        addPrice(item.sku || item.barcode, item.costPrice);
      });
    }
  });

  // 3. Extract from SystemLogs
  const logs = await SystemLog.find({
    action: { $in: ['POST /api/sales', 'POST /api/grn', 'POST /api/sales/create'] }
  }).lean();
  console.log(`- Extracted from ${logs.length} relevant SystemLogs.`);
  logs.forEach(log => {
    const body = log.details?.body;
    if (!body) return;

    if (Array.isArray(body.products)) {
      body.products.forEach(p => {
        addPrice(p.barcode || p.sku, p.mrp || p.price || p.rate);
      });
    }
    if (Array.isArray(body.items)) {
      body.items.forEach(item => {
        addPrice(item.barcode || item.sku, item.mrp || item.costPrice);
      });
    }
  });

  console.log(`✅ Extracted correct pricing for ${barcodePrices.size} unique variants/barcodes.`);

  // 4. Update catalog items with matching history prices
  console.log("\n🟢 Phase 2: Updating catalog items with historical prices...");
  const items = await Item.find({ isActive: true });
  console.log(`Found ${items.length} active items in catalog.`);

  const manualOverrides = {
    'AW24SS0021': 1998,
    'AW24CTR0007': 3299,
    'FSH25-0071': 3299
  };

  function getStylePrefix(itemName) {
    if (!itemName) return '';
    const name = itemName.trim();
    let prefix = name;
    const match = name.match(/(.+)-\d{5,}$/);
    if (match) {
      prefix = match[1].trim();
    }
    return prefix.toUpperCase();
  }

  let historyUpdatedDocs = 0;
  let historyUpdatedVariants = 0;

  for (const item of items) {
    let docModified = false;
    const stylePrefix = getStylePrefix(item.itemName);
    const overridePrice = manualOverrides[stylePrefix];

    for (const size of item.sizes || []) {
      const barcode = size.barcode || size.sku;
      let correctPrice;

      if (overridePrice !== undefined) {
        correctPrice = overridePrice;
      } else if (barcodePrices.has(barcode)) {
        correctPrice = barcodePrices.get(barcode);
      }

      if (correctPrice !== undefined && size.mrp !== correctPrice) {
        size.mrp = correctPrice;
        docModified = true;
        historyUpdatedVariants++;
      }
    }

    if (docModified) {
      await item.save();
      historyUpdatedDocs++;
    }
  }

  console.log(`✅ Restored pricing from history for ${historyUpdatedVariants} variants across ${historyUpdatedDocs} documents.`);

  // 5. Group by style prefix and align remaining defaults
  console.log("\n🟢 Phase 3: Aligning remaining default/mismatched MRPs at style prefix level...");
  
  // Re-query updated documents from database to get fresh state
  const updatedItems = await Item.find({ isActive: true });

  const groups = new Map();
  for (const item of updatedItems) {
    const stylePrefix = getStylePrefix(item.itemName);
    if (!stylePrefix) continue;

    if (!groups.has(stylePrefix)) {
      groups.set(stylePrefix, []);
    }
    groups.get(stylePrefix).push(item);
  }

  console.log(`Grouped into ${groups.size} distinct style groups.`);

  let styleUpdatedDocs = 0;
  let styleUpdatedVariants = 0;

  for (const [stylePrefix, docList] of groups.entries()) {
    let targetMRP;

    // Check if there is a manual override first
    if (manualOverrides[stylePrefix] !== undefined) {
      targetMRP = manualOverrides[stylePrefix];
    } else {
      // Collect all unique prices in this style group
      const uniquePrices = new Set();
      for (const doc of docList) {
        if (doc.mrp) uniquePrices.add(doc.mrp);
        for (const size of doc.sizes || []) {
          if (size.mrp) uniquePrices.add(size.mrp);
        }
      }

      // Filter out placeholder price 999
      const non999Prices = Array.from(uniquePrices).filter(p => p !== 999 && p > 0);

      if (non999Prices.length > 0) {
        targetMRP = Math.max(...non999Prices);
      } else if (uniquePrices.has(999)) {
        targetMRP = 999;
      } else {
        continue; // No valid prices in the group
      }
    }

    for (const doc of docList) {
      let docModified = false;

      // Update parent MRP if different
      if (doc.mrp !== targetMRP) {
        doc.mrp = targetMRP;
        docModified = true;
      }

      // Update size variant MRPs if different
      for (const size of doc.sizes || []) {
        if (size.mrp !== targetMRP) {
          size.mrp = targetMRP;
          docModified = true;
          styleUpdatedVariants++;
        }
      }

      if (docModified) {
        await doc.save();
        styleUpdatedDocs++;
      }
    }
  }

  console.log(`✅ Aligned style prices for ${styleUpdatedVariants} variants across ${styleUpdatedDocs} documents.`);
  console.log("\n🎉 Database MRP recovery completed successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
