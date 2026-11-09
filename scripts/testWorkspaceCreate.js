// Quick e2e check of the new-workspace contract: { caseTitle, caseText }.
// Verifies: missing title -> 400, valid create -> 201 with caseTitle saved and
// AI analysis populated from caseText, then deletes the disposable case.
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5000';

const request = (method, path, body, token) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 120000,
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });

const assert = (condition, label) => {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) process.exitCode = 1;
};

(async () => {
  const login = await request('POST', '/api/auth/login', {
    email: 'authmvp7689@gmail.com',
    password: 'RealPass@2026',
  });
  const token = login.body?.token || login.body?.data?.token;
  assert(login.status === 200 && token, `login -> ${login.status}`);

  // 1) Missing title -> 400
  const noTitle = await request('POST', '/api/workspace/create', {
    caseText: 'Company X sued Company Y for breach of contract under Section 420.',
  }, token);
  assert(noTitle.status === 400, `no-title create -> ${noTitle.status} (expect 400)`);
  assert(/title/i.test(noTitle.body?.message || ''), `400 message: "${noTitle.body?.message}"`);

  // 2) Valid create with caseTitle + caseText
  const created = await request('POST', '/api/workspace/create', {
    caseTitle: 'State vs. Test Imran (Contract Dispute)',
    caseText:
      'Company X filed a suit against Company Y for breach of contract under Section 420 of the Contract Act 1872. ' +
      'Company Y failed to deliver 1,000 metric tonnes of raw material on the agreed date of 31 March 2024 and delivered ' +
      'only 600 tonnes of inferior quality goods. The trial court awarded PKR 5,000,000 damages to Company X. Both parties ' +
      'appealed; the appellate proceedings remain pending before the Lahore High Court.',
  }, token);
  assert(created.status === 201, `valid create -> ${created.status} (expect 201)`);
  const createdCase = created.body?.data || {};
  assert(createdCase.caseTitle === 'State vs. Test Imran (Contract Dispute)', `caseTitle saved verbatim: "${createdCase.caseTitle}"`);
  assert((createdCase.summary || '').length > 20 && createdCase.summary !== 'Not available', `AI summary generated (${(createdCase.summary || '').length} chars)`);
  assert((createdCase.facts || '').length > 20, 'AI facts generated');
  assert((createdCase.legalLaws || []).length > 0, `legalLaws extracted: ${(createdCase.legalLaws || []).join(', ')}`);
  assert(created.body?.caseId, 'caseId returned');

  // 3) Clean up the disposable case
  const del = await request('DELETE', `/api/cases/${created.body.caseId}`, null, token);
  assert(del.status === 200 || del.status === 404, `cleanup delete -> ${del.status}`);

  console.log('\nWorkspace create-contract test finished.', process.exitCode ? 'WITH FAILURES' : 'ALL PASSED');
  process.exit(process.exitCode || 0);
})().catch((error) => {
  console.error('Test crashed:', error);
  process.exit(1);
});
