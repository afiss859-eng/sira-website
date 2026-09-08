import crypto from 'node:crypto';

const REPO = 'afiss859-eng/sira-website';
const STORE_PATH = 'data/manager-control.json';
const EMAIL = process.env.ADMIN_EMAIL || 'sawadogoafis125@gmail.com';

function adminAuthorized(req) {
  const header = String(req.headers?.authorization || '');
  if (!header.startsWith('Basic ') || !process.env.ADMIN_PASSWORD) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    return sep > 0 && decoded.slice(0, sep) === EMAIL && decoded.slice(sep + 1) === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function makeLicenseKey() {
  const raw = crypto.randomBytes(12).toString('hex').toUpperCase();
  return `SIRA-MGR-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}
function makeApiKey(prefix='SIRA') {
  const raw = crypto.randomBytes(30).toString('base64url');
  return `${prefix}_${raw}`;
}
function githubHeaders() {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN manquant.');
  return { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}
function storeUrl() { return `https://api.github.com/repos/${REPO}/contents/${STORE_PATH}`; }

async function readStore() {
  const r = await fetch(storeUrl(), { headers: githubHeaders(), cache: 'no-store' });
  if (r.status === 404) return { data: { version: 2, licenses: [], apiKeys: [] }, sha: null };
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  const file = await r.json();
  return { data: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), sha: file.sha };
}
async function writeStore(data, sha, message) {
  const body = { message, content: Buffer.from(JSON.stringify(data, null, 2) + '\n', 'utf8').toString('base64'), branch: 'main' };
  if (sha) body.sha = sha;
  const r = await fetch(storeUrl(), { method: 'PUT', headers: { ...githubHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`);
}
function normalize(data) {
  return {
    version: 2,
    licenses: Array.isArray(data?.licenses) ? data.licenses : [],
    apiKeys: Array.isArray(data?.apiKeys) ? data.apiKeys : []
  };
}

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'overview');

    if (action === 'validate' && req.method === 'POST') {
      const { key, deviceId, appVersion } = req.body || {};
      const licenseKey = String(key || '').trim();
      const did = String(deviceId || '').trim();
      if (!licenseKey || !did) return res.status(400).json({ valid: false, error: 'Clé ou identifiant appareil manquant.' });
      const current = await readStore();
      const data = normalize(current.data);
      const lic = data.licenses.find(x => x.licenseKey === licenseKey);
      if (!lic) return res.status(401).json({ valid: false, error: 'Clé de licence inconnue.' });
      if (lic.expiresAt && new Date(lic.expiresAt).getTime() < Date.now()) return res.status(401).json({ valid: false, expired: true, error: 'Licence expirée.' });
      if (lic.status !== 'ACTIVE') return res.status(401).json({ valid: false, revoked: true, error: `Licence ${String(lic.status).toLowerCase()}.` });

      const devices = Array.isArray(lic.deviceIds) ? lic.deviceIds : [];
      if (!devices.includes(did)) {
        if (devices.length >= Math.max(1, Number(lic.maxUsers) || 1)) return res.status(401).json({ valid: false, error: 'Quota d’appareils atteint.' });
        lic.deviceIds = [...devices, did];
        lic.lastSeenAt = new Date().toISOString();
        lic.lastAppVersion = String(appVersion || '');
        await writeStore(data, current.sha, `manager: register device ${did} on ${licenseKey}`);
      }

      return res.status(200).json({
        valid: true,
        license: {
          key: lic.licenseKey,
          merchantName: lic.merchantName,
          shopName: lic.shopName,
          maxUsers: lic.maxUsers,
          usedCount: (lic.deviceIds || []).length,
          status: lic.status,
          expiresAt: lic.expiresAt || null,
          themeColor: lic.themeColor || '#007AFF',
          appName: lic.appName || 'SIRA Business',
          logoUrl: lic.logoUrl || '',
          bgUrl: lic.bgUrl || '',
          cguText: lic.cguText || '',
          privacyText: lic.privacyText || ''
        },
        commands: Array.isArray(lic.commands) ? lic.commands : []
      });
    }

    if (!adminAuthorized(req)) return res.status(401).json({ ok: false, error: 'Authentification administrateur requise.' });

    const current = await readStore();
    const data = normalize(current.data);

    if (req.method === 'GET') {
      const licenses = data.licenses.map(x => ({ ...x, deviceIds: Array.isArray(x.deviceIds) ? x.deviceIds : [], commands: Array.isArray(x.commands) ? x.commands : [] }));
      const devices = licenses.flatMap(x => (x.deviceIds || []).map(deviceId => ({ deviceId, licenseKey: x.licenseKey, merchantName: x.merchantName, shopName: x.shopName, appVersion: x.lastAppVersion || '', status: x.status, lastSeen: x.lastSeenAt || null })));
      const commands = licenses.flatMap(x => (x.commands || []).map(c => ({ ...c, licenseKey: x.licenseKey })));
      const apiKeys = data.apiKeys.map(k => ({ id: k.id, label: k.label, prefix: k.prefix, scopes: k.scopes, status: k.status, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt || null }));
      return res.status(200).json({ ok: true, counts: { licenses: licenses.length, devices: devices.length, pendingCommands: commands.length, apiKeys: apiKeys.filter(k => k.status === 'ACTIVE').length }, licenses, devices, commands, apiKeys });
    }

    if (action === 'create-license') {
      const key = makeLicenseKey();
      data.licenses.unshift({ licenseKey: key, merchantName: String(req.body?.merchantName || 'Commerce SIRA').slice(0, 160), shopName: String(req.body?.shopName || 'SIRA Business').slice(0, 160), status: 'ACTIVE', maxUsers: Math.max(1, Math.min(50, Number(req.body?.maxUsers) || 1)), expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt).toISOString() : null, createdAt: new Date().toISOString(), deviceIds: [], commands: [] });
      await writeStore(data, current.sha, `manager: create license ${key}`);
      return res.status(201).json({ ok: true, licenseKey: key });
    }

    if (action === 'set-license-status') {
      const status = ['ACTIVE', 'SUSPENDED', 'REVOKED'].includes(req.body?.status) ? req.body.status : null;
      const key = String(req.body?.licenseKey || '');
      const lic = data.licenses.find(x => x.licenseKey === key);
      if (!status || !lic) return res.status(400).json({ ok: false, error: 'Licence ou statut invalide.' });
      lic.status = status;
      lic.updatedAt = new Date().toISOString();
      await writeStore(data, current.sha, `manager: set ${key} status ${status}`);
      return res.status(200).json({ ok: true, status });
    }

    if (action === 'command') {
      const deviceId = String(req.body?.deviceId || '');
      const command = ['LOCK_APP', 'FORCE_SYNC', 'SHOW_MESSAGE'].includes(req.body?.command) ? req.body.command : null;
      const lic = data.licenses.find(x => Array.isArray(x.deviceIds) && x.deviceIds.includes(deviceId));
      if (!deviceId || !command || !lic) return res.status(400).json({ ok: false, error: 'Appareil ou commande invalide.' });
      lic.commands = Array.isArray(lic.commands) ? lic.commands : [];
      lic.commands.push({ id: hash(`${deviceId}:${Date.now()}:${command}`).slice(0, 16), command, payload: req.body?.payload || {}, createdAt: new Date().toISOString() });
      if (command === 'LOCK_APP') lic.status = 'SUSPENDED';
      await writeStore(data, current.sha, `manager: ${command} for ${deviceId}`);
      return res.status(201).json({ ok: true });
    }

    if (action === 'create-api-key') {
      const key = makeApiKey('SIRA');
      const label = String(req.body?.label || 'SIRA Manager').slice(0, 120);
      const scopes = Array.isArray(req.body?.scopes) ? req.body.scopes.filter(Boolean).slice(0, 20) : ['manager:read'];
      const id = crypto.randomBytes(8).toString('hex');
      data.apiKeys.unshift({ id, label, prefix: key.slice(0, 12), keyHash: hash(key), scopes, status: 'ACTIVE', createdAt: new Date().toISOString(), lastUsedAt: null });
      await writeStore(data, current.sha, `manager: create api key ${label}`);
      return res.status(201).json({ ok: true, apiKey: key, id, label, scopes, warning: 'Cette clé est affichée une seule fois. Conservez-la dans un coffre de secrets.' });
    }

    if (action === 'revoke-api-key') {
      const id = String(req.body?.id || '');
      const item = data.apiKeys.find(x => x.id === id);
      if (!item) return res.status(404).json({ ok: false, error: 'Clé API introuvable.' });
      item.status = 'REVOKED';
      item.revokedAt = new Date().toISOString();
      await writeStore(data, current.sha, `manager: revoke api key ${id}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'Action inconnue.' });
  } catch (error) {
    console.error('SIRA manager control error', error);
    return res.status(500).json({ ok: false, error: 'Erreur du centre de contrôle.' });
  }
}
