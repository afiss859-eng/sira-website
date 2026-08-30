(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const menuToggle = $('.menu-toggle');
  const nav = $('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const save = (key, payload) => {
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ ...payload, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
  };

  const contact = $('#contact-form');
  if (contact) {
    contact.addEventListener('submit', async e => {
      e.preventDefault();
      if (!contact.checkValidity()) { contact.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(contact).entries());
      save('sira_messages', data);
      const note = $('.form-note', contact);
      const text = `Demande SIRA\nNom : ${data.name}\nE-mail : ${data.email}\nObjet : ${data.subject}\n\n${data.message}`;
      try { await navigator.clipboard.writeText(text); note.textContent = 'Message enregistré et copié. Il peut être transmis à l’équipe SIRA.'; }
      catch (_) { note.textContent = 'Message enregistré sur cet appareil. La messagerie serveur sera activée avec le backend officiel.'; }
      contact.reset();
    });
  }

  const join = $('#join-form');
  if (join) {
    join.addEventListener('submit', e => {
      e.preventDefault();
      if (!join.checkValidity()) { join.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(join).entries());
      save('sira_membership_requests', data);
      $('.form-note', join).textContent = 'Votre demande a été enregistrée sur cet appareil. L’équipe SIRA devra la traiter via le futur espace serveur.';
      join.reset();
    });
  }

  const admin = $('#admin-app');
  if (admin) {
    const render = () => {
      const messages = JSON.parse(localStorage.getItem('sira_messages') || '[]');
      const members = JSON.parse(localStorage.getItem('sira_membership_requests') || '[]');
      const m = $('#message-count'); const n = $('#member-count');
      if (m) m.textContent = messages.length; if (n) n.textContent = members.length;
      const box = $('#admin-list');
      if (box) box.innerHTML = [...members.map(x => `<article><b>Adhésion</b><h3>${escapeHtml(x.name || '')}</h3><p>${escapeHtml(x.email || '')} · ${escapeHtml(x.profile || '')}</p></article>`), ...messages.map(x => `<article><b>Message</b><h3>${escapeHtml(x.name || '')}</h3><p>${escapeHtml(x.email || '')} · ${escapeHtml(x.subject || '')}</p><p>${escapeHtml(x.message || '')}</p></article>`)].join('') || '<p>Aucune demande locale.</p>';
    };
    const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    $('#clear-admin')?.addEventListener('click', () => { if (confirm('Effacer les demandes enregistrées sur cet appareil ?')) { localStorage.removeItem('sira_messages'); localStorage.removeItem('sira_membership_requests'); render(); } });
    render();
  }
})();
