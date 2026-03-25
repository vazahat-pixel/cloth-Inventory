const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    permissions: {
        type: [String],
        default: [] // e.g., ['purchase:create', 'sale:view']
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
