require('dotenv').config();
const mongoose = require('mongoose');
const { getNextSequence } = require('./src/services/sequence.service');

const testConcurrency = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const counterName = `TEST_CONCURRENCY_${Date.now()}`;
        const numRequests = 50;

        console.log(`Sending ${numRequests} concurrent requests for sequence...`);

        const results = await Promise.all(
            Array.from({ length: numRequests }).map(() => getNextSequence(counterName))
        );

        console.log("Results received.");

        // Check for duplicates
        const uniqueResults = new Set(results);
        console.log(`Original count: ${results.length}`);
        console.log(`Unique count: ${uniqueResults.size}`);

        if (results.length === uniqueResults.size) {
            console.log("✅ SUCCESS: No duplicates found. Atomic increment works.");

            // Verify last value
            const min = Math.min(...results);
            const max = Math.max(...results);
            console.log(`Sequence range: ${min} to ${max}`);

            if (min === 1 && max === numRequests) {
                console.log("✅ SUCCESS: Sequence is perfect (1 to 50).");
            } else {
                console.error("❌ FAILURE: Sequence range is incorrect.");
            }
        } else {
            console.error("❌ FAILURE: Duplicates detected!");
            // Find duplicates
            const counts = {};
            results.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
            const duplicates = Object.keys(counts).filter(num => counts[num] > 1);
            console.log("Duplicate values:", duplicates);
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        await mongoose.disconnect();
    }
};

testConcurrency();
