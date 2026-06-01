const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Group = require('../src/models/group.model');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cloth-erp';

const groupsData = [
  {
    name: "Men's Wear",
    groupType: "Section",
    children: [
      {
        name: "Shirts",
        groupType: "Category",
        children: [
          {
            name: "Formal Shirts",
            groupType: "Sub Category",
            children: [
              { name: "Slim Fit", groupType: "Style / Type" },
              { name: "Regular Fit", groupType: "Style / Type" }
            ]
          },
          {
            name: "Casual Shirts",
            groupType: "Sub Category",
            children: [
              { name: "Printed", groupType: "Style / Type" },
              { name: "Checked", groupType: "Style / Type" },
              { name: "Solid", groupType: "Style / Type" }
            ]
          }
        ]
      },
      {
        name: "Trousers",
        groupType: "Category",
        children: [
          {
            name: "Chinos",
            groupType: "Sub Category",
            children: [
              { name: "Slim Fit", groupType: "Style / Type" }
            ]
          },
          {
            name: "Formal Trousers",
            groupType: "Sub Category",
            children: [
              { name: "Regular Fit", groupType: "Style / Type" },
              { name: "Slim Fit", groupType: "Style / Type" }
            ]
          }
        ]
      },
      {
        name: "Jeans",
        groupType: "Category",
        children: [
          {
            name: "Denim Jeans",
            groupType: "Sub Category",
            children: [
              { name: "Skinny Fit", groupType: "Style / Type" },
              { name: "Straight Fit", groupType: "Style / Type" },
              { name: "Slim Fit", groupType: "Style / Type" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Women's Wear",
    groupType: "Section",
    children: [
      {
        name: "Kurta",
        groupType: "Category",
        children: [
          {
            name: "Anarkali Kurta",
            groupType: "Sub Category",
            children: [
              { name: "Embroidered", groupType: "Style / Type" },
              { name: "Printed", groupType: "Style / Type" }
            ]
          },
          {
            name: "Straight Kurta",
            groupType: "Sub Category",
            children: [
              { name: "Solid", groupType: "Style / Type" },
              { name: "Printed", groupType: "Style / Type" }
            ]
          }
        ]
      },
      {
        name: "Sarees",
        groupType: "Category",
        children: [
          {
            name: "Silk Sarees",
            groupType: "Sub Category",
            children: [
              { name: "Banarasi", groupType: "Style / Type" },
              { name: "Kanjeevaram", groupType: "Style / Type" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Kids Wear",
    groupType: "Section",
    children: [
      {
        name: "T-Shirts",
        groupType: "Category",
        children: [
          {
            name: "Round Neck",
            groupType: "Sub Category",
            children: [
              { name: "Graphic Print", groupType: "Style / Type" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Accessories",
    groupType: "Section",
    children: [
      {
        name: "Belts",
        groupType: "Category",
        children: [
          {
            name: "Leather Belts",
            groupType: "Sub Category",
            children: [
              { name: "Classic Buckle", groupType: "Style / Type" },
              { name: "Reversible", groupType: "Style / Type" }
            ]
          }
        ]
      },
      {
        name: "Wallets",
        groupType: "Category",
        children: [
          {
            name: "Leather Wallets",
            groupType: "Sub Category",
            children: [
              { name: "Bi-Fold", groupType: "Style / Type" },
              { name: "Card Holder", groupType: "Style / Type" }
            ]
          }
        ]
      }
    ]
  }
];

async function seedNode(node, parentId = null) {
  // Check if exists
  let group = await Group.findOne({
    name: node.name,
    groupType: node.groupType,
    parentId: parentId
  });

  if (!group) {
    group = await Group.create({
      name: node.name,
      groupType: node.groupType,
      parentId: parentId,
      code: node.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + Math.floor(Math.random() * 100)
    });
    console.log(`+ Seeded Group: [${node.groupType}] ${node.name}`);
  } else {
    console.log(`o Already Exists: [${node.groupType}] ${node.name}`);
  }

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await seedNode(child, group._id);
    }
  }
}

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Seeding categories hierarchy into Group model...');
    for (const node of groupsData) {
      await seedNode(node, null);
    }

    console.log('🎉 Hierarchy seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

run();
