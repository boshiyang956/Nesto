import { spawn } from 'node:child_process';
import { join } from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = 'http://127.0.0.1:8765/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startClient(port) {
  const userData = join(process.env.TEMP, 'ledger-pri-' + port + '-' + Date.now());
  const proc = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + userData,
    url
  ], { stdio: 'ignore' });
  let target = null;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        target = list.find((t) => t.type === 'page');
        if (target) break;
      }
    } catch (e) { /* retry */ }
    await sleep(200);
  }
  if (!target) throw new Error('client ' + port + ' not up');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  const cdp = {
    id: 0,
    pending: new Map(),
    errors: [],
    ws: ws,
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++this.id;
        this.pending.set(id, { resolve, reject });
        this.ws.send(JSON.stringify({ id, method, params }));
      });
    },
    async eval(expression) {
      const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    }
  };
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id) {
      const p = cdp.pending.get(msg.id);
      if (p) {
        cdp.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      cdp.errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
  });
  await cdp.send('Runtime.enable');
  await sleep(1500);
  return { cdp, proc };
}

const R = {};
let a, b;
try {
  a = await startClient(9311);
  await a.cdp.eval(`(() => {
    document.querySelector('[data-login-tab="register"]').click();
    document.querySelector('#loginName').value = '隐私测试';
    document.querySelector('#loginPassword').value = '1234';
    document.querySelector('#loginForm').requestSubmit();
  })()`);
  await sleep(1400);
  await a.cdp.eval(`(() => {
    document.querySelector('#quickAddBtn').click();
  })()`);
  await sleep(300);
  await a.cdp.eval(`(() => {
    const amt = document.querySelector('#txAmount');
    amt.value = '66';
    amt.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#txNote').value = '设备A的隐私账单';
    document.querySelector('[data-action="save-tx"]').click();
  })()`);
  await sleep(500);
  R.aHas = await a.cdp.eval(`Store.transactions.some(t => t.note === '设备A的隐私账单')`);

  b = await startClient(9312);
  // B 直接用相同用户名登录：本机没有这个账号，应该失败
  await b.cdp.eval(`(() => {
    document.querySelector('#loginName').value = '隐私测试';
    document.querySelector('#loginPassword').value = '1234';
    document.querySelector('#loginForm').requestSubmit();
  })()`);
  await sleep(1200);
  R.bLoginFail = await b.cdp.eval(`({
    appShown: !document.querySelector('#app').classList.contains('hidden'),
    error: document.querySelector('#loginError').textContent
  })`);

  // B 注册同名账号：成功但数据为空，看不到 A 的数据
  await b.cdp.eval(`(() => {
    document.querySelector('[data-login-tab="register"]').click();
    document.querySelector('#loginName').value = '隐私测试';
    document.querySelector('#loginPassword').value = '1234';
    document.querySelector('#loginForm').requestSubmit();
  })()`);
  await sleep(1400);
  R.bRegister = await b.cdp.eval(`({
    appShown: !document.querySelector('#app').classList.contains('hidden'),
    txCount: Store.transactions.length,
    hasA: Store.transactions.some(t => t.note === '设备A的隐私账单')
  })`);

  R.errorsA = a.cdp.errors;
  R.errorsB = b.cdp.errors;
  console.log(JSON.stringify(R, null, 2));
} finally {
  for (const c of [a, b]) {
    if (!c) continue;
    try { c.cdp.send('Browser.close'); } catch (e) { /* ignore */ }
    setTimeout(() => c.proc.kill(), 300);
  }
}
