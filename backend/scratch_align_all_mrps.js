require('dotenv').config();
const fs = require('fs');
const connectDB = require('./src/config/db');
const Item = require('./src/models/item.model');

async function run() {
  await connectDB();

  const isCommit = process.argv.includes('--commit');
  console.log(`Starting MRP alignment. Mode: ${isCommit ? 'COMMIT (WRITE)' : 'DRY-RUN (READ-ONLY)'}\n`);

  // Fetch all active items
  const items = await Item.find({ isActive: true });
  console.log(`Fetched ${items.length} active items.`);

  // Group by style prefix using the refined logic (stripping hyphen + 5 or more digits at the end)
  const groups = new Map();
  for (const item of items) {
    if (!item.itemName) continue;
    const name = item.itemName.trim();
    
    let stylePrefix = name;
    const match = name.match(/(.+)-\d{5,}$/);
    if (match) {
      stylePrefix = match[1].trim();
    }
    stylePrefix = stylePrefix.toUpperCase();

    if (!groups.has(stylePrefix)) {
      groups.set(stylePrefix, []);
    }
    groups.get(stylePrefix).push(item);
  }

  console.log(`Grouped into ${groups.size} distinct style groups.`);

  const proposals = [];
  let totalDocsToUpdate = 0;
  let totalVariantsToUpdate = 0;

  for (const [stylePrefix, docList] of groups.entries()) {
    // 1. Find the highest MRP in this style group
    let maxMRP = 0;
    const currentPrices = new Set();

    for (const doc of docList) {
      if (doc.mrp) {
        maxMRP = Math.max(maxMRP, doc.mrp);
        currentPrices.add(doc.mrp);
      }
      for (const size of doc.sizes || []) {
        if (size.mrp) {
          maxMRP = Math.max(maxMRP, size.mrp);
          currentPrices.add(size.mrp);
        }
      }
    }

    if (maxMRP <= 0) continue;

    // Check if there is any mismatch in this group
    const docsToChange = [];
    for (const doc of docList) {
      let docNeedsChange = false;
      const variantChanges = [];

      if (doc.mrp !== maxMRP) {
        docNeedsChange = true;
      }

      for (const size of doc.sizes || []) {
        if (size.mrp !== maxMRP) {
          docNeedsChange = true;
          variantChanges.push({
            sku: size.sku,
            size: size.size,
            color: size.color,
            from: size.mrp,
            to: maxMRP
          });
        }
      }

      if (docNeedsChange) {
        docsToChange.push({
          itemId: doc._id.toString(),
          itemCode: doc.itemCode,
          itemName: doc.itemName,
          parentFrom: doc.mrp,
          parentTo: maxMRP,
          variantChanges
        });
      }
    }

    if (docsToChange.length > 0) {
      proposals.push({
        stylePrefix,
        targetMRP: maxMRP,
        allUniquePricesInGroup: Array.from(currentPrices),
        totalItemsInGroup: docList.length,
        itemsToUpdate: docsToChange
      });

      totalDocsToUpdate += docsToChange.length;
      totalVariantsToUpdate += docsToChange.reduce((sum, item) => sum + item.variantChanges.length, 0);
    }
  }

  // Save proposals report
  fs.writeFileSync('mrp_alignment_proposals.json', JSON.stringify(proposals, null, 2));
  console.log(`\nProposals report saved to mrp_alignment_proposals.json`);
  console.log(`Found ${proposals.length} styles requiring alignment.`);
  console.log(`Total documents to update: ${totalDocsToUpdate}`);
  console.log(`Total variant sizes to update: ${totalVariantsToUpdate}`);

  if (isCommit) {
    console.log(`\nExecuting database updates...`);
    let updatedCount = 0;

    for (const prop of proposals) {
      const targetMRP = prop.targetMRP;

      for (const itemProposal of prop.itemsToUpdate) {
        const doc = await Item.findById(itemProposal.itemId);
        if (!doc) {
          console.error(`Error: Document with ID ${itemProposal.itemId} not found during update!`);
          continue;
        }

        let docModified = false;
        if (doc.mrp !== targetMRP) {
          doc.mrp = targetMRP;
          docModified = true;
        }

        for (const size of doc.sizes || []) {
          if (size.mrp !== targetMRP) {
            size.mrp = targetMRP;
            docModified = true;
          }
        }

        if (docModified) {
          await doc.save();
          updatedCount++;
        }
      }
    }

    console.log(`\nSuccessfully applied changes to ${updatedCount} documents in MongoDB.`);
  } else {
    console.log(`\nDry run completed. Run the command with --commit to apply changes to MongoDB.`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
