import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'sawadogoafis125@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Méthode non autorisée.' });

  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ ok: false, error: 'Nom, e-mail et message sont obligatoires.' });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ ok: false, error: 'La messagerie SIRA n’est pas encore configurée sur Vercel.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `SIRA — Site web <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[SIRA] ${subject || 'Nouvelle demande'} — ${name}`,
      text: `Nouvelle demande reçue depuis le site SIRA.\n\nNom : ${name}\nE-mail : ${email}\nSujet : ${subject || 'Information'}\n\nMessage :\n${message}`,
      html: `<h2>Nouvelle demande SIRA</h2><p><strong>Nom :</strong> ${escapeHtml(name)}</p><p><strong>E-mail :</strong> ${escapeHtml(email)}</p><p><strong>Sujet :</strong> ${escapeHtml(subject || 'Information')}</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
    });

    return res.status(200).json({ ok: true, message: 'Votre demande a bien été envoyée.' });
  } catch (error) {
    console.error('SIRA contact error:', error);
    return res.status(500).json({ ok: false, error: 'Impossible d’envoyer la demande pour le moment.' });
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[c]));
}
