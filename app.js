(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const readJSON = (key, fallback = []) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const save = (key, payload) => { const list = readJSON(key, []); list.push({ ...payload, createdAt: new Date().toISOString() }); return writeJSON(key, list); };

  const menuToggle = $('.menu-toggle');
  const nav = $('.nav');
  const closeMenu = () => { if (!menuToggle || !nav) return; nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Ouvrir le menu'); menuToggle.textContent = '☰'; };
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open', open); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu'); menuToggle.textContent = open ? '×' : '☰'; });
    $$('.nav a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    document.addEventListener('click', event => { if (nav.classList.contains('open') && !nav.contains(event.target) && event.target !== menuToggle) closeMenu(); });
  }
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 }) : null;
  $$('.section:not(.hero), .cards article, .project-card, .news-grid article, .impact-list div').forEach(element => { element.classList.add('reveal'); if (observer) observer.observe(element); else element.classList.add('visible'); });

  const showFormMessage = (form, message, type = 'info') => { const note = $('.form-note', form); if (note) { note.textContent = message; note.dataset.state = type; } };

  async function sendRequest(form, payload, localKey) {
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Erreur serveur');
      showFormMessage(form, 'Votre demande a bien été envoyée à SIRA. Vous pouvez aussi répondre au message reçu depuis votre adresse e-mail.', 'success');
      form.reset();
      return true;
    } catch (error) {
      console.error(error);
      const saved = save(localKey, payload);
      showFormMessage(form, saved ? 'Le serveur de messagerie n’est pas encore configuré. Votre demande a été conservée localement en attendant.' : 'Impossible d’envoyer ou de conserver la demande.', saved ? 'info' : 'error');
      return false;
    }
  }

  const contact = $('#contact-form');
  if (contact) contact.addEventListener('submit', async event => {
    event.preventDefault();
    if (!contact.checkValidity()) return contact.reportValidity();
    const data = Object.fromEntries(new FormData(contact).entries());
    await sendRequest(contact, data, 'sira_messages');
  });

  const join = $('#join-form');
  if (join) join.addEventListener('submit', async event => {
    event.preventDefault();
    if (!join.checkValidity()) return join.reportValidity();
    const data = Object.fromEntries(new FormData(join).entries());
    await sendRequest(join, { ...data, subject: `Demande d’adhésion — ${data.profile || 'Participation'}`, message: `Profil : ${data.profile || ''}\nTéléphone : ${data.phone || ''}\n\nCompétences / motivation :\n${data.message || ''}` }, 'sira_membership_requests');
  });

  const admin = $('#admin-app');
  if (admin) {
    const escapeHTML = value => String(value ?? '').replace(/[&<>\"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' }[character]));
    const render = () => {
      const messages = readJSON('sira_messages', []), members = readJSON('sira_membership_requests', []);
      const messageCount = $('#message-count'), memberCount = $('#member-count'), box = $('#admin-list');
      if (messageCount) messageCount.textContent = messages.length;
      if (memberCount) memberCount.textContent = members.length;
      if (!box) return;
      const memberCards = members.map(item => `<article><b>ADHÉSION</b><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.email)} · ${escapeHTML(item.profile)}</p><small>${escapeHTML(item.createdAt)}</small></article>`);
      const messageCards = messages.map(item => `<article><b>MESSAGE</b><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.email)} · ${escapeHTML(item.subject)}</p><p>${escapeHTML(item.message)}</p><small>${escapeHTML(item.createdAt)}</small></article>`);
      box.innerHTML = [...memberCards, ...messageCards].join('') || '<p>Aucune demande locale.</p>';
    };
    $('#clear-admin')?.addEventListener('click', () => { if (!confirm('Effacer les demandes locales de cet appareil ?')) return; localStorage.removeItem('sira_messages'); localStorage.removeItem('sira_membership_requests'); render(); });
    render();
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
