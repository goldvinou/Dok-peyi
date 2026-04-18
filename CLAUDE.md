# Dok'péyi — Documentation technique

## Instructions Claude Code — OBLIGATOIRE
Ces règles s'appliquent à CHAQUE session sans exception.

### En début de session
1. Lire ce fichier CLAUDE.md en entier
2. Vérifier que le contenu correspond à l'état réel du code
3. Si écart détecté → corriger CLAUDE.md avant toute action

### En fin de session (avant chaque commit)
1. Mettre à jour CLAUDE.md pour refléter les changements effectués :
   - Nouveaux fichiers créés → ajouter dans Architecture
   - Nouveaux services → ajouter dans Services disponibles
   - Variables d'env ajoutées → ajouter dans Variables
   - Roadmap avancée → mettre à jour le statut
2. Le commit de CLAUDE.md doit accompagner chaque commit de code
3. Ne jamais committer du code sans mettre à jour CLAUDE.md

### Règle absolue
Si CLAUDE.md n'est pas à jour → ne pas committer.

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
    ├─ Panneau modif section      (universel tous services hors 'improve',
    │                              FREE_MODIFICATIONS = 2, sections par service
    │                              via MODIFY_SECTIONS, versions historisées)
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
| `api/orchestrate.js` | Pipeline multi-agents serveur — Emma → Viktor (éval, max 2 boucles) → Sofia → Léa, rate-limit 5/min. Emma : Opus (séjour/naturalisation) ou Sonnet (autres). Viktor/Sofia/Léa : Haiku. Retourne `{ cv: "…" }` |
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
| `service.js` | Wizard client — logique complète, constantes `CV_TEMPLATES`, `MODIFY_SECTIONS`, `CV_POSTES_GROUPS`, `CV_DIPLOMES_GROUPS`, `CV_COMPETENCES_GROUPS`, `LETTRE_ENTREPRISES_GROUPS`, `LETTRE_SECTEUR_TAGS`, `COURRIER_DESTINATAIRES_GROUPS`, `COURRIER_OBJET_TYPES`, `DOSSIER_CAF_PRESTATIONS`, `DOSSIER_CAF_SITUATION_PRO`, `DOSSIER_CAF_FOYER`, `DOSSIER_LOGEMENT_TYPES`, `DOSSIER_LOGEMENT_SITUATIONS`, `DOSSIER_AIDE_TYPES`, `DOSSIER_AIDE_ORGANISMES`, `SEJOUR_NATIONALITES`, `SEJOUR_SITUATION_FAMILIALE`, `SEJOUR_ENFANTS_CHARGE`, `SEJOUR_MOTIFS`, `SEJOUR_DUREES_SOUHAITEES`, `SEJOUR_CHANGEMENT_SITUATION`, `SEJOUR_DUREE_PRESENCE`, `SEJOUR_MOTIFS_REGULARISATION`, `SEJOUR_SUJETS_INFO`, `SSW` state, `swBuildPrompt`, `swGenerate`, panneau modif universel (`swModifyDoc`) — supporte `hybrid-select` et `tags` (avec variante `single: true` = radio-tags) |
| `service.html` | Wizard client — structure HTML 3 étapes + prévisualisation iframe + panneau modif |
| `service.css` | Styles wizard + cartes templates + modif panel |
| `a-propos.html` | Page institutionnelle — hero sombre, mission, 7 services + prix, ancrage Guyane (7 langues + organismes réels), engagements RGPD/qualité |
| `cv-catalogue.html` | Page standalone catalogue des 6 templates CV (lien `?template=XXX` vers wizard) |
| `mentions-legales.html` | Mentions légales (éditeur, hébergeur Vercel, propriété intellectuelle, contact) |
| `cgv.html` | Conditions Générales de Vente (tarifs détaillés, délais, remboursement, disclaimer IA, CIMADE Guyane) |
| `confidentialite.html` | Politique de confidentialité RGPD (données collectées, sous-traitants, droits, CNIL) |
| `cookies.html` | Politique cookies (tableau des cookies strictement nécessaires, aucun tracking tiers) |
| `legales.html` | Page legacy unifiée (mentions + CGU + CGV + confidentialité) — conservée pour compatibilité |
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

**Champs wizard dossier par sous-type** (définis dans `SVC.dossier.questions`, groupes dans `DOSSIER_*`) :
- `caf` : prestation (tags radio — RSA/APL/AAH/PAJE/ALS/ASF), situation_pro (tags radio), foyer (tags radio), revenus (select)
- `logement` : type_demande (tags radio — HLM/Mutation/Urgence/Hébergement urgence), departement (text), anciennete_liste (select), situation_actuelle (tags multi)
- `aide` : type_aide (tags multi — alimentaire/énergie/eau/mobilité/obsèques/rentrée scolaire), organisme_cible (tags radio — CCAS/MSA/CAF/Département 973/Croix-Rouge)
- `autre` : type (text libre), organisme (text libre)
- Tous les sous-types : description (textarea obligatoire), documents (textarea facultatif)
- Les champs spécifiques sont agrégés dans `{{dossier_contexte}}` (variable calculée dans `swBuildPrompt`) injectée dans le prompt dossier.

**Champs wizard séjour par sous-type** (définis dans `SVC.sejour.questions(choice)`, groupes dans `SEJOUR_*`) :
- Communs à tous : nationalite (hybrid-select — priorité Brésil/Haïti/Suriname/Guyana + Afrique subsaharienne), situation_familiale (tags radio), enfants_charge (tags radio)
- `premiere` : motif (tags radio — Travail/Regroupement familial/Études/Humanitaire/Retraité/Réfugié OFPRA), duree_souhaitee (tags radio)
- `renouvellement` : motif (tags radio identique), date_expiration (text), changement_situation (tags radio Oui/Non)
- `regularisation` : duree_presence (tags radio — Moins d'1 an/1–3 ans/3–5 ans/Plus de 5 ans), motif_regularisation (tags radio)
- `information` : sujet (tags radio — Droits/Procédure/Recours/Refus/Expulsion)
- Communs (suite) : situation (textarea obligatoire), documents (textarea), visa_actuel (select), situation_pro (select), historique_refus (radio)
- Les champs spécifiques sont agrégés dans `{{sejour_contexte}}` (variable calculée dans `swBuildPrompt`) injectée dans le prompt séjour.

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

**Pipeline 4 agents nommés (Emma → Viktor → Sofia → Léa)** : implémenté côté serveur dans `api/orchestrate.js`. Le client (`swGenerate` dans `service.js`) appelle `/api/orchestrate` en un seul fetch (timeout 120s). `swCallAgent` (panneau de modification) continue d'appeler `/api/generate-cv`. Emma utilise Opus pour séjour/naturalisation, Sonnet pour les autres services. Viktor, Sofia, Léa utilisent Haiku.

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
- **Phase 2 — Pipeline multi-agents** : ✅ implémenté (`api/orchestrate.js`) — Emma → Viktor → Sofia → Léa orchestré serveur. Mémoire partagée entre agents : à venir (Phase 2b)
- **Phase 3 — Premium et croissance** : à venir (templates CV premium additionnels, abonnement, parrainage, dashboard client)

## Équipe
- **Marvin** : produit, IA, prompts, wizard, SEO, contenu
- **Allan** : infrastructure, Vercel, Firebase, Stripe, PayPal, sécurité

## Pages légales
4 pages dédiées créées à la racine + bannière cookies dans `index.html` :

| Fichier | URL | Contenu |
|---|---|---|
| `mentions-legales.html` | `/mentions-legales` | Éditeur (constitution juridique en cours), responsable publication Marvin, hébergeur Vercel, propriété intellectuelle, contact |
| `cgv.html` | `/cgv` | Tarifs des 7 services + suppléments templates CV + traduction, délais, remboursement, rétractation, disclaimer IA (CIMADE Guyane), droit français / Tribunal de Cayenne |
| `confidentialite.html` | `/confidentialite` | RGPD : données collectées, sous-traitants (Anthropic/Vercel/Stripe/Firebase/Resend), durée conservation 12 mois, droits, CNIL |
| `cookies.html` | `/cookies` | Cookies strictement nécessaires uniquement, tableau des cookies utilisés, aucun tracking tiers |

Page legacy `legales.html` conservée (page unifiée accessible via `/legales`).

**Bannière cookies** : bandeau fixe bas de page dans `index.html` avec bouton « J'accepte » (stockage localStorage `dok_cookies_ok`) et lien vers `/cookies`. Masquée automatiquement si déjà acceptée.

**Footer d'`index.html`** : liens mis à jour vers les 4 pages dédiées (`/mentions-legales`, `/cgv`, `/confidentialite`, `/cookies`).
