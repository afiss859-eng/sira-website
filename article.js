(() => {
  const $ = s => document.querySelector(s);
  const stories = {
    hero:{category:'BURKINA FASO',title:'Le Burkina Faso au cœur de l’actualité nationale et régionale',date:'24 septembre 2026',views:'3.2K vues',cover:'hero'},
    transition:{category:'BURKINA FASO',title:'Transition : cap sur la souveraineté et le développement durable',date:'24 septembre 2026',views:'1.4K vues',cover:'bf'},
    ua:{category:'AFRIQUE',title:'Afrique : les dirigeants multiplient les échanges autour des priorités régionales',date:'24 septembre 2026',views:'980 vues',cover:'africa'},
    economie:{category:'ÉCONOMIE',title:'Croissance économique : les perspectives régionales au centre des débats',date:'24 septembre 2026',views:'760 vues',cover:'money'},
    culture:{category:'CULTURE',title:'Culture : le cinéma africain met en lumière créativité et innovation',date:'24 septembre 2026',views:'650 vues',cover:'culture'},
    edu:{category:'SOCIÉTÉ',title:'Éducation : de nouvelles infrastructures renforcent l’offre scolaire',date:'24 septembre 2026',views:'520 vues',cover:'edu'},
    sport:{category:'SPORT',title:'Football : les regards tournés vers les prochaines échéances',date:'24 septembre 2026',views:'980 vues',cover:'sport'},
    tech:{category:'TECH',title:'Innovation : de jeunes Burkinabè développent des solutions numériques',date:'24 septembre 2026',views:'410 vues',cover:'tech'}
  };
  const data = new URLSearchParams(location.search);
  const story = stories[data.get('story')] || stories.hero;
  $('#article-category').textContent = story.category;
  $('#article-title').textContent = story.title;
  $('#article-meta').textContent = '◷ ' + story.date + '   ·   ◉ ' + story.views;
  $('#article-cover').className = 'article-cover cover-' + story.cover;
  $('#article-lead').textContent = 'Cette page constitue le modèle éditorial SIRA. Elle est prête à recevoir le texte complet, les sources, les images, les vidéos associées et les informations de publication.';
  $('#article-body').innerHTML = '<p>Le contenu final de cette page sera alimenté depuis la base éditoriale de SIRA. La structure est déjà pensée pour une lecture confortable sur ordinateur et mobile.</p><h2>Une présentation claire de l’information</h2><p>Le lecteur doit retrouver rapidement le titre, la rubrique, la date, les médias associés et le corps de l’article. Des blocs complémentaires pourront ensuite afficher les sources, articles liés, podcasts et vidéos.</p><p>Cette version sert de socle frontend et évite de présenter comme réelles des données qui n’ont pas encore été validées ou connectées au CMS.</p>';
})();