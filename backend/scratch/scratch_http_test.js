const http = require('http');

const port = process.env.PORT || 5000;
const url = `http://localhost:${port}/api/items/scan/0006947-XL`;

console.log(`Sending GET request to ${url}...`);

http.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(data);
      console.log('Response Payload:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
