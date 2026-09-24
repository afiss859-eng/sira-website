(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const toast = $('#toast');
  let toastTimer;
  const showToast = message => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  const stories = {
    hero: {title:'Le Burkina Faso au cœur de l’actualité nationale et régionale', category:'BURKINA FASO'},
    transition: {title:'Transition : cap sur la souveraineté et le développement durable', category:'BURKINA FASO'},
    ua: {title:'Afrique : les dirigeants multiplient les échanges autour des priorités régionales', category:'AFRIQUE'},
    economie: {title:'Croissance économique : les perspectives régionales au centre des débats', category:'ÉCONOMIE'},
    culture: {title:'Culture : le cinéma africain met en lumière créativité et innovation', category:'CULTURE'},
    edu: {title:'Éducation : de nouvelles infrastructures renforcent l’offre scolaire', category:'SOCIÉTÉ'},
    sport: {title:'Football : les regards tournés vers les prochaines échéances', category:'SPORT'},
    tech: {title:'Innovation : de jeunes Burkinabè développent des solutions numériques', category:'TECH'}
  };

  $$('[data-story]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.story;
      if (id && stories[id]) {
        location.href = `article.html?story=${encodeURIComponent(id)}`;
      }
    });
  });

  const menuToggle = $('.menu-toggle');
  const mobileLinks = $$('.main-nav a');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const current = document.body.classList.toggle('mobile-nav-open');
      menuToggle.setAttribute('aria-expanded', String(current));
      menuToggle.textContent = current ? '×' : '☰';
      const nav = $('.main-nav');
      if (nav) nav.style.display = current ? 'block' : '';
    });
    mobileLinks.forEach(link => link.addEventListener('click', () => {
      document.body.classList.remove('mobile-nav-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
      const nav = $('.main-nav');
      if (nav && window.innerWidth <= 680) nav.style.display = '';
    }));
  }

  const searchInput = $('#site-search');
  const searchButton = $('#search-button');
  const doSearch = () => {
    const q = (searchInput?.value || '').trim();
    if (!q) return showToast('Écrivez un mot-clé à rechercher.');
    const match = Object.entries(stories).find(([, s]) => (s.title + ' ' + s.category).toLowerCase().includes(q.toLowerCase()));
    location.href = `article.html?q=${encodeURIComponent(q)}${match ? `&story=${encodeURIComponent(match[0])}` : ''}`;
  };
  searchButton?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  $('#newsletter-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    if (!email) return;
    localStorage.setItem('sira_newsletter_email', String(email));
    e.currentTarget.reset();
    showToast('Merci. Votre demande d’abonnement a été enregistrée pour la démo.');
  });

  const modal = $('#player-modal');
  const title = $('#player-title');
  const copy = $('#player-copy');
  const action = $('#player-action');
  const openPlayer = kind => {
    if (!modal) return;
    const isTV = kind === 'tv';
    title.textContent = isTV ? 'SIRA TV' : 'SIRA FM 88.0';
    copy.textContent = isTV
      ? 'Lecteur vidéo de démonstration : branchez le flux ou le lecteur réel lorsque SIRA TV est configurée.'
      : 'Lecteur radio de démonstration : branchez l’URL du flux audio lorsque SIRA FM est configurée.';
    action.textContent = isTV ? '▶ Ouvrir le direct' : '▶ Lancer la radio';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closePlayer = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  };
  $$('[data-player]').forEach(el => el.addEventListener('click', () => openPlayer(el.dataset.player)));
  $$('[data-close-player]').forEach(el => el.addEventListener('click', closePlayer));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });
  action?.addEventListener('click', () => showToast('Le flux réel sera branché ici lors de la configuration du direct.'));

  const time = $('#breaking-time');
  if (time) {
    const minutes = 1;
    time.textContent = `il y a ${minutes} min`;
  }
})();