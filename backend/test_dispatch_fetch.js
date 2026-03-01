const http = require('http');

const login = () => new Promise(resolve => {
    const req = http.request('http://localhost:5000/api/auth/store/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
    });
    req.write(JSON.stringify({ email: 'store@test.com', password: 'store123' }));
    req.end();
});

login().then(data => {
    const req = http.request('http://localhost:5000/api/dispatch', {
        headers: { 'Authorization': `Bearer ${data.token}` }
    }, res => {
        let rd = '';
        res.on('data', c => rd += c);
        res.on('end', () => console.log(JSON.parse(rd)));
    });
    req.end();
});
