const mongoose = require('mongoose');
const StockLedger = require('./models/stockLedger.model');

const MONGO_URI = 'mongodb://wazahatqureshi4_db_user:pKUv0rnI1Fv28A8w@ac-g6dgyg7-shard-00-00.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-01.nmyzy1e.mongodb.net:27017,ac-g6dgyg7-shard-00-02.nmyzy1e.mongodb.net:27017/cloth-inventory?ssl=true&authSource=admin&replicaSet=atlas-11u2xh-shard-0&retryWrites=true&w=majority';
const STORE_ID = '69e89f8e5df4170210683876';

async function check() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected');

    const counts = await StockLedger.aggregate([
        { $match: { 
            locationId: new mongoose.Types.ObjectId(STORE_ID) 
        } },
        { $group: { 
            _id: { 
                date: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } },
                source: "$source"
            }, 
            count: { $sum: 1 },
            totalQty: { $sum: "$quantity" }
        } },
        { $sort: { "_id.date": -1 } }
    ]);

    console.log('Stock Movements Breakdown:', JSON.stringify(counts, null, 2));
    
    process.exit(0);
}

check();
