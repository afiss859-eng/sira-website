# SIRA Manager — API et secrets

## Architecture

Le flux de production est : **APK SIRA Manager → HTTPS → `/api/manager/control` → stockage serveur → réponse JSON**.

Le stockage actuellement utilisé par le Control Plane est le fichier GitHub `data/manager-control.json`. Les commandes et licences sont donc gérées côté serveur et non par le mini-serveur HTTP local Android.

`api/licenses/validate` reste disponible comme route de compatibilité et délègue au Control Plane.

## API Control Plane

### Validation APK
`POST /api/licenses/validate`

Body JSON :
```json
{"key":"SIRA-MGR-XXXX-XXXX-XXXX","deviceId":"DEV-XXXXXXXXXXXX","appVersion":"1.0.0"}
```

Retour : `valid`, métadonnées de licence et commandes en attente.

### Administration
`/api/manager/control` utilise une authentification HTTP Basic côté serveur.

Actions principales :
- `GET ?action=overview`
- `POST ?action=create-license`
- `POST ?action=set-license-status`
- `POST ?action=command`
- `POST ?action=create-api-key`
- `POST ?action=revoke-api-key`

Les clés SIRA générées par `create-api-key` sont stockées sous forme de hash SHA-256 ; la valeur brute n’est retournée qu’une seule fois lors de la création.

### État des fournisseurs
`GET /api/manager/providers`

Retourne uniquement `configured: true/false` et la liste des variables manquantes. **Aucun secret n’est renvoyé.**

## Variables Vercel

### Administration et stockage
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `GITHUB_TOKEN`

### IA
- `OPENAI_API_KEY`

### CinetPay
- `CINETPAY_API_KEY`
- `CINETPAY_SITE_ID`

### PayDunya
- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_PUBLIC_KEY`
- `PAYDUNYA_TOKEN`

### Opérateurs Mobile Money
Les noms exacts des identifiants doivent suivre les contrats/API réellement fournis lors de l’onboarding de chaque opérateur. Ne jamais inventer ou hardcoder des credentials.

## Règles de sécurité

Les secrets fournisseurs restent uniquement dans les variables d’environnement Vercel et ne doivent jamais être placés dans l’APK, dans HTML/JavaScript public, dans `vercel.json` ou dans le dépôt Git.

Le endpoint `/api/manager/providers` ne révèle jamais les valeurs des variables. Il sert uniquement au diagnostic de configuration.

Les clés PayDunya sont délivrées depuis une application PayDunya Business active ; la documentation officielle indique notamment `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_PUBLIC_KEY` et `PAYDUNYA_TOKEN` pour la configuration Node.js. Voir : https://developers.paydunya.com/doc/FR/NodeJS

Les clés CinetPay doivent être récupérées depuis le compte marchand CinetPay et configurées côté serveur après validation de l’intégration.

## État actuel

✅ Génération de licences côté serveur

✅ Validation distante des licences par l’APK

✅ Commandes `LOCK_APP`, `FORCE_SYNC`, `SHOW_MESSAGE`

✅ Génération et révocation de clés API SIRA

✅ Endpoint de diagnostic des fournisseurs sans exposition de secrets

🟡 Credentials fournisseurs réels : à renseigner dans Vercel après obtention auprès des fournisseurs

🟡 Ack/consommation atomique des commandes : à renforcer pour éviter qu’une commande reste rejouée plusieurs fois

🟡 Migration du stockage GitHub vers une base transactionnelle si le volume/concurrence augmente
