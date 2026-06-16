const http = require('http');
function post(path, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = body;
        try { parsed = JSON.parse(body); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
(async () => {
  try {
    const email = `test-check-${Date.now()}@example.com`;
    const password = 'Password123!';
    console.log('Signing up');
    const signup = await post('/api/auth/signup', { email, password, name: 'Debug User' });
    console.log('signup', signup.status, signup.body);
    const login = await post('/api/auth/login', { email, password });
    console.log('login', login.status);
    const cookieHeader = login.headers['set-cookie'] ? login.headers['set-cookie'][0] : '';
    const cookie = cookieHeader.split(';')[0];
    console.log('cookie', cookie);
    const ingest = await post('/api/ingest', { title: 'Debug Doc 2', text: 'This document should be searchable and summarizable.' }, { Cookie: cookie });
    console.log('ingest', ingest.status, ingest.body);
    const docId = ingest.body.documentId;
    const documents = await post('/api/documents', {}, { Cookie: cookie });
    console.log('documents', documents.status, documents.body);
    const debug = await post('/api/debug/inspect', { documentId: docId }, { Cookie: cookie });
    console.log('debug', debug.status, debug.body);
    const summary = await post('/api/summarize', { documentId: docId }, { Cookie: cookie });
    console.log('summary', summary.status, typeof summary.body.summary === 'string' ? summary.body.summary.slice(0, 200) : summary.body);
    const search = await post('/api/search', { question: 'searchable', documentId: docId }, { Cookie: cookie });
    console.log('search', search.status, search.body);
  } catch (err) {
    console.error(err);
  }
})();
