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

async function run() {
    const email = `test-${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Ingest Test User';

    console.log('--- SIGNING UP...');
    const signup = await post('/api/auth/signup', { email, password, name });
    console.log('Signup Status:', signup.status);

    console.log('--- LOGGING IN...');
    const login = await post('/api/auth/login', { email, password });
    console.log('Login Status:', login.status);

    // Get cookie
    const cookieHeader = login.headers['set-cookie'] ? login.headers['set-cookie'][0] : '';
    const cookie = cookieHeader.split(';')[0];
    console.log('Cookie obtained:', cookie);

    console.log('--- TESTING TEXT INGESTION...');
    const textRes = await post('/api/ingest', {
        title: 'My Custom Ingestion Title',
        text: 'This is some high-quality sample resource content text. LearnSphere AI is a platform designed to enhance learning using AI.'
    }, {
        'Cookie': cookie
    });
    console.log('Text Ingest Status:', textRes.status);
    console.log('Text Ingest Body:', textRes.body);
}

run().catch(console.error);
