# SIRA — contrôle qualité

## Contrôles statiques
- Toutes les pages HTML doivent charger `styles.css` et `app.js`.
- Les références du logo utilisent `assets/sira-logo.svg`.
- Les formulaires utilisent `required`/`type=email` avant envoi.
- Aucun secret ne doit être commité.

## Vérifications locales
Ouvrir `index.html`, `join.html`, `admin.html`, `privacy.html`, `legal.html` et `404.html` dans un navigateur récent.

## Déploiement
Le déploiement GitHub Pages dépend toujours de l'activation de Pages dans les paramètres du dépôt. Le workflow CI ne remplace pas cette activation lorsque l'intégration GitHub n'a pas les droits nécessaires.
