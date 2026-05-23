require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const GRN = require('./src/models/grn.model');
        
        // Target GRNs to delete
        const grnsToDelete = [
            'GRN-2026-00002',
            'GRN-2026-00003',
            'GRN-2026-00004',
            'GRN-2026-00005',
            'GRN-2026-00006'
        ];
        
        const result = await GRN.deleteMany({ grnNumber: { $in: grnsToDelete } });
        console.log(`Successfully deleted ${result.deletedCount} duplicate GRNs.`);
        
        // Let's also check if GRN-2026-00001 exists and is APPROVED
        const remainingGrn = await GRN.findOne({ grnNumber: 'GRN-2026-00001' });
        if (remainingGrn) {
            console.log(`Primary GRN remaining: ${remainingGrn.grnNumber}, Status: ${remainingGrn.status}, Items: ${remainingGrn.items.length}, TotalQty: ${remainingGrn.totalQty}`);
        } else {
            console.log('WARNING: Primary GRN-2026-00001 not found!');
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

run();
