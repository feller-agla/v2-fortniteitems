# PayDunya — intégration

## Variables d’environnement (`.env.local`)

```bash
# Active PayDunya à la place de Lygos pour POST /api/orders
PAYMENT_PROVIDER=paydunya

# true / 1 = API sandbox (recommandé pour les tests)
# false / 0 = API production
# Si absent : sandbox en local, production sur Vercel (NODE_ENV=production)
PAYDUNYA_SANDBOX=true

PAYDUNYA_MASTER_KEY=...
PAYDUNYA_PRIVATE_KEY=...
PAYDUNYA_TOKEN=...

# Optionnel : non utilisée pour checkout-invoice côté serveur (réserve client / doc PayDunya)
# PAYDUNYA_PUBLIC_KEY=...

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Pour un déploiement public, définis aussi `NEXT_PUBLIC_BASE_URL=https://ton-domaine.com` (utilisé pour `return_url`, `cancel_url` et `callback_url` si l’en-tête `Origin` est absent).

## Pourquoi la page demande email + mot de passe PayDunya ? (mode TEST)

Ce n’est **pas** le parcours réel des acheteurs.

En **sandbox** (`PAYDUNYA_SANDBOX=true` ou clés de test), PayDunya simule les paiements avec des **comptes clients fictifs** (portefeuille de test). L’écran « PayDunya + connexion » est **normal en test** : il n’y a pas la grille Orange Money / MTN / Wave comme en production.

**À faire pour tester :**

1. Dashboard PayDunya → [Intégrez notre API](https://paydunya.com/integration-setups) → onglet **[Clients fictifs](https://paydunya.com/integration-setups/sandbox-accounts)**.
2. Crée un client fictif (email, nom, solde en FCFA fictif).
3. Sur la page de paiement **TEST**, connecte-toi avec **l’email + mot de passe de ce compte fictif** (pas ton compte business).

Doc officielle : [Création d’un compte fictif](https://developers.paydunya.com/doc/FR/introduction#section-2).

## Parcours réel des clients (production)

Quand l’application est en **mode production** (clés **live**, `PAYDUNYA_SANDBOX=false`, compte validé chez PayDunya), la même URL de facture ouvre en général la **page de checkout publique** : choix du **pays / opérateur** (Orange Money, Wave, MTN, carte, etc.) et paiement **sans compte PayDunya** pour l’acheteur — il utilise seulement son numéro / son opérateur habituel.

- Activation : dans le détail de ton application → **Modifier la configuration** → **Activer le mode production** + remplacer les clés par les clés **live** dans `.env` / Vercel.

## Tester le flux (dev)

1. Ajoute les clés depuis [PayDunya — Intégration API](https://paydunya.com/integration-setups) (mode test).
2. Mets `PAYMENT_PROVIDER=paydunya` et `PAYDUNYA_SANDBOX=true`.
3. Redémarre `npm run dev`.
4. Crée un **client fictif** (voir plus haut), puis panier → Commander → connecte-toi avec ce client sur la page PayDunya **sandbox**.

## IPN (webhook)

URL enregistrée automatiquement à la création de facture :

`{NEXT_PUBLIC_BASE_URL ou Origin}/api/webhooks/paydunya`

En local, PayDunya ne peut pas joindre `localhost` : utilise **ngrok** (ou équivalent), mets l’URL HTTPS dans `NEXT_PUBLIC_BASE_URL`, ou configure l’URL de callback dans le dashboard PayDunya si proposé.

Si le hash IPN est rejeté en test, tu peux temporairement mettre `PAYDUNYA_SKIP_IPN_HASH=true` (uniquement en debug).

## Retour après paiement

- `return_url` : `/orders?status=success&order_id=...` (+ `token` ajouté par PayDunya)
- En cas de succès IPN avec `status=completed`, la commande passe en `processing` en base.
