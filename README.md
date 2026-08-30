# SIRA — Site officiel

Site institutionnel responsive de l’association SIRA — **« Chemin d’aujourd’hui, avenir de demain »**.

## État actuel
- Accueil institutionnel complet, responsive mobile / tablette / ordinateur
- Identité visuelle SIRA intégrée à partir du logo officiel SVG
- Navigation mobile accessible
- Sections : présentation, domaines d’action, projets, impact, actualités, participation, contact et FAQ
- Page d’adhésion / participation
- Tableau de bord local de démonstration
- Pages confidentialité et mentions légales préparatoires
- Manifest PWA + service worker de cache
- Workflow GitHub Pages
- Métadonnées SEO de base

## Arborescence
- `index.html` — accueil institutionnel
- `join.html` — adhésion / participation
- `admin.html` — tableau de bord local de test
- `styles.css` — design responsive et composants
- `app.js` — navigation, animations, validation et stockage local de prototype
- `assets/sira-logo.svg` — logo officiel SIRA
- `privacy.html` — confidentialité préparatoire
- `legal.html` — mentions légales préparatoires
- `404.html` — page introuvable
- `manifest.webmanifest` — PWA
- `sw.js` — cache offline de base
- `.github/workflows/pages.yml` — publication GitHub Pages

## Données et sécurité
Les coordonnées, dirigeants, projets, partenaires, moyens de don et autres informations institutionnelles non fournis par SIRA ne sont pas inventés. Les formulaires actuels utilisent `localStorage` uniquement pour démontrer le parcours frontend. **Ils ne constituent pas encore une base de données sécurisée et ne doivent pas servir à collecter des données sensibles en production.**

## Mise en production prévue
La prochaine couche technique devra fournir une API sécurisée, une vraie base de données, une authentification administrateur avec rôles, un stockage des médias, la messagerie transactionnelle, la gestion des projets/actualités/événements, des journaux d’activité et un module de dons après validation des moyens de paiement de SIRA.

## Déploiement
Le workflow GitHub Pages est présent. Dans GitHub : **Settings → Pages → Source: GitHub Actions**. Les changements poussés sur `main` peuvent ensuite être publiés automatiquement par le workflow.
