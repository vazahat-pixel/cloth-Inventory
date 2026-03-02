#!/usr/bin/env node

const autocannon = require('autocannon');
require('dotenv').config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

function run() {
  const instance = autocannon(
    {
      url: API_BASE,
      connections: 50,
      duration: 20,
      method: 'POST',
      requests: [
        {
          method: 'POST',
          path: '/sales',
          body: JSON.stringify({
            storeId: '000000000000000000000000',
            products: [],
            subTotal: 0,
            grandTotal: 0,
            paymentMode: 'CASH',
          }),
          headers: {
            'content-type': 'application/json',
          },
        },
        {
          method: 'POST',
          path: '/purchase',
          body: JSON.stringify({
            supplierId: '000000000000000000000000',
            invoiceNumber: 'LOAD-TEST',
            invoiceDate: new Date().toISOString(),
            products: [],
            subTotal: 0,
            totalTax: 0,
            grandTotal: 0,
          }),
          headers: {
            'content-type': 'application/json',
          },
        },
      ],
    },
    (err, result) => {
      if (err) {
        console.error('Load test error:', err);
        process.exit(1);
      }
      console.log('Average latency (ms):', result.latency.average);
      console.log('Errors:', result.errors);
      console.log('Non 2xx:', result.non2xx);
      if (result.errors > 0 || result.non2xx > 0) {
        console.log('LOAD TEST: FAIL');
        process.exit(1);
      } else {
        console.log('LOAD TEST: PASS');
        process.exit(0);
      }
    }
  );

  autocannon.track(instance, { renderProgressBar: true });
}

run();

