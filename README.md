# SIRA — Site officiel

Site officiel responsive de l’association SIRA — **« Chemin d’aujourd’hui, avenir de demain »**.

## Version actuelle
- Accueil institutionnel responsive mobile / tablette / ordinateur
- Identité visuelle SIRA et logo SVG
- Navigation mobile accessible
- Présentation des axes d’action
- Vitrine projets, actualités et événements
- Formulaire de contact avec validation et stockage local de test
- Page d’adhésion / participation avec stockage local de test
- Tableau de bord local de démonstration (`admin.html`)
- Pages confidentialité, mentions légales et 404
- Manifest PWA
- Workflow GitHub Pages
- SEO de base : description, thème, sitemap et robots

## Arborescence
- `index.html` — accueil
- `join.html` — adhésion / participation
- `admin.html` — tableau de bord local de test
- `styles.css` — design responsive
- `app.js` — interactions, validation et stockage local
- `assets/sira-logo.svg` — identité SIRA
- `privacy.html` — confidentialité préparatoire
- `legal.html` — mentions légales préparatoires
- `404.html` — page introuvable
- `manifest.webmanifest` — PWA
- `robots.txt` / `sitemap.xml` — référencement
- `.github/workflows/pages.yml` — déploiement continu

## Important avant production
Les informations officielles de l’association (dénomination juridique complète, mission validée, dirigeants, adresse, téléphone, e-mail, réseaux sociaux, projets réels, partenaires et moyens de don/paiement) doivent être fournies et validées par SIRA. Aucun faux contact, faux partenaire ou faux moyen de paiement n’est intégré.

Les formulaires actuels sont **un prototype frontend** : ils enregistrent les demandes dans `localStorage` du navigateur. Ils ne constituent pas encore une base de données membres et ne doivent pas être utilisés pour collecter des données sensibles en production.

## Déploiement
Le workflow GitHub Pages est prêt. Dans le dépôt GitHub, activer **Settings → Pages → Source: GitHub Actions**. Une fois Pages autorisé, chaque push sur `main` déclenche la publication.

## Prochaine étape technique
Pour une vraie production : connecter une API sécurisée + base de données, authentification administrateur avec rôles, stockage médias, messagerie transactionnelle, gestion des projets/actualités/événements et module de dons après validation des moyens de paiement de SIRA.
