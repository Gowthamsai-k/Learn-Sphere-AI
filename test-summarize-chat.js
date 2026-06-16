const http = require('http');

function post(port, path, payload, headers = {}) {
    return new Promise((resolve, reject) => {
        const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const mergedHeaders = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            ...headers
        };
        const req = http.request({
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'POST',
            headers: mergedHeaders
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
        req.write(data);
        req.end();
    });
}

async function run() {
    const port = process.argv[2] ? Number(process.argv[2]) : 3000;
    const email = `test-sum-${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'Sum Test User';

    console.log('Using port:', port);

    await post(port, '/api/auth/signup', { email, password, name });
    const login = await post(port, '/api/auth/login', { email, password });
    const cookieHeader = login.headers['set-cookie'] ? login.headers['set-cookie'][0] : '';
    const cookie = cookieHeader.split(';')[0];
    console.log('Cookie obtained:', cookie);

    const ingest = await post(port, '/api/ingest', { title: 'Summarize Doc', text: 'Alpha beta gamma. This document contains several sentences to summarize and cite.' }, { 'Cookie': cookie });
    console.log('Ingest:', ingest.status, ingest.body);

    const documentId = ingest.body.documentId;
    console.log('DocumentId:', documentId);

    const summarize = await post(port, '/api/summarize', { documentId }, { 'Cookie': cookie });
    console.log('/api/summarize status:', summarize.status, 'body preview:', summarize.body?.summary?.slice?.(0,200));

    const chat = await post(port, '/api/chat', { documentId, messages: [{ role: 'user', content: 'What is this document about?' }] }, { 'Cookie': cookie });
    console.log('/api/chat status:', chat.status, 'response keys:', Object.keys(chat.body || {}));
}

run().catch(console.error);
