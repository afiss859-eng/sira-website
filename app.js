(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
    }));
  }

  const form = document.querySelector('#contact-form');
  if (form) {
    const note = form.querySelector('.form-note');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = new FormData(form);
      const text = `Demande SIRA\n\nNom : ${data.get('name')}\nE-mail : ${data.get('email')}\nObjet : ${data.get('subject')}\n\n${data.get('message')}`;
      try {
        await navigator.clipboard.writeText(text);
        note.textContent = 'Message copié. Vous pouvez maintenant le transmettre à l’équipe SIRA.';
      } catch (_) {
        note.textContent = 'Votre message est préparé. La messagerie officielle devra être configurée pour l’envoi en ligne.';
      }
      form.reset();
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
