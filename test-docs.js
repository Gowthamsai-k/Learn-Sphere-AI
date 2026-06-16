const http = require('http');

function post(path, payload, headers = {}) {
    return new Promise((resolve, reject) => {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const mergedHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            ...headers
        };
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: mergedHeaders
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = body;
                try {
                    parsed = JSON.parse(body);
                } catch(e) {}
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = body;
                try { parsed = JSON.parse(body); } catch(e) {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    const email = `test-docs-${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Docs Test User';

    console.log('--- SIGNING UP...');
    const signup = await post('/api/auth/signup', { email, password, name });
    console.log('Signup Status:', signup.status);

    console.log('--- LOGGING IN...');
    const login = await post('/api/auth/login', { email, password });
    console.log('Login Status:', login.status);

    const cookieHeader = login.headers['set-cookie'] ? login.headers['set-cookie'][0] : '';
    const cookie = cookieHeader.split(';')[0];
    console.log('Cookie obtained:', cookie);

    console.log('--- GET /api/documents ...');
    const docs = await get('/api/documents', { 'Cookie': cookie });
    console.log('Documents Status:', docs.status);
    console.log('Documents Body:', docs.body);
}

run().catch(console.error);
