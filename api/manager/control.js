import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

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

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function makeLicenseKey() {
  const raw = crypto.randomBytes(12).toString('hex').toUpperCase();
  return `SIRA-MGR-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function makeDeviceToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function ensureSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS sira_manager_licenses (
    id BIGSERIAL PRIMARY KEY,
    license_key TEXT UNIQUE NOT NULL,
    merchant_name TEXT NOT NULL DEFAULT 'Commerce SIRA',
    shop_name TEXT NOT NULL DEFAULT 'SIRA Business',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    max_users INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS sira_manager_devices (
    device_id TEXT PRIMARY KEY,
    license_key TEXT NOT NULL REFERENCES sira_manager_licenses(license_key) ON DELETE CASCADE,
    device_token_hash TEXT UNIQUE NOT NULL,
    app_version TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS sira_manager_commands (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    command TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ NULL
  )`;
}

async function validateDevice(sql, key, deviceId, appVersion = '') {
  const rows = await sql`SELECT license_key, merchant_name, shop_name, status, max_users, expires_at FROM sira_manager_licenses WHERE license_key=${key} LIMIT 1`;
  if (!rows.length) return { valid: false, error: 'Clé de licence inconnue.' };
  const lic = rows[0];
  const expired = lic.expires_at && new Date(lic.expires_at).getTime() < Date.now();
  if (expired) return { valid: false, expired: true, error: 'Licence expirée.' };
  if (lic.status !== 'ACTIVE') return { valid: false, revoked: true, error: `Licence ${lic.status.toLowerCase()}.` };
  if (!deviceId) return { valid: false, error: 'Identifiant appareil manquant.' };

  const existing = await sql`SELECT device_id, device_token_hash FROM sira_manager_devices WHERE device_id=${deviceId} LIMIT 1`;
  let token;
  if (existing.length) {
    const sameLicense = existing[0].license_key === key;
    if (!sameLicense) return { valid: false, error: 'Cet appareil est déjà lié à une autre licence.' };
    token = null;
    await sql`UPDATE sira_manager_devices SET app_version=${appVersion}, status='ACTIVE', last_seen=NOW() WHERE device_id=${deviceId}`;
  } else {
    const countRows = await sql`SELECT COUNT(*)::int AS count FROM sira_manager_devices WHERE license_key=${key} AND status='ACTIVE'`;
    if (countRows[0].count >= lic.max_users) return { valid: false, error: 'Quota d’appareils de la licence atteint.' };
    token = makeDeviceToken();
    await sql`INSERT INTO sira_manager_devices(device_id, license_key, device_token_hash, app_version) VALUES (${deviceId}, ${key}, ${hash(token)}, ${appVersion})`;
  }

  const commands = await sql`SELECT id, command, payload FROM sira_manager_commands WHERE device_id=${deviceId} AND status='PENDING' ORDER BY id ASC LIMIT 20`;
  return {
    valid: true,
    license: {
      key: lic.license_key,
      merchantName: lic.merchant_name,
      shopName: lic.shop_name,
      maxUsers: lic.max_users,
      usedCount: 1,
      status: lic.status,
      expiresAt: lic.expires_at,
      deviceToken: token || undefined,
      remoteMessage: null
    },
    commands
  };
}

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) return res.status(503).json({ ok: false, error: 'DATABASE_URL manquant sur Vercel.' });
  const sql = neon(process.env.DATABASE_URL);
  try {
    await ensureSchema(sql);
    const action = String(req.query?.action || 'overview');

    if (action === 'validate' && req.method === 'POST') {
      const { key, deviceId, appVersion } = req.body || {};
      const result = await validateDevice(sql, String(key || '').trim(), String(deviceId || '').trim(), String(appVersion || '').trim());
      return res.status(result.valid ? 200 : 401).json(result);
    }

    if (action === 'heartbeat' && req.method === 'POST') {
      const token = String(req.headers['x-sira-device-token'] || '');
      if (!token) return res.status(401).json({ ok: false, error: 'Jeton appareil manquant.' });
      const device = await sql`SELECT device_id, license_key, status FROM sira_manager_devices WHERE device_token_hash=${hash(token)} LIMIT 1`;
      if (!device.length || device[0].status !== 'ACTIVE') return res.status(401).json({ ok: false, blocked: true, error: 'Appareil bloqué.' });
      const { appVersion = '' } = req.body || {};
      await sql`UPDATE sira_manager_devices SET last_seen=NOW(), app_version=${String(appVersion)} WHERE device_id=${device[0].device_id}`;
      const lic = await sql`SELECT status, expires_at FROM sira_manager_licenses WHERE license_key=${device[0].license_key} LIMIT 1`;
      if (!lic.length || lic[0].status !== 'ACTIVE') return res.status(401).json({ ok: false, blocked: true, error: 'Licence désactivée.' });
      const commands = await sql`SELECT id, command, payload FROM sira_manager_commands WHERE device_id=${device[0].device_id} AND status='PENDING' ORDER BY id ASC LIMIT 20`;
      return res.status(200).json({ ok: true, blocked: false, nextPollSeconds: 60, commands });
    }

    if (!adminAuthorized(req)) return res.status(401).json({ ok: false, error: 'Authentification administrateur requise.' });

    if (req.method === 'GET') {
      const licenses = await sql`SELECT license_key AS "licenseKey", merchant_name AS "merchantName", shop_name AS "shopName", status, max_users AS "maxUsers", created_at AS "createdAt", expires_at AS "expiresAt" FROM sira_manager_licenses ORDER BY created_at DESC`;
      const devices = await sql`SELECT device_id AS "deviceId", license_key AS "licenseKey", app_version AS "appVersion", status, last_seen AS "lastSeen", created_at AS "createdAt" FROM sira_manager_devices ORDER BY last_seen DESC`;
      const commands = await sql`SELECT id, device_id AS "deviceId", command, payload, status, created_at AS "createdAt", delivered_at AS "deliveredAt" FROM sira_manager_commands ORDER BY created_at DESC LIMIT 100`;
      return res.status(200).json({ ok: true, counts: { licenses: licenses.length, devices: devices.length, pendingCommands: commands.filter(c => c.status === 'PENDING').length }, licenses, devices, commands });
    }

    const body = req.body || {};
    if (action === 'create-license') {
      const key = makeLicenseKey();
      await sql`INSERT INTO sira_manager_licenses(license_key, merchant_name, shop_name, max_users, expires_at) VALUES (${key}, ${String(body.merchantName || 'Commerce SIRA').slice(0,160)}, ${String(body.shopName || 'SIRA Business').slice(0,160)}, ${Math.max(1, Math.min(50, Number(body.maxUsers) || 1))}, ${body.expiresAt ? new Date(body.expiresAt).toISOString() : null})`;
      return res.status(201).json({ ok: true, licenseKey: key });
    }

    if (action === 'set-license-status') {
      const status = ['ACTIVE', 'SUSPENDED', 'REVOKED'].includes(body.status) ? body.status : null;
      if (!status || !body.licenseKey) return res.status(400).json({ ok: false, error: 'Statut ou licence invalide.' });
      await sql`UPDATE sira_manager_licenses SET status=${status}, updated_at=NOW() WHERE license_key=${String(body.licenseKey)}`;
      return res.status(200).json({ ok: true, status });
    }

    if (action === 'command') {
      const deviceId = String(body.deviceId || '');
      const command = ['LOCK_APP', 'FORCE_SYNC', 'SHOW_MESSAGE'].includes(body.command) ? body.command : null;
      if (!deviceId || !command) return res.status(400).json({ ok: false, error: 'Commande invalide.' });
      const inserted = await sql`INSERT INTO sira_manager_commands(device_id, command, payload) VALUES (${deviceId}, ${command}, ${JSON.stringify(body.payload || {})}::jsonb) RETURNING id`;
      return res.status(201).json({ ok: true, id: inserted[0].id });
    }

    if (action === 'ack') {
      const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter(Number.isInteger) : [];
      if (!ids.length) return res.status(400).json({ ok: false, error: 'Aucun identifiant de commande.' });
      await sql`UPDATE sira_manager_commands SET status='DONE', delivered_at=NOW() WHERE id = ANY(${ids})`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: 'Action inconnue.' });
  } catch (error) {
    console.error('SIRA manager control error', error);
    return res.status(500).json({ ok: false, error: 'Erreur du centre de contrôle.' });
  }
}
