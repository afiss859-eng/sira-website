const REPO = 'afiss859-eng/sira-website';
const CONTENT_PATH = 'data/site-content.json';
const INDEX_PATH = 'index.html';
const ADMIN_EMAIL = 'sawadogoafis125@gmail.com';

export default async function handler(req, res) {
  if (!process.env.GITHUB_TOKEN || !process.env.ADMIN_PASSWORD) return res.status(500).json({ ok: false, error: 'Administration non configurée sur Vercel.' });
  if (!authorized(req)) return res.status(401).setHeader('WWW-Authenticate', 'Basic realm="SIRA Administration"').json({ ok: false, error: 'Identifiants administrateur invalides.' });

  try {
    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const contentUrl = `https://api.github.com/repos/${REPO}/contents/${CONTENT_PATH}`;
    if (req.method === 'GET') {
      const r = await fetch(contentUrl, { headers });
      if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
      const file = await r.json();
      return res.status(200).json({ ok: true, content: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) });
    }
    if (req.method !== 'PUT') return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });

    const body = req.body || {};
    const content = { newsTitle: clean(body.newsTitle), newsText: clean(body.newsText), projectTitle: clean(body.projectTitle), projectText: clean(body.projectText), updatedAt: new Date().toISOString() };

    const contentFile = await getFile(contentUrl, headers);
    await putFile(contentUrl, headers, JSON.stringify(content, null, 2) + '\n', contentFile.sha, 'content: update SIRA content data');

    // Also update the public HTML so the published text is visible immediately after Vercel rebuilds.
    const indexUrl = `https://api.github.com/repos/${REPO}/contents/${INDEX_PATH}`;
    const indexFile = await getFile(indexUrl, headers);
    let html = Buffer.from(indexFile.content, 'base64').toString('utf8');
    html = html.replace('<h3>Les nouvelles de SIRA</h3>', `<h3>${escapeHtml(content.newsTitle)}</h3>`);
    html = html.replace('<p>Les publications officielles seront ajoutées ici au fur et à mesure des activités.</p>', `<p>${escapeHtml(content.newsText)}</p>`);
    html = html.replace('<h3>Construire les opportunités</h3>', `<h3>${escapeHtml(content.projectTitle)}</h3>`);
    html = html.replace('<p>Une vitrine de programme prête à recevoir les détails, visuels et résultats validés par l’association.</p>', `<p>${escapeHtml(content.projectText)}</p>`);
    await putFile(indexUrl, headers, html, indexFile.sha, 'content: publish SIRA public content');

    return res.status(200).json({ ok: true, content });
  } catch (error) {
    console.error('SIRA admin error:', error);
    return res.status(500).json({ ok: false, error: 'Erreur pendant l’enregistrement du contenu.' });
  }
}

async function getFile(url, headers) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`GitHub file ${r.status}`);
  return r.json();
}

async function putFile(url, headers, text, sha, message) {
  const r = await fetch(url, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ message, content: Buffer.from(text, 'utf8').toString('base64'), sha, branch: 'main' }) });
  if (!r.ok) throw new Error(`GitHub PUT ${r.status}: ${await r.text()}`);
  return r.json();
}

function clean(value) { return String(value ?? '').trim().slice(0, 5000); }
function escapeHtml(value) { return String(value).replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[c])); }
function authorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    return separator > 0 && decoded.slice(0, separator) === ADMIN_EMAIL && decoded.slice(separator + 1) === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}
