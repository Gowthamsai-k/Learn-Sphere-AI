const http = require('http');

const data = JSON.stringify({
    email: 'test-1781590878148@domain.com',
    password: 'Password123!'
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('TEXT:', body);
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e);
});

req.write(data);
req.end();
