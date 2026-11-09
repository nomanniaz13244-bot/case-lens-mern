// Temporary end-to-end test of the Chat History feature (plain Node http).
// Login → create session → send a message via /api/ai/chat with sessionId →
// verify the exchange is persisted → rename-on-first-message → history list →
// session fetch → delete → verify re-delete 404 + gone from history.
require('dotenv').config();
const http = require('http');

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

const assert = (condition, label) => {
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}`);
  if (!condition) process.exitCode = 1;
};

(async () => {
  const login = await request('POST', '/api/auth/login', {
    email: 'authmvp7689@gmail.com',
    password: 'RealPass@2026',
  });
  if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  const token = login.body?.token || login.body?.data?.token;
  console.log('login:', login.status, token ? 'token OK' : 'NO TOKEN');

  // 1) Create a new empty session
  const created = await request('POST', '/api/chat/new', {}, token);
  assert(created.status === 201, `POST /api/chat/new -> ${created.status}`);
  const sessionId = created.body?.data?._id;
  assert(Boolean(sessionId), 'session _id returned');
  assert(created.body?.data?.messages?.length === 0, 'session starts empty');

  // 2) History contains it with only _id/title/updatedAt
  const history1 = await request('GET', '/api/chat/history', null, token);
  assert(history1.status === 200, `GET /api/chat/history -> ${history1.status}`);
  const found = (history1.body?.data || []).find((s) => String(s._id) === String(sessionId));
  assert(Boolean(found), 'new session appears in history');
  assert(found && found.messages === undefined, 'history items contain no message arrays');

  // 3) Send a real chat exchange bound to the session
  const chat = await request('POST', '/api/ai/chat', {
    message: 'What are the grounds for pre-arrest bail under Section 498 Cr.P.C.?',
    sessionId,
  }, token);
  assert(chat.status === 200, `POST /api/ai/chat -> ${chat.status}`);
  assert(
    String(chat.body?.data?.sessionId) === String(sessionId),
    'chat response echoes sessionId'
  );

  // 4) The session now has 2 messages (user + assistant) and a derived title
  const fetched = await request('GET', `/api/chat/${sessionId}`, null, token);
  assert(fetched.status === 200, `GET /api/chat/:id -> ${fetched.status}`);
  const msgs = fetched.body?.data?.messages || [];
  assert(msgs.length === 2, `session persisted ${msgs.length} messages (expect 2)`);
  assert(msgs[0]?.role === 'user' && msgs[0]?.text.includes('Section 498'), 'first message is the user question');
  assert(msgs[1]?.role === 'assistant' && (msgs[1]?.text || '').length > 0, 'second message is the assistant answer');
  assert((fetched.body?.data?.title || '').length > 0, `title auto-generated: "${fetched.body?.data?.title}"`);

  // 5) Delete the session
  const del = await request('DELETE', `/api/chat/${sessionId}`, null, token);
  assert(del.status === 200, `DELETE /api/chat/:id -> ${del.status}`);

  // 6) Re-delete -> 404, and gone from history
  const reDel = await request('DELETE', `/api/chat/${sessionId}`, null, token);
  assert(reDel.status === 404, `re-delete -> ${reDel.status} (expect 404)`);
  const history2 = await request('GET', '/api/chat/history', null, token);
  const stillThere = (history2.body?.data || []).some((s) => String(s._id) === String(sessionId));
  assert(!stillThere, 'deleted session gone from history');

  console.log('\nChat-history e2e test finished.', process.exitCode ? 'WITH FAILURES' : 'ALL PASSED');
})().catch((error) => {
  console.error('Test crashed:', error);
  process.exit(1);
});
