# SIRA — Site officiel

Site officiel responsive de l’association SIRA — **« Chemin d’aujourd’hui, avenir de demain »**.

## Version actuelle
- Accueil institutionnel responsive mobile / tablette / ordinateur
- Identité visuelle SIRA et logo SVG
- Navigation mobile accessible
- Présentation des axes d’action
- Vitrine projets et actualités prête pour les contenus officiels
- Formulaire de contact côté interface avec préparation/copie du message
- Pages confidentialité et mentions légales de base
- Manifest PWA
- Déploiement automatique GitHub Pages via `.github/workflows/pages.yml`

## Arborescence
- `index.html` — accueil
- `styles.css` — design, responsive, accessibilité
- `app.js` — interactions et formulaire
- `assets/sira-logo.svg` — identité SIRA
- `privacy.html` — confidentialité
- `legal.html` — mentions légales
- `manifest.webmanifest` — installation PWA
- `.github/workflows/pages.yml` — déploiement continu

## À renseigner avant production
Les informations officielles de l’association (dénomination juridique complète, mission validée, dirigeants, adresse, téléphone, e-mail, réseaux sociaux, projets réels, partenaires et moyens de don/paiement) doivent être fournies par SIRA. Aucun faux contact ou faux moyen de paiement n’est intégré.

## Déploiement
Après activation de **Settings → Pages → GitHub Actions** dans le dépôt, chaque push sur `main` déclenche le workflow de publication.
