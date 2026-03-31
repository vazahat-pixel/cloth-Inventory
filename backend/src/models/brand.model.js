const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Brand name is required'],
            unique: true,
            trim: true
        },
        shortName: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

brandSchema.pre('save', function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

module.exports = mongoose.model('Brand', brandSchema);
