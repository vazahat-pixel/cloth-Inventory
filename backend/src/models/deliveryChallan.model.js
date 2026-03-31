const mongoose = require('mongoose');

const deliveryChallanSchema = new mongoose.Schema(
    {
        dcNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse' // Can be Warehouse or Store
        },
        type: {
            type: String,
            enum: ['CUSTOMER_DISPATCH', 'STOCK_TRANSFER'],
            default: 'CUSTOMER_DISPATCH'
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },
                price: {
                    type: Number,
                    required: true
                }
            }
        ],
        status: {
            type: String,
            enum: ['DRAFT', 'SENT', 'BILLED', 'CANCELLED'],
            default: 'DRAFT'
        },
        dcDate: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        notes: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

deliveryChallanSchema.index({ dcNumber: 1 });
deliveryChallanSchema.index({ customerId: 1 });
deliveryChallanSchema.index({ storeId: 1 });

module.exports = mongoose.model('DeliveryChallan', deliveryChallanSchema);
