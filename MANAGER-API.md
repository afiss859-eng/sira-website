# SIRA Manager — API, IA et secrets

## Architecture

Flux de production : **APK SIRA Manager → HTTPS → Control Plane Vercel → stockage serveur → réponse JSON**.

Le stockage actuel des licences et clés SIRA utilise `data/manager-control.json` dans GitHub. Le mini-serveur HTTP local Android ne constitue pas l’autorité publique.

## API Control Plane

### Validation APK
`POST /api/licenses/validate`

Body JSON :
```json
{"key":"SIRA-MGR-XXXX-XXXX-XXXX","deviceId":"DEV-XXXXXXXXXXXX","appVersion":"1.0.0"}
```

### Administration
`/api/manager/control` utilise HTTP Basic côté serveur.

Actions : `overview`, `create-license`, `set-license-status`, `command`, `create-api-key`, `revoke-api-key`.

Les clés SIRA internes sont générées côté serveur, stockées sous hash SHA-256 et affichées en clair uniquement lors de leur création.

### Diagnostic des fournisseurs
`GET /api/manager/providers`

Retourne seulement `configured` et `missing`. Aucun secret n’est exposé.

## Moteur IA compatible OpenAI

SIRA peut utiliser le service fourni par l’utilisateur :

`https://aimodelapi.onrender.com/v1`

Variables Vercel recommandées :
- `AI_MODEL_API_KEY` : clé fournie par le service AI Model API
- `AI_MODEL_BASE_URL` : optionnelle ; par défaut `https://aimodelapi.onrender.com/v1`

OpenAI officiel est **optionnel** pour cette architecture. `OPENAI_API_KEY` n’est pas nécessaire pour utiliser le service compatible OpenAI.

### Proxy IA SIRA
`GET /api/manager/ai` récupère la liste des modèles depuis `/v1/models`.

`POST /api/manager/ai` avec :
```json
{"type":"chat","model":"dev-x","messages":[{"role":"user","content":"Bonjour"}]}
```

Pour une image :
```json
{"type":"image","model":"image-gen","prompt":"Visuel professionnel pour une facture SIRA"}
```

Le navigateur et l’APK ne reçoivent pas `AI_MODEL_API_KEY`.

### Modèle actif
`GET/POST /api/manager/ai-config` gère le modèle sélectionné par l’administration. La sélection est conservée côté serveur dans `data/manager-ai.json`.

Modèles attendus d’après la documentation fournie : `dev-x`, `gpt-oss-120b`, `llama-3.3-70b-instruct`, `gpt-5-nano`, `gemini-2.5-flash-lite`, `qwen3-30b-a3b`, `deepseek-r1`, `mistral`, `kimi-k2p5`, `kimi-k2-thinking`, `grok-3-mini`, `grok-3`, `grok-4`, plus `image-gen`, `qwen-max-image` et `gemini-flash-image` pour la génération d’images.

## Factures proforma

`POST /api/manager/proforma` génère une facture proforma HTML imprimable en PDF depuis le navigateur.

Fonctions :
- calcul du sous-total, taxes et total en FCFA ;
- identité vendeur/client ;
- lignes d’articles ;
- numéro et date ;
- génération optionnelle d’un visuel via le moteur image configuré ;
- retour de `html`, `total` et `imageUrl`.

Le document retourné porte clairement la mention **Document proforma — non constitutif d’une facture définitive**.

## Paiements

Variables prévues pour les intégrations marchandes :
- CinetPay : `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`
- PayDunya : `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_PUBLIC_KEY`, `PAYDUNYA_TOKEN`
- Opérateurs : credentials à définir selon les contrats réellement délivrés lors de l’onboarding.

## Sécurité

Aucune clé fournisseur ne doit être hardcodée dans l’APK, HTML, JavaScript public, `vercel.json` ou le dépôt Git. Les secrets restent côté Vercel.

## État

✅ Contrôle licences serveur

✅ Validation distante APK

✅ Commandes distantes

✅ Génération/révocation de clés API SIRA

✅ Sélection persistante du modèle IA

✅ Proxy chat compatible OpenAI

✅ Proxy génération d’images

✅ Générateur de factures proforma

🟡 Clé réelle `AI_MODEL_API_KEY` : à placer dans les variables Vercel

🟡 Credentials paiement : à renseigner après onboarding fournisseur

🟡 Ack atomique des commandes et migration future vers base transactionnelle à renforcer avec la montée en charge
