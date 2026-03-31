const axios = require('axios');

async function testRoutes() {
  const baseURL = 'http://localhost:5001/api';
  const routes = [
    '/suppliers',
    '/account-groups',
    '/account-master',
    '/groups'
  ];

  for (const route of routes) {
    try {
      console.log(`Checking ${baseURL}${route} ...`);
      // Since they are protected, we expect a 401, NOT a 404
      await axios.get(`${baseURL}${route}`);
    } catch (err) {
      if (err.response) {
        console.log(`Result: ${err.response.status} ${err.response.statusText}`);
      } else {
        console.log(`Result: Error ${err.message}`);
      }
    }
  }
}

testRoutes();
