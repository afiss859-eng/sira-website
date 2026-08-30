(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const safeJSON=(key,fallback=[])=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
  const save=(key,payload)=>{const list=safeJSON(key);list.push({...payload,createdAt:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(list));};

  const menuToggle=$('.menu-toggle'),nav=$('.nav');
  if(menuToggle&&nav){menuToggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.textContent=open?'×':'☰';});$$('.nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='☰';}));}
  $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12}):null;
  $$('section:not(.hero),.cards article,.project-card,.news-grid article,.impact-list div').forEach(el=>{el.classList.add('reveal');if(observer)observer.observe(el);else el.classList.add('visible')});

  const contact=$('#contact-form');
  if(contact){contact.addEventListener('submit',e=>{e.preventDefault();if(!contact.checkValidity()){contact.reportValidity();return}const data=Object.fromEntries(new FormData(contact).entries());save('sira_messages',data);const note=$('.form-note',contact);note.textContent='Votre demande a été enregistrée sur cet appareil. Le raccordement à la messagerie serveur sera effectué avec le backend officiel de SIRA.';contact.reset();});}

  const join=$('#join-form');
  if(join){join.addEventListener('submit',e=>{e.preventDefault();if(!join.checkValidity()){join.reportValidity();return}const data=Object.fromEntries(new FormData(join).entries());save('sira_membership_requests',data);const note=$('.form-note',join);note.textContent='Demande enregistrée localement. L’équipe SIRA pourra la traiter lorsque le backend sera connecté.';join.reset();});}

  const admin=$('#admin-app');
  if(admin){const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));const render=()=>{const messages=safeJSON('sira_messages'),members=safeJSON('sira_membership_requests');const mc=$('#message-count'),nc=$('#member-count');if(mc)mc.textContent=messages.length;if(nc)nc.textContent=members.length;const box=$('#admin-list');if(box)box.innerHTML=[...members.map(x=>`<article><b>ADHÉSION</b><h3>${escapeHTML(x.name)}</h3><p>${escapeHTML(x.email)} · ${escapeHTML(x.profile)}</p><small>${escapeHTML(x.createdAt)}</small></article>`),...messages.map(x=>`<article><b>MESSAGE</b><h3>${escapeHTML(x.name)}</h3><p>${escapeHTML(x.email)} · ${escapeHTML(x.subject)}</p><p>${escapeHTML(x.message)}</p><small>${escapeHTML(x.createdAt)}</small></article>`)].join('')||'<p>Aucune demande locale.</p>';};$('#clear-admin')?.addEventListener('click',()=>{if(confirm('Effacer les demandes locales de cet appareil ?')){localStorage.removeItem('sira_messages');localStorage.removeItem('sira_membership_requests');render();}});render();}

  const install=()=>{if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});};install();
})();