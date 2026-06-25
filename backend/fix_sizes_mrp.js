require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB...");
  const Item = require("./src/models/item.model");

  const result = await Item.updateMany(
    { mrp: { $gt: 0 } },
    [{ $set: { sizes: { $map: { input: "$sizes", as: "sv", in: { $mergeObjects: ["$$sv", { mrp: "$mrp" }] } } } } }]
  );

  console.log("Fixed:", result.modifiedCount, "items");
  console.log("Done! All sizes[].mrp now match parent mrp.");
  process.exit(0);
}).catch(e => { console.error("Error:", e.message); process.exit(1); });
