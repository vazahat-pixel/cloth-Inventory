const mongoose = require('mongoose');

const saleOrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number }
}, { _id: false });

saleOrderItemSchema.pre('save', function() {
    this.total = this.quantity * this.rate * (1 - this.discount / 100);
});

const saleOrderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, unique: true },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        items: [saleOrderItemSchema],
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING'
        },
        expectedDelivery: { type: Date },
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
        isStockReserved: { type: Boolean, default: false },
        notes: { type: String },
        subTotal: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

saleOrderSchema.index({ orderNumber: 1 });
saleOrderSchema.index({ customerId: 1 });
saleOrderSchema.index({ storeId: 1 });
saleOrderSchema.index({ status: 1 });

module.exports = mongoose.model('SaleOrder', saleOrderSchema);
