(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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

  async function sendRequest(form, payload) {
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'Erreur serveur');
      showFormMessage(form, 'Votre demande a bien été envoyée à SIRA. Vous pouvez répondre au message depuis votre adresse e-mail.', 'success');
      form.reset();
      return true;
    } catch (error) {
      console.error('SIRA form error:', error);
      const message = error?.message || '';
      if (message.includes('messagerie') || message.includes('configurée')) {
        showFormMessage(form, 'L’envoi e-mail n’est pas encore activé sur le serveur SIRA. Aucun envoi n’a été effectué. Veuillez réessayer après la configuration de la messagerie.', 'error');
      } else {
        showFormMessage(form, 'Impossible d’envoyer la demande pour le moment. Veuillez réessayer.', 'error');
      }
      return false;
    }
  }

  const contact = $('#contact-form');
  if (contact) contact.addEventListener('submit', async event => {
    event.preventDefault();
    if (!contact.checkValidity()) return contact.reportValidity();
    const data = Object.fromEntries(new FormData(contact).entries());
    await sendRequest(contact, data);
  });

  const join = $('#join-form');
  if (join) join.addEventListener('submit', async event => {
    event.preventDefault();
    if (!join.checkValidity()) return join.reportValidity();
    const data = Object.fromEntries(new FormData(join).entries());
    await sendRequest(join, { ...data, subject: `Demande d’adhésion — ${data.profile || 'Participation'}`, message: `Profil : ${data.profile || ''}\nTéléphone : ${data.phone || ''}\n\nCompétences / motivation :\n${data.message || ''}` });
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
