import crypto from 'node:crypto';

const REPO = 'afiss859-eng/sira-website';
const STORE_PATH = 'data/manager-control.json';
const BASE = (process.env.AI_MODEL_BASE_URL || 'https://aimodelapi.onrender.com/v1').replace(/\/$/, '');
const DEFAULT_MODEL = process.env.SIRA_COPILOT_MODEL || 'dev-x';

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function githubHeaders() {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN manquant.');
  return { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}
function storeUrl() { return `https://api.github.com/repos/${REPO}/contents/${STORE_PATH}`; }
async function readStore() {
  const r = await fetch(storeUrl(), { headers: githubHeaders(), cache: 'no-store' });
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  const file = await r.json();
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
}
function normalizeModel(value) {
  const allowed = ['BOUTIQUE', 'NATIONAL', 'INTERNATIONAL'];
  return allowed.includes(String(value)) ? String(value) : 'BOUTIQUE';
}
function capabilities(model) {
  const base = {
    barcode: true, stock: true, sales: true, purchases: true, customers: true, suppliers: true,
    proforma: true, offline: true, bluetoothReceipt: true,
    multiStore: false, multiWarehouse: false, locations: false, transfers: false,
    lots: false, serialNumbers: false, expiry: false, fifo: false, fefo: false,
    replenishment: false, forecasting: false, international: false, multiCurrency: false, landedCost: false
  };
  if (model === 'NATIONAL' || model === 'INTERNATIONAL') Object.assign(base, {
    multiStore: true, multiWarehouse: true, locations: true, transfers: true,
    lots: true, serialNumbers: true, expiry: true, fifo: true, fefo: true,
    replenishment: true, forecasting: true
  });
  if (model === 'INTERNATIONAL') Object.assign(base, { international: true, multiCurrency: true, landedCost: true });
  return base;
}
function findLicense(data, key, deviceId) {
  const licenses = Array.isArray(data?.licenses) ? data.licenses : [];
  const lic = licenses.find(x => x.licenseKey === String(key || '').trim());
  if (!lic) return { error: 'Licence inconnue.' };
  if (lic.status !== 'ACTIVE') return { error: `Licence ${String(lic.status).toLowerCase()}.` };
  if (lic.expiresAt && new Date(lic.expiresAt).getTime() < Date.now()) return { error: 'Licence expirée.' };
  const devices = Array.isArray(lic.deviceIds) ? lic.deviceIds : [];
  if (!devices.includes(String(deviceId || ''))) return { error: 'Appareil non autorisé pour cette licence.' };
  return { lic };
}
async function callAI(model, messages) {
  if (!process.env.AI_MODEL_API_KEY) throw new Error('AI_MODEL_API_KEY manquante sur le serveur.');
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AI_MODEL_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature: 0.2 })
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(data?.error?.message || data?.error || `Moteur IA HTTP ${r.status}`);
  return data;
}
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
    const { key, deviceId, query, context } = req.body || {};
    if (!key || !deviceId || !String(query || '').trim()) return res.status(400).json({ ok: false, error: 'key, deviceId et query sont requis.' });
    const store = await readStore();
    const auth = findLicense(store, key, deviceId);
    if (auth.error) return res.status(401).json({ ok: false, error: auth.error });

    const lic = auth.lic;
    const stockModel = normalizeModel(lic.stockModel);
    const selectedModel = String(lic.copilotModel || DEFAULT_MODEL);
    const featureSet = capabilities(stockModel);
    const safeContext = context && typeof context === 'object' ? context : {};
    const system = `Tu es SIRA Copilote, assistant de gestion commerciale. Modèle SIRA: ${stockModel}. Ne propose que des actions compatibles avec ces capacités: ${JSON.stringify(featureSet)}. Réponds en français simple, orienté décision, sans jargon ERP. N'invente aucun chiffre: utilise uniquement les données fournies. Pour une action sensible (commande, modification massive, suppression, ajustement de stock, changement de prix), demande une confirmation explicite. Fais des recommandations adaptées à un commerçant au Burkina Faso et aux montants en FCFA.`;
    const user = `Demande du commerçant: ${String(query).slice(0, 4000)}\nDonnées SIRA disponibles: ${JSON.stringify(safeContext).slice(0, 18000)}`;
    const result = await callAI(selectedModel, [{ role: 'system', content: system }, { role: 'user', content: user }]);
    const answer = result?.choices?.[0]?.message?.content;
    if (!answer) return res.status(502).json({ ok: false, error: 'Le moteur IA n’a pas retourné de réponse.' });
    return res.status(200).json({ ok: true, answer, model: selectedModel, stockModel, features: featureSet, traceId: hash(`${deviceId}:${Date.now()}:${query}`).slice(0, 16) });
  } catch (error) {
    console.error('SIRA Copilot error', error);
    return res.status(502).json({ ok: false, error: error.message || 'Copilote IA indisponible.' });
  }
}
