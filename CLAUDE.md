# Dok'péyi — Documentation technique

## Instructions Claude Code
- Lire ce fichier en début de chaque session
- Mettre à jour les sections concernées avant chaque commit
- Ne jamais modifier le code sans avoir lu ce fichier

## Stack technique
- Frontend : HTML/CSS/JS vanilla, zéro framework
- Runtime : Vercel Edge Functions (`export const config = { runtime: 'edge' }`)
- IA : Anthropic API (`CLAUD_API_KEY`) + OpenAI (`OPENAI_API_KEY`)
- Modèle utilisé partout : `claude-haiku-4-5-20251001`
- DB : Firebase Realtime Database EU-west1
- Email : Resend API
- Paiement : Stripe Checkout + webhook HMAC-SHA256 + Mobile Money (Momo) + PayPal manuel
- Tests : `node --test` natif (pas de framework externe), 181 tests / 58 suites
- CI : GitHub Actions (`ci.yml`, `tests.yml`, `secret-scan.yml`)
- Zéro dépendance npm (`package.json` ne contient que `"type": "module"` et le script test)

## Variables d'environnement requises
| Variable | Service | Où obtenir la valeur | Obligatoire |
|---|---|---|---|
| `CLAUD_API_KEY` | Anthropic — génération documents (attention : sans le E final) | console.anthropic.com | Oui |
| `OPENAI_API_KEY` | OpenAI — chat IA équipe (fallback) | platform.openai.com | Oui |
| `RESEND_API_KEY` | Emails transactionnels | resend.com | Oui |
| `EMAIL_FROM` | Adresse expéditeur emails | Configuration Resend | Oui |
| `EMAIL_ADMIN` | Destinataire notifications internes | Adresse équipe | Oui |
| `STRIPE_SECRET_KEY` | Paiement Stripe | dashboard.stripe.com | Oui |
| `STRIPE_WEBHOOK_SECRET` | Vérification signature webhook Stripe | Stripe → Webhooks → endpoint | Oui |
| `DOK_WEBHOOK_SECRET` | Webhook interne | À générer (openssl rand -hex 32) | Oui |
| `MOMO_CALLBACK_TOKEN` | Authentification callback Mobile Money | Opérateur Momo | Oui |
| `FIREBASE_DATABASE_URL` | Firebase Realtime DB (URL EU-west1) | Firebase console | Oui |
| `NEXT_PUBLIC_BASE_URL` | CORS origin (`https://dok-peyi.vercel.app`) | URL déploiement Vercel | Oui |
| `ADMIN_PASS_ALLAN` | Mot de passe admin Allan | Générer (≥16 caractères) | Oui |
| `ADMIN_PASS_YONEL` | Mot de passe admin Yonel | Générer (≥16 caractères) | Oui |
| `ADMIN_PASS_MARVIN` | Mot de passe admin Marvin | Générer (≥16 caractères) | Oui |
| `ADMIN_PASS_REDAC` | Mot de passe agent Rédac | Générer (≥16 caractères) | Oui |

Note : `PAYPAL_EMAIL` n'est PAS une variable d'environnement. L'adresse PayPal Business est hardcodée dans `service.js` (constante `PAYPAL_EMAIL = 'contact@dok-peyi.fr'`).

## Architecture

### Flow client (wizard)
```
index.html (landing)
    ↓
service.html + service.js (wizard 3 étapes : service → infos → paiement)
    ↓
    ├─ POST /api/extract-doc      (si import document : pré-remplissage auto)
    ↓
    ├─ POST /api/generate-cv      (génération document HTML via Claude streaming)
    ↓ iframe srcdoc (prévisualisation)
    ├─ Panneau modif section      (FREE_MODIFICATIONS = 2, versions historisées)
    ↓
    ├─ POST /api/create-checkout  (Stripe) OU paiement PayPal/Momo manuel
    ↓ redirection Stripe Checkout
    ├─ POST /api/payment-webhook  (callback signé HMAC)
    ↓
    └─ email livraison via /api/send-email (Resend)
```

### Flow admin
```
admin/index.html
    ↓
POST /api/admin-auth (brute-force protection, 5 tentatives max)
    ↓
workspace-* (projets, tâches, chat, IA, QC, agents, notes, dashboard)
    ↓
    ├─ POST /api/ai-chat          (assistant IA équipe — Claude ou GPT)
    ├─ POST /api/redac-chat       (agent Rédac — supervision dossiers, #ID)
    └─ POST /api/pipeline         (transitions d'états : generate / confirm_payment /
                                   deliver / fail / get_document)
```

### Edge Functions (répertoire `api/`)
| Fichier | Rôle |
|---|---|
| `api/generate-cv.js` | Génération document principal — streaming SSE Anthropic, rate-limit 5/min, max prompt 32k car, max systemPrompt 4k car |
| `api/ai-chat.js` | Chat IA interne équipe (Claude ou OpenAI selon `service`), historique 10 derniers messages |
| `api/redac-chat.js` | Agent Rédac — assistant interne, anti-injection + actions destructives bloquées |
| `api/pipeline.js` | Orchestration transitions — `generate`/`confirm_payment`/`deliver`/`fail`/`get_document` |
| `api/payment-webhook.js` | Webhook Stripe + Momo — vérification HMAC-SHA256 |
| `api/create-checkout.js` | Création session Stripe Checkout |
| `api/send-email.js` | Envoi emails transactionnels via Resend |
| `api/extract-doc.js` | OCR/extraction JSON depuis PDF ou image (pré-remplissage wizard) |
| `api/admin-auth.js` | Authentification admin serveur + rate-limit anti-brute-force |

### Modules `lib/`
| Fichier | Rôle |
|---|---|
| `lib/content.js` | Prompt builders par service + parseContent (mode `json` ou `html`) |
| `lib/pipeline.js` | Stage handlers backend (graphe transitions, `generate`, `confirm_payment`, `deliver`, `fail`) |
| `lib/templates.js` | Rendering structuré (JSON → HTML A4 CSS-inline) |
| `lib/documents.js` | Contrôle d'accès aux documents selon statut (`preview` vs `final`) |
| `lib/statuses.js` | Miroir navigateur du graphe de transitions |
| `lib/review.js` | Règles de review admin (pré-paiement / post-paiement) |
| `lib/rate-limit.js` | Fenêtre glissante en mémoire, par IP |
| `lib/edge-response.js` | Helpers CORS + `json()` partagés par toutes les Edge Functions |
| `lib/services/sejour.js` | Builder prompt dédié titre de séjour |
| `lib/services/impot.js` | Builder prompt dédié avis d'impôt |
| `lib/services/naturalisation.js` | Builder prompt dédié naturalisation |

### Autres fichiers clés
| Fichier | Rôle |
|---|---|
| `service.js` | Wizard client — logique complète, constante `CV_TEMPLATES`, `SSW` state, `swBuildPrompt`, `swGenerate`, panneau modif |
| `service.html` | Wizard client — structure HTML 3 étapes + prévisualisation iframe + panneau modif |
| `service.css` | Styles wizard + cartes templates + modif panel |
| `cv-catalogue.html` | Page standalone catalogue des 6 templates CV (lien `?template=XXX` vers wizard) |
| `admin/index.html` | Dashboard admin |
| `admin/admin.js` | Logique dashboard admin |
| `admin/workspace-*.js` | Modules du workspace admin (chat, IA, projets, tâches, QC, agents…) |
| `lang.js` + `lang.css` | Système multilingue |

Note : les templates CV sont définis dans `service.js` (constante `CV_TEMPLATES`, exposée via `window.CV_TEMPLATES`). Il n'existe pas de fichier `lib/cv-templates.js` séparé.

## Services disponibles
| ID | Service | Prix | Modèle IA | Review admin | Sous-types | État |
|---|---|---|---|---|---|---|
| `cv` | CV Professionnel | 8€ | claude-haiku-4-5 | Non | scratch / improve / pro | ✅ Fonctionnel |
| `lettre` | Lettre de motivation | 5€ | claude-haiku-4-5 | Non | create / improve / adapt | ✅ Fonctionnel |
| `courrier` | Courrier officiel | 7€ | claude-haiku-4-5 | Non | demande / reclamation / contestation | ✅ Fonctionnel |
| `dossier` | Dossier administratif | 12€ | claude-haiku-4-5 | Non | caf / logement / aide / autre | ✅ Fonctionnel |
| `sejour` | Titre de séjour | 15€ | claude-haiku-4-5 | **Oui** | premiere / renouvellement / regularisation / information | ✅ Fonctionnel |
| `impot` | Avis d'impôt | 10€ | claude-haiku-4-5 | Non | comprendre / aide / courrier | ✅ Fonctionnel |
| `naturalisation` | Naturalisation | 20€ | claude-haiku-4-5 | **Oui** | situation / dossier / lettre | ✅ Fonctionnel |

Les services avec review admin obligatoire (`sejour`, `naturalisation`) déclenchent la transition `generated → needs_review` au lieu de `generated → pending_payment`.

## Templates CV
6 templates disponibles dans `CV_TEMPLATES` (service.js) et exposés sur la page `cv-catalogue.html`.
Le style de chaque template est injecté dans le prompt Emma via le placeholder `{{cv_template_style}}`.

| ID | Nom | Prix supplémentaire | Description |
|---|---|---|---|
| `classique` | Classique | +0€ (inclus) | Épuré et professionnel |
| `elite` | Élite | +4€ | Sidebar sombre, impact fort |
| `corporate` | Corporate | +2€ | Navy et sobre, idéal fonction publique |
| `impact` | Impact | +2€ | Dynamique, idéal commerce et BTP |
| `prestige` | Prestige | +4€ | Or et élégance, idéal santé et éducation |
| `executive` | Executive | +7€ | Ultra-minimaliste premium, direction et cadres |

## Pipeline de génération
**État actuel (production)** : pipeline mono-agent.
`api/generate-cv.js` appelle une seule fois l'API Anthropic en streaming SSE, avec un `system` prompt global Dok'péyi (contexte Guyane) et le prompt métier construit côté client (`swBuildPrompt` dans `service.js`) ou côté serveur (`buildPrompt` dans `lib/content.js`).

- Modèle : `claude-haiku-4-5-20251001`
- `max_tokens` : 4096
- Rate-limit : 5 appels / minute / IP
- Limite prompt : 32 000 caractères
- Limite systemPrompt : 4 000 caractères
- Format réponse : `{ cv: "<!DOCTYPE html>…</html>" }`

Pour les services utilisant `lib/pipeline.js` (via `/api/pipeline` action `generate`) :
- appel Anthropic non-streaming
- format `json` → `lib/templates.js` rend le HTML final ; format `html` → passage brut
- actuellement en `json` : cv (scratch + pro) — tous les autres en `html`

**Pipeline 4 agents nommés (Emma → Sofia → Léa → Viktor)** : uniquement Emma est présente à ce jour dans le prompt `cv_scratch` (`service.js:1270`). Sofia, Léa et Viktor sont des noms de rôles prévus pour la Phase 2 (orchestration multi-agents) — non implémentés en production.

## Branches Git
- **Branche principale** : `claude/create-website-AhMOy`
- **Convention commits** : `<type>(<scope>): <message>` — types `feat`, `fix`, `chore`, `refactor`, `test`, `merge`, scopes courants : `cv`, `lettre`, `courrier`, `dossier`, `sejour`, `impot`, `naturalisation`, `prompt`, `impot`
- **Tests obligatoires avant push** : `npm test` (181 / 181 OK)

## Déploiement Vercel
- **Production Branch** : `claude/create-website-AhMOy` (auto-deploy sur chaque push)
- **Edge Functions timeout** : 25 s (Hobby) / 60 s (Pro) — streaming maintient la connexion
- **CORS** : géré uniquement par `lib/edge-response.js` via `NEXT_PUBLIC_BASE_URL`
- **Headers sécurité** (`vercel.json`) : CSP, HSTS, X-Frame-Options, Referrer-Policy
- **Cache** : `no-store` sur `/api/*`, `immutable` sur CSS/favicon, `no-cache` sur `sw.js`
- **Points d'attention** :
  - CORS unique — ne pas dupliquer les headers dans les handlers
  - Rate-limit en mémoire : reset à chaque cold start (acceptable en Edge)
  - Streaming Anthropic : obligatoire pour les documents lourds (évite idle timeout)
  - Aucune dépendance npm → pas de `node_modules` à builder

## Tests
- **Commande** : `npm test` (équivalent à `node --test tests/*.test.js`)
- **Résultat actuel** : 181 tests / 58 suites / 181 pass / 0 fail
- **Couverture** :
  - `api/admin-auth.js` — 11 tests
  - `api/ai-chat.js` — couvert
  - `api/create-checkout.js` — 7 tests
  - `api/generate-cv.js` — couvert
  - `api/payment-webhook.js` — 8 tests
  - `api/pipeline.js` — 7 tests
  - `api/redac-chat.js` — couvert
  - `api/send-email.js` — 6 tests
  - `lib/rate-limit.js` — 26 tests
  - `lib/documents.js` — 7 tests
  - `lib/review.js` — 5 tests
- **Non couvert** :
  - Wizard client (`service.js`) — aucun test unitaire
  - Flows E2E (navigation complète service → paiement → livraison)
  - Pages admin (`admin/*.js`)
  - `api/extract-doc.js`
  - Templates CV visuels (rendu)

## Conventions de code
- Pas de framework, vanilla JS/HTML/CSS uniquement
- ES modules côté serveur (`"type": "module"` dans `package.json`)
- CSS inline pour les documents générés (portabilité impression, emails)
- Nommage :
  - `sw*` : fonctions wizard client (`swInit`, `swGenerate`, `swBuildPrompt`…)
  - `SSW` : state object global du wizard (persisté sessionStorage)
  - `SVC` : config statique des services
  - `_priv` : helpers privés (underscore prefix)
- Prompts versionnés en dur dans le code (pas de base externe)
- Pas de commentaires JSDoc sur les fonctions triviales ; bloc d'en-tête en haut de chaque fichier Edge Function décrivant l'endpoint

## Roadmap
- **Phase 0 — Sécurité** : en attente Allan (Vercel env vars + Firebase rules + HSTS preload + rotation secrets)
- **Phase 1 — Prompts production** : ✅ terminé (prompts enrichis par service et sous-type, contexte Guyane, 7 services fonctionnels)
- **Phase 2 — Pipeline multi-agents** : à venir (Emma → Sofia → Léa → Viktor orchestré serveur, mémoire partagée entre agents)
- **Phase 3 — Premium et croissance** : à venir (templates CV premium additionnels, abonnement, parrainage, dashboard client)

## Équipe
- **Marvin** : produit, IA, prompts, wizard, SEO, contenu
- **Allan** : infrastructure, Vercel, Firebase, Stripe, PayPal, sécurité

## Pages légales
Non créées — **obligatoires avant premier client réel** :
- CGU (Conditions Générales d'Utilisation)
- CGV (Conditions Générales de Vente)
- Politique de confidentialité (RGPD)
- Bannière cookies + page de gestion du consentement
- Mentions légales déjà présentes dans `legales.html` (à compléter)
