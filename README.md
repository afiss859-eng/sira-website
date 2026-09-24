# SIRA — Portail média

SIRA est maintenant présenté comme un portail d'actualités responsive inspiré de la maquette fournie : Burkina Faso, Afrique, International, Économie, Société, Sport, Culture, Tech, Vidéos, Podcasts, SIRA FM et SIRA TV.

## Version actuelle
- Accueil média responsive PC / tablette / mobile
- Barre Flash Info
- Une principale + fil d'actualités
- Rubriques et cartes de contenu
- Blocs SIRA FM / SIRA TV avec lecteurs de démonstration
- Newsletter avec stockage local de démonstration
- Recherche vers le modèle de lecture d'article
- article.html + article.js pour les pages d'articles
- about.html pour la présentation
- PWA + service worker avec nouveau cache

## Important
Les articles, chiffres de vues et compteurs sociaux présents dans la maquette sont des contenus de démonstration. Ils doivent être remplacés par les contenus éditoriaux validés avant mise en production.

Les lecteurs FM/TV sont également des démonstrations frontend. Les vrais flux audio/vidéo pourront être branchés lorsque les URLs de diffusion seront disponibles.

## Architecture prévue pour la production
La prochaine étape consiste à connecter une API/CMS sécurisé, une base de données, l'authentification avec rôles, le stockage des médias, la messagerie transactionnelle, la gestion des actualités, catégories, vidéos, podcasts, directs, commentaires et journaux d'activité.

## Déploiement
Le dépôt contient un workflow GitHub Pages qui se déclenche sur main.
