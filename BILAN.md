# Bilan technique — Dok'péyi
*Date : 16/04/2026*

---

## Vue d'ensemble

Dok'péyi est une plateforme d'aide administrative en ligne destinée aux résidents de Guyane française.
Elle permet de générer des CV, lettres de motivation, courriers officiels et dossiers administratifs
via une interface web, avec paiement intégré et suivi des demandes en temps réel.

**Stack technique**
- Frontend : HTML/CSS/JS vanilla — déployé sur Vercel
- Backend : Vercel Edge Functions (Node.js runtime edge)
- Base de données : Firebase Realtime Database
- Paiements : Stripe + Mobile Money (Momo)
- Emails : Resend
- IA : Claude (Anthropic) + OpenAI

---

## Pages et interface utilisateur

| Page | Rôle |
|------|------|
| `index.html` | Landing page publique — présentation des services |
| `service.html` | Wizard de commande (étapes : service → infos → paiement) |
| `legales.html` | Mentions légales, CGU, politique de confidentialité |
| `admin/index.html` | Dashboard interne (gestion des demandes, chat d'équipe) |

**Fonctionnalités UX notables**
- Persistance du wizard en `sessionStorage` — le formulaire survit à un rechargement de page
- Guard `beforeunload` sur les étapes critiques pour éviter les pertes de données
- Service worker avec notification automatique lors d'une mise à jour
- Support multilingue via `lang.js`
- PWA : `manifest.json` + `favicon.svg`

---

## API — Endpoints (Vercel Edge Functions)

| Endpoint | Rôle |
|----------|------|
| `POST /api/admin-auth` | Authentification des membres de l'équipe (rate limiting + brute-force protection) |
| `POST /api/ai-chat` | Chat IA client (Claude / OpenAI) |
| `POST /api/create-checkout` | Création de session de paiement Stripe |
| `POST /api/generate-cv` | Génération de CV via Claude |
| `POST /api/payment-webhook` | Réception des webhooks Stripe et Momo |
| `POST /api/pipeline` | Orchestration du pipeline IA multi-étapes |
| `POST /api/redac-chat` | Agent Rédac — coordination interne de l'équipe |
| `POST /api/send-email` | Envoi d'emails transactionnels via Resend |

---

## Agent Rédac (IA interne)

Rédac est un agent IA intégré dans le chat d'équipe du dashboard.
Il est déclenché par `@Rédac` dans une conversation.

**Ce qu'il fait**
- Répond aux questions sur les dossiers en cours
- Identifie les blocages, urgences et paiements en attente
- Résume l'activité récente
- Aide à rédiger ou reformuler des documents
- Donne son avis sur des situations complexes

**Architecture**
- Contexte ciblé : seuls les dossiers urgents, récents et explicitement mentionnés (`#ID`) sont envoyés à Claude — pas un dump complet
- Garde-fous serveur : actions dangereuses détectées et refusées avant tout appel à Claude
- Protection anti-injection de prompt côté serveur
- Prompt de personnalité : membre de l'équipe (Allan, Yonel, Marvin), ton naturel et professionnel

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| Headers HTTP | CSP, HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy |
| Rate limiting | Fenêtre glissante en mémoire, par IP, sur tous les endpoints sensibles |
| Brute-force | Blocage après 5 tentatives échouées sur `/api/admin-auth` |
| Webhooks | Vérification de signature HMAC (Stripe + Momo) |
| Prompt injection | Filtrage regex sur les messages avant appel Claude |
| Actions interdites | Patterns serveur bloquant suppression, modification de rôles, validation de paiement |
| Firebase | Règles de sécurité configurées dans `firebase.rules.json` |
| Cache | `no-store` sur les API, `immutable` sur les assets statiques |

---

## Tests unitaires

| Fichier testé | Tests |
|---------------|-------|
| `api/admin-auth.js` | ✅ 11 tests |
| `api/create-checkout.js` | ✅ 7 tests |
| `api/payment-webhook.js` | ✅ 8 tests |
| `api/pipeline.js` | ✅ 7 tests |
| `api/send-email.js` | ✅ 6 tests |
| `lib/rate-limit.js` | ✅ 26 tests |
| `lib/documents.js` | ✅ 7 tests |
| `lib/review.js` | ✅ 5 tests |
| `api/ai-chat.js` | ❌ Non couvert |
| `api/generate-cv.js` | ❌ Non couvert |
| `api/redac-chat.js` | ❌ Non couvert |

**Total : ~77 tests — framework Node.js natif (`node:test`)**

---

## SEO

- Meta OG + Twitter Card sur toutes les pages
- JSON-LD `LocalBusiness` (Schema.org)
- `sitemap.xml` avec toutes les URLs de services
- `robots.txt` avec exclusion du `/admin/`
- Balises `canonical`
- Scripts Firebase chargés en `defer` (non bloquants)

---

## Variables d'environnement requises

```
CLAUD_API_KEY          Anthropic Claude
OPENAI_API_KEY         OpenAI
STRIPE_SECRET_KEY      Stripe
STRIPE_WEBHOOK_SECRET  Stripe webhooks
RESEND_API_KEY         Emails
EMAIL_FROM             Adresse expéditeur
EMAIL_ADMIN            Adresse de notification interne
DOK_WEBHOOK_SECRET     Sécurité webhook interne
MOMO_CALLBACK_TOKEN    Authentification Mobile Money
FIREBASE_DATABASE_URL  Firebase Realtime DB
ADMIN_PASS_ALLAN       Mot de passe admin
NEXT_PUBLIC_BASE_URL   URL de base publique
```

---

## Points d'amélioration identifiés

| Priorité | Sujet |
|----------|-------|
| 🔴 Haute | Ajouter les tests pour `ai-chat.js`, `generate-cv.js`, `redac-chat.js` |
| 🟡 Moyenne | Externaliser les 1 500+ lignes CSS inline du dashboard admin |
| 🟡 Moyenne | Migration Firebase SDK v8 → v9 modulaire (réduction du bundle) |
| 🟢 Basse | OG image statique PNG (1200×630) pour meilleur rendu sur réseaux sociaux |
| 🟢 Basse | Configurer ESLint + Prettier |

---

## Estimation globale

**Score qualité : 8.5 / 10**

La plateforme est fonctionnelle, sécurisée et déployable en production.
Les principaux axes de progression sont la couverture de tests et l'optimisation du dashboard admin.
