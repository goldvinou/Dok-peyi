/* ============================================================
   DOK'PÉYI — Admin Panel JavaScript
   ============================================================ */

// ===== CONSTANTES =====
// ── Comptes utilisateurs — modifier les mots de passe ici ──────────────
const USERS = [
  { user: 'allan',  pass: 'Allan@2025',  nom: 'Allan',  role: 'admin',     color: '#2563eb' },
  { user: 'yonel',  pass: 'Yonel@2025',  nom: 'Yonel',  role: 'admin',     color: '#10b981' },
  { user: 'marvin', pass: 'Marvin@2025', nom: 'Marvin', role: 'manager',   color: '#f59e0b' },
  { user: 'redac1', pass: 'Redac@2025',  nom: 'Rédacteur', role: 'redacteur', color: '#8b5cf6' }
];
// ── Rôles ────────────────────────────────────────────────────────────────
const ROLE_SECTIONS = {
  admin:     ['dashboard','demandes','services','ia','stats','workspace','controle','agents'],
  manager:   ['dashboard','demandes','stats','workspace','controle'],
  redacteur: ['dashboard','controle']
};

// ── Équipe IA interne — configurable par l'admin ─────────────────────────
function buildDefaultAgents() {
  return [
    {
      id: 'lucas', nom: 'Lucas', role: 'IA Accueil', icon: '🤝', color: '#3b82f6',
      specialite: 'Accueil & collecte client', enabled: true,
      tone: 'friendly', qualityFocus: 'accuracy',
      systemPrompt: "Tu es Lucas, assistant IA de Dok'péyi spécialisé dans l'accueil des clients. Tu collectes toutes les informations nécessaires avec bienveillance et précision. Tu t'assures qu'aucune donnée client n'est manquante avant de transmettre la demande. Tu communiques de façon chaleureuse, claire et rassurante.",
      instructions: ''
    },
    {
      id: 'emma', nom: 'Emma', role: 'IA Rédaction', icon: '✍️', color: '#10b981',
      specialite: 'Rédaction & génération documents', enabled: true,
      tone: 'professional', qualityFocus: 'completeness',
      systemPrompt: "Tu es Emma, experte en rédaction professionnelle chez Dok'péyi. Tu génères des documents de haute qualité : CV percutants, lettres de motivation convaincantes, dossiers administratifs rigoureux. Ton travail est soigné, sans fautes, riche en contenu et parfaitement adapté au profil de chaque client. Tu vises l'excellence à chaque document.",
      instructions: ''
    },
    {
      id: 'viktor', nom: 'Viktor', role: 'IA Vérification', icon: '🔍', color: '#f59e0b',
      specialite: 'Contrôle qualité & validation', enabled: true,
      tone: 'formal', qualityFocus: 'clarity',
      systemPrompt: "Tu es Viktor, responsable qualité IA chez Dok'péyi. Tu analyses chaque document avec un œil critique et méthodique : cohérence des informations, orthographe, grammaire, pertinence du contenu par rapport à la demande client, conformité au format attendu. Tu signales toute anomalie avec précision.",
      instructions: ''
    },
    {
      id: 'sofia', nom: 'Sofia', role: 'IA Optimisation', icon: '⚡', color: '#8b5cf6',
      specialite: 'Optimisation & finalisation', enabled: true,
      tone: 'concise', qualityFocus: 'clarity',
      systemPrompt: "Tu es Sofia, spécialiste en optimisation chez Dok'péyi. Tu améliores les documents finaux sans trahir le contenu original : fluidité du texte, impact des formulations, vocabulaire adapté au secteur professionnel du client, finition impeccable. Tu apportes la touche finale qui fait la différence.",
      instructions: ''
    }
  ];
}

function loadAIAgents() {
  try {
    const saved = localStorage.getItem('dok_ai_agents');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fusion avec les défauts pour garantir tous les champs
      const defaults = buildDefaultAgents();
      return defaults.map(def => ({ ...def, ...(parsed.find(a => a.id === def.id) || {}) }));
    }
  } catch(_) {}
  return buildDefaultAgents();
}

function saveAIAgents() {
  try { localStorage.setItem('dok_ai_agents', JSON.stringify(AI_TEAM)); } catch(_) {}
  if (typeof db !== 'undefined' && db)
    db.ref('dok-peyi/ai_agents').set(AI_TEAM).catch(console.error);
  showToast('✅ Configuration équipe IA enregistrée', 'success');
}

let AI_TEAM = loadAIAgents();

// Attribue automatiquement les agents IA selon le statut de la demande
function _assignAI(d, newStatus) {
  d._aiTeam = d._aiTeam || {};
  const now = new Date().toISOString();
  // Lucas — accueil (à la création)
  if (!d._aiTeam.accueil) {
    d._aiTeam.accueil = { aiId: 'lucas', at: d.date || now, label: 'Demande reçue et collectée' };
  }
  // Emma — génération
  if ((newStatus === 'processing' || newStatus === 'generated') && !d._aiTeam.generation) {
    d._aiTeam.generation = { aiId: 'emma', at: now, label: 'Document généré' };
  }
  // Viktor — vérification
  if ((newStatus === 'a_verifier' || newStatus === 'valide_manager' || newStatus === 'correction_demandee') && !d._aiTeam.verification) {
    d._aiTeam.verification = { aiId: 'viktor', at: now, label: 'Contrôle qualité en cours' };
  }
  // Sofia — optimisation finale
  if ((newStatus === 'pret_paiement' || newStatus === 'delivered') && !d._aiTeam.optimisation) {
    d._aiTeam.optimisation = { aiId: 'sofia', at: now, label: 'Document optimisé et finalisé' };
  }
  return d._aiTeam;
}

const PRICES_DEFAULT = { cv: 8, lettre: 5, dossier: 12, courrier: 7, sejour: 15, impot: 10, naturalisation: 20 };
const SERVICE_NAMES  = { cv: 'CV Professionnel', lettre: 'Lettre de motivation', dossier: 'Dossier administratif', courrier: 'Courrier officiel', sejour: 'Titre de séjour', impot: 'Avis d\'impôt', naturalisation: 'Naturalisation' };
const SERVICE_ICONS  = { cv: '📄', lettre: '✉️', dossier: '📁', courrier: '📮', sejour: '🛂', impot: '🧾', naturalisation: '🇫🇷' };

const STATUT_LABELS = {
  /* ── New pipeline statuses ── */
  submitted:       'Soumis',
  processing:      'Génération IA',
  generated:       'Généré',
  pending_payment: 'Paiement en cours',
  paid:            'Payé',
  needs_review:    'À vérifier',
  delivered:       'Livré',
  failed:          'Échec',
  /* ── Legacy statuses (kept for existing orders) ── */
  en_attente: 'En attente',
  en_cours:   'En cours',
  terminé:    'Terminé',
  annulé:     'Annulé',
  /* ── QC workflow ── */
  assignee:            'Assignée',
  en_redaction:        'En rédaction',
  a_verifier:          'À vérifier',
  valide_manager:      'Validé ✓',
  correction_demandee: 'Correction demandée',
  pret_paiement:       'Prêt paiement'
};
const STATUT_CLASS = {
  /* ── New pipeline statuses ── */
  submitted:       'badge-submitted',
  processing:      'badge-processing',
  generated:       'badge-generated',
  pending_payment: 'badge-pending-payment',
  paid:            'badge-paid',
  needs_review:    'badge-needs-review',
  delivered:       'badge-delivered',
  failed:          'badge-failed',
  /* ── Legacy statuses ── */
  en_attente: 'badge-attente',
  en_cours:   'badge-cours',
  terminé:    'badge-termine',
  annulé:     'badge-annule',
  /* ── QC workflow ── */
  assignee:            'badge-assignee',
  en_redaction:        'badge-redaction',
  a_verifier:          'badge-verifier',
  valide_manager:      'badge-valide',
  correction_demandee: 'badge-correction',
  pret_paiement:       'badge-pret'
};

// "Completed" covers both legacy ('terminé') and pipeline ('delivered', 'paid') terminal states.
const DONE_STATUSES    = new Set(['terminé', 'delivered', 'paid', 'pret_paiement', 'valide_manager']);
// "Pending" covers anything waiting on admin attention.
const PENDING_STATUSES = new Set(['en_attente','submitted','pending_payment','needs_review','a_verifier','correction_demandee']);

// ===== ÉTAT =====
const APP = {
  section:      'dashboard',
  filters:      { search: '', statut: 'all', service: 'all' },
  charts:       {},
  modalId:      null,
  generatedCV:  null
};
let currentUser = null;  // { user, nom, role, color }

// ===== DONNÉES =====
function safeParse(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch(e) { localStorage.removeItem(key); return null; }
}
let demandes    = safeParse('dok_demandes') || [];
let services    = safeParse('dok_services') || buildDefaultServices();
let aiPrompts   = safeParse('dok_ai_prompts') || buildDefaultPrompts();
let _demFilters = { statut: 'all', service: 'all' };

/* ── Firebase DB handle ── */
let db = null;

/* ── Connexion Firebase anticipée (disponible dès la page de login) ── */
(function earlyFirebaseInit() {
  try {
    if (typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined'
        && !FIREBASE_CONFIG.apiKey.startsWith('REMPLACE')) {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
    }
  } catch(e) { /* Firebase non configuré */ }
})();

/* ============================================================
   PROMPTS IA PAR DÉFAUT
   ============================================================ */
function buildDefaultPrompts() {
  const FOOTER = '\nRéponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.';
  return {
    cv_scratch: `Tu es un expert en design et rédaction de CV professionnels.
Crée un CV complet, moderne et professionnel en HTML autonome (CSS inline, sans JS, format A4 prêt à imprimer).

=== DONNÉES DU CLIENT ===
Nom complet : {{nom}}
Ville : {{ville}}
Email : {{email}}
Téléphone : {{tel}}
Disponibilité : {{disponibilite}}
Poste recherché : {{poste}}
Secteur d'activité : {{secteur}}
Niveau d'études : {{niveauEtudes}}
Permis de conduire : {{permis}}
Langues parlées : {{langues}}
Expériences : {{experience}}
Formation / Diplômes : {{formation}}
Compétences : {{competences}}
Informations supplémentaires : {{infos}}

=== DESIGN ===
- En-tête fond bleu marine #1e3a5f : nom en grand, poste, ville, email, téléphone
- Corps blanc : Expériences → Formation → Compétences → Langues → Infos
- Typographie system-ui/Arial, accents #2563eb pour les titres de section
- Séparateurs subtils, layout 1-2 pages
- @media print : marges 15mm${FOOTER}`,

    cv_improve: `Tu es un expert en design et rédaction de CV professionnels.
Un client souhaite améliorer et moderniser son CV existant.

=== INFORMATIONS DU CLIENT ===
Nom complet : {{nom}}
Email : {{email}}
Téléphone : {{tel}}

=== SOUHAITS DE MODIFICATION ===
{{note}}

Génère un CV HTML moderne et professionnel en appliquant toutes les modifications demandées.

=== DESIGN ===
- En-tête fond bleu marine #1e3a5f : nom en grand, email, téléphone
- Corps blanc : Expériences → Formation → Compétences
- Typographie system-ui/Arial, accents #2563eb pour les titres de section
- @media print : marges 15mm${FOOTER}`,

    lettre: `Tu es un expert en rédaction de lettres de motivation professionnelles.
Rédige une lettre de motivation complète, personnalisée et convaincante en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS DU CANDIDAT ===
Nom complet : {{nom}}
Email : {{email}}
Téléphone : {{tel}}
Poste visé : {{poste}}
Entreprise : {{entreprise}}
Expérience : {{experience}}
Motivation : {{motivation}}

=== STRUCTURE ===
- Coordonnées candidat (haut gauche), date + destinataire (haut droite)
- Objet en gras
- Corps : Introduction percutante → Pourquoi ce poste → Ce que j'apporte → Conclusion
- Formule de politesse professionnelle, signature
- Format A4, marges 25mm, typographie system-ui/Arial${FOOTER}`,

    dossier: `Tu es un expert en démarches administratives (France / Guyane).
Génère un document d'aide complet et pratique en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS ===
Nom complet : {{nom}}
Email : {{email}}
Téléphone : {{tel}}
Type de dossier : {{type}}
Besoin : {{description}}
Documents disponibles : {{documents}}

=== CONTENU ===
1. Titre + résumé de la situation du client
2. Liste des documents à fournir avec cases à cocher ☐
3. Étapes numérotées à suivre (claires et concrètes)
4. Conseils pratiques et délais habituels
5. Coordonnées des organismes utiles (CAF, CPAM, Pôle Emploi, Préfecture…)

- En-tête fond bleu marine #1e3a5f, typographie system-ui/Arial, accents #2563eb
- @media print : marges 15mm${FOOTER}`,

    courrier: `Tu es un expert en rédaction de courriers officiels pour l'administration française.
Rédige un courrier formel, clair et professionnel en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS ===
Expéditeur : {{nom}}
Email : {{email}}
Téléphone : {{tel}}
Destinataire : {{destinataire}}
Objet : {{objet}}
Situation / Demande : {{description}}

=== STRUCTURE ===
- Coordonnées expéditeur (haut gauche), ville et date (haut droite)
- Coordonnées destinataire, Objet en gras
- Corps : contexte → demande précise → justification
- Formule de politesse officielle, signature
- Format A4, marges 25mm, ton officiel adapté à l'administration${FOOTER}`,

    sejour: `Tu es un assistant administratif professionnel spécialisé en droit des étrangers (Guyane / France).
Génère un document d'aide personnalisé en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS ===
Nom complet : {{nom}}
Email : {{email}}
Téléphone : {{tel}}
Nationalité : {{nationalite}}
Type de demande : {{choix}}
Situation actuelle : {{situation}}
Documents disponibles : {{documents}}

=== CONTENU ===
1. Résumé de la situation et du type de demande
2. Démarches recommandées étape par étape (numérotées)
3. Checklist des documents à préparer ☐
4. Organismes compétents en Guyane (Préfecture de Guyane, OFII, France Services…) avec adresses et horaires
5. Délais habituels et points de vigilance importants
6. Bandeau d'avertissement visible : "Ce document est une aide informatique. Il ne remplace pas un conseil juridique professionnel."

- En-tête fond rouge #b91c1c, accents #ef4444, corps blanc, @media print marges 15mm
- Inclure un disclaimer légal en bas de page${FOOTER}`,

    impot: `Tu es un assistant administratif professionnel spécialisé en fiscalité française et en aides sociales (Guyane / France).
Génère un document d'aide personnalisé en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS DU CLIENT ===
Nom complet : {{nom}}
Email : {{email}}
Téléphone : {{tel}}
Type de demande : {{choix}}
Type d'avis / Objet : {{type}} {{objet}}
Revenus annuels : {{revenus}}
Situation familiale : {{situation}}
Demande / Description : {{description}}
Destinataire : {{destinataire}}

=== CONTENU SELON LE TYPE DE DEMANDE ===
• "comprendre" → Explication pédagogique de l'avis d'imposition, signification des montants, droits et recours possibles
• "aide" → Analyse des aides et exonérations auxquelles le client peut prétendre (CAF, réductions fiscales, délais), démarches pour les obtenir
• "courrier" → Courrier officiel formel adressé aux services fiscaux (structure réglementaire française complète, marges 25mm)

Pour tous les cas : inclure les coordonnées utiles (DGFIP Guyane, Centre des impôts de Cayenne, numéro 0809 401 401, impots.gouv.fr).

- En-tête fond bleu #0c4a6e, accents #0369a1, corps blanc, @media print marges 15mm${FOOTER}`,

    naturalisation: `Tu es un assistant administratif professionnel spécialisé en procédures de naturalisation française (droit des étrangers, Guyane).
Génère un document d'aide complet et personnalisé en HTML (CSS inline, sans JS, format A4).

=== INFORMATIONS DU CLIENT ===
Nom complet : {{nom}}
Email : {{email}}
Téléphone : {{tel}}
Nationalité actuelle : {{nationalite}}
Durée de résidence en France : {{duree}}
Situation familiale : {{famille}}
Situation professionnelle : {{travail}}
Type de demande : {{choix}}
Informations complémentaires : {{situation}}
Documents disponibles : {{documents}}
Parcours en France : {{parcours}}
Motivation / Valeurs : {{motivation}}

=== CONTENU SELON LE TYPE DE DEMANDE ===
• "situation" (vérification éligibilité) → Analyse des critères légaux + évaluation personnalisée + recommandations claires (éligible / non éligible / à vérifier)
• "dossier" (préparation) → Checklist complète ☐ des documents requis + étapes chronologiques numérotées + délais habituels
• "lettre" (lettre d'intégration) → Lettre de motivation officielle au format épistolaire (HTML A4, 1-2 pages)

Points importants pour tous les cas :
1. Critères légaux de naturalisation (5 ans de résidence, intégration, moralité, niveau de français B1)
2. Spécificités Guyane (Préfecture de Guyane à Cayenne, sous-préfecture Saint-Laurent-du-Maroni)
3. Coordonnées : Préfecture de Guyane, France Services, OFII Guyane
4. Délais habituels (12 à 24 mois après dépôt)
5. Bandeau d'avertissement visible : "Ce document est une aide informatique. Il ne remplace pas un conseil juridique ou une consultation officielle à la préfecture."

- En-tête fond bleu marine #1e3a5f avec bandeau tricolore subtil, accents #2563eb, corps blanc, @media print marges 15mm${FOOTER}`
  };
}

function buildPromptFromTemplate(template, demande) {
  const d = demande.details || {};
  const vars = {
    nom:           `${demande.prenom || ''} ${demande.nom || ''}`.trim(),
    email:         demande.email    || '',
    tel:           demande.whatsapp || '',
    ville:         d['cv-ville']          || demande.ville  || '',
    disponibilite: d['cv-disponibilite']  || '',
    poste:         d['cv-poste']          || d['l-poste']       || 'Non précisé',
    secteur:       d['cv-secteur']        || '',
    niveauEtudes:  d['cv-niveau-etudes']  || '',
    langues:       d['cv-langues']        || '',
    permis:        d['cv-permis']         || '',
    experience:    d['cv-experience']     || d['l-experience']  || 'Non précisée',
    formation:     d['cv-formation']      || 'Non précisée',
    competences:   d['cv-competences']    || 'Non précisées',
    infos:         d['cv-infos']          || '',
    note:          d['cv-note']           || 'Moderniser le design, rendre plus professionnel',
    entreprise:    d['l-entreprise']      || 'Non précisée',
    motivation:    d['l-motivation']      || 'Non précisée',
    type:          d['d-type']            || 'Non précisé',
    description:   d['d-description']    || d['c-description'] || d['description']  || 'Non précisée',
    documents:     d['d-documents']       || d['documents']    || 'Non précisés',
    destinataire:  d['c-destinataire']    || 'Non précisé',
    objet:         d['c-objet']           || 'Non précisé',
    nationalite:   d['nationalite']       || 'Non précisée',
    situation:     d['situation']         || 'Non précisée',
    choix:         d['sw-choice']         || '',
    revenus:       d['revenus']           || 'Non précisés',
    duree:         d['duree']             || 'Non précisée',
    famille:       d['famille']           || 'Non précisée',
    travail:       d['travail']           || 'Non précisé',
    parcours:      d['parcours']          || 'Non précisé'
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : '');
}

/* ============================================================
   GÉNÉRATION DES DONNÉES MOCK
   ============================================================ */
function generateMockData() {
  const NOMS    = ['Toussaint', 'Rivière', 'Cambronne', 'Delgado', 'Blaise', 'Théodore',
                   'Mathurin', 'Coutou', 'Fleurentin', 'Abati', 'Mondésir', 'Bernabé',
                   'Cyprien', 'Régis', 'Lafleur'];
  const PRENOMS = ['Marlène', 'Kevin', 'Fatima', 'Jean-Baptiste', 'Lucie', 'Marc',
                   'Sophie', 'David', 'Isabelle', 'Patrick', 'Nadia', 'Franck',
                   'Sabrina', 'Rodrigue', 'Céline', 'Thierry', 'Vanessa'];
  const SVCS    = ['cv', 'lettre', 'dossier', 'courrier'];
  // Statuts pondérés — plus de "terminé" pour avoir des stats réalistes
  const STATUTS = ['en_attente', 'en_attente', 'en_cours', 'terminé', 'terminé', 'terminé'];
  const VILLES  = ['Cayenne', 'Saint-Laurent', 'Kourou', 'Rémire-Montjoly', 'Macouria'];

  const data = [];
  const now  = new Date();

  for (let i = 0; i < 28; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 32));
    const svc    = SVCS[Math.floor(Math.random() * SVCS.length)];
    const prenom = PRENOMS[Math.floor(Math.random() * PRENOMS.length)];
    const nom    = NOMS[Math.floor(Math.random() * NOMS.length)];
    const h      = 8 + Math.floor(Math.random() * 11);
    const m      = Math.floor(Math.random() * 60);

    data.push({
      id:       i + 1,
      date:     d.toISOString().split('T')[0],
      heure:    `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
      prenom,
      nom,
      email:    `${normalize(prenom)}.${normalize(nom)}@email.com`,
      whatsapp: Math.random() > 0.45 ? `+594 694 ${rand2()} ${rand2()} ${rand2()}` : '',
      ville:    VILLES[Math.floor(Math.random() * VILLES.length)],
      service:  svc,
      montant:  PRICES_DEFAULT[svc],
      statut:   STATUTS[Math.floor(Math.random() * STATUTS.length)],
      details:  buildFakeDetails(svc, prenom),
      note:     ''
    });
  }

  data.sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure));
  data.forEach((d, i) => { d.id = i + 1; });
  return data;
}

function buildFakeDetails(svc, prenom) {
  const map = {
    cv: {
      'Poste recherché':   'Employé(e) polyvalent(e)',
      'Expériences':       `${prenom} a travaillé 2 ans dans le commerce.`,
      'Formation':         'BAC Pro Commerce'
    },
    lettre: {
      'Poste visé':        'Vendeur(se) en grande surface',
      'Entreprise':        'Leclerc Cayenne',
      'Motivation':        'Sérieux(se), motivé(e), disponible immédiatement.'
    },
    dossier: {
      'Type de dossier':   'CAF / Aide sociale',
      'Besoin':            'Demande d\'allocation logement.'
    },
    courrier: {
      'Destinataire':      'Mairie de Cayenne',
      'Objet':             'Demande d\'information sur les aides locales',
      'Description':       'Besoin d\'informations sur les dispositifs d\'aide à l\'emploi.'
    }
  };
  return map[svc] || {};
}

function buildDefaultServices() {
  return {
    cv:      { name: 'CV Professionnel',      icon: '📄', price: 8,  active: true,  desc: 'Un CV professionnel, clair et efficace pour décrocher un emploi.' },
    lettre:  { name: 'Lettre de motivation',  icon: '✉️', price: 5,  active: true,  desc: 'Une lettre personnalisée et convaincante pour ta candidature.' },
    dossier: { name: 'Dossier administratif', icon: '📁', price: 12, active: true,  desc: 'Accompagnement complet pour monter ton dossier CAF, logement, emploi…' },
    courrier:{ name: 'Courrier officiel',      icon: '📮', price: 7,  active: true,  desc: 'Rédaction de courriers pour mairies, préfectures et administrations.' },
    sejour:        { name: 'Titre de séjour',  icon: '🛂', price: 15, active: true, desc: 'Accompagnement pour les démarches de titre de séjour en Guyane.' },
    impot:         { name: 'Avis d\'impôt',    icon: '🧾', price: 10, active: true, desc: 'Aide à la compréhension de l\'avis d\'imposition, démarches liées et courrier fiscal.' },
    naturalisation:{ name: 'Naturalisation',  icon: '🇫🇷', price: 20, active: true, desc: 'Vérification éligibilité, préparation du dossier et lettre d\'intégration.' }
  };
}

function normalize(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,''); }
function rand2() { return String(Math.floor(Math.random() * 90 + 10)); }

/* ============================================================
   AUTHENTIFICATION MULTI-UTILISATEURS
   ============================================================ */
function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  const app = document.getElementById('admin-app');
  app.style.display = 'flex';
  app.classList.add('visible');
  app.removeAttribute('aria-hidden');
}

function hideApp() {
  document.getElementById('login-screen').style.display = 'flex';
  const app = document.getElementById('admin-app');
  app.style.display = 'none';
  app.classList.remove('visible');
  app.setAttribute('aria-hidden', 'true');
}

/* ============================================================
   MOTS DE PASSE — Hachage + Stockage
   ============================================================ */
async function hashPass(password) {
  const data = new TextEncoder().encode(password + ':dok-peyi-salt');
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getStoredHash(username) {
  // Firebase en priorité si dispo
  if (db) {
    try {
      const snap = await db.ref('dok-peyi/users/' + username + '/passHash').once('value');
      if (snap.val()) {
        localStorage.setItem('dok_pass_' + username, snap.val()); // cache local
        return snap.val();
      }
    } catch(e) {}
  }
  return localStorage.getItem('dok_pass_' + username) || null;
}

async function storeHash(username, hash) {
  try { localStorage.setItem('dok_pass_' + username, hash); } catch(e) {}
  if (db) db.ref('dok-peyi/users/' + username + '/passHash').set(hash).catch(() => {});
}

/* ============================================================
   LOGIN
   ============================================================ */
async function adminLogin(e) {
  if (e) e.preventDefault();
  const userEl = document.getElementById('lg-user');
  const passEl = document.getElementById('lg-pass');
  const errEl  = document.getElementById('lg-error');
  const btn    = document.getElementById('btn-login');

  const u = (userEl?.value || '').trim().toLowerCase();
  const p = passEl?.value || '';

  if (errEl) errEl.style.display = 'none';
  if (btn)   { btn.textContent = 'Connexion…'; btn.disabled = true; }

  const found = USERS.find(x => x.user === u);
  if (!found) { _loginError(errEl, btn, passEl); return; }

  let ok = false, isFirstLogin = false;
  try {
    const storedHash = await getStoredHash(u);
    if (storedHash) {
      // Mot de passe personnalisé — comparer le hash
      ok = (await hashPass(p)) === storedHash;
    } else {
      // Aucun mot de passe personnalisé → vérifier le mot de passe temporaire
      ok = (p === found.pass);
      isFirstLogin = ok;
    }
  } catch(err) {
    ok = (p === found.pass);  // fallback si Web Crypto indisponible
  }

  if (ok) {
    currentUser = { ...found };
    try { localStorage.setItem('dok_auth_user', JSON.stringify(currentUser)); } catch(ex) {}
    showApp();
    updateUserUI();
    init();
    if (isFirstLogin) setTimeout(showChangePassModal, 900);
  } else {
    _loginError(errEl, btn, passEl);
  }
}

function _loginError(errEl, btn, passEl) {
  if (errEl) { errEl.textContent = 'Identifiant ou mot de passe incorrect.'; errEl.style.display = 'block'; }
  if (btn)   { btn.textContent = 'Se connecter →'; btn.disabled = false; }
  if (passEl) { passEl.value = ''; passEl.focus(); }
}

/* ============================================================
   MODALE — Choisir / Changer son mot de passe
   ============================================================ */
function showChangePassModal() {
  let m = document.getElementById('chpass-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'chpass-modal';
    m.innerHTML = `
      <div class="chpm-bg" onclick="skipPassChange()"></div>
      <div class="chpm-card">
        <div class="chpm-icon">🔑</div>
        <h2 class="chpm-title">Choisis ton mot de passe</h2>
        <p class="chpm-sub">Crée un mot de passe personnel sécurisé.<br>Tu l'utiliseras à toutes tes prochaines connexions.</p>
        <div class="form-group">
          <label style="display:block;font-size:.82rem;font-weight:700;color:var(--gray-700);margin-bottom:7px">Nouveau mot de passe *</label>
          <input type="password" id="chp-new" class="chpm-input" placeholder="Minimum 8 caractères" autocomplete="new-password">
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label style="display:block;font-size:.82rem;font-weight:700;color:var(--gray-700);margin-bottom:7px">Confirmer *</label>
          <input type="password" id="chp-confirm" class="chpm-input" placeholder="Répète le mot de passe" autocomplete="new-password">
        </div>
        <p id="chp-err" style="color:#ef4444;font-size:.82rem;margin-bottom:12px;display:none;background:#fef2f2;border-radius:8px;padding:10px"></p>
        <button class="btn-modal-save" style="width:100%;font-size:.9rem;padding:14px" onclick="saveNewPass()">
          <span id="chp-btn-lbl">Enregistrer mon mot de passe →</span>
        </button>
        <button class="btn-modal-cancel" style="width:100%;margin-top:8px;font-size:.82rem" onclick="skipPassChange()">Plus tard</button>
      </div>`;
    document.body.appendChild(m);
  }
  m.style.display = 'flex';
  requestAnimationFrame(() => m.classList.add('open'));
  document.getElementById('chp-new')?.focus();
}

async function saveNewPass() {
  const newPass = document.getElementById('chp-new')?.value    || '';
  const confirm = document.getElementById('chp-confirm')?.value || '';
  const errEl   = document.getElementById('chp-err');
  const btnLbl  = document.getElementById('chp-btn-lbl');

  if (errEl) errEl.style.display = 'none';

  if (newPass.length < 8) {
    errEl.textContent = '❌ Le mot de passe doit faire au moins 8 caractères.';
    errEl.style.display = 'block'; return;
  }
  if (newPass !== confirm) {
    errEl.textContent = '❌ Les deux mots de passe ne correspondent pas.';
    errEl.style.display = 'block'; return;
  }

  if (btnLbl) btnLbl.textContent = 'Enregistrement…';
  const saveBtn = document.querySelector('#chpass-modal .btn-modal-save');
  if (saveBtn) saveBtn.disabled = true;

  try {
    const hash = await hashPass(newPass);
    await storeHash(currentUser.user, hash);
    closePassModal();
    showToast(`✅ Mot de passe enregistré, ${currentUser.nom} !`, 'success');
  } catch(err) {
    if (errEl) { errEl.textContent = '❌ Erreur : ' + err.message; errEl.style.display = 'block'; }
    if (saveBtn) saveBtn.disabled = false;
    if (btnLbl)  btnLbl.textContent = 'Enregistrer mon mot de passe →';
  }
}

function skipPassChange() {
  closePassModal();
  showToast('Tu pourras changer ton mot de passe via "🔑 Changer mot de passe" dans la barre latérale.', 'success');
}

function closePassModal() {
  const m = document.getElementById('chpass-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => { m.style.display = 'none'; }, 300);
}

function logout() {
  if (!confirm('Confirmer la déconnexion ?')) return;
  try { localStorage.removeItem('dok_auth_user'); } catch(ex) {}
  currentUser = null;
  hideApp();
  const uEl = document.getElementById('lg-user');
  const pEl = document.getElementById('lg-pass');
  if (uEl) uEl.value = '';
  if (pEl) pEl.value = '';
}

/* Met à jour tous les éléments UI avec les infos de l'utilisateur connecté */
function updateUserUI() {
  if (!currentUser) return;
  const initial  = currentUser.nom.charAt(0).toUpperCase();
  const roleLabel = currentUser.role === 'admin' ? '👑 Admin' : '🔧 Manager';
  const allowed   = ROLE_SECTIONS[currentUser.role] || [];

  // Sidebar
  const av = document.getElementById('sb-avatar');
  if (av) { av.textContent = initial; av.style.background = currentUser.color; }
  const nm = document.getElementById('sb-name');
  if (nm) nm.textContent = currentUser.nom;
  const rl = document.getElementById('sb-role');
  if (rl) rl.textContent = roleLabel;

  // Topbar badge
  const ta = document.getElementById('topbar-avatar');
  if (ta) { ta.textContent = initial; ta.style.background = currentUser.color; }
  const tn = document.getElementById('topbar-nom');
  if (tn) tn.textContent = currentUser.nom;
  const tb = document.getElementById('topbar-role-badge');
  if (tb) {
    tb.textContent = currentUser.role === 'admin' ? 'Admin' : 'Manager';
    tb.style.background = currentUser.role === 'admin' ? '#eff6ff' : '#fef3c7';
    tb.style.color       = currentUser.role === 'admin' ? '#2563eb' : '#d97706';
  }

  // Masquer les nav admin-only si manager
  document.querySelectorAll('.nav-admin-only').forEach(el => {
    el.style.display = currentUser.role === 'admin' ? '' : 'none';
  });
}

/* ============================================================
   HORLOGE + CALENDRIER TOPBAR
   ============================================================ */
function startClock() {
  function tick() {
    const now  = new Date();
    const tEl  = document.getElementById('topbar-time');
    const dEl  = document.getElementById('topbar-date-lbl');
    if (tEl) tEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (dEl) dEl.textContent = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  tick();
  setInterval(tick, 1000);

  // Fermer le calendrier en cliquant ailleurs
  document.addEventListener('click', function(e) {
    const pop = document.getElementById('cal-pop');
    const clk = document.getElementById('topbar-clock');
    if (pop && !pop.contains(e.target) && clk && !clk.contains(e.target)) {
      closeCal();
    }
  });
}

let _calDate = new Date();

function toggleCal() {
  const pop = document.getElementById('cal-pop');
  const clk = document.getElementById('topbar-clock');
  if (!pop) return;
  const isOpen = pop.classList.contains('visible');
  if (isOpen) {
    closeCal();
  } else {
    _calDate = new Date();
    renderCal(_calDate.getFullYear(), _calDate.getMonth());
    pop.classList.add('visible');
    clk && clk.classList.add('cal-open');
  }
}

function closeCal() {
  const pop = document.getElementById('cal-pop');
  const clk = document.getElementById('topbar-clock');
  pop && pop.classList.remove('visible');
  clk && clk.classList.remove('cal-open');
}

function calNav(dir) {
  _calDate.setMonth(_calDate.getMonth() + dir);
  renderCal(_calDate.getFullYear(), _calDate.getMonth());
}

function calGoToday() {
  _calDate = new Date();
  renderCal(_calDate.getFullYear(), _calDate.getMonth());
}

function renderCal(year, month) {
  const today     = new Date();
  const todayY    = today.getFullYear();
  const todayM    = today.getMonth();
  const todayD    = today.getDate();

  // Header mois/année
  const monthLbl = document.getElementById('cal-month-lbl');
  if (monthLbl) {
    monthLbl.textContent = new Date(year, month, 1)
      .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // Jours de la semaine (L M M J V S D)
  const daysRow = document.getElementById('cal-days-row');
  if (daysRow) {
    const names = ['L','M','M','J','V','S','D'];
    daysRow.innerHTML = names.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  }

  // Points d'événements = jours avec des demandes ce mois
  const eventDays = new Set();
  demandes.forEach(d => {
    if (!d.date) return;
    const dt = new Date(d.date);
    if (dt.getFullYear() === year && dt.getMonth() === month) {
      eventDays.add(dt.getDate());
    }
  });

  // Grille
  const grid   = document.getElementById('cal-grid');
  if (!grid) return;

  const firstDay = new Date(year, month, 1).getDay(); // 0=dim
  const lead     = (firstDay === 0) ? 6 : firstDay - 1; // lundi = 0
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  let cells = '';

  // Jours du mois précédent
  for (let i = lead - 1; i >= 0; i--) {
    cells += `<div class="cal-cell other">${prevDays - i}</div>`;
  }

  // Jours du mois courant
  for (let d = 1; d <= daysInM; d++) {
    const isToday = (year === todayY && month === todayM && d === todayD);
    const hasEv   = eventDays.has(d);
    const cls     = ['cal-cell', isToday ? 'today' : '', hasEv ? 'has-event' : ''].filter(Boolean).join(' ');
    cells += `<div class="${cls}">${d}</div>`;
  }

  // Compléter avec jours suivants
  const total = lead + daysInM;
  const trail = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= trail; d++) {
    cells += `<div class="cal-cell other">${d}</div>`;
  }

  grid.innerHTML = cells;
}

/* ============================================================
   INITIALISATION
   ============================================================ */
function init() {
  // Horloge live dans la topbar
  startClock();

  refreshBadge();
  renderDashboard();

  // Firebase sync temps réel
  initFirebase();

  // Floating chat — accessible partout dans l'admin
  if (typeof fchatInit === 'function') fchatInit();

  // Fallback onglets localStorage
  if (!db) {
    window.addEventListener('storage', function(e) {
      if (e.key !== 'dok_demandes') return;
      demandes = safeParse('dok_demandes') || [];
      refreshBadge();
      if (APP.section === 'dashboard') renderDashboard();
      if (APP.section === 'demandes')  applyFilters();
      showToast('📋 Nouvelle commande reçue !', 'success');
    });
  }
}

/* Auto-login au chargement de la page si session active */
(function autoLogin() {
  if (document.readyState !== 'loading') { _tryAutoLogin(); }
  else { document.addEventListener('DOMContentLoaded', _tryAutoLogin); }
})();

function _tryAutoLogin() {
  try {
    const saved = JSON.parse(localStorage.getItem('dok_auth_user') || 'null');
    if (saved && saved.nom && saved.role) {
      // Vérifier que l'utilisateur existe toujours (au cas où le code a changé)
      const stillValid = USERS.find(u => u.user === saved.user && u.role === saved.role);
      if (stillValid) {
        currentUser = { ...saved };
        showApp();
        updateUserUI();
        init();
      }
    }
  } catch(ex) {}
}

// Auth gérée par le script inline dans index.html

/* ============================================================
   NAVIGATION
   ============================================================ */
const SECTION_TITLES = {
  dashboard: 'Tableau de bord',
  demandes:  'Demandes',
  services:  'Services & Tarifs',
  ia:        'Configuration IA',
  stats:     'Statistiques',
  workspace: 'Workspace',
  controle:  'Contrôle qualité',
  agents:    'Équipe IA'
};

function showSection(name, navEl) {
  // Contrôle de rôle
  const allowed = ROLE_SECTIONS[currentUser?.role] || ['dashboard'];
  if (!allowed.includes(name)) {
    showToast('🔒 Accès réservé aux administrateurs', 'error');
    return false;
  }

  // Firebase maintient demandes à jour en temps réel
  if (!db) demandes = safeParse('dok_demandes') || [];

  // Cacher toutes les sections
  document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`s-${name}`).classList.add('active');

  // Mettre à jour la nav sidebar
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  else {
    const target = document.querySelector(`.nav-item[onclick*="'${name}'"]`);
    if (target) target.classList.add('active');
  }

  // Titre topbar
  document.getElementById('topbar-title').textContent = SECTION_TITLES[name] || name;

  APP.section = name;

  // Rendu à la demande
  if (name === 'dashboard') renderDashboard();
  if (name === 'demandes')  renderDemandes();
  if (name === 'services')  renderServices();
  if (name === 'ia')        renderAIConfig();
  if (name === 'stats')     renderStats();
  if (name === 'workspace') renderWorkspace();
  if (name === 'controle')  renderQualiteControl();
  if (name === 'agents')    renderAgentsPanel();

  // Fermer la sidebar sur mobile
  closeSidebar();

  return false;
}

/* ============================================================
   SIDEBAR MOBILE
   ============================================================ */
function toggleSidebar() {
  if (window.innerWidth <= 1024) {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sbOverlay').classList.toggle('visible');
  } else {
    document.getElementById('admin-app').classList.toggle('sb-collapsed');
  }
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('visible');
}

/* ============================================================
   BADGE DEMANDES EN ATTENTE
   ============================================================ */
function refreshBadge() {
  // Count orders that need admin attention (new pipeline + legacy)
  const ATTENTION = new Set(['submitted', 'paid', 'needs_review', 'en_attente']);
  const count = demandes.filter(d => ATTENTION.has(d.statut)).length;
  const badge = document.getElementById('nb-pending');
  const dot   = document.getElementById('notif-dot');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
    dot.style.display = 'block';
  } else {
    badge.style.display = 'none';
    dot.style.display = 'none';
  }
  // Badge contrôle qualité
  const nbQC = demandes.filter(d => d.statut === 'a_verifier' || d.statut === 'correction_demandee').length;
  const elQC = document.getElementById('nb-controle');
  if (elQC) { elQC.textContent = nbQC; elQC.style.display = nbQC ? 'flex' : 'none'; }
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const total = demandes.length;

  const termine = demandes.filter(d => DONE_STATUSES.has(d.statut)).length;
  const attente = demandes.filter(d => PENDING_STATUSES.has(d.statut)).length;
  const revenue = demandes
    .filter(d => DONE_STATUSES.has(d.statut))
    .reduce((s, d) => s + (d.montant || 0), 0);

  // KPIs
  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card blue">
      <div class="kpi-top">
        <div class="kpi-label">Total demandes</div>
        <div class="kpi-icon">📋</div>
      </div>
      <div class="kpi-value">${total}</div>
      <div class="kpi-sub">Depuis le début</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-top">
        <div class="kpi-label">Revenus générés</div>
        <div class="kpi-icon">💶</div>
      </div>
      <div class="kpi-value">${revenue}€</div>
      <div class="kpi-sub">${termine} commandes terminées</div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-top">
        <div class="kpi-label">En attente</div>
        <div class="kpi-icon">⏳</div>
      </div>
      <div class="kpi-value">${attente}</div>
      <div class="kpi-sub">À traiter</div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-top">
        <div class="kpi-label">Taux de réussite</div>
        <div class="kpi-icon">📈</div>
      </div>
      <div class="kpi-value">${total ? Math.round((termine / total) * 100) : 0}%</div>
      <div class="kpi-sub">Demandes complétées</div>
    </div>
  `;

  // Graphiques
  renderRevenueChart();
  renderDonutChart();

  // Dernières demandes (compact)
  const recent = [...demandes].slice(0, 5);
  renderRecentCompact('recent-list', recent);
}

/* ============================================================
   DASHBOARD : LISTE COMPACTE RÉCENTE
   ============================================================ */
function renderRecentCompact(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!data.length) {
    el.innerHTML = '<div class="dash-dem-empty">📭 Aucune demande pour le moment</div>';
    return;
  }

  function relTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60)    return 'À l\'instant';
    if (diff < 3600)  return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + ' h';
    return Math.floor(diff / 86400) + ' j';
  }

  el.innerHTML = '<div class="dash-dem-list">' + data.map(d => `
    <div class="dash-dem-row" onclick="openModal(${d.id})">
      <span class="dash-dem-svc">${SERVICE_ICONS[d.service] || '📄'}</span>
      <div class="dash-dem-info">
        <div class="dash-dem-name">${escHtml(d.prenom || '')} ${escHtml(d.nom || '')}</div>
        <div class="dash-dem-meta">
          <span class="dash-dem-type">${SERVICE_NAMES[d.service] || d.service}</span>
          <span class="dash-dem-dot"></span>
          <span class="dash-dem-time">${relTime(d.date)}</span>
        </div>
      </div>
      <div class="dash-dem-right">
        <span class="badge ${STATUT_CLASS[d.statut] || ''}">${STATUT_LABELS[d.statut] || d.statut}</span>
        <span class="dash-dem-amount">${d.montant}€</span>
      </div>
    </div>
  `).join('') + '</div>';
}

/* ============================================================
   CHART : REVENUS 7 JOURS
   ============================================================ */
function renderRevenueChart() {
  const labels   = [];
  const values   = [];
  const now      = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const str = d.toISOString().split('T')[0];
    const rev = demandes
      .filter(dm => dm.date === str && DONE_STATUSES.has(dm.statut))
      .reduce((s, dm) => s + (dm.montant || 0), 0);
    labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    values.push(rev);
  }

  destroyChart('revenue');
  const ctx = document.getElementById('ch-revenue');
  if (!ctx) return;
  APP.charts.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenus (€)',
        data: values,
        borderColor:     '#2563eb',
        backgroundColor: 'rgba(37,99,235,.1)',
        borderWidth: 2.5,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { callback: v => v + '€', font: { size: 11 } }
        },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

/* ============================================================
   CHART : DONUT PAR SERVICE
   ============================================================ */
function renderDonutChart() {
  const counts = { cv: 0, lettre: 0, dossier: 0, courrier: 0, sejour: 0 };
  demandes.forEach(d => { if (counts[d.service] !== undefined) counts[d.service]++; });

  destroyChart('donut');
  const ctx = document.getElementById('ch-donut');
  if (!ctx) return;

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];
  const keys   = Object.keys(counts);

  APP.charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: keys.map(k => SERVICE_NAMES[k]),
      datasets: [{
        data: keys.map(k => counts[k]),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false } }
    }
  });

  // Légende custom
  const legend = document.getElementById('donut-legend');
  if (legend) {
    legend.innerHTML = keys.map((k, i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${colors[i]}"></div>
        <span>${SERVICE_NAMES[k]}</span>
        <strong style="margin-left:auto">${counts[k]}</strong>
      </div>
    `).join('');
  }
}

function destroyChart(name) {
  if (APP.charts[name]) {
    APP.charts[name].destroy();
    delete APP.charts[name];
  }
}

/* ============================================================
   RENDER TABLE GÉNÉRIQUE
   ============================================================ */
function renderTable(containerId, data, compact) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Aucune demande trouvée</p>
      </div>`;
    return;
  }

  const rows = data.map(d => `
    <tr>
      <td>#${d.id}</td>
      <td>
        <div>${formatDate(d.date)}</div>
        <div style="font-size:.75rem;color:var(--gray-400)">${d.heure}</div>
      </td>
      <td>
        <div class="client-name">${escHtml(d.prenom)} ${escHtml(d.nom)}</div>
        <div class="client-email">${escHtml(d.email)}</div>
      </td>
      <td>${SERVICE_ICONS[d.service] || ''} ${SERVICE_NAMES[d.service] || d.service}</td>
      <td><strong>${d.montant}€</strong></td>
      <td><span class="badge ${STATUT_CLASS[d.statut] || ''}">${STATUT_LABELS[d.statut] || d.statut}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon" title="Voir détails" onclick="openModal(${d.id})">👁</button>
          ${!compact ? `
          <select class="status-select" onchange="quickChangeStatus(${d.id}, this.value)">
            <optgroup label="Pipeline">
              <option value="submitted"       ${d.statut === 'submitted'       ? 'selected' : ''}>Soumis</option>
              <option value="processing"      ${d.statut === 'processing'      ? 'selected' : ''}>Génération IA</option>
              <option value="generated"       ${d.statut === 'generated'       ? 'selected' : ''}>Généré</option>
              <option value="pending_payment" ${d.statut === 'pending_payment' ? 'selected' : ''}>Paiement en cours</option>
              <option value="paid"            ${d.statut === 'paid'            ? 'selected' : ''}>Payé</option>
              <option value="needs_review"    ${d.statut === 'needs_review'    ? 'selected' : ''}>À vérifier</option>
              <option value="delivered"       ${d.statut === 'delivered'       ? 'selected' : ''}>Livré</option>
              <option value="failed"          ${d.statut === 'failed'          ? 'selected' : ''}>Échec</option>
            </optgroup>
            <optgroup label="Ancien système">
              <option value="en_attente" ${d.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
              <option value="en_cours"   ${d.statut === 'en_cours'   ? 'selected' : ''}>En cours</option>
              <option value="terminé"    ${d.statut === 'terminé'    ? 'selected' : ''}>Terminé</option>
              <option value="annulé"     ${d.statut === 'annulé'     ? 'selected' : ''}>Annulé</option>
            </optgroup>
          </select>
          <button class="btn-icon danger" title="Supprimer" onclick="deleteDemande(${d.id})">🗑</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Client</th>
          <th>Service</th>
          <th>Montant</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ============================================================
   SECTION DEMANDES
   ============================================================ */
function renderDemandes() {
  applyFilters();
}

/* ── Chip filter ── */
function setDemChip(type, val, btn) {
  _demFilters[type] = val;
  const grp = type === 'statut' ? '#dem-chips-statut' : '#dem-chips-service';
  document.querySelectorAll(grp + ' .dem-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const search = (document.getElementById('f-search')  || {}).value || '';
  const sort   = (document.getElementById('dem-sort')  || {}).value || 'desc';

  const WAIT   = new Set(['submitted','en_attente','pending_payment']);
  const ACTIVE = new Set(['processing','generated','en_cours']);
  const REVIEW = new Set(['needs_review']);
  const DONE   = new Set(['paid','delivered','terminé']);
  const DEAD   = new Set(['failed','annulé']);

  let filtered = [...demandes];

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(d =>
      (d.prenom || '').toLowerCase().includes(q) ||
      (d.nom    || '').toLowerCase().includes(q) ||
      (d.email  || '').toLowerCase().includes(q)
    );
  }

  const statut = _demFilters.statut || 'all';
  if (statut !== 'all') {
    const grp = statut === 'wait' ? WAIT : statut === 'active' ? ACTIVE :
                statut === 'review' ? REVIEW : statut === 'done' ? DONE : DEAD;
    filtered = filtered.filter(d => grp.has(d.statut));
  }

  const service = _demFilters.service || 'all';
  if (service !== 'all') filtered = filtered.filter(d => d.service === service);

  if (sort === 'asc')    filtered.sort((a,b) => (a.id||0)-(b.id||0));
  else if (sort === 'amount') filtered.sort((a,b) => (b.montant||0)-(a.montant||0));
  else                   filtered.sort((a,b) => (b.id||0)-(a.id||0));

  const total = demandes.length;
  const shown = filtered.length;
  const cEl = document.getElementById('dem-count');
  const mEl = document.getElementById('dem-meta-count');
  if (cEl) cEl.textContent = total ? (shown < total ? `${shown} / ${total}` : `${total}`) : '';
  if (mEl) mEl.textContent = shown === 0 ? '' : shown === 1 ? '1 demande' : `${shown} demandes`;

  renderDemandesCards('demandes-table', filtered);
}

/* ── Cards renderer ── */
function renderDemandesCards(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!data.length) {
    el.innerHTML = `
      <div class="dem-empty">
        <div class="dem-empty-ico">📭</div>
        <div class="dem-empty-title">Aucune demande trouvée</div>
        <div class="dem-empty-sub">Essaie un autre filtre ou attends<br>une nouvelle commande.</div>
      </div>`;
    return;
  }

  const CARD_CLS = {
    submitted:'st-wait', en_attente:'st-wait', pending_payment:'st-wait',
    processing:'st-active', generated:'st-active', en_cours:'st-active',
    needs_review:'st-review',
    paid:'st-done', delivered:'st-done', terminé:'st-done',
    failed:'st-dead', annulé:'st-dead'
  };

  el.innerHTML = '<div class="dem-list">' + data.map(d => {
    const cc      = CARD_CLS[d.statut] || 'st-wait';
    const nom     = [d.prenom, d.nom].filter(Boolean).join(' ') || '—';
    const stLbl   = STATUT_LABELS[d.statut] || d.statut || '—';
    const svcIco  = SERVICE_ICONS[d.service] || '📄';
    const svcName = SERVICE_NAMES[d.service] || d.service || '—';
    const dateLbl = d.date ? formatDate(d.date) + (d.heure ? ' · ' + d.heure : '') : '—';
    const opts = ['submitted','processing','generated','pending_payment','paid','needs_review','delivered','failed','en_attente','en_cours','terminé','annulé']
      .map(s => `<option value="${s}"${d.statut===s?' selected':''}>${STATUT_LABELS[s]||s}</option>`).join('');

    return `<div class="dem-card ${cc}" onclick="openModal(${d.id})">
      <div class="dem-card-top">
        <span class="dem-st-pill">${stLbl}</span>
        <span class="dem-svc-tag">${svcIco} ${escHtml(svcName)}</span>
      </div>
      <div class="dem-card-body">
        <div class="dem-card-name">${escHtml(nom)}</div>
        <div class="dem-card-email">${escHtml(d.email || '')}</div>
      </div>
      <div class="dem-card-foot">
        <span class="dem-card-date">${dateLbl}</span>
        <span class="dem-card-price">${d.montant || 0}€</span>
        <div class="dem-card-acts" onclick="event.stopPropagation()">
          <button class="dem-act" title="Voir" onclick="openModal(${d.id})">👁</button>
          <select class="dem-st-sel" title="Statut" onchange="quickChangeStatus(${d.id},this.value)">${opts}</select>
          <button class="dem-act del" title="Supprimer" onclick="deleteDemande(${d.id})">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('') + '</div>';
}

/* Journal d'audit — visible dans Firebase Console → dok-peyi/audit */
function auditLog(action, details) {
  if (!currentUser) return;
  const entry = {
    user:    currentUser.nom,
    role:    currentUser.role,
    action,
    details,
    ts:      Date.now(),
    date:    new Date().toLocaleString('fr-FR')
  };
  // Log dans Firebase si disponible
  if (db) db.ref('dok-peyi/audit/' + Date.now()).set(entry).catch(() => {});
  // Log console pour debug
  console.log(`[Audit] ${entry.user} (${entry.role}) — ${action}: ${details}`);
}

function quickChangeStatus(id, newStatus) {
  const dem = demandes.find(d => d.id === id);
  if (!dem) return;
  const oldStatus = dem.statut;
  dem.statut = newStatus;
  _assignAI(dem, newStatus);
  if (db) fbUpdate(id, { statut: newStatus, _aiTeam: dem._aiTeam || null });
  else    saveData();
  auditLog('statut_change', `#${id} ${STATUT_LABELS[oldStatus]} → ${STATUT_LABELS[newStatus]}`);
  refreshBadge();
  showToast(`Statut mis à jour : ${STATUT_LABELS[newStatus]}`, 'success');
}

function deleteDemande(id) {
  if (!confirm('Supprimer cette demande définitivement ?')) return;
  demandes = demandes.filter(d => d.id !== id);
  if (db) fbDelete(id);
  else    saveData();
  auditLog('delete', `Demande #${id} supprimée`);
  refreshBadge();
  applyFilters();
  showToast('Demande supprimée', 'error');
}

/* ============================================================
   MODAL DÉTAIL
   ============================================================ */
function openModal(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d) return;
  APP.modalId = id;

  const SKIP_KEYS = new Set(['cv-actuel', 'cv-fichier', 'cv-choix', 'cv-note']);
  const KEY_LABELS = {
    'cv-poste': 'Poste recherché', 'cv-experience': 'Expériences',
    'cv-formation': 'Formation', 'cv-competences': 'Compétences', 'cv-infos': 'Infos supplémentaires',
    'l-poste': 'Poste visé', 'l-entreprise': 'Entreprise', 'l-experience': 'Expérience', 'l-motivation': 'Motivation',
    'd-type': 'Type de dossier', 'd-description': 'Besoin', 'd-documents': 'Documents disponibles',
    'c-destinataire': 'Destinataire', 'c-objet': 'Objet', 'c-description': 'Description',
    /* Nouveaux champs communs */
    poste: 'Poste', experience: 'Expérience', formation: 'Formation', competences: 'Compétences',
    infos: 'Informations', note: 'Souhaits', entreprise: 'Entreprise', motivation: 'Motivation',
    type: 'Type', description: 'Description', documents: 'Documents', destinataire: 'Destinataire',
    objet: 'Objet', nationalite: 'Nationalité', situation: 'Situation',
    /* Avis d'impôt */
    revenus: 'Revenus annuels',
    /* Naturalisation */
    duree: 'Durée en France', famille: 'Situation familiale', travail: 'Situation professionnelle',
    parcours: 'Parcours en France'
  };
  const detailsHtml = Object.entries(d.details || {})
    .filter(([k]) => !SKIP_KEYS.has(k))
    .map(([k, v]) => `
    <div class="modal-row">
      <span class="modal-key">${KEY_LABELS[k] || k}</span>
      <span class="modal-val">${escHtml(String(v))}</span>
    </div>`).join('');

  const _det          = d.details || {};
  const cvChoix       = _det['cv-choix'] || 'scratch';
  const cvNote        = _det['cv-note']  || '';
  const _cvf          = _det['cv-fichier'];
  const hasCVFile     = _cvf && (_cvf.data || _cvf.key);
  const isImprove     = cvChoix === 'improve';

  /* ── Pipeline section: review alert, payment info, action buttons ── */
  const PIPELINE_STATUSES = new Set(['submitted','processing','generated',
    'pending_payment','paid','needs_review','delivered','failed']);
  const isPipelineOrder = Array.isArray(d._pipeline) && d._pipeline.length > 0
    || PIPELINE_STATUSES.has(d.statut);

  let pipelineSection = '';
  if (isPipelineOrder) {
    // Review alert
    const reviewAlert = (d.reviewRequired && d.reviewReason)
      ? `<div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;
           padding:10px 14px;margin-bottom:12px;font-size:.82rem;color:#991b1b">
           ⚠️ <strong>Revue requise :</strong> ${escHtml(d.reviewReason)}
         </div>`
      : '';

    // Payment badge
    const paymentInfo = d._payment
      ? `<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;
            padding:10px 14px;margin-bottom:12px;font-size:.82rem;color:#166534">
            💳 Paiement confirmé ${new Date(d._payment.confirmedAt).toLocaleString('fr-FR')}${
              d._payment.reference ? ` · Réf : ${escHtml(String(d._payment.reference))}` : ''}${
              d._payment.provider && d._payment.provider !== 'manual'
                ? ` · ${escHtml(d._payment.provider)}` : ''}
         </div>`
      : '';

    // Action buttons based on current status
    let actionBtns = '';
    if (d.statut === 'pending_payment') {
      actionBtns = `<button class="btn-modal-save"
        onclick="pipelineAction(${d.id},'confirm_payment',{provider:'manual'})">
        ✅ Confirmer le paiement
      </button>`;
    } else if (d.statut === 'needs_review') {
      if (d._payment) {
        // Post-payment review — payment already done, just deliver
        actionBtns = `<button class="btn-modal-save"
          onclick="pipelineAction(${d.id},'deliver')">
          📦 Livrer (revue terminée)
        </button>`;
      } else {
        // Pre-payment review (e.g. sejour) — confirm payment first
        actionBtns = `<button class="btn-modal-save"
          style="background:linear-gradient(135deg,#d97706,#f59e0b)"
          onclick="pipelineAction(${d.id},'confirm_payment',{provider:'manual'})">
          💳 Approuver + confirmer paiement
        </button>`;
      }
    } else if (d.statut === 'paid') {
      actionBtns = `<button class="btn-modal-save"
        onclick="pipelineAction(${d.id},'deliver')">
        📦 Livrer la commande
      </button>`;
    }

    // View pipeline-generated document
    const docViewBtn = d._documents?.final
      ? `<button class="btn-modal-save"
           style="background:linear-gradient(135deg,#475569,#334155)"
           onclick="viewPipelineDoc(${d.id})">
           👁 Voir le document
         </button>`
      : '';

    const hasContent = reviewAlert || paymentInfo || actionBtns || docViewBtn;
    if (hasContent) {
      pipelineSection = `
        <div class="modal-section">
          <div class="modal-section-title">Pipeline de traitement</div>
          ${reviewAlert}${paymentInfo}
          ${actionBtns || docViewBtn
            ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${actionBtns}${docViewBtn}</div>`
            : ''}
        </div>`;
    }
  }

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">
      ${SERVICE_ICONS[d.service]} Demande #${d.id}
      <span class="badge ${STATUT_CLASS[d.statut] || ''}" style="margin-left:auto">${STATUT_LABELS[d.statut] || d.statut}</span>
    </div>

    <div class="modal-section cv-ai-section">
      <div class="modal-section-title">${{
        cv:             'Générer le CV',
        lettre:         'Rédiger la lettre de motivation',
        dossier:        'Générer le document d\'aide',
        courrier:       'Rédiger le courrier',
        sejour:         'Générer le guide titre de séjour',
        impot:          'Générer le document fiscal',
        naturalisation: 'Préparer le dossier naturalisation'
      }[d.service] || 'Générer le document'} avec IA ✨</div>

      ${d.service === 'cv' ? `
        <div class="cv-base-badge ${isImprove ? '' : 'cv-base-empty'}" style="margin-bottom:10px">
          ${isImprove
            ? `✨ Le client veut <strong>améliorer son CV existant</strong>`
            : `✏️ Le client veut <strong>un CV créé de A à Z</strong>`}
        </div>
        ${isImprove && cvNote ? `
        <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:.83rem;color:#0369a1">
          <strong>Souhaits du client :</strong><br>${escHtml(cvNote)}
        </div>` : ''}
        ${isImprove && hasCVFile ? `
        <div style="margin-bottom:12px">
          <button class="btn-dl-orig" onclick="downloadOriginalCV(${d.id})">⬇ Télécharger le CV original</button>
        </div>` : ''}
      ` : ''}

      <button class="btn-ai-gen" id="btn-gen-cv" onclick="generateCV(${d.id})">
        ✨ ${{
          cv:             isImprove ? 'Moderniser le CV' : 'Générer le CV',
          lettre:         'Rédiger la lettre',
          dossier:        'Générer le document',
          courrier:       'Rédiger le courrier',
          sejour:         'Générer le guide séjour',
          impot:          'Générer le document fiscal',
          naturalisation: 'Préparer le dossier'
        }[d.service] || 'Générer'}
      </button>

      <div id="cv-result" style="display:none;margin-top:18px">

        <!-- Succès -->
        <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.84rem;color:#166534;font-weight:600;display:flex;align-items:center;gap:8px">
          ✅ Document généré — vérifiez puis envoyez au client
        </div>

        <!-- Étape 1 : Aperçu + téléchargement -->
        <div style="margin-bottom:4px">
          <div style="font-size:.7rem;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Étape 1 — Vérifier le document</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <button class="btn-modal-save" onclick="previewCV()">👁 Aperçu plein écran</button>
            <button class="btn-modal-save" onclick="downloadCV(${d.id})" style="background:linear-gradient(135deg,#475569,#334155)">⬇ Télécharger PDF</button>
          </div>
          <details class="cv-editor-details">
            <summary>✏️ Modifier le document généré</summary>
            <p style="font-size:.78rem;color:var(--gray-500);margin-bottom:8px">Modifie le HTML puis clique Aperçu pour vérifier.</p>
            <textarea id="cv-html-editor" rows="12" oninput="APP.generatedCV=this.value"></textarea>
            <button class="btn-ai-gen" onclick="previewCV()" style="margin-top:8px;font-size:.82rem;padding:9px 16px">🔄 Aperçu avec mes modifications</button>
          </details>
        </div>

        <!-- Étape 2 : Envoi -->
        <div style="background:var(--blue-xlight);border:1.5px solid #bfdbfe;border-radius:12px;padding:16px;margin-top:14px">
          <div style="font-size:.7rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Étape 2 — Envoyer au client</div>
          <p style="font-size:.79rem;color:var(--gray-600);margin-bottom:12px;line-height:1.5">Télécharge le PDF ci-dessus, puis clique le bouton d'envoi ci-dessous.<br>La commande sera automatiquement marquée comme complétée.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${d.whatsapp ? `<button class="btn-ai-gen" onclick="sendDocWhatsApp(${d.id})" style="background:linear-gradient(135deg,#15803d,#16a34a)">💬 WhatsApp — ${escHtml(d.whatsapp)}</button>` : ''}
            <button class="btn-ai-gen" onclick="sendDocEmail(${d.id})" style="background:linear-gradient(135deg,#d97706,#f59e0b)">📧 Email — ${escHtml(d.email)}</button>
          </div>
        </div>

      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Informations client</div>
      <div class="modal-row"><span class="modal-key">Nom</span><span class="modal-val">${escHtml(d.prenom)} ${escHtml(d.nom)}</span></div>
      <div class="modal-row"><span class="modal-key">Email</span><span class="modal-val">${escHtml(d.email)}</span></div>
      ${d.whatsapp ? `<div class="modal-row"><span class="modal-key">WhatsApp</span><span class="modal-val">${escHtml(d.whatsapp)}</span></div>` : ''}
      ${d.ville    ? `<div class="modal-row"><span class="modal-key">Ville</span><span class="modal-val">${escHtml(d.ville)}</span></div>` : ''}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Commande</div>
      <div class="modal-row"><span class="modal-key">Service</span><span class="modal-val">${SERVICE_NAMES[d.service]}</span></div>
      <div class="modal-row"><span class="modal-key">Montant</span><span class="modal-val" style="color:var(--blue);font-weight:700">${d.montant}€</span></div>
      <div class="modal-row"><span class="modal-key">Date</span><span class="modal-val">${formatDate(d.date)} à ${d.heure}</span></div>
    </div>

    ${pipelineSection}

    ${_modalAITeamSection(d)}

    ${Object.keys(d.details || {}).length ? `
    <div class="modal-section">
      <div class="modal-section-title">Informations fournies</div>
      ${detailsHtml}
    </div>` : ''}


    <div class="modal-section">
      <div class="modal-section-title">Changer le statut</div>
      <div class="modal-status-change">
        <label>Statut actuel :</label>
        <select class="status-select" id="modal-statut-sel">
          <optgroup label="Pipeline">
            <option value="submitted"       ${d.statut === 'submitted'       ? 'selected' : ''}>Soumis</option>
            <option value="processing"      ${d.statut === 'processing'      ? 'selected' : ''}>Génération IA</option>
            <option value="generated"       ${d.statut === 'generated'       ? 'selected' : ''}>Généré</option>
            <option value="pending_payment" ${d.statut === 'pending_payment' ? 'selected' : ''}>Paiement en cours</option>
            <option value="paid"            ${d.statut === 'paid'            ? 'selected' : ''}>Payé</option>
            <option value="needs_review"    ${d.statut === 'needs_review'    ? 'selected' : ''}>À vérifier</option>
            <option value="delivered"       ${d.statut === 'delivered'       ? 'selected' : ''}>Livré</option>
            <option value="failed"          ${d.statut === 'failed'          ? 'selected' : ''}>Échec</option>
          </optgroup>
          <optgroup label="Ancien système">
            <option value="en_attente" ${d.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
            <option value="en_cours"   ${d.statut === 'en_cours'   ? 'selected' : ''}>En cours</option>
            <option value="terminé"    ${d.statut === 'terminé'    ? 'selected' : ''}>Terminé</option>
            <option value="annulé"     ${d.statut === 'annulé'     ? 'selected' : ''}>Annulé</option>
          </optgroup>
        </select>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Note interne</div>
      <div class="form-group" style="margin-bottom:0">
        <textarea id="modal-note" rows="3" placeholder="Ajoute une note sur cette demande…">${escHtml(d.note || '')}</textarea>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-modal-cancel" onclick="closeModal()">Fermer</button>
      <button class="btn-modal-save" onclick="saveModal()">💾 Enregistrer</button>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function saveModal() {
  const d = demandes.find(dm => dm.id === APP.modalId);
  if (!d) return;

  const sel  = document.getElementById('modal-statut-sel');
  const note = document.getElementById('modal-note');
  if (sel)  d.statut = sel.value;
  if (note) d.note   = note.value;
  _assignAI(d, d.statut);

  if (db) fbUpdate(d.id, { statut: d.statut, note: d.note, _aiTeam: d._aiTeam || null });
  else    saveData();
  auditLog('save_modal', `#${d.id} statut=${d.statut}${d.note ? ' + note' : ''}`);
  refreshBadge();
  closeModal();
  showToast('Modifications enregistrées', 'success');

  // Refresh section active
  if (APP.section === 'demandes')  applyFilters();
  if (APP.section === 'dashboard') renderDashboard();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  APP.modalId = null;
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

/* ── Section Équipe IA dans la modale ── */
function _modalAITeamSection(d) {
  if (!d._aiTeam) return '';
  const steps = [
    { key: 'accueil',      label: 'Accueil & collecte'     },
    { key: 'generation',   label: 'Rédaction & génération' },
    { key: 'verification', label: 'Contrôle qualité'       },
    { key: 'optimisation', label: 'Optimisation finale'    },
  ];
  const rows = steps.filter(s => d._aiTeam[s.key]).map(s => {
    const entry = d._aiTeam[s.key];
    const agent = AI_TEAM.find(a => a.id === entry.aiId) || { nom: entry.aiId, color: '#475569', icon: '🤖', role: s.label };
    return `<div class="ai-team-row">
      <div class="ai-team-dot" style="background:${agent.color}"></div>
      <div class="ai-team-info">
        <span class="ai-team-name" style="color:${agent.color}">${agent.icon} ${agent.nom}</span>
        <span class="ai-team-role">${agent.role}</span>
      </div>
      <div class="ai-team-label">${escHtml(entry.label || '')}</div>
    </div>`;
  });
  if (!rows.length) return '';
  return `<div class="modal-section">
    <div class="modal-section-title">🤖 Équipe IA assignée</div>
    <div class="ai-team-grid">${rows.join('')}</div>
  </div>`;
}

/* ============================================================
   GÉNÉRATION CV PAR IA
   ============================================================ */
async function generateCV(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d) return;

  const btn = document.getElementById('btn-gen-cv');
  if (!btn) return;
  btn.textContent = '⏳ Génération en cours…';
  btn.disabled = true;
  APP.generatedCV = null;

  try {
    // Choisir le bon template selon le service et le choix CV
    const cvChoix   = (d.details || {})['cv-choix'] || (d.details || {})['sw-choice'] || 'scratch';
    const promptKey = d.service === 'cv'
      ? (cvChoix === 'improve' ? 'cv_improve' : 'cv_scratch')
      : d.service; // 'lettre' | 'dossier' | 'courrier' | 'sejour'
    const template = aiPrompts[promptKey] || buildDefaultPrompts()[promptKey] || '';
    const prompt   = buildPromptFromTemplate(template, d);

    // Préfixe Emma (IA Rédaction) — instructions personnalisées de l'agent
    const emmaAgent  = AI_TEAM.find(a => a.id === 'emma');
    const emmaPrefix = (emmaAgent?.enabled && emmaAgent?.systemPrompt)
      ? emmaAgent.systemPrompt
        + (emmaAgent.instructions ? '\n\n' + emmaAgent.instructions : '')
        + '\n\n---\n\n'
      : '';
    const finalPrompt = emmaPrefix + prompt;

    const _res  = await fetch('/api/generate-cv', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: finalPrompt })
    });
    const _json = await _res.json();
    if (!_res.ok || _json.error) throw new Error(_json.error || `Erreur ${_res.status}`);
    let rawCV = (_json.cv || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    APP.generatedCV = rawCV;

    // Remplir l'éditeur HTML
    const editor = document.getElementById('cv-html-editor');
    if (editor) editor.value = rawCV;

    document.getElementById('cv-result').style.display = 'block';
    btn.textContent = '✅ Généré — vérifiez et envoyez ci-dessous';
    showToast('CV généré avec succès !', 'success');
  } catch (e) {
    btn.textContent = '❌ Erreur — réessayer';
    btn.disabled = false;
    showToast('Erreur : ' + e.message, 'error');
  }
}

function previewCV() {
  if (!APP.generatedCV) return;
  const w = window.open('', '_blank');
  if (!w) { showToast('Autorisez les popups du navigateur', 'error'); return; }
  w.document.write(APP.generatedCV);
  w.document.close();
}

function downloadCV(id) {
  if (!APP.generatedCV) return;
  const d = id ? demandes.find(dm => dm.id === id) : null;
  const svcLabel = { cv: 'CV', lettre: 'Lettre_motivation', dossier: 'Dossier', courrier: 'Courrier' };
  const nom = d ? `${d.prenom}_${d.nom}`.replace(/\s+/g, '_') : 'Document';
  const svc = d ? (svcLabel[d.service] || 'Document') : 'Document';
  // Injecter le titre pour que "Enregistrer en PDF" propose un bon nom de fichier
  let html = APP.generatedCV;
  if (/<title>/i.test(html)) {
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${svc}_${nom}</title>`);
  } else {
    html = html.replace(/<head>/i, `<head><title>${svc}_${nom}</title>`);
  }
  const w = window.open('', '_blank');
  if (!w) { showToast('Autorisez les popups du navigateur', 'error'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.print(); } catch(e) {} }, 700);
}

/* ── Envoi au client via WhatsApp ── */
function sendDocWhatsApp(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d || !d.whatsapp) return;
  const svcLabel = { cv: 'CV', lettre: 'lettre de motivation', dossier: 'document administratif', courrier: 'courrier officiel', sejour: 'guide titre de séjour' };
  const doc = svcLabel[d.service] || 'document';
  const num = d.whatsapp.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  const msg = `Bonjour ${d.prenom} 👋\n\nVotre ${doc} est prêt ! Je vous l'envoie en pièce jointe (PDF).\n\nN'hésitez pas si vous avez des questions 😊\n\n— L'équipe Dok'péyi`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  markSent(id);
}

/* ── Envoi au client par email ── */
function sendDocEmail(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d) return;
  const svcLabel = { cv: 'CV', lettre: 'lettre de motivation', dossier: 'document administratif', courrier: 'courrier officiel', sejour: 'guide titre de séjour' };
  const doc     = svcLabel[d.service] || 'document';
  const subject = `Votre ${doc} — Dok'péyi`;
  const body    = `Bonjour ${d.prenom},\n\nVotre ${doc} est prêt. Vous trouverez le fichier PDF en pièce jointe.\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nL'équipe Dok'péyi`;
  window.location.href = `mailto:${d.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  markSent(id);
}

/* ── Marquer la commande comme terminée après envoi ── */
function markSent(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d) return;

  // Pipeline orders (identified by _pipeline audit trail) use 'delivered';
  // legacy orders keep the old 'terminé' status.
  const isPipeline  = Array.isArray(d._pipeline) && d._pipeline.length > 0;
  const doneStatus  = isPipeline ? 'delivered' : 'terminé';
  const doneLabel   = isPipeline ? 'Livré'     : 'Terminé';
  const doneCls     = isPipeline ? 'badge-delivered' : 'badge-termine';

  if (d.statut === doneStatus || d.statut === 'terminé' || d.statut === 'delivered') return;

  d.statut = doneStatus;
  if (db) fbUpdate(id, { statut: doneStatus });
  else    saveData();
  auditLog('document_envoyé', `#${id} — document envoyé, statut → ${doneStatus}`);
  refreshBadge();

  // Mettre à jour la modale ouverte
  const badge = document.querySelector('#modal-content .modal-title .badge');
  if (badge) { badge.textContent = doneLabel; badge.className = `badge ${doneCls}`; }
  const sel = document.getElementById('modal-statut-sel');
  if (sel) sel.value = doneStatus;
  showToast(`✅ Document envoyé — commande marquée ${doneLabel} !`, 'success');
}

/* ── Pipeline action: POST /api/pipeline and refresh the open modal ── */
async function pipelineAction(id, action, payload = {}) {
  const d = demandes.find(dm => dm.id === id);
  if (!d) return null;

  try {
    const res  = await fetch('/api/pipeline', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ action, order: d, payload })
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || `Erreur ${res.status}`);

    // Update the local order object in-place
    Object.assign(d, json.order);
    if (db) fbUpdate(id, json.order);
    else    saveData();
    auditLog(action, `#${id} → ${json.order.statut}`);
    refreshBadge();

    // Re-render the modal so the pipeline section reflects the new state
    openModal(id);
    showToast('Statut mis à jour : ' + (STATUT_LABELS[json.order.statut] || json.order.statut), 'success');
    return json.order;
  } catch (e) {
    showToast('Erreur pipeline : ' + e.message, 'error');
    return null;
  }
}

/* ── View a pipeline-generated document (stored in order._documents.final) ── */
function viewPipelineDoc(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d?._documents?.final) { showToast('Document non disponible', 'error'); return; }
  const w = window.open('', '_blank');
  if (!w) { showToast('Autorisez les popups du navigateur', 'error'); return; }
  w.document.write(d._documents.final);
  w.document.close();
}

function downloadOriginalCV(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d || !d.details || !d.details['cv-fichier']) return;
  const f    = d.details['cv-fichier'];
  const data = f.data || (f.key ? localStorage.getItem(f.key) : null);
  if (!data) { showToast('Fichier introuvable — peut-être trop volumineux pour le stockage local', 'error'); return; }
  const a = document.createElement('a');
  a.href     = data;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ============================================================
   SECTION SERVICES
   ============================================================ */
function renderServices() {
  const grid = document.getElementById('svc-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(services).map(([key, svc]) => `
    <div class="svc-edit-card">
      <div class="svc-edit-header">
        <span class="svc-edit-icon">${svc.icon}</span>
        <span class="svc-edit-name">${escHtml(svc.name)}</span>
      </div>
      <div class="svc-form-row">
        <div class="form-group" style="margin-bottom:0">
          <label>Prix (€)</label>
          <input type="number" id="svc-price-${key}" value="${svc.price}" min="1" max="999" step="1">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Nom du service</label>
          <input type="text" id="svc-name-${key}" value="${escHtml(svc.name)}">
        </div>
      </div>
      <div class="form-group" style="margin-top:12px;margin-bottom:0">
        <label>Description courte</label>
        <textarea id="svc-desc-${key}" rows="2">${escHtml(svc.desc)}</textarea>
      </div>
      <div class="toggle-wrap">
        <label>Service actif</label>
        <label class="toggle">
          <input type="checkbox" id="svc-active-${key}" ${svc.active ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `).join('');
}

function saveServices() {
  Object.keys(services).forEach(key => {
    const priceEl  = document.getElementById(`svc-price-${key}`);
    const nameEl   = document.getElementById(`svc-name-${key}`);
    const descEl   = document.getElementById(`svc-desc-${key}`);
    const activeEl = document.getElementById(`svc-active-${key}`);
    if (priceEl)  services[key].price  = parseFloat(priceEl.value)  || services[key].price;
    if (nameEl)   services[key].name   = nameEl.value.trim()         || services[key].name;
    if (descEl)   services[key].desc   = descEl.value.trim();
    if (activeEl) services[key].active = activeEl.checked;
  });
  localStorage.setItem('dok_services', JSON.stringify(services));
  showToast('Services enregistrés avec succès', 'success');
}

/* ============================================================
   SECTION CONFIGURATION IA
   ============================================================ */
function renderAIConfig() {
  const grid = document.getElementById('ia-grid');
  if (!grid) return;

  const CONFIGS = [
    { key: 'cv_scratch', icon: '✏️', title: 'CV — Créer de A à Z',
      desc: 'Quand le client choisit de créer un CV depuis zéro',
      vars: ['nom','email','tel','poste','experience','formation','competences','infos'] },
    { key: 'cv_improve', icon: '✨', title: 'CV — Améliorer l\'existant',
      desc: 'Quand le client envoie son CV + ses souhaits de modification',
      vars: ['nom','email','tel','note'] },
    { key: 'lettre', icon: '✉️', title: 'Lettre de motivation',
      desc: 'Rédige une lettre personnalisée pour un poste',
      vars: ['nom','email','tel','poste','entreprise','experience','motivation'] },
    { key: 'dossier', icon: '📁', title: 'Dossier administratif',
      desc: 'Génère une checklist et les étapes à suivre',
      vars: ['nom','email','tel','type','description','documents'] },
    { key: 'courrier', icon: '📮', title: 'Courrier officiel',
      desc: 'Rédige un courrier formel pour l\'administration',
      vars: ['nom','email','tel','destinataire','objet','description'] },
    { key: 'sejour', icon: '🛂', title: 'Titre de séjour',
      desc: 'Guide personnalisé pour les démarches de titre de séjour (review obligatoire)',
      vars: ['nom','email','tel','nationalite','situation','choix','documents'] },
    { key: 'impot', icon: '🧾', title: 'Avis d\'impôt',
      desc: 'Aide à la compréhension, démarches liées ou courrier fiscal',
      vars: ['nom','email','tel','choix','type','revenus','situation','description','objet','destinataire'] },
    { key: 'naturalisation', icon: '🇫🇷', title: 'Naturalisation',
      desc: 'Vérification éligibilité, préparation dossier ou lettre d\'intégration (review obligatoire)',
      vars: ['nom','email','tel','nationalite','duree','famille','travail','choix','situation','documents','parcours','motivation'] }
  ];

  grid.innerHTML = CONFIGS.map(c => `
    <div class="svc-edit-card">
      <div class="svc-edit-header" style="align-items:flex-start;gap:12px">
        <span class="svc-edit-icon">${c.icon}</span>
        <div>
          <div class="svc-edit-name">${c.title}</div>
          <div style="font-size:.77rem;color:var(--gray-500);font-weight:400;margin-top:2px">${c.desc}</div>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:10px">
        <label>Variables disponibles</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          ${c.vars.map(v => `<span class="ia-var-chip" title="Copier">{{${v}}}</span>`).join('')}
        </div>
      </div>
      <div class="form-group" style="margin-bottom:10px">
        <label>Instructions pour l'IA (prompt)</label>
        <textarea id="ia-${c.key}" class="ia-textarea" rows="14" spellcheck="false">${escHtml(aiPrompts[c.key] || '')}</textarea>
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button class="btn-ia-reset" onclick="resetPrompt('${c.key}')">↺ Réinitialiser</button>
      </div>
    </div>
  `).join('');
}

function saveAIPrompts() {
  ['cv_scratch','cv_improve','lettre','dossier','courrier','sejour','impot','naturalisation'].forEach(k => {
    const el = document.getElementById('ia-' + k);
    if (el) aiPrompts[k] = el.value;
  });
  localStorage.setItem('dok_ai_prompts', JSON.stringify(aiPrompts));
  showToast('Configuration IA enregistrée', 'success');
}

function resetPrompt(key) {
  if (!confirm('Réinitialiser ce prompt au texte par défaut ?')) return;
  const def = buildDefaultPrompts();
  aiPrompts[key] = def[key];
  const el = document.getElementById('ia-' + key);
  if (el) el.value = def[key];
  showToast('Prompt réinitialisé', 'success');
}

/* ============================================================
   SECTION STATISTIQUES
   ============================================================ */
function renderStats() {
  const termine  = demandes.filter(d => d.statut === 'terminé');
  const revenue  = termine.reduce((s, d) => s + d.montant, 0);
  const moy      = termine.length ? Math.round(revenue / termine.length * 10) / 10 : 0;

  // Service le plus demandé
  const counts   = {};
  demandes.forEach(d => { counts[d.service] = (counts[d.service] || 0) + 1; });
  const topSvc   = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];

  document.getElementById('stats-kpis').innerHTML = `
    <div class="kpi-card blue">
      <div class="kpi-icon">📋</div>
      <div class="kpi-label">Total demandes</div>
      <div class="kpi-value">${demandes.length}</div>
      <div class="kpi-sub">Toutes périodes</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">💶</div>
      <div class="kpi-label">Revenus totaux</div>
      <div class="kpi-value">${revenue}€</div>
      <div class="kpi-sub">Commandes terminées</div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-icon">📊</div>
      <div class="kpi-label">Panier moyen</div>
      <div class="kpi-value">${moy}€</div>
      <div class="kpi-sub">Par commande</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-icon">🏆</div>
      <div class="kpi-label">Service populaire</div>
      <div class="kpi-value" style="font-size:1.2rem">${topSvc ? SERVICE_NAMES[topSvc[0]] : '—'}</div>
      <div class="kpi-sub">${topSvc ? topSvc[1] + ' demandes' : ''}</div>
    </div>
  `;

  renderMonthlyChart();
  renderByServiceChart();
}

function renderMonthlyChart() {
  const months = [];
  const values = [];
  const now    = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = d.toLocaleDateString('fr-FR', { month: 'short' });
    const count = demandes.filter(dm => {
      const dd = new Date(dm.date);
      return dd.getFullYear() === y && dd.getMonth() === m;
    }).length;
    months.push(label);
    values.push(count);
  }

  destroyChart('monthly');
  const ctx = document.getElementById('ch-monthly');
  if (!ctx) return;
  APP.charts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Demandes',
        data: values,
        backgroundColor: 'rgba(37,99,235,.75)',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

function renderByServiceChart() {
  const svcs    = ['cv', 'lettre', 'dossier', 'courrier', 'sejour'];
  const colors  = ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];
  const revenues = svcs.map(k =>
    demandes.filter(d => d.service === k && d.statut === 'terminé')
            .reduce((s, d) => s + d.montant, 0)
  );

  destroyChart('bySvc');
  const ctx = document.getElementById('ch-by-svc');
  if (!ctx) return;
  APP.charts.bySvc = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: svcs.map(k => SERVICE_NAMES[k]),
      datasets: [{
        label: 'Revenus (€)',
        data: revenues,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => v + '€', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

/* ============================================================
   FIREBASE — Temps réel multi-admin
   ============================================================ */
function initFirebase() {
  if (typeof firebase === 'undefined') return;
  if (!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey.startsWith('REMPLACE')) return;

  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();

    /* Listener temps réel — se déclenche pour TOUS les admins connectés */
    let firstLoad = true;
    db.ref('dok-peyi/demandes').on('value', snapshot => {
      const raw = snapshot.val() || {};
      demandes = Object.values(raw).sort((a, b) => b.id - a.id);
      try { localStorage.setItem('dok_demandes', JSON.stringify(demandes)); } catch(e) {}

      refreshBadge();
      if (APP.section === 'dashboard') renderDashboard();
      if (APP.section === 'demandes')  applyFilters();
      if (APP.section === 'stats')     renderStats();
      if (APP.section === 'controle')  _qcRenderList();

      firstLoad = false;
    }, err => {
      console.warn('Firebase sync error:', err.message);
    });

    /* Migration unique : si Firebase vide → charger depuis localStorage */
    db.ref('dok-peyi/demandes').once('value', snapshot => {
      if (!snapshot.val()) {
        const local = safeParse('dok_demandes') || [];
        if (local.length > 0) {
          const obj = {};
          local.forEach(d => { obj[d.id] = d; });
          db.ref('dok-peyi/demandes').set(obj).then(() => {
            showToast(`✅ ${local.length} commandes synchronisées sur Firebase`, 'success');
          });
        }
      }
    });

    showToast('🔥 Firebase connecté — synchronisation active', 'success');
  } catch(e) {
    console.warn('Firebase init failed, fallback localStorage:', e.message);
  }
}

/* Mise à jour ciblée d'un champ (statut, note…) */
function fbUpdate(id, changes) {
  if (db) db.ref('dok-peyi/demandes/' + id).update(changes).catch(console.error);
}

/* Suppression */
function fbDelete(id) {
  if (db) db.ref('dok-peyi/demandes/' + id).remove().catch(console.error);
}

/* Écriture d'une nouvelle demande (appelé depuis script.js via bridge) */
function fbWrite(demande) {
  _assignAI(demande, demande.statut || 'submitted'); // Lucas assigné à l'accueil
  if (db) db.ref('dok-peyi/demandes/' + demande.id).set(demande).catch(console.error);
}

/* ============================================================
   PERSISTANCE
   ============================================================ */
function saveData() {
  if (db) {
    /* Firebase — écriture atomique de toutes les demandes */
    const obj = {};
    demandes.forEach(d => { obj[d.id] = d; });
    db.ref('dok-peyi/demandes').set(obj).catch(console.error);
  }
  /* Toujours garder localStorage en cache local */
  try { localStorage.setItem('dok_demandes', JSON.stringify(demandes)); } catch(e) {}
}

/* ============================================================
   TOAST
   ============================================================ */
let _toastTimer = null;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* ============================================================
   UTILITAIRES
   ============================================================ */
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
