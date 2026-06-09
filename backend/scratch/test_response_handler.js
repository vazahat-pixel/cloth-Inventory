const mongoose = require('mongoose');
const { sendSuccess } = require('../src/utils/response.handler');
const Item = require('../src/models/item.model');
require('dotenv').config();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Fetch a document
        const itemDoc = await Item.findOne();
        if (!itemDoc) throw new Error('No item found in DB.');

        // Attach a mock session (or similar object with circular dependency / Client references) to simulate the error condition
        const mockSession = {
            id: 'mock-session-id',
            client: {}
        };
        mockSession.client.sessionPool = { client: mockSession }; // Circular reference!
        
        // Mongoose internally attaches the session to the document
        itemDoc.$session(mockSession);

        // Mock Express Response object
        const mockRes = {
            statusCode: 200,
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(payload) {
                console.log('JSON conversion successful!');
                console.log('Payload keys:', Object.keys(payload));
                console.log('Payload success:', payload.success);
                console.log('Payload message:', payload.message);
                
                // Let's test if JSON.stringify throws any error
                try {
                    const str = JSON.stringify(payload);
                    console.log('JSON.stringify successful. Length of JSON string:', str.length);
                } catch (jsonErr) {
                    console.error('JSON.stringify FAILED:', jsonErr.message);
                }
                return this;
            }
        };

        // Call sendSuccess with the document containing the circular reference
        sendSuccess(mockRes, itemDoc, 'Test success message');

    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
