const http = require('http');

function post(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: JSON.parse(body)
                });
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    const email = `test-${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Autotest User';

    console.log('--- SIGNING UP:', email);
    const signupRes = await post('/api/auth/signup', { email, password, name });
    console.log('Signup Status:', signupRes.status);
    console.log('Signup Body:', signupRes.body);

    if (signupRes.status === 200) {
        console.log('--- LOGGING IN:', email);
        const loginRes = await post('/api/auth/login', { email, password });
        console.log('Login Status:', loginRes.status);
        console.log('Login Headers:', loginRes.headers);
        console.log('Login Body:', loginRes.body);
    }
}

run().catch(console.error);
