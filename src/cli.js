#!/usr/bin/env node
'use strict';

/**
 * xlapis-bulk-apikey CLI — mint Xlapis accounts, one API key per account, and
 * keep only the keys that survived a live chat call.
 *
 * This panel's door is a **"nofield" one**: `/api/user/register` takes a
 * username and a password and nothing else — no mailbox, no captcha — while the
 * `default` group has no channel for the cheap models, so a token created there
 * answers 503. The tool therefore **binds the token to the model's own group**
 * (`enable_groups[0]` from `/api/pricing`) and walks the cheapest priced models
 * until the chat answers 200.
 *
 * Flow, per account, every request over one pinned exit:
 *   1. register  `POST /api/user/register` {username,password}  (no e-mail field)
 *   2. login     `POST /api/user/login`     {username,password} → access_token
 *   3. account   `GET  /api/user/self`      → id + quota
 *   4. pricing   `GET  /api/pricing`        → cheapest priced model + its group
 *   5. key       `POST /api/token/` {group} → `POST /api/token/<id>/key` (reveal)
 *   6. gate      `POST /v1/chat/completions` → 200 with `choices` = keep
 *
 * A key is appended to `keys.txt` only *after* step 6 answers 200 — a key that
 * never passes is recorded in `accounts.json` and retried on the next run.
 *
 * Options:
 *   --count N        accounts (= keys) to mint                     [10]
 *   --conc N         accounts in flight at once, max 16            [2]
 *   --host <name>    panel host                               [xlapis.com]
 *   --model <id>     pin the gate to one model id (default: cheapest priced)
 *   --group <name>   pin the token group (default: the model's own group)
 *   --pool <file>    proxy list, one exit per line    (env XLAPIS_PROXIES)
 *   --gap MS         pause between rounds inside a worker          [800]
 *   --tries N        exits tried per account before giving up             [2]
 *   --timeout MS     per-request timeout                                 [60000]
 *   --verify-only    re-run every key in keys.txt through the chat gate
 *   --screen         only test the proxy list against the panel
 *   --probe          environment check: panel, exits, pricing, existing keys
 *   --collect        rebuild keys.txt from accounts.json
 *   --help
 *
 * Zero dependencies. Node.js >= 18.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const { URL } = require('url');

// Shipped as `<repo>/src/cli.js`; in the lab it sits in `providers/xlapis/`,
// so both layouts must resolve the same root for keys.txt / accounts.json.
const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const UNGATED_FILE = path.join(ROOT, 'keys-ungated.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

// ------------------------------------------------------------------- options

const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`);
const MODES = new Set(['run', 'mint', 'gate', 'screen', 'probe', 'collect']);
const MODE = MODES.has(argv[0]) ? argv[0] : 'run';
const VERIFY_ONLY = has('verify-only') || MODE === 'gate';
const SCREEN_ONLY = has('screen') || MODE === 'screen';
const PROBE_ONLY = has('probe') || MODE === 'probe';
const COLLECT_ONLY = has('collect') || MODE === 'collect';

if (has('help') || has('h')) {
  console.log(`xlapis-bulk-apikey — mint Xlapis accounts, one key each, verified by a live chat call.

  node src/cli.js --count 50         mint (a key is kept only after a chat 200)
  node src/cli.js --verify-only      re-check every key in keys.txt
  node src/cli.js --screen           test your proxy list against the panel
  node src/cli.js --probe            panel / exits / pricing / key check
  node src/cli.js --collect          rebuild keys.txt from accounts.json
  node src/cli.js --help

  --count N      accounts to mint                                 [10]
  --conc N       accounts in flight (max 16)                       [2]
  --host <name>  panel host                                [xlapis.com]
  --model <id>   pin the gate to one model            [cheapest priced]
  --group <name> pin the token group        [the model's own group]
  --pool <file>  proxy list, one exit per line     (env XLAPIS_PROXIES)

Every request leaves through an exit from your pool; the tool never dials the
panel directly.`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '10'), 10) || 10);
const CONC = Math.min(16, Math.max(1, parseInt(arg('conc', arg('concurrency', '2')), 10) || 2));
const GAP_MS = Math.max(0, parseInt(arg('gap', '800'), 10) || 0);
const TRIES = Math.max(1, parseInt(arg('tries', '2'), 10) || 2);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const HOST = arg('host', 'xlapis.com');
const BASE = `https://${HOST}`;
const PIN_MODEL = arg('model', '');
const PIN_GROUP = arg('group', '');
const PROXY_FILE = process.env.XLAPIS_PROXIES || arg('pool', arg('proxies', 'proxies.txt'));
// Panel-side model families that are not chat completions. Measured: the two
// cheapest priced ids here are `seedance-*` in group `视频模型` (video), so the
// group label has to be checked too — a name-only filter walks them first.
const NON_CHAT = /embed|rerank|tts|whisper|video|image|绘图|视频|seedance|veo|kling|sora|mj_|suno|flux|sd-|dall/i;

// ------------------------------------------------------------------ helpers

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jparse = (s) => {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
};
const maskExit = (line) => String(line || 'direct').replace(/:[^:@/]+@/, ':***@');
const randUser = () => `omp${Array.from({ length: 6 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`;
function randPass() {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '0123456789';
  const rand = (set, n) => Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('');
  return `${rand(lower, 5)}${rand(upper, 1)}${rand(lower + digits, 4)}!${rand(digits, 2)}`;
}
function say(msg) {
  console.log(`${new Date().toISOString().slice(11, 19)} ${msg}`);
}

function loadExits() {
  const file = path.resolve(ROOT, PROXY_FILE);
  if (!fs.existsSync(file)) {
    console.error(`! proxy list not found: ${PROXY_FILE} (one exit per line: http://host:port)`);
    process.exit(2);
  }
  const exits = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#') && !s.startsWith('//'))
    // a screened list may carry a trailing note (`http://host:port 1.2.3.4`)
    .map((s) => s.split(/\s+/)[0]);
  if (!exits.length) {
    console.error(`! proxy list ${PROXY_FILE} is empty`);
    process.exit(2);
  }
  return exits;
}

// ------------------------------------------------------------------- tunnel

/** `host:port`, an http/https exit (credentials allowed), `socks5://…`, `socks4://…`. */
function parseExit(line) {
  const m = /^(?:(socks5h|socks5|socks4a|socks4|https|http):\/\/)?(?:([^:@/\s]+):([^@/\s]*)@)?([^:/\s]+):(\d{1,5})$/.exec(
    String(line || '').trim()
  );
  if (!m) return null;
  return {
    protocol: (m[1] || 'http').toLowerCase(),
    username: m[2] ? decodeURIComponent(m[2]) : null,
    password: m[3] !== undefined && m[2] ? decodeURIComponent(m[3]) : null,
    host: m[4],
    port: Number(m[5]),
  };
}

/** Reads exactly `n` bytes; anything past `n` is pushed back for the caller. */
function readExactly(sock, n, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (sock.__leftover && sock.__leftover.length >= n) {
      const out = sock.__leftover.slice(0, n);
      sock.__leftover = sock.__leftover.slice(n);
      return resolve(out);
    }
    let buf = sock.__leftover || Buffer.alloc(0);
    sock.__leftover = Buffer.alloc(0);
    if (buf.length >= n) {
      const out = buf.slice(0, n);
      sock.__leftover = buf.slice(n);
      return resolve(out);
    }
    const timer = setTimeout(() => {
      sock.removeListener('data', onData);
      sock.removeListener('error', onErr);
      reject(new Error('tunnel handshake timeout'));
    }, timeoutMs);
    const onData = (d) => {
      buf = Buffer.concat([buf, d]);
      if (buf.length >= n) {
        clearTimeout(timer);
        sock.removeListener('data', onData);
        sock.removeListener('error', onErr);
        sock.__leftover = buf.slice(n);
        resolve(buf.slice(0, n));
      }
    };
    const onErr = (e) => {
      clearTimeout(timer);
      sock.removeListener('data', onData);
      reject(e);
    };
    sock.on('data', onData);
    sock.on('error', onErr);
  });
}

/** CONNECT tunnel through an http/https exit; leftover proxy bytes are unshifted. */
async function httpTunnel(exit, host, port, timeoutMs) {
  const sock = await new Promise((resolve, reject) => {
    const s =
      exit.protocol === 'https'
        ? tls.connect({ host: exit.host, port: exit.port, servername: exit.host })
        : net.connect({ host: exit.host, port: exit.port });
    s.setTimeout(timeoutMs, () => s.destroy(new Error('exit connect timeout')));
    s.once(exit.protocol === 'https' ? 'secureConnect' : 'connect', () => resolve(s));
    s.once('error', reject);
  });
  const auth =
    exit.username && exit.password
      ? `Proxy-Authorization: Basic ${Buffer.from(`${exit.username}:${exit.password}`).toString('base64')}\r\n`
      : '';
  sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
  const head = await new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => {
      sock.removeListener('data', onData);
      reject(new Error('exit CONNECT timeout'));
    }, timeoutMs);
    const onData = (d) => {
      buf = Buffer.concat([buf, d]);
      const end = buf.indexOf('\r\n\r\n');
      if (end === -1) {
        if (buf.length > 8192) {
          clearTimeout(timer);
          sock.removeListener('data', onData);
          reject(new Error('exit sent an oversized CONNECT response'));
        }
        return;
      }
      clearTimeout(timer);
      sock.removeListener('data', onData);
      sock.__leftover = buf.slice(end + 4);
      resolve(buf.slice(0, end).toString('latin1'));
    };
    sock.on('data', onData);
  });
  const line = head.split('\r\n')[0];
  if (!/^HTTP\/1\.[01] 200/.test(line)) throw new Error(`exit CONNECT refused: ${line}`);
  return sock;
}

/** SOCKS5 (no-auth or user/pass) CONNECT. */
async function socks5Tunnel(exit, host, port, timeoutMs) {
  const needAuth = Boolean(exit.username);
  const sock = await new Promise((resolve, reject) => {
    const s = net.connect({ host: exit.host, port: exit.port });
    s.setTimeout(timeoutMs, () => s.destroy(new Error('exit connect timeout')));
    s.once('connect', () => resolve(s));
    s.once('error', reject);
  });
  sock.write(needAuth ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
  const greeting = await readExactly(sock, 2, timeoutMs);
  if (greeting[0] !== 5) throw new Error('socks5: bad greeting');
  if (greeting[1] === 2) {
    const u = Buffer.from(exit.username || '');
    const p = Buffer.from(exit.password || '');
    sock.write(Buffer.concat([Buffer.from([1, u.length]), u, Buffer.from([p.length]), p]));
    const auth = await readExactly(sock, 2, timeoutMs);
    if (auth[1] !== 0) throw new Error('socks5: auth rejected');
  } else if (greeting[1] !== 0) {
    throw new Error('socks5: no acceptable auth method');
  }
  const name = Buffer.from(host);
  if (name.length > 255) throw new Error('socks5: host too long');
  sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, name.length]), name, Buffer.from([port >> 8, port & 0xff])]));
  const head = await readExactly(sock, 4, timeoutMs);
  if (head[1] !== 0) throw new Error(`socks5: CONNECT refused (${head[1]})`);
  const tail = head[3] === 1 ? 4 + 2 : head[3] === 4 ? 16 + 2 : (await readExactly(sock, 1, timeoutMs))[0] + 2;
  await readExactly(sock, tail, timeoutMs);
  return sock;
}

/** SOCKS4 / SOCKS4a CONNECT. */
async function socks4Tunnel(exit, host, port, timeoutMs) {
  const sock = await new Promise((resolve, reject) => {
    const s = net.connect({ host: exit.host, port: exit.port });
    s.setTimeout(timeoutMs, () => s.destroy(new Error('exit connect timeout')));
    s.once('connect', () => resolve(s));
    s.once('error', reject);
  });
  const isV4a = exit.protocol === 'socks4a' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const ip = isV4a ? Buffer.from([0, 0, 0, 1]) : Buffer.from(host.split('.').map(Number));
  const user = Buffer.from(exit.username || '');
  const body = Buffer.concat([
    Buffer.from([4, 1, port >> 8, port & 0xff]),
    ip,
    user,
    Buffer.from([0]),
    isV4a ? Buffer.concat([Buffer.from(host), Buffer.from([0])]) : Buffer.alloc(0),
  ]);
  sock.write(body);
  const res = await readExactly(sock, 8, timeoutMs);
  if (res[1] !== 90) throw new Error(`socks4: CONNECT refused (${res[1]})`);
  return sock;
}

async function openTunnel(exit, host, port, timeoutMs) {
  if (exit.protocol === 'socks5' || exit.protocol === 'socks5h') return socks5Tunnel(exit, host, port, timeoutMs);
  if (exit.protocol === 'socks4' || exit.protocol === 'socks4a') return socks4Tunnel(exit, host, port, timeoutMs);
  return httpTunnel(exit, host, port, timeoutMs);
}

/**
 * One HTTPS request through `exit`. No exit means no request: the rail never
 * dials the panel from your own line.
 */
function exitRequest(exitLine, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const exit = parseExit(exitLine);
    if (!exitLine) return reject(new Error('refusing a direct request: this attempt has no exit'));
    if (!exit) return reject(new Error(`unparseable exit ${maskExit(exitLine)}`));
    const u = new URL(url);
    const payload =
      body === null || body === undefined ? null : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const origin = `${u.protocol}//${u.host}`;
    const hs = {
      host: u.host,
      'user-agent': UA,
      accept: 'application/json, text/plain, */*',
      'accept-encoding': 'identity',
      origin,
      referer: `${origin}/`,
      connection: 'close',
      ...headers,
    };
    if (payload) {
      hs['content-type'] = hs['content-type'] || 'application/json';
      hs['content-length'] = String(payload.length);
    }
    const head =
      `${method} ${u.pathname}${u.search} HTTP/1.1\r\n` +
      Object.entries(hs)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n';
    let settled = false;
    const fail = (e) => {
      if (settled) return;
      settled = true;
      reject(e);
    };
    let tlsSock = null;
    openTunnel(exit, u.hostname, Number(u.port || 443), Math.min(timeoutMs, 20000))
      .then((tunnel) => {
        const leftover = tunnel.__leftover;
        tunnel.__leftover = Buffer.alloc(0);
        tunnel.pause();
        tunnel.removeAllListeners('data');
        if (leftover && leftover.length) tunnel.unshift(leftover);
        tlsSock = tls.connect({ socket: tunnel, servername: u.hostname }, () => {
          tlsSock.write(head);
          if (payload) tlsSock.write(payload);
        });
        tlsSock.setTimeout(timeoutMs, () => tlsSock.destroy(new Error('timeout')));
        let raw = Buffer.alloc(0);
        let headEnd = -1;
        let status = 0;
        let respHeaders = {};
        let closed = false;
        const finish = (text) => {
          if (settled) return;
          settled = true;
          tlsSock.destroy();
          resolve({
            status,
            headers: respHeaders,
            text,
            json: jparse(text),
            setCookie: respHeaders['set-cookie'] ? [respHeaders['set-cookie']] : [],
          });
        };
        /** `null` while the chunked body is still incomplete. */
        const dechunk = (buf) => {
          const parts = [];
          let i = 0;
          for (;;) {
            const nl = buf.indexOf('\r\n', i);
            if (nl === -1) return null;
            const size = parseInt(buf.slice(i, nl).toString('latin1').split(';')[0], 16);
            if (!Number.isFinite(size)) return null;
            if (size === 0) return Buffer.concat(parts);
            if (buf.length < nl + 2 + size + 2) return null;
            parts.push(buf.slice(nl + 2, nl + 2 + size));
            i = nl + 2 + size + 2;
          }
        };
        const pump = () => {
          if (headEnd === -1) {
            headEnd = raw.indexOf('\r\n\r\n');
            if (headEnd === -1) return;
            const headText = raw.slice(0, headEnd).toString('latin1');
            status = parseInt(headText.split('\r\n')[0].split(' ')[1] || '0', 10);
            for (const line of headText.split('\r\n').slice(1)) {
              const i = line.indexOf(':');
              if (i > 0) respHeaders[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
            }
          }
          const body = raw.slice(headEnd + 4);
          if ((respHeaders['transfer-encoding'] || '').toLowerCase().includes('chunked')) {
            const done = dechunk(body);
            if (done) finish(done.toString('utf8'));
            return;
          }
          if (respHeaders['content-length'] !== undefined) {
            const len = parseInt(respHeaders['content-length'], 10);
            if (body.length >= len) finish(body.slice(0, len).toString('utf8'));
            return;
          }
          if (closed) finish(body.toString('utf8'));
        };
        tlsSock.on('data', (d) => {
          raw = Buffer.concat([raw, d]);
          pump();
        });
        tlsSock.on('end', () => {
          closed = true;
          pump();
        });
        tlsSock.on('error', fail);
        tlsSock.on('close', () => fail(new Error('connection closed before a response')));
      })
      .catch(fail);
  });
}

/** Retrying wrapper — a dead exit hands the account to the next one in the pool. */
async function exitJson(exits, exitLine, url, opts = {}, tries = 3) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    const px = i === 0 ? exitLine : exits[(exits.indexOf(exitLine) + i * 7 + 1) % exits.length];
    try {
      const r = await exitRequest(px, url, opts);
      if (r.status === 407 || r.status === 502 || r.status === 504) {
        last = new Error(`exit ${r.status} via ${maskExit(px)}`);
        await sleep(1200 * (i + 1));
        continue;
      }
      return r;
    } catch (e) {
      last = new Error(`${e.message} via ${maskExit(px)}`);
      await sleep(1200 * (i + 1));
    }
  }
  throw last || new Error('request failed');
}

// --------------------------------------------------------------------- flows

function appendKey(key) {
  fs.appendFileSync(KEYS_FILE, `${key}\n`);
}

let writeChain = Promise.resolve();
function recordAccount(rec) {
  writeChain = writeChain
    .then(() => {
      let arr = [];
      try {
        const parsed = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
        if (Array.isArray(parsed)) arr = parsed;
      } catch (e) {
        /* first record */
      }
      arr.push(rec);
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(arr, null, 2) + '\n');
    })
    .catch(() => {});
  return writeChain;
}

/** Priced, chat-capable models, cheapest first — the order the gate walks. */
async function loadPricing(exits, exitLine) {
  const r = await exitJson(exits, exitLine, `${BASE}/api/pricing`, {}, 2);
  let rows = r.json && r.json.data;
  if (rows && !Array.isArray(rows)) rows = rows.data;
  const models = (rows || [])
    .filter((m) => m && m.model_name && Array.isArray(m.enable_groups) && m.enable_groups.length)
    .filter((m) => !NON_CHAT.test(String(m.model_name)) && !m.enable_groups.some((g) => NON_CHAT.test(String(g))))
    .map((m) => ({ name: String(m.model_name), ratio: Number(m.model_ratio) || 0, groups: m.enable_groups }));
  models.sort((a, b) => a.ratio - b.ratio);
  if (!models.length) throw new Error('the panel published no priced model with an enabled group');
  return models;
}

/** Gate order: the pinned id first (if any), then the cheapest priced models. */
function gateOrder(models, pinned) {
  if (!pinned) return models.slice(0, 4);
  const hit = models.filter((m) => m.name === pinned);
  return (hit.length ? hit : [{ name: pinned, ratio: 0, groups: PIN_GROUP ? [PIN_GROUP] : [] }]).concat(
    models.filter((m) => m.name !== pinned).slice(0, 2)
  );
}

async function signUp(exits, exitLine) {
  const username = randUser();
  const password = randPass();
  const register = (body, headers) => exitJson(exits, exitLine, `${BASE}/api/user/register`, { method: 'POST', body, headers }, 2);

  let reg = await register({ username, password });
  for (let a = 0; a < 2 && reg.status >= 500; a++) {
    await sleep(2500);
    reg = await register({ username, password });
  }
  if (!(reg.status === 200 && reg.json && reg.json.success !== false)) {
    reg = await register({ username, password, email: `${username}@gmail.com` });
  }
  if (!(reg.status === 200 && reg.json && reg.json.success !== false)) {
    const msg = String((reg.json && reg.json.message) || reg.text || '').slice(0, 140);
    return { username, password, error: `register failed HTTP ${reg.status}: ${msg}` };
  }
  const cookie = reg.setCookie.map((c) => String(c).split(';')[0]).join('; ');

  const lg = await exitJson(
    exits,
    exitLine,
    `${BASE}/api/user/login`,
    { method: 'POST', body: { username, password }, headers: cookie ? { cookie } : {} },
    2
  );
  const data = (lg.json && lg.json.data) || {};
  const jwt = data.access_token || (typeof data === 'string' ? data : '');
  const uid = data.id;
  const sess = lg.setCookie.map((c) => String(c).split(';')[0]).join('; ') || cookie;
  if (!jwt && !uid && !sess) {
    return { username, password, error: `login failed HTTP ${lg.status}: ${String(lg.text).slice(0, 140)}` };
  }
  const auth = jwt
    ? { authorization: `Bearer ${jwt}` }
    : uid
      ? { cookie: sess, 'new-api-user': String(uid) }
      : { cookie: sess };

  const self = await exitJson(exits, exitLine, `${BASE}/api/user/self`, { headers: auth });
  const me = (self.json && self.json.data) || {};
  if (!jwt && me.id) auth['new-api-user'] = String(me.id);
  return { username, password, uid: me.id || uid, quota: me.quota, auth };
}

/** Create the token inside the model's own group and read the plaintext key. */
async function mintKey(exits, exitLine, auth, model) {
  const group = PIN_GROUP || model.groups[0] || '';
  const created = await exitJson(
    exits,
    exitLine,
    `${BASE}/api/token/`,
    {
      method: 'POST',
      headers: auth,
      body: {
        name: `omp-${Math.floor(Math.random() * 9000 + 1000)}`,
        remain_quota: 0,
        expired_time: -1,
        unlimited_quota: true,
        model_limits_enabled: false,
        model_limits: '',
        allow_ips: '',
        group,
      },
    },
    2
  );
  const dd = created.json && created.json.data;
  let raw = dd && dd.key && !String(dd.key).includes('*') ? String(dd.key) : '';
  const id = dd && dd.id;
  if (!raw && id) {
    const kr = await exitJson(exits, exitLine, `${BASE}/api/token/${id}/key`, { method: 'POST', headers: auth, body: {} }, 2);
    raw = (kr.json && kr.json.data && kr.json.data.key) || '';
  }
  if (!raw) {
    // only when the panel withholds the key on create: read it from the list
    const list = await exitJson(exits, exitLine, `${BASE}/api/token/?p=0&size=10`, { headers: auth }, 2);
    const items = (list.json && list.json.data && (list.json.data.items || list.json.data)) || [];
    const mine = id ? items.find((t) => t.id === id) : items[0];
    if (mine && mine.key && !String(mine.key).includes('*')) raw = String(mine.key);
    else if (mine) {
      const kr = await exitJson(exits, exitLine, `${BASE}/api/token/${mine.id}/key`, { method: 'POST', headers: auth, body: {} }, 2);
      raw = (kr.json && kr.json.data && kr.json.data.key) || '';
    }
  }
  if (!raw) return { key: null, group, error: `token HTTP ${created.status}` };
  return { key: raw.startsWith('sk-') ? raw : `sk-${raw}`, group };
}

/** The gate: 200 with `choices` and no `error` = the key is live. */
async function chatGate(exits, exitLine, key, model, { maxTokens = 16 } = {}) {
  const r = await exitJson(
    exits,
    exitLine,
    `${BASE}/v1/chat/completions`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${key}` },
      body: { model, messages: [{ role: 'user', content: 'ping' }], max_tokens: maxTokens, stream: false },
      timeoutMs: Math.max(TIMEOUT_MS, 60000),
    },
    2
  );
  const j = r.json;
  const ok = r.status === 200 && j && !j.error && Array.isArray(j.choices);
  const text = ok ? String(((j.choices[0] || {}).message || {}).content || '').slice(0, 60) : '';
  return {
    ok,
    status: r.status,
    text,
    error: ok ? '' : String((j && j.error && (j.error.message || JSON.stringify(j.error))) || r.text).slice(0, 160),
  };
}

async function mintOne(exits, startExit, index, models) {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const exitLine = attempt === 0 ? startExit : exits[(exits.indexOf(startExit) + attempt * 3 + 1) % exits.length];
    try {
      const acct = await signUp(exits, exitLine);
      if (acct.error) {
        say(`  ✗ #${index + 1} ${acct.error}`);
        continue;
      }
      const order = gateOrder(models, PIN_MODEL);
      let last = { status: 0, error: 'no model tried' };
      for (const model of order) {
        const made = await mintKey(exits, exitLine, acct.auth, model);
        if (!made.key) {
          last = { status: 0, error: made.error };
          continue;
        }
        const gate = await chatGate(exits, exitLine, made.key, model.name);
        if (gate.ok) {
          const rec = {
            index: index + 1,
            username: acct.username,
            password: acct.password,
            uid: acct.uid,
            quota: acct.quota,
            api_key: made.key,
            group: made.group,
            model: model.name,
            chat_status: gate.status,
            chat: gate.text,
            exit: maskExit(exitLine),
            verdict: 'LIVE',
            at: new Date().toISOString(),
          };
          await recordAccount(rec);
          appendKey(made.key);
          say(`  ✓ #${index + 1} ${acct.username} → ${made.key.slice(0, 8)}…  quota ${acct.quota}  ${model.name} [${made.group}]  chat 200 ${gate.text}`);
          return rec;
        }
        last = { status: gate.status, error: `${model.name} [${made.group}]: ${gate.error}` };
        // 429 is a pace signal, not a dead key: wait it out and stay on this model
        if (gate.status === 429) {
          await sleep(2500);
          const retry = await chatGate(exits, exitLine, made.key, model.name);
          if (retry.ok) {
            const rec = {
              index: index + 1,
              username: acct.username,
              password: acct.password,
              uid: acct.uid,
              quota: acct.quota,
              api_key: made.key,
              group: made.group,
              model: model.name,
              chat_status: retry.status,
              chat: retry.text,
              exit: maskExit(exitLine),
              verdict: 'LIVE',
              at: new Date().toISOString(),
            };
            await recordAccount(rec);
            appendKey(made.key);
            say(`  ✓ #${index + 1} ${acct.username} → ${made.key.slice(0, 8)}…  ${model.name} [${made.group}]  chat 200 ${retry.text}`);
            return rec;
          }
          last = { status: retry.status, error: `${model.name} [${made.group}]: ${retry.error}` };
        }
        await sleep(GAP_MS);
      }
      await recordAccount({
        index: index + 1,
        username: acct.username,
        password: acct.password,
        quota: acct.quota,
        chat_status: last.status,
        chat_error: last.error,
        exit: maskExit(exitLine),
        verdict: 'key-no-chat',
        at: new Date().toISOString(),
      });
      say(`  ✗ #${index + 1} ${acct.username}: no model answered 200 (${last.error})`);
      return null;
    } catch (e) {
      say(`  ✗ #${index + 1} attempt ${attempt + 1} via ${maskExit(exitLine)}: ${e.message}`);
      await sleep(1500 * (attempt + 1));
    }
  }
  await recordAccount({ index: index + 1, verdict: 'failed', at: new Date().toISOString() });
  return null;
}

// --------------------------------------------------------------------- modes

async function screen(exits) {
  say(`screening ${exits.length} exit(s) against ${HOST}`);
  const live = [];
  let cursor = 0;
  const workers = Array.from({ length: CONC }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= exits.length) return;
      const exitLine = exits[i];
      try {
        const r = await exitRequest(exitLine, `${BASE}/api/status`, { timeoutMs: 12000 });
        if (r.status === 200) {
          live.push(exitLine);
          say(`  ✓ ${maskExit(exitLine)} ${r.status}`);
        } else {
          say(`  ✗ ${maskExit(exitLine)} ${r.status}`);
        }
      } catch (e) {
        say(`  ✗ ${maskExit(exitLine)} ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
  fs.writeFileSync(path.join(ROOT, 'proxies.live.txt'), live.join('\n') + (live.length ? '\n' : ''));
  say(`screen done: ${live.length}/${exits.length} live → proxies.live.txt`);
}

async function probe(exits) {
  const exitLine = exits[0];
  const st = await exitJson(exits, exitLine, `${BASE}/api/status`, {}, 2);
  const d = (st.json && st.json.data) || {};
  say(
    `panel ${HOST} · sys=${d.system_name || '?'} · register=${d.password_register_enabled ?? '?'} ` +
      `mail=${d.email_verification} turnstile=${d.turnstile_check}`
  );
  const models = await loadPricing(exits, exitLine);
  say(`pricing: ${models.length} chat model(s) with an enabled group; cheapest ${models[0].name} [${models[0].groups[0]}]`);
  const order = gateOrder(models, PIN_MODEL);
  say(`gate order: ${order.map((m) => `${m.name}[${m.groups[0] || '-'}]`).join(' → ')}`);
  let live = 0;
  for (const ex of exits) {
    try {
      const r = await exitRequest(ex, `${BASE}/api/status`, { timeoutMs: 12000 });
      if (r.status === 200) live++;
    } catch (e) {
      /* dead exit */
    }
  }
  say(`exits: ${live}/${exits.length} reach ${HOST}`);
  if (fs.existsSync(KEYS_FILE)) {
    const keys = fs.readFileSync(KEYS_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    say(`keys.txt: ${keys.length} key(s) — run --verify-only to re-test them`);
  } else {
    say('keys.txt: not present yet');
  }
}

async function verifyOnly(exits) {
  if (!fs.existsSync(KEYS_FILE)) {
    console.error(`! ${path.basename(KEYS_FILE)} not found — nothing to verify`);
    process.exit(2);
  }
  const keys = fs
    .readFileSync(KEYS_FILE, 'utf8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const models = await loadPricing(exits, exits[0]);
  const order = gateOrder(models, PIN_MODEL);
  say(`re-checking ${keys.length} key(s), gate order ${order.map((m) => m.name).join(' → ')}`);
  const live = [];
  const dead = [];
  for (let i = 0; i < keys.length; i++) {
    const exitLine = exits[i % exits.length];
    let ok = false;
    let note = '';
    for (const model of order) {
      try {
        const gate = await chatGate(exits, exitLine, keys[i], model.name);
        if (gate.ok) {
          ok = true;
          note = `${model.name} ${gate.status} ${gate.text}`;
          break;
        }
        note = `${model.name} HTTP ${gate.status} ${gate.error}`;
      } catch (e) {
        note = e.message;
      }
    }
    if (ok) {
      live.push(keys[i]);
      say(`  ✓ ${keys[i].slice(0, 8)}… ${note}`);
    } else {
      dead.push(keys[i]);
      say(`  ✗ ${keys[i].slice(0, 8)}… ${note}`);
    }
  }
  fs.writeFileSync(KEYS_FILE, live.join('\n') + (live.length ? '\n' : ''));
  if (dead.length) fs.writeFileSync(UNGATED_FILE, dead.join('\n') + '\n');
  say(`verify done: ${live.length} live, ${dead.length} dead`);
}

async function collect() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.error(`! ${path.basename(ACCOUNTS_FILE)} not found — nothing to collect`);
    process.exit(2);
  }
  const rows = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  const keys = [...new Set(rows.filter((r) => r.chat_status === 200 && r.api_key).map((r) => r.api_key))];
  fs.writeFileSync(KEYS_FILE, keys.join('\n') + (keys.length ? '\n' : ''));
  say(`collect done: ${keys.length} chat-200 key(s) → keys.txt`);
}

async function mint(exits, models) {
  const order = gateOrder(models, PIN_MODEL);
  say(
    `minting ${COUNT} account(s), conc ${CONC}, ${exits.length} exit(s), ` +
      `gate ${order.map((m) => `${m.name}[${m.groups[0] || '-'}]`).join(' → ')}`
  );
  let cursor = 0;
  let ok = 0;
  let failed = 0;
  const workers = Array.from({ length: CONC }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= COUNT) return;
      const rec = await mintOne(exits, exits[i % exits.length], i, models);
      if (rec && rec.verdict === 'LIVE') ok++;
      else failed++;
      if (GAP_MS) await sleep(GAP_MS);
    }
  });
  await Promise.all(workers);
  await writeChain;
  say(`done: ${ok} live key(s), ${failed} failed — keys.txt`);
  if (!ok) process.exitCode = 1;
}

(async () => {
  const exits = loadExits();
  if (SCREEN_ONLY) return screen(exits);
  if (COLLECT_ONLY) return collect();
  const models = await loadPricing(exits, exits[0]);
  if (PROBE_ONLY) return probe(exits);
  if (VERIFY_ONLY) return verifyOnly(exits);
  return mint(exits, models);
})().catch((e) => {
  console.error('[fatal]', e.message);
  process.exit(1);
});
