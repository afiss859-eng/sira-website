const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', env: ['OPENAI_API_KEY'] },
  { id: 'cinetpay', label: 'CinetPay', env: ['CINETPAY_API_KEY', 'CINETPAY_SITE_ID'] },
  { id: 'paydunya', label: 'PayDunya', env: ['PAYDUNYA_MASTER_KEY', 'PAYDUNYA_PRIVATE_KEY', 'PAYDUNYA_PUBLIC_KEY', 'PAYDUNYA_TOKEN'] },
  { id: 'orange', label: 'Orange Money', env: ['ORANGE_MONEY_CLIENT_ID', 'ORANGE_MONEY_CLIENT_SECRET'] },
  { id: 'moov', label: 'Moov Money', env: ['MOOV_MONEY_CLIENT_ID', 'MOOV_MONEY_CLIENT_SECRET'] },
  { id: 'coris', label: 'Coris Money', env: ['CORIS_MONEY_CLIENT_ID', 'CORIS_MONEY_CLIENT_SECRET'] }
];

function adminAuthorized(req) {
  const header = String(req.headers?.authorization || '');
  const expectedEmail = process.env.ADMIN_EMAIL || 'sawadogoafis125@gmail.com';
  if (!header.startsWith('Basic ') || !process.env.ADMIN_PASSWORD) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    return sep > 0 && decoded.slice(0, sep) === expectedEmail && decoded.slice(sep + 1) === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
  if (!adminAuthorized(req)) return res.status(401).json({ ok: false, error: 'Authentification administrateur requise.' });

  const providers = PROVIDERS.map(p => {
    const configured = p.env.every(name => Boolean(process.env[name]));
    return { id: p.id, label: p.label, configured, missing: p.env.filter(name => !process.env[name]) };
  });

  return res.status(200).json({
    ok: true,
    checkedAt: new Date().toISOString(),
    providers,
    note: 'Aucune valeur secrète n’est retournée par cette API.'
  });
}
