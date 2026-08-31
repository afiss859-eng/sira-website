const REPO = 'afiss859-eng/sira-website';
const PATH = 'data/site-content.json';
const ADMIN_EMAIL = 'sawadogoafis125@gmail.com';

export default async function handler(req, res) {
  if (!process.env.GITHUB_TOKEN || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: 'Administration non configurée sur Vercel.' });
  }

  if (!authorized(req)) return res.status(401).setHeader('WWW-Authenticate', 'Basic realm="SIRA Administration"').json({ ok: false, error: 'Identifiants administrateur invalides.' });

  try {
    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const url = `https://api.github.com/repos/${REPO}/contents/${PATH}`;

    if (req.method === 'GET') {
      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
      const file = await r.json();
      const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
      return res.status(200).json({ ok: true, content });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const content = { newsTitle: String(body.newsTitle || ''), newsText: String(body.newsText || ''), projectTitle: String(body.projectTitle || ''), projectText: String(body.projectText || ''), updatedAt: new Date().toISOString() };
      const current = await fetch(url, { headers });
      if (!current.ok) throw new Error(`GitHub current ${current.status}`);
      const currentFile = await current.json();
      const encoded = Buffer.from(JSON.stringify(content, null, 2) + '\n', 'utf8').toString('base64');
      const update = await fetch(url, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'content: update SIRA site content', content: encoded, sha: currentFile.sha, branch: 'main' }) });
      if (!update.ok) throw new Error(`GitHub PUT ${update.status}: ${await update.text()}`);
      return res.status(200).json({ ok: true, content });
    }

    return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });
  } catch (error) {
    console.error('SIRA admin error:', error);
    return res.status(500).json({ ok: false, error: 'Erreur pendant l’enregistrement du contenu.' });
  }
}

function authorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    const email = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return email === ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}
