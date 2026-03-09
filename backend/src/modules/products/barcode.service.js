const Counter = require('../../models/counter.model');
const Settings = require('../../models/settings.model');

/**
 * Service to generate an automatic barcode
 * Format: prefix + padded sequence (e.g., DA0780)
 */
const generateBarcode = async () => {
    // 1. Fetch Barcode Settings (Prefix)
    const settings = await Settings.findOne({ key: 'barcode_settings' });
    const prefix = settings?.value?.prefix || 'DA';
    const padding = settings?.value?.padding || 4;

    // 2. Atomically increment sequence in Counter
    const counter = await Counter.findOneAndUpdate(
        { name: 'product_barcode_sequence' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    // 3. Format Barcode
    const seqString = counter.seq.toString().padStart(padding, '0');
    return `${prefix}${seqString}`;
};

module.exports = {
    generateBarcode
};
