import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';
const PORT = 9333;
const email = `noman.navtest.${Date.now()}@caselens.test`;
const password = 'TestPass123';
const fullName = 'Noman Nav Test';
const userDataDir = mkdtempSync(join(tmpdir(), 'caselens-chrome-'));

const results = [];
function log(step, ok, detail = '') {
  results.push({ step, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}${detail ? ` — ${detail}` : ''}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(fn, timeout = 15000) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (err) {
      lastErr = err;
    }
    await wait(250);
  }
  throw lastErr || new Error('Timed out');
}

const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

let ws;
try {
  await waitFor(async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return res.ok ? true : null;
  });

  const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`${BASE}/admin`)}`, {
    method: 'PUT',
  });
  const target = await targetRes.json();
  if (!target.webSocketDebuggerUrl) {
    throw new Error(`No page target: ${JSON.stringify(target)}`);
  }

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('CDP websocket failed'));
  });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const nextId = ++id;
      pending.set(nextId, { resolve, reject });
      ws.send(JSON.stringify({ id: nextId, method, params }));
    });

  const evalExpr = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
    }
    return result.result.value;
  };

  await send('Runtime.enable');
  await send('Page.enable');

  const goto = async (url) => {
    await send('Page.navigate', { url });
    await waitFor(async () => {
      const ready = await evalExpr('document.readyState');
      const hasRoot = await evalExpr('Boolean(document.querySelector("#root")?.children?.length)');
      return ready === 'complete' && hasRoot;
    }, 20000);
    await wait(800);
  };

  await waitFor(async () => {
    const path = await evalExpr('window.location.pathname');
    return path === '/login' ? path : null;
  }, 20000).catch(() => null);
  const adminPath = await evalExpr('window.location.pathname');
  const adminSnippet = await evalExpr('document.body.innerText.slice(0, 240)');
  log('Unauthenticated /admin redirects to /login', adminPath === '/login', `path=${adminPath} text=${adminSnippet.replace(/\\s+/g, ' ').trim()}`);

  const loggedOutNav = await evalExpr(`document.querySelector('nav')?.innerText || ''`);
  log('Navbar shows Login when logged out', loggedOutNav.includes('Login'), loggedOutNav.replace(/\s+/g, ' ').trim());
  log('Navbar links include Home, AI Chat, Admin, Dashboard', ['Home', 'AI Chat', 'Admin', 'Dashboard'].every((label) => loggedOutNav.includes(label)));

  const registerRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password }),
  });
  const registerJson = await registerRes.json();
  log('Backend register succeeded', Boolean(registerJson.success), registerJson.message || '');

  await goto(`${BASE}/login`);
  await evalExpr(`
    const set = (id, value) => {
      const el = document.getElementById(id);
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto.set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set('email', ${JSON.stringify(email)});
    set('password', ${JSON.stringify(password)});
    document.querySelector('button[type="submit"]').click();
  `);

  await waitFor(async () => {
    const path = await evalExpr('window.location.pathname');
    return path === '/dashboard' ? path : null;
  }, 25000).catch(async () => {
    const text = await evalExpr('document.body.innerText.slice(0, 400)');
    throw new Error(`Login did not reach dashboard: ${text.replace(/\\s+/g, ' ')}`);
  });
  const afterReg = await evalExpr('window.location.pathname');
  log('Register lands on /dashboard', afterReg === '/dashboard', `path=${afterReg}`);

  const loggedInNav = await evalExpr(`document.querySelector('nav')?.innerText || ''`);
  log('Navbar shows remaining credits after login', loggedInNav.includes('credits') && /\d+/.test(loggedInNav), loggedInNav.replace(/\s+/g, ' ').trim());
  log('Navbar shows Logout when logged in', loggedInNav.includes('Logout'));
  log('Navbar does not show Login when logged in', !loggedInNav.includes('Login'));

  for (const [path, hint] of [
    ['/', 'Case Lens AI'],
    ['/ai-chat', 'AI Legal Assistant'],
    ['/admin', 'Admin Portal'],
    ['/dashboard', 'Welcome'],
  ]) {
    await goto(`${BASE}${path}`);
    const current = await evalExpr('window.location.pathname');
    const body = await evalExpr('document.body.innerText');
    log(`Authenticated navigate ${path}`, current === path && body.toLowerCase().includes(hint.toLowerCase()), `path=${current}`);
  }
} catch (err) {
  log('Browser test threw', false, err.message);
} finally {
  if (ws) ws.close();
  chrome.kill();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}
