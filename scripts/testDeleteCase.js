// Temporary end-to-end test of DELETE /api/cases/:id (plain Node http, no deps).
// Login → create a disposable case → delete it → verify it disappears →
// verify re-delete 404 → verify ownership guard (403 on a foreign/seeded case).
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const LegalCase = require('../models/LegalCase');

const BASE = 'http://localhost:5000';

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${BASE}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
        timeout: 120000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    if (data) req.write(data);
    req.end();
  });

(async () => {
  const login = await request('POST', '/api/auth/login', {
    email: 'authmvp7689@gmail.com',
    password: 'RealPass@2026',
  });
  if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  const token = login.body?.token || login.body?.data?.token;
  console.log('login:', login.status, token ? 'token OK' : 'NO TOKEN');

  const create = await request('POST', '/api/workspace/create', {
    text: 'Disposable delete-test case. Company X sued Company Y for breach of contract under Section 420 of the Contract Act. The trial court awarded damages of 5000 PKR. The appeal remains pending.',
    caseTitle: 'Delete Test Case',
  }, token);
  if (create.status !== 201) throw new Error(`create failed: ${create.status} ${JSON.stringify(create.body).slice(0, 200)}`);
  const caseId = create.body.caseId;
  console.log('created:', create.status, 'id:', caseId);

  const mine = await request('GET', '/api/workspace/my-cases', null, token);
  console.log('my-cases contains it:', mine.body.data.some((c) => c._id === caseId));

  const del = await request('DELETE', `/api/cases/${caseId}`, null, token);
  console.log('DELETE #1:', del.status, JSON.stringify(del.body));

  const after = await request('GET', '/api/workspace/my-cases', null, token);
  console.log('my-cases contains it after delete:', after.body.data.some((c) => c._id === caseId));

  const del2 = await request('DELETE', `/api/cases/${caseId}`, null, token);
  console.log('DELETE #2 (re-delete):', del2.status, del2.body.message || '');

  // Ownership guard: seeded SC judgments have no createdBy → must 403.
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const foreign = await LegalCase.findOne({ citation: '2013 SCMR 183' }).select('_id').lean();
  const del3 = await request('DELETE', `/api/cases/${foreign._id}`, null, token);
  console.log('DELETE foreign case:', del3.status, del3.body.message || '');
  const stillThere = await LegalCase.findById(foreign._id).lean();
  console.log('foreign case intact:', Boolean(stillThere));
  await mongoose.disconnect();
  console.log('ALL CHECKS COMPLETE');
})().catch((error) => {
  console.error('TEST FAILED:', error.message);
  process.exit(1);
});
