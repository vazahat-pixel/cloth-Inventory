const mongoose = require('mongoose');
require('dotenv').config();

const GrnSchema = new mongoose.Schema({
    status: String
});
const GRN = mongoose.model('GRN', GrnSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const grns = await GRN.find({});
    console.log('Total GRNs:', grns.length);
    console.log('Statuses:', grns.map(g => g.status));
    process.exit(0);
}
check();
