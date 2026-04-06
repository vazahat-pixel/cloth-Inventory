const mongoose = require('mongoose');
const { GrnStatus } = require('../core/enums');

// ─── Line Item Schema ──────────────────────────────────────────────────────────
const grnItemSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    variantId: { type: String, required: true }, // _id of the size variant
    sku: { type: String, required: true },
    itemName: { type: String },
    size: { type: String },
    color: { type: String },
    uom: { type: String, default: 'PCS' },
    receivedQty: { type: Number, required: true, min: 0 },

    // Pricing
    costPrice: { type: Number, default: 0 },    // MRP / Rate at which received
    
    // GST / Tax (ONLY applied for FABRIC and ACCESSORY GRNs)
    taxPercent: { type: Number, default: 0 },   // e.g. 5, 12, 18, 28
    taxAmount: { type: Number, default: 0 },    // Auto-computed: costPrice * qty * taxPercent / 100
    totalWithTax: { type: Number, default: 0 }, // costPrice * qty + taxAmount

    // Other
    discount: { type: Number, default: 0 },
    batchNumber: { type: String, trim: true },
}, { _id: false });

// ─── Material Consumption Sub-Schema (For GARMENT GRN only) ───────────────────
// Tracks what fabric/accessories were given to the tailor and how much was consumed
const consumptionDetailSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    variantId: { type: String },
    barcode: { type: String },
    itemName: { type: String },
    uom: { type: String, default: 'MTR' },

    givenQty: { type: Number, default: 0 },   // Total dispatched in Job Work Outward
    usedQty: { type: Number, default: 0 },    // Consumed to make the garments received
    wasteQty: { type: Number, default: 0 },   // Scrap / Wastage at the tailor's end
    pendingQty: { type: Number, default: 0 }, // Auto-calc: givenQty - usedQty - wasteQty
    
    notes: { type: String },
}, { _id: false });

// ─── Main GRN Schema ───────────────────────────────────────────────────────────
const grnSchema = new mongoose.Schema(
    {
        grnNumber: { type: String, unique: true, trim: true },

        // ── GRN Type: The master switch for all downstream logic ──
        grnType: {
            type: String,
            enum: ['FABRIC', 'ACCESSORY', 'GARMENT'],
            required: true,
            default: 'FABRIC'
        },

        // ── Source References ─────────────────────────────────────
        purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
        purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
        
        // Links to Supplier Outward (Job Work — used only for GARMENT GRN)
        jobWorkId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOutward' },

        // ── Parties & Location ────────────────────────────────────
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },

        // ── Invoice Details ───────────────────────────────────────
        invoiceNumber: { type: String, trim: true },
        invoiceDate: { type: Date },
        
        // ── Logistics ─────────────────────────────────────────────
        gateEntryNumber: { type: String, trim: true },
        vehicleNumber: { type: String, trim: true },
        transportName: { type: String, trim: true },
        remarks: { type: String, trim: true },

        // ── Items Received ────────────────────────────────────────
        items: [grnItemSchema],

        // ── Material Consumption Ledger (GARMENT GRN ONLY) ────────
        // Settles the fabric/accessories issued to the tailor when garments are returned
        consumptionDetails: [consumptionDetailSchema],

        // ── Financials ────────────────────────────────────────────
        totalQty: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },   // Pre-tax value
        totalTaxAmount: { type: Number, default: 0 },  // Total GST charged (0 for GARMENT)
        grandTotal: { type: Number, default: 0 },   // totalValue + totalTaxAmount

        // ── Workflow ──────────────────────────────────────────────
        status: {
            type: String,
            enum: Object.values(GrnStatus),
            default: GrnStatus.PENDING
        },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receivedAt: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

grnSchema.index({ purchaseOrderId: 1 });
grnSchema.index({ purchaseId: 1 });
grnSchema.index({ jobWorkId: 1 });
grnSchema.index({ status: 1 });
grnSchema.index({ grnType: 1 });
grnSchema.index({ supplierId: 1 });

module.exports = mongoose.model('GRN', grnSchema);
