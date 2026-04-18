/* ============================================================
   DOK'PÉYI — Service Wizard  (service.js)
   Un seul moteur pour tous les services : CV, Lettre,
   Courrier, Dossier, Titre de séjour.
   ============================================================ */

/* ── LISTES PRÉDÉFINIES (CV) ──────────────────────────────── */
const CV_POSTES_GROUPS = [
  { label: 'BTP / Industrie',         options: ['Ouvrier BTP','Maçon','Coffreur','Électricien','Plombier','Carreleur','Peintre en bâtiment','Chef de chantier','Conducteur d\'engins','Métreur','Technicien de maintenance','Soudeur'] },
  { label: 'Santé / Social',          options: ['Infirmier(e) diplômé(e) d\'État','Aide-soignant(e)','Auxiliaire de vie','Agent de service hospitalier','Éducateur spécialisé','Assistant(e) social(e)','Puéricultrice','Médecin généraliste'] },
  { label: 'Éducation / Formation',   options: ['Professeur des écoles','Professeur certifié','AESH','Animateur périscolaire','Formateur professionnel','CPE'] },
  { label: 'Administration / Juridique', options: ['Agent administratif','Secrétaire','Assistant(e) de direction','Gestionnaire RH','Comptable','Agent fonction publique','Juriste'] },
  { label: 'Commerce / Vente',        options: ['Vendeur(se)','Conseiller(e) de vente','Responsable de rayon','Caissier(e)','Commercial(e)','Manager de rayon'] },
  { label: 'Transport / Logistique',  options: ['Chauffeur PL','Chauffeur VL','Livreur','Magasinier','Cariste'] },
  { label: 'Agriculture / Environnement', options: ['Ouvrier agricole','Technicien agricole','Agent forestier','Pêcheur','Technicien environnement'] },
  { label: 'Numérique / Technique',   options: ['Développeur web','Technicien informatique','Administrateur réseau'] },
  { label: 'Restauration / Hôtellerie', options: ['Cuisinier','Aide cuisinier','Serveur','Réceptionniste','Agent d\'entretien'] }
];

const CV_DIPLOMES_GROUPS = [
  { label: 'Diplômes courants', options: [
    'Aucun diplôme','CFG','CFGP','CAP','BEP',
    'BAC Professionnel','BAC Général','BAC Technologique',
    'BTS','DUT/BUT','DEUG','Licence','Licence Professionnelle','Master','Master Professionnel','Doctorat',
    'BTS SP3S','DEAS','DEAP','DEEJE','Diplôme d\'État Infirmier','Diplôme d\'État Aide-soignant',
    'Certificat de qualification professionnelle (CQP)','Titre professionnel AFPA','Habilitations électriques (B0/H0/BR/BC)'
  ]}
];

const CV_COMPETENCES_GROUPS = [
  { label: 'Transversales',    options: ['Travail en équipe','Autonomie','Rigueur','Ponctualité','Adaptabilité','Gestion du stress','Communication','Sens du service','Organisation','Prise d\'initiative','Polyvalence','Gestion des priorités'] },
  { label: 'Techniques BTP',   options: ['Lecture de plans','PPSPS','Travail en hauteur sécurisé','Conduite d\'engins','Coffrages','Maçonnerie','Électricité','Plomberie','Soudure','Habilitation électrique'] },
  { label: 'Techniques Santé', options: ['Soins infirmiers','Gestion de la douleur','Soins intensifs','Tutorat étudiants','Gestion de dossiers patients'] },
  { label: 'Techniques Commerce', options: ['Techniques de vente','Gestion de caisse','Merchandising','Gestion des stocks','Relation client','Objectifs commerciaux'] },
  { label: 'Techniques Admin', options: ['Maîtrise Word/Excel','Logiciels métier','Gestion documentaire','Comptabilité','Droit du travail','Marchés publics'] },
  { label: 'Langues',          options: ['Français','Anglais','Espagnol','Portugais brésilien','Créole guyanais','Créole haïtien','Néerlandais','Arabe'] },
  { label: 'Permis',           options: ['Permis B','Permis C (PL)','Permis CE','CACES R482','CACES R489','Permis bateau','Permis moto'] }
];

/* ── CONFIG PAR SERVICE ───────────────────────────────────── */
const SVC = {
  cv: {
    name: 'CV Professionnel', icon: '📄', color: '#2563eb', light: '#eff6ff', price: 8,
    reviewRequired: false,
    choices: [
      { id: 'scratch', icon: '✏️', label: 'Créer de A à Z',       desc: 'Je n\'ai pas encore de CV' },
      { id: 'improve', icon: '✨', label: 'Améliorer l\'existant', desc: 'Mon CV existe, je veux le moderniser' },
      { id: 'pro',     icon: '🎯', label: 'Professionnaliser',     desc: 'Donner un look expert à mon profil' }
    ],
    questions: function(choice) {
      if (choice === 'improve') return [
        { id: 'note', label: 'Que souhaitez-vous améliorer ?', type: 'textarea',
          placeholder: 'Décrivez les changements souhaités (design, contenu, mise en page…)', required: true }
      ];
      return [
        { id: 'poste',       label: 'Poste recherché *',            type: 'hybrid-select', placeholder: 'Ou saisir un poste non listé…', required: true,  groups: CV_POSTES_GROUPS },
        { id: 'experience',  label: 'Expériences professionnelles', type: 'textarea',      placeholder: 'Postes occupés, entreprises, durées… (laissez vide si débutant)', required: false },
        { id: 'formation',   label: 'Formation / Diplômes',         type: 'hybrid-select', placeholder: 'Ou saisir un diplôme non listé…', required: false, groups: CV_DIPLOMES_GROUPS },
        { id: 'competences', label: 'Compétences',                  type: 'tags',          placeholder: 'Ajouter vos propres compétences (séparées par des virgules)…', required: false, groups: CV_COMPETENCES_GROUPS },
        { id: 'infos',       label: 'Informations supplémentaires', type: 'textarea',      placeholder: 'Loisirs, disponibilité, mobilité géographique…', required: false }
      ];
    }
  },

  lettre: {
    name: 'Lettre de motivation', icon: '✉️', color: '#10b981', light: '#ecfdf5', price: 5,
    reviewRequired: false,
    choices: [
      { id: 'create',  icon: '✏️', label: 'Créer une lettre',      desc: 'Pour une candidature précise' },
      { id: 'improve', icon: '✨', label: 'Améliorer ma lettre',    desc: 'La rendre plus percutante' },
      { id: 'adapt',   icon: '🔄', label: 'Adapter pour un poste', desc: 'Cibler une offre spécifique' }
    ],
    questions: function(choice) {
      if (choice === 'improve') return [
        { id: 'poste', label: 'Pour quel poste ?',                              type: 'text',     placeholder: 'Poste visé', required: true },
        { id: 'note',  label: 'Ta lettre actuelle + ce que tu veux améliorer', type: 'textarea', placeholder: 'Colle ta lettre ici et décris les améliorations souhaitées…', required: true }
      ];
      if (choice === 'adapt') return [
        { id: 'poste',      label: 'Nouveau poste visé *',  type: 'text',     placeholder: 'Ex : Aide-soignant(e), Caissier(e)…', required: true },
        { id: 'entreprise', label: 'Entreprise cible *',    type: 'text',     placeholder: 'Nom de l\'entreprise ou organisme', required: true },
        { id: 'note',       label: 'Ta lettre existante',   type: 'textarea', placeholder: 'Colle ta lettre actuelle ici…', required: true }
      ];
      return [
        { id: 'poste',      label: 'Poste visé *',                           type: 'text',     placeholder: 'Ex : Vendeur(se), Infirmier(e), Technicien(ne)…', required: true },
        { id: 'entreprise', label: 'Entreprise / Organisme *',               type: 'text',     placeholder: 'Ex : Leclerc Cayenne, CHC, Mairie de Kourou…', required: true },
        { id: 'experience', label: 'Expérience en lien avec ce poste',       type: 'textarea', placeholder: 'Ce qui te qualifie pour ce poste…', required: false },
        { id: 'motivation', label: 'Pourquoi ce poste t\'intéresse ?',       type: 'textarea', placeholder: 'Ce qui t\'attire dans ce poste ou cette entreprise…', required: false }
      ];
    }
  },

  courrier: {
    name: 'Courrier officiel', icon: '📮', color: '#7c3aed', light: '#f5f3ff', price: 7,
    reviewRequired: false,
    choices: [
      { id: 'demande',      icon: '📋', label: 'Demande',      desc: 'Demander une information ou un document' },
      { id: 'reclamation',  icon: '⚠️', label: 'Réclamation', desc: 'Signaler un problème ou un litige' },
      { id: 'contestation', icon: '⚖️', label: 'Contestation', desc: 'Contester une décision administrative' }
    ],
    questions: function() {
      return [
        { id: 'destinataire', label: 'Destinataire *',        type: 'text',     placeholder: 'Ex : Mairie de Cayenne, CAF de Guyane, CPAM…', required: true },
        { id: 'objet',        label: 'Objet du courrier *',   type: 'text',     placeholder: 'Résumé en une ligne', required: true },
        { id: 'description',  label: 'Votre situation *',     type: 'textarea', placeholder: 'Décrivez votre situation et ce que vous demandez…', required: true }
      ];
    }
  },

  dossier: {
    name: 'Dossier administratif', icon: '📁', color: '#f59e0b', light: '#fffbeb', price: 12,
    reviewRequired: false,
    choices: [
      { id: 'caf',      icon: '👶', label: 'CAF / Allocations', desc: 'RSA, APL, allocations familiales…' },
      { id: 'logement', icon: '🏠', label: 'Logement social',   desc: 'HLM, logement d\'urgence…' },
      { id: 'aide',     icon: '🤝', label: 'Aide sociale',      desc: 'Minima sociaux, aides diverses…' },
      { id: 'autre',    icon: '📋', label: 'Autre dossier',     desc: 'Emploi, santé, formation…' }
    ],
    questions: function(choice) {
      const q = [];
      if (choice === 'autre') q.push({ id: 'type', label: 'Type de dossier *', type: 'text', placeholder: 'Ex : Pôle Emploi, Retraite, Dossier scolaire…', required: true });
      q.push({ id: 'description', label: 'Votre situation et votre besoin *', type: 'textarea', placeholder: 'Expliquez ce que vous cherchez à obtenir, votre situation actuelle…', required: true });
      q.push({ id: 'documents',   label: 'Documents que vous avez déjà',      type: 'textarea', placeholder: 'Ex : Carte d\'identité, justificatif de domicile, bulletins de salaire…', required: false });
      return q;
    }
  },

  sejour: {
    name: 'Titre de séjour', icon: '🛂', color: '#ef4444', light: '#fef2f2', price: 15,
    reviewRequired: true,
    reviewMsg: 'Votre dossier a été transmis à notre équipe. Un conseiller vous contactera par email sous 24 à 48h pour valider votre demande et vous guider dans les prochaines étapes.',
    choices: [
      { id: 'premiere',       icon: '🆕', label: 'Première demande',      desc: 'Je n\'ai pas encore de titre de séjour' },
      { id: 'renouvellement', icon: '🔄', label: 'Renouvellement',         desc: 'Mon titre de séjour arrive à expiration' },
      { id: 'regularisation', icon: '⚖️', label: 'Régularisation',        desc: 'Je souhaite régulariser ma situation' },
      { id: 'information',    icon: '❓', label: 'Demande d\'information', desc: 'Comprendre mes droits et démarches' }
    ],
    questions: function() {
      return [
        { id: 'nationalite',      label: 'Nationalité *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Surinamaise…', required: true },
        { id: 'situation',        label: 'Votre situation actuelle *',    type: 'textarea', placeholder: 'Depuis quand êtes-vous en Guyane/France ? Avec quel document ? Quel est votre projet de séjour ?', required: true },
        { id: 'documents',        label: 'Documents dont vous disposez', type: 'textarea', placeholder: 'Passeport, visa, actes d\'état civil, attestation d\'hébergement, contrats de travail…', required: false },
        { id: 'visa_actuel',      label: 'Visa ou titre actuel',          type: 'select',   options: ['Aucun', 'Visa touriste', 'Visa étudiant', 'Visa travail', 'Titre de séjour en cours', 'Autre'], required: false },
        { id: 'date_expiration',  label: 'Date d\'expiration de votre titre/visa actuel', type: 'date', required: false },
        { id: 'duree_presence',   label: 'Durée de présence en France/Guyane',            type: 'select', options: ['Moins de 1 an', '1-2 ans', '2-5 ans', '5-10 ans', 'Plus de 10 ans'], required: false },
        { id: 'situation_pro',    label: 'Situation professionnelle',                      type: 'select', options: ['Sans emploi', 'Salarié', 'Indépendant', 'Étudiant', 'Retraité'], required: false },
        { id: 'historique_refus', label: 'Avez-vous déjà eu un refus de titre de séjour ?', type: 'radio', options: ['oui', 'non'], required: false }
      ];
    }
  },

  impot: {
    name: 'Avis d\'impôt', icon: '🧾', color: '#0369a1', light: '#e0f2fe', price: 10,
    reviewRequired: false,
    choices: [
      { id: 'comprendre', icon: '💡', label: 'Comprendre mon avis',  desc: 'Décoder mon avis d\'imposition ou de non-imposition' },
      { id: 'aide',       icon: '🤝', label: 'Aide liée à l\'impôt', desc: 'Réductions, exonérations, aides CAF, délais de paiement…' },
      { id: 'courrier',   icon: '📮', label: 'Écrire aux impôts',    desc: 'Contester, demander un délai, faire une réclamation' }
    ],
    questions: function(choice) {
      if (choice === 'courrier') return [
        { id: 'destinataire', label: 'Destinataire *',      type: 'text',     placeholder: 'Ex : Trésor Public de Guyane, DGFIP, Centre des impôts de Cayenne…', required: true },
        { id: 'objet',        label: 'Objet du courrier *', type: 'text',     placeholder: 'Ex : Demande de délai de paiement, contestation d\'imposition…', required: true },
        { id: 'description',  label: 'Votre situation *',   type: 'textarea', placeholder: 'Expliquez votre situation et ce que vous demandez…', required: true }
      ];
      return [
        { id: 'type',        label: 'Type d\'avis *',              type: 'text',     placeholder: 'Ex : Avis d\'imposition, avis de non-imposition, taxe foncière…', required: true },
        { id: 'revenus',     label: 'Revenus annuels',              type: 'text',     placeholder: 'Ex : 18 000€/an, RSA uniquement, sans revenus…', required: false },
        { id: 'situation',   label: 'Situation familiale',          type: 'text',     placeholder: 'Ex : Célibataire, marié(e) avec 2 enfants, veuf(ve)…', required: false },
        { id: 'description', label: 'Votre question / demande *',  type: 'textarea', placeholder: 'Qu\'est-ce que vous ne comprenez pas ? Quel type d\'aide cherchez-vous ?', required: true }
      ];
    }
  },

  naturalisation: {
    name: 'Naturalisation', icon: '🇫🇷', color: '#1d4ed8', light: '#eff6ff', price: 20,
    reviewRequired: true,
    reviewMsg: 'Votre dossier a été transmis à notre équipe. Un conseiller spécialisé vous contactera sous 24 à 48h pour analyser votre éligibilité et vous accompagner dans la procédure.',
    choices: [
      { id: 'situation', icon: '🔍', label: 'Vérifier mon éligibilité', desc: 'Suis-je en mesure de faire une demande ?' },
      { id: 'dossier',   icon: '📁', label: 'Préparer mon dossier',      desc: 'Liste complète des documents et étapes à suivre' },
      { id: 'lettre',    icon: '✍️', label: 'Lettre d\'intégration',     desc: 'Rédiger ma lettre de motivation de vie en France' }
    ],
    questions: function(choice) {
      if (choice === 'lettre') return [
        { id: 'nationalite', label: 'Nationalité actuelle *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…', required: true },
        { id: 'duree',       label: 'Durée de résidence en France *',         type: 'text',     placeholder: 'Ex : 5 ans, depuis 2018…', required: true },
        { id: 'parcours',    label: 'Votre parcours en France *',             type: 'textarea', placeholder: 'Vie sociale, emploi, associations, liens avec la France…', required: true },
        { id: 'famille',     label: 'Situation familiale',                    type: 'text',     placeholder: 'Ex : Marié(e) à un(e) Français(e), enfants nés en France…', required: false },
        { id: 'motivation',  label: 'Pourquoi souhaitez-vous la nationalité ?', type: 'textarea', placeholder: 'Vos raisons personnelles, votre attachement aux valeurs françaises…', required: false }
      ];
      return [
        { id: 'nationalite', label: 'Nationalité actuelle *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…', required: true },
        { id: 'duree',       label: 'Durée de résidence en France *',         type: 'text',     placeholder: 'Ex : 5 ans, depuis 2018…', required: true },
        { id: 'famille',     label: 'Situation familiale',                    type: 'text',     placeholder: 'Ex : Marié(e) à un(e) Français(e), enfants nés en France…', required: false },
        { id: 'travail',     label: 'Situation professionnelle',              type: 'text',     placeholder: 'Ex : CDI, fonctionnaire, auto-entrepreneur, sans emploi…', required: false },
        { id: 'situation',   label: 'Informations complémentaires',           type: 'textarea', placeholder: 'Casier judiciaire vierge ? Niveau de français ? Titre de séjour actuel ?', required: false },
        { id: 'documents',   label: 'Documents dont vous disposez',           type: 'textarea', placeholder: 'Passeport, titre de séjour, actes d\'état civil, diplômes, bulletins de salaire…', required: false }
      ];
    }
  }
};

/* ── IMPORT — choix qui impliquent un document existant ─────── */
const IMPORT_CHOICES = {
  cv:     ['improve', 'pro'],
  lettre: ['improve', 'adapt'],
  sejour: ['renouvellement', 'regularisation'],
  impot:  ['comprendre', 'aide']
};

/* ── TEST MODE — bouton paiement fictif ─────────────────── */
const IS_TEST_MODE = location.hostname === 'localhost'
  || location.hostname === '127.0.0.1'
  || new URLSearchParams(location.search).get('test') === '1';

/* ── PAYPAL — email du compte PayPal Business ────────────── */
const PAYPAL_EMAIL = 'contact@dok-peyi.fr';

/* ── STATE ───────────────────────────────────────────────── */
const SSW = {
  svc:             null,
  step:            1,
  choice:          null,
  personal:        { prenom: '', nom: '', email: '', phone: '' },
  details:         {},
  html:            null,
  paid:            false,
  orderId:         null,
  importFile:      null,   // fichier importé { name, type, data }
  importExtracted: null    // champs extraits par l'IA depuis le document
};

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', swInit);

function swInit() {
  const params = new URLSearchParams(location.search);

  /* ── Retour depuis Stripe Checkout ── */
  if (params.get('success') === '1') {
    const restoredSvc = _swRestoreState();
    if (restoredSvc && SVC[restoredSvc]) {
      _swApplyTheme(restoredSvc);
      SSW.paid = true;
      swClearDraft();
      swSaveOrder();
      swShowConfirm();
      _swSendConfirmationEmail();
      history.replaceState({}, '', '/service?s=' + restoredSvc);
      return;
    }
  }
  if (params.get('cancelled') === '1') {
    const s = params.get('s') || '';
    if (SVC[s]) {
      _swApplyTheme(s);
      _swRestoreState();
      swGoStep(4);
      history.replaceState({}, '', '/service?s=' + s);
      return;
    }
  }

  const s = params.get('s') || '';
  if (!SVC[s]) { location.href = '/'; return; }
  SSW.svc = s;
  _swApplyTheme(s);
  swRenderChoices();
  swRestoreDraft();
  swGoStep(1);
}

function _swApplyTheme(s) {
  SSW.svc = s;
  const cfg  = SVC[s];
  const root = document.documentElement;
  root.style.setProperty('--sw-color', cfg.color);
  root.style.setProperty('--sw-light', cfg.light);
  const hex = cfg.color.replace('#', '');
  root.style.setProperty('--sw-rgb',
    parseInt(hex.slice(0,2),16) + ',' +
    parseInt(hex.slice(2,4),16) + ',' +
    parseInt(hex.slice(4,6),16));
  document.getElementById('sw-hero-icon').textContent  = cfg.icon;
  document.getElementById('sw-hero-name').textContent  = cfg.name;
  document.getElementById('sw-hero-price').textContent = cfg.price + '€';
  document.title = cfg.name + ' — Dok\'péyi';
}

/* Sauvegarde SSW dans localStorage avant redirection Stripe */
function _swSaveState() {
  try { localStorage.setItem('dok_ssw_pending', JSON.stringify(SSW)); } catch(_) {}
}

/* Restaure SSW depuis localStorage, retourne le service restauré */
function _swRestoreState() {
  try {
    const raw = localStorage.getItem('dok_ssw_pending');
    if (!raw) return null;
    const saved = JSON.parse(raw);
    Object.assign(SSW, saved);
    localStorage.removeItem('dok_ssw_pending');
    return SSW.svc;
  } catch(_) { return null; }
}

/* Envoie l'email de confirmation au client */
async function _swSendConfirmationEmail() {
  try {
    const cfg = SVC[SSW.svc] || {};
    await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        type:  'order_confirmation',
        order: {
          id:      SSW.orderId,
          service: SSW.svc,
          prenom:  SSW.personal.prenom,
          nom:     SSW.personal.nom,
          email:   SSW.personal.email,
          montant: cfg.price || 0
        }
      })
    });
  } catch(_) {}
}

/* ── PROGRESS ─────────────────────────────────────────────── */
function swGoStep(n) {
  document.querySelectorAll('.sw-step').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('sw-s' + n);
  if (el) el.classList.add('active');
  SSW.step = n;

  const vis = Math.min(n, 4);
  document.querySelectorAll('.sw-prog-step').forEach(dot => {
    const sn = parseInt(dot.dataset.n);
    dot.classList.remove('active', 'done');
    if (sn < vis)      dot.classList.add('done');
    else if (sn === vis) dot.classList.add('active');
  });

  const prog = document.getElementById('sw-progress');
  if (prog) prog.style.display = n >= 5 ? 'none' : '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── CHOICES ──────────────────────────────────────────────── */
function swRenderChoices() {
  const grid = document.getElementById('sw-choices');
  if (!grid) return;
  grid.innerHTML = SVC[SSW.svc].choices.map(c => `
    <div class="sw-choice" data-id="${c.id}" onclick="swPick('${c.id}',this)">
      <div class="sw-choice-icon">${c.icon}</div>
      <div class="sw-choice-body">
        <div class="sw-choice-name">${c.label}</div>
        <div class="sw-choice-desc">${c.desc}</div>
      </div>
      <div class="sw-choice-chk">○</div>
    </div>`).join('');
}

function swPick(id, el) {
  SSW.choice = id;
  document.querySelectorAll('.sw-choice').forEach(e => {
    e.classList.remove('selected');
    e.querySelector('.sw-choice-chk').textContent = '○';
  });
  el.classList.add('selected');
  el.querySelector('.sw-choice-chk').textContent = '✓';
}

/* ── STEP NAVIGATION ──────────────────────────────────────── */
function swNext(from) {
  if (from === 1) {
    const pr = document.getElementById('sw-prenom');
    const nm = document.getElementById('sw-nom');
    const em = document.getElementById('sw-email');
    if (!pr.value.trim()) { swShake(pr); return; }
    if (!nm.value.trim()) { swShake(nm); return; }
    if (!em.value.trim() || !em.value.includes('@')) { swShake(em); return; }
    if (!SSW.choice) { swShake(document.getElementById('sw-choices')); return; }

    SSW.personal = {
      prenom: pr.value.trim(),
      nom:    nm.value.trim(),
      email:  em.value.trim(),
      phone:  (document.getElementById('sw-phone')?.value || '').trim()
    };
    swSaveDraft();
    swBuildForm();
    swGoStep(2);
    return;
  }

  if (from === 2) {
    let ok = true;
    document.querySelectorAll('#sw-fields [data-req]').forEach(el => {
      if (!el.value.trim()) { swShake(el); ok = false; }
    });
    if (!ok) return;

    SSW.details = {};
    document.querySelectorAll('#sw-fields [data-fid]').forEach(el => {
      SSW.details[el.dataset.fid] = el.value.trim();
    });
    swSaveDraft();
    swGoStep(3);
    swGenerate();
  }
}

/* ── IMPORT FILE HANDLERS ─────────────────────────────────── */

function _swImportStatus(type, msg) {
  const el = document.getElementById('sw-import-status');
  if (!el) return;
  el.className    = 'sw-import-status' + (type ? ' sw-import-status--' + type : '');
  el.textContent  = msg || '';
  el.style.display = msg ? 'block' : 'none';
}

function _swApplyExtracted(ext) {
  const map = { 'sw-prenom': 'prenom', 'sw-nom': 'nom', 'sw-email': 'email', 'sw-phone': 'phone' };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && ext[key]) el.value = ext[key];
  });
}

function swHandleImport(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';

  if (file.size > 3 * 1024 * 1024) {
    swShake(document.querySelector('.sw-import-btn'));
    return;
  }

  /* Affichage immédiat du fichier choisi */
  const chosen = document.getElementById('sw-import-chosen');
  const btn    = document.querySelector('.sw-import-btn');
  const nm     = document.getElementById('sw-import-name');
  if (nm)     nm.textContent       = file.name;
  if (chosen) chosen.style.display = 'flex';
  if (btn)    btn.style.display    = 'none';

  const canAnalyze = file.type === 'application/pdf' || file.type.startsWith('image/');

  if (!canAnalyze) {
    SSW.importFile = { name: file.name, type: file.type };
    _swImportStatus('neutral', 'Document joint · remplissez les champs ci-dessous');
    return;
  }

  _swImportStatus('loading', 'Analyse du document en cours…');

  const reader = new FileReader();
  reader.onload = async e => {
    SSW.importFile = { name: file.name, type: file.type, data: e.target.result };
    try {
      const res  = await fetch('/api/extract-doc', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ file: { data: e.target.result, type: file.type, name: file.name } })
      });
      const data = await res.json();
      if (data.ok && data.extracted) {
        SSW.importExtracted = data.extracted;
        _swApplyExtracted(data.extracted);
        const filled = Object.values(data.extracted).filter(v => v && String(v).trim()).length;
        _swImportStatus(
          filled > 0 ? 'success' : 'neutral',
          filled > 0
            ? 'Informations détectées — vérifiez et modifiez si nécessaire'
            : 'Document joint · remplissez les champs ci-dessous'
        );
      } else {
        _swImportStatus('neutral', 'Document joint · remplissez les champs ci-dessous');
      }
    } catch(_) {
      _swImportStatus('neutral', 'Document joint · remplissez les champs ci-dessous');
    }
  };
  reader.readAsDataURL(file);
}

function swRemoveImport() {
  SSW.importFile      = null;
  SSW.importExtracted = null;
  document.getElementById('sw-import-chosen').style.display = 'none';
  document.querySelector('.sw-import-btn').style.display    = 'flex';
  _swImportStatus('', '');
}

/* ── BUILD FORM (step 2) ──────────────────────────────────── */
function swBuildForm() {
  const questions = SVC[SSW.svc].questions(SSW.choice);
  const titles = {
    cv:             'Vos informations professionnelles',
    lettre:         'Votre candidature',
    courrier:       'Votre courrier officiel',
    dossier:        'Votre dossier administratif',
    sejour:         'Votre situation',
    impot:          'Votre demande',
    naturalisation: 'Votre dossier de naturalisation'
  };
  document.getElementById('sw-q-title').textContent = titles[SSW.svc] || 'Informations';

  /* Bouton import — uniquement si le choix implique un document existant */
  const showImport = (IMPORT_CHOICES[SSW.svc] || []).includes(SSW.choice);

  const importHtml = showImport ? `
    <div class="sw-import-wrap">
      <input type="file" id="sw-import-input" accept=".pdf,.jpg,.jpeg,.png"
             style="display:none" onchange="swHandleImport(this)">
      <button type="button" class="sw-import-btn"
              onclick="document.getElementById('sw-import-input').click()">
        <span class="sw-import-icon">⬆️</span>
        <span>
          <span class="sw-import-title">Gagnez du temps — importer votre document</span>
          <span class="sw-import-hint">PDF ou image · max 3 Mo · facultatif</span>
        </span>
      </button>
      <div class="sw-import-chosen" id="sw-import-chosen" style="display:none">
        <span>📄</span><span id="sw-import-name"></span>
        <button type="button" onclick="swRemoveImport()">✕</button>
      </div>
      <div class="sw-import-status" id="sw-import-status" style="display:none"></div>
    </div>` : '';

  document.getElementById('sw-fields').innerHTML = importHtml + questions.map(q => {
    const req = q.required ? 'data-req="1"' : '';
    let field;
    if (q.type === 'textarea') {
      field = `<textarea id="sw-f-${q.id}" data-fid="${q.id}" ${req}
                 placeholder="${escSw(q.placeholder || '')}" rows="4"></textarea>`;
    } else if (q.type === 'select') {
      const opts = (q.options || []).map(o => `<option value="${escSw(o)}">${escSw(o)}</option>`).join('');
      field = `<select id="sw-f-${q.id}" data-fid="${q.id}" ${req}>
                 <option value="">— Choisir —</option>${opts}
               </select>`;
    } else if (q.type === 'date') {
      field = `<input type="date" id="sw-f-${q.id}" data-fid="${q.id}" ${req}>`;
    } else if (q.type === 'radio') {
      const opts = (q.options || []).map(o =>
        `<label class="sw-radio"><input type="radio" name="sw-r-${q.id}" value="${escSw(o)}"
           onchange="document.getElementById('sw-f-${q.id}').value=this.value"> ${escSw(o)}</label>`
      ).join('');
      field = `<div class="sw-radio-group">${opts}</div>
               <input type="hidden" id="sw-f-${q.id}" data-fid="${q.id}" ${req}>`;
    } else if (q.type === 'hybrid-select') {
      const groups = (q.groups || []).map(g =>
        `<optgroup label="${escSw(g.label)}">${g.options.map(o =>
          `<option value="${escSw(o)}">${escSw(o)}</option>`
        ).join('')}</optgroup>`
      ).join('');
      field = `<div class="sw-hybrid">
                 <select class="sw-hybrid-select" onchange="swHybridPick('${q.id}', this.value); this.selectedIndex=0;">
                   <option value="">— Choisir dans la liste —</option>
                   ${groups}
                   <option value="__autre__">Autre (préciser ci-dessous)</option>
                 </select>
                 <input type="text" class="sw-hybrid-input" id="sw-f-${q.id}" data-fid="${q.id}" ${req}
                        placeholder="${escSw(q.placeholder || '')}">
               </div>`;
    } else if (q.type === 'tags') {
      const groups = (q.groups || []).map(g =>
        `<div class="sw-tags-cat">
           <div class="sw-tags-cat-title">${escSw(g.label)}</div>
           <div class="sw-tags-cat-btns">
             ${g.options.map(o => `<button type="button" class="sw-tag-btn" data-tag="${escSw(o)}">+ ${escSw(o)}</button>`).join('')}
           </div>
         </div>`
      ).join('');
      field = `<div class="sw-tags-wrap" id="sw-tags-wrap-${q.id}">
                 <div class="sw-tags-chips" id="sw-tags-chips-${q.id}" data-selected="[]"></div>
                 ${groups}
                 <textarea class="sw-tags-free" id="sw-tags-free-${q.id}" rows="2"
                           placeholder="${escSw(q.placeholder || '')}"
                           oninput="swTagsSync('${q.id}')"></textarea>
                 <input type="hidden" id="sw-f-${q.id}" data-fid="${q.id}" ${req}>
               </div>`;
    } else {
      field = `<input type="text" id="sw-f-${q.id}" data-fid="${q.id}" ${req}
                 placeholder="${escSw(q.placeholder || '')}">`;
    }
    return `<div class="sw-fg"><label for="sw-f-${q.id}">${escSw(q.label)}</label>${field}</div>`;
  }).join('');

  /* Brancher les boutons de tag (event delegation évitée au profit d'un câblage direct) */
  document.querySelectorAll('#sw-fields .sw-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.sw-tags-wrap');
      if (wrap) swTagAdd(wrap.id.replace('sw-tags-wrap-', ''), btn.dataset.tag);
    });
  });

  /* Restaurer l'état visuel de l'import si retour depuis l'étape 3 */
  if (showImport && SSW.importFile) {
    document.getElementById('sw-import-name').textContent     = SSW.importFile.name;
    document.getElementById('sw-import-chosen').style.display = 'flex';
    document.querySelector('.sw-import-btn').style.display    = 'none';
    if (SSW.importExtracted) {
      const filled = Object.values(SSW.importExtracted).filter(v => v?.trim()).length;
      _swImportStatus(
        filled > 0 ? 'success' : 'neutral',
        filled > 0 ? 'Informations détectées — vérifiez et modifiez si nécessaire'
                   : 'Document joint · remplissez les champs ci-dessous'
      );
    }
  }

  /* Pré-remplissage depuis extraction (si pas déjà rempli manuellement) */
  if (SSW.importExtracted) {
    Object.entries(SSW.importExtracted).forEach(([k, v]) => {
      const el = document.getElementById('sw-f-' + k);
      if (el && v && !el.value) el.value = v;
    });
  }

  /* Restore values if returning from step 3 (prioritaire sur l'extraction) */
  Object.entries(SSW.details).forEach(([k, v]) => {
    const el = document.getElementById('sw-f-' + k);
    if (el && v) {
      el.value = v;
      /* Si c'est un champ radio (hidden input), cocher le bouton correspondant */
      if (el.type === 'hidden') {
        const radio = document.querySelector(`input[name="sw-r-${k}"][value="${v}"]`);
        if (radio) radio.checked = true;
      }
    }
  });

  /* Restaurer les champs tags : la valeur stockée est remise dans la zone libre
     (on ne tente pas de re-cocher les tags pour éviter une parse ambiguë). */
  document.querySelectorAll('#sw-fields .sw-tags-wrap').forEach(wrap => {
    const id = wrap.id.replace('sw-tags-wrap-', '');
    const stored = (SSW.details[id] || '').trim();
    const free = wrap.querySelector('.sw-tags-free');
    if (free && stored && !free.value) free.value = stored;
    swTagsSync(id);
  });
}

/* ── HYBRID-SELECT + TAGS HELPERS ─────────────────────────── */

/** Sélection dans un <select> hybride : copie la valeur dans l'input texte associé. */
function swHybridPick(id, val) {
  const input = document.getElementById('sw-f-' + id);
  if (!input) return;
  if (val && val !== '__autre__') {
    input.value = val;
  } else if (val === '__autre__') {
    input.value = '';
    input.focus();
  }
}

/** Ajoute un tag à la sélection d'un champ "tags". */
function swTagAdd(id, tag) {
  const wrap = document.getElementById('sw-tags-wrap-' + id);
  if (!wrap || !tag) return;
  const chips = wrap.querySelector('.sw-tags-chips');
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  if (selected.includes(tag)) return;
  selected.push(tag);
  chips.dataset.selected = JSON.stringify(selected);
  _swRenderChips(id);
  wrap.querySelectorAll('.sw-tag-btn').forEach(b => {
    if (b.dataset.tag === tag) b.classList.add('sw-tag-btn--added');
  });
  swTagsSync(id);
}

/** Retire un tag de la sélection. */
function swTagRemove(id, tag) {
  const wrap = document.getElementById('sw-tags-wrap-' + id);
  if (!wrap) return;
  const chips = wrap.querySelector('.sw-tags-chips');
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  selected = selected.filter(t => t !== tag);
  chips.dataset.selected = JSON.stringify(selected);
  _swRenderChips(id);
  wrap.querySelectorAll('.sw-tag-btn').forEach(b => {
    if (b.dataset.tag === tag) b.classList.remove('sw-tag-btn--added');
  });
  swTagsSync(id);
}

/** Rerend les chips pour un champ tags à partir de dataset.selected. */
function _swRenderChips(id) {
  const chips = document.getElementById('sw-tags-chips-' + id);
  if (!chips) return;
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  chips.innerHTML = selected.map(t =>
    `<span class="sw-tag-chip" data-tag="${escSw(t)}">${escSw(t)}<button type="button" aria-label="Retirer">✕</button></span>`
  ).join('');
  chips.querySelectorAll('.sw-tag-chip button').forEach(btn => {
    btn.addEventListener('click', () => {
      const chip = btn.closest('.sw-tag-chip');
      if (chip) swTagRemove(id, chip.dataset.tag);
    });
  });
}

/** Synchronise le champ caché (data-fid) d'un champ tags avec les tags + le texte libre. */
function swTagsSync(id) {
  const wrap   = document.getElementById('sw-tags-wrap-' + id);
  const hidden = document.getElementById('sw-f-' + id);
  if (!wrap || !hidden) return;
  const chips = wrap.querySelector('.sw-tags-chips');
  const free  = wrap.querySelector('.sw-tags-free');
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  const joined  = selected.join(', ');
  const freeTxt = (free && free.value || '').trim();
  hidden.value = [joined, freeTxt].filter(Boolean).join(' · ');
}

/* ── PIPELINE HELPERS ─────────────────────────────────────── */

/** Lit le system prompt d'un agent depuis localStorage (configurable par admin). */
function swGetAgentPrompt(agentId) {
  try {
    const agents = JSON.parse(localStorage.getItem('dok_ai_agents') || '[]');
    const agent  = agents.find(function(a) { return a.id === agentId; });
    if (agent && agent.systemPrompt) return agent.systemPrompt;
  } catch(_) {}
  const defaults = {
    emma:   "Tu es un expert en rédaction de documents professionnels. Tu génères des documents HTML complets, clairs, sans fautes, richement structurés et adaptés au profil exact du client. Tu ne produis que du HTML autonome, jamais de texte seul.",
    sofia:  "Tu es un expert en optimisation de documents professionnels. Améliore ce document HTML pour un impact maximal : formulations percutantes, mise en valeur des points forts, contenu enrichi. Retourne UNIQUEMENT le HTML complet optimisé, sans aucun commentaire.",
    lea:    "Tu es un expert en mise en page et design de documents professionnels. Améliore la présentation visuelle de ce document HTML : mise en page soignée, typographie cohérente, espacement harmonieux, lisibilité optimale, impact visuel professionnel. Ne modifie pas le contenu rédactionnel. Retourne UNIQUEMENT le HTML complet mis en forme, sans aucun commentaire.",
    viktor: "Tu es un validateur expert. Vérifie ce document HTML, corrige les dernières erreurs (orthographe, cohérence, qualité finale). Retourne UNIQUEMENT le HTML complet validé, sans aucun commentaire, sans texte hors du HTML."
  };
  return defaults[agentId] || '';
}

/** Crée une demande vide dans Firebase dès le début de la génération. */
function swCreatePendingOrder() {
  const now = new Date();
  const id  = Date.now();
  const pad = function(n) { return String(n).padStart(2, '0'); };
  SSW.orderId   = id;
  SSW.orderDate = now.toISOString();
  var demande = {
    id:      id,
    service: SSW.svc,
    date:    now.toISOString().split('T')[0],
    heure:   pad(now.getHours()) + ':' + pad(now.getMinutes()),
    statut:  'submitted',
    note:    '',
    details: Object.assign({}, SSW.details, { 'sw-choice': SSW.choice })
  };
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
      firebase.database().ref('dok-peyi/demandes/' + id).set(demande);
  } catch(_) {}
}

/** Stocke les versions avant/après du Pôle Qualité dans Firebase. */
function swPipelineUpdatePQ(inputHtml, outputHtml) {
  if (!SSW.orderId) return;
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      firebase.database().ref('dok-peyi/demandes/' + SSW.orderId + '/_pq').set({
        statut:     'termine',
        inputHtml:  inputHtml,
        outputHtml: outputHtml,
        comment:    ''
      });
    }
  } catch(_) {}
}

/** Met à jour statut + événement _aiTeam dans Firebase en temps réel. */
function swPipelineUpdate(statut, aiKey, agentId, label) {
  if (!SSW.orderId) return;
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      var ref = firebase.database().ref('dok-peyi/demandes/' + SSW.orderId);
      var at  = new Date().toISOString();
      if (statut) ref.child('statut').set(statut);
      if (aiKey && agentId) ref.child('_aiTeam/' + aiKey).set({ aiId: agentId, at: at, label: label });
    }
  } catch(_) {}
}

/** Appel API vers un agent spécifique avec son system prompt. */
async function swCallAgent(systemPrompt, userPrompt) {
  var controller = new AbortController();
  var timeout    = setTimeout(function() { controller.abort(); }, 45000);
  try {
    var res = await fetch('/api/generate-cv', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ prompt: userPrompt, systemPrompt: systemPrompt }),
      signal:  controller.signal
    });
    clearTimeout(timeout);
    var data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.cv || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  } catch(err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('timeout');
    throw err;
  }
}

/* ── GENERATE — pipeline 4 agents ────────────────────────── */
async function swGenerate() {
  var loading = document.getElementById('sw-loading');
  var preview = document.getElementById('sw-preview');
  if (loading) { loading.style.display = 'flex'; loading.innerHTML = _loadingHTML(); }
  if (preview) preview.style.display = 'none';

  var updateMsg = function(txt) {
    var el = document.getElementById('sw-loading-msg');
    if (el) el.textContent = txt;
  };

  try {
    /* ── Créer la demande dans Firebase avant de commencer ── */
    swCreatePendingOrder();

    /* ── LUCAS — accueil (instant, pas d'appel IA) ── */
    updateMsg('Demande reçue');
    swPipelineUpdate('submitted', 'accueil', 'lucas', 'Demande reçue et collectée');
    await new Promise(function(r) { setTimeout(r, 600); });

    /* ── EMMA — génération du document ── */
    updateMsg('En préparation…');
    swPipelineUpdate('processing', null, null, null);
    var emmaResult = await swCallAgent(swGetAgentPrompt('emma'), swBuildPrompt());
    swPipelineUpdate('generated', 'generation', 'emma', 'Document rédigé');

    /* ── SOFIA — optimisation du brouillon ── */
    updateMsg('En cours de vérification…');
    swPipelineUpdate('pret_paiement', 'optimisation', 'sofia', 'Optimisation en cours');
    var sofiaPrompt = 'Optimise ce document HTML pour un impact maximal et une présentation impeccable. '
      + 'Améliore la fluidité du texte, l\'impact des formulations, la mise en forme. '
      + 'Retourne uniquement le HTML complet optimisé, sans aucun commentaire :\n\n' + emmaResult;
    var sofiaResult = await swCallAgent(swGetAgentPrompt('sofia'), sofiaPrompt);
    swPipelineUpdate('pret_paiement', 'optimisation', 'sofia', 'Optimisation terminée');

    /* ── LÉA — Pôle Qualité & Présentation ── */
    updateMsg('Mise en forme professionnelle…');   // client ne voit pas "IA"
    swPipelineUpdate('pole_qualite', 'presentation', 'lea', 'Mise en forme professionnelle en cours');
    var leaPrompt = 'Améliore la mise en page, la lisibilité, la structure et l\'harmonie visuelle de ce document HTML. '
      + 'Ne modifie pas le contenu rédactionnel. Améliore uniquement la présentation (espacement, typographie, hiérarchie visuelle, couleurs professionnelles, impact visuel). '
      + 'Retourne uniquement le HTML complet mis en forme, sans aucun commentaire :\n\n' + sofiaResult;
    var leaResult = await swCallAgent(swGetAgentPrompt('lea'), leaPrompt);
    /* Stocker avant/après pour la comparaison admin */
    swPipelineUpdatePQ(sofiaResult, leaResult);
    swPipelineUpdate('pole_qualite', 'presentation', 'lea', 'Mise en forme terminée');

    /* ── VIKTOR — validation finale ── */
    updateMsg('Prêt — finalisation…');
    swPipelineUpdate('a_verifier', 'verification', 'viktor', 'Validation finale en cours');
    var viktorPrompt = 'Voici un document HTML à valider. '
      + 'Corrige les éventuelles erreurs restantes (orthographe, grammaire, cohérence) et assure-toi de la qualité finale. '
      + 'Retourne uniquement le HTML complet validé, sans aucun commentaire :\n\n' + leaResult;
    var viktorResult = await swCallAgent(swGetAgentPrompt('viktor'), viktorPrompt);
    swPipelineUpdate('valide_manager', 'verification', 'viktor', 'Document validé et approuvé');

    SSW.html        = viktorResult;
    SSW.generatedAt = new Date().toISOString();

    /* ── Afficher le document final ── */
    if (loading) loading.style.display = 'none';
    if (preview) {
      preview.style.display = 'block';
      var iframe = document.getElementById('sw-iframe');
      if (iframe) {
        iframe.srcdoc  = SSW.html;
        iframe.onload  = swScaleFrame;
        swScaleFrame();
      }
    }
  } catch(e) {
    var isTimeout  = e.message === 'timeout';
    var isOffline  = !navigator.onLine || e.message.toLowerCase().includes('network') || e.message.toLowerCase().includes('fetch');
    var userMsg    = isTimeout  ? 'La génération a pris trop de temps. Nos serveurs sont occupés, réessayez dans quelques instants.'
                  : isOffline  ? 'Impossible de contacter nos serveurs. Vérifiez votre connexion internet, puis réessayez.'
                  : 'Une erreur est survenue lors de la génération. Réessayez ou revenez en arrière pour modifier vos informations.';
    if (loading) loading.innerHTML =
      '<div style="text-align:center;padding:32px 20px">'
      + '<div style="font-size:2.5rem;margin-bottom:14px">' + (isOffline ? '📡' : '⚠️') + '</div>'
      + '<div style="color:#dc2626;font-weight:700;font-size:1rem;margin-bottom:10px">Génération interrompue</div>'
      + '<div style="color:#64748b;font-size:.87rem;line-height:1.6;margin-bottom:24px;max-width:320px;margin-left:auto;margin-right:auto">' + escSw(userMsg) + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
      + '<button class="sw-btn-ghost" onclick="swGoStep(2)">← Modifier mes infos</button>'
      + '<button class="sw-btn-next" onclick="swGenerate()">Réessayer →</button>'
      + '</div></div>';
  }
}

function _loadingHTML() {
  return '<div class="sw-spinner"></div>'
    + '<div class="sw-loading-msg" id="sw-loading-msg">Demande reçue</div>'
    + '<div class="sw-loading-sub">Nous préparons votre document — cela prend quelques instants.</div>';
}

/* ── A4 SCALE ─────────────────────────────────────────────── */
function swScaleFrame() {
  const wrap  = document.getElementById('sw-a4-wrap');
  const frame = document.getElementById('sw-iframe');
  if (!wrap || !frame) return;
  const A4W = 794, A4H = 1123;
  const scale = Math.min(1, (wrap.clientWidth || 680) / A4W);
  frame.style.width           = A4W + 'px';
  frame.style.height          = A4H + 'px';
  frame.style.transform       = `scale(${scale})`;
  frame.style.transformOrigin = 'top left';
  wrap.style.height           = Math.ceil(A4H * scale) + 'px';
}
window.addEventListener('resize', () => { if (SSW.step === 3 && SSW.html) swScaleFrame(); });

/* ── BUILD PROMPT ─────────────────────────────────────────── */
function swBuildPrompt() {
  let prompts = {};
  try { prompts = JSON.parse(localStorage.getItem('dok_ai_prompts') || '{}'); } catch(e) {}

  /* Résolution de clé : impot et naturalisation ont un prompt par sous-type */
  const key = SSW.svc === 'cv'
    ? (SSW.choice === 'improve' ? 'cv_improve' : 'cv_scratch')
    : (SSW.svc === 'impot' || SSW.svc === 'naturalisation')
    ? SSW.svc + '_' + SSW.choice
    : SSW.svc;

  const tpl = (prompts[key] && prompts[key].trim()) ? prompts[key] : (swDefaultPrompts()[key] || swFallbackPrompt());

  const d = SSW.details, p = SSW.personal;
  const vars = {
    nom:             (p.prenom + ' ' + p.nom).trim(),
    email:           p.email           || '',
    tel:             p.phone           || '',
    poste:           d.poste           || '',
    experience:      d.experience      || '',
    formation:       d.formation       || '',
    competences:     d.competences     || '',
    infos:           d.infos           || '',
    note:            d.note            || '',
    entreprise:      d.entreprise      || '',
    motivation:      d.motivation      || '',
    type:            d.type            || (SSW.choice !== 'autre' ? SSW.choice : '') || '',
    description:     d.description     || '',
    documents:       d.documents       || '',
    destinataire:    d.destinataire    || '',
    objet:           d.objet           || '',
    nationalite:     d.nationalite     || '',
    situation:       d.situation       || '',
    choix:           SSW.choice        || '',
    revenus:         d.revenus         || '',
    duree:           d.duree           || '',
    famille:         d.famille         || '',
    travail:         d.travail         || '',
    parcours:        d.parcours        || '',
    visa_actuel:     d.visa_actuel     || '',
    date_expiration: d.date_expiration || '',
    duree_presence:  d.duree_presence  || '',
    situation_pro:   d.situation_pro   || '',
    historique_refus:d.historique_refus|| ''
  };

  const result = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : '');

  const importNote = SSW.importFile
    ? `\n\n[Document importé par le client : ${SSW.importFile.name}. Utilise ce document comme base et applique les demandes ci-dessus.]`
    : '';

  return result + importNote;
}

/* ── DEFAULT PROMPTS (si admin n'a pas configuré) ─────────── */
function swDefaultPrompts() {
  const FOOTER = '\nRéponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.';
  const SYS    = 'Tu es un assistant administratif professionnel. Ta mission : créer un document clair, structuré et adapté. Règles : ne pas inventer d\'informations · corriger les fautes · être simple et compréhensible · produire un document prêt à l\'emploi.';
  return {
    cv_scratch: `${SYS}
Tu es aussi expert en design de CV. Crée un CV complet et professionnel en HTML autonome (CSS inline, sans JS, format A4 prêt à imprimer).

Nom : {{nom}} | Email : {{email}} | Tél : {{tel}}
Poste recherché : {{poste}}
Expériences : {{experience}}
Formation : {{formation}}
Compétences : {{competences}}
Infos supplémentaires : {{infos}}

Design : en-tête fond bleu marine #1e3a5f (nom en grand, poste, contacts). Corps blanc : Expériences → Formation → Compétences → Infos. Accents #2563eb pour les titres de section. @media print marges 15mm.${FOOTER}`,

    cv_improve: `${SYS}
Modernise et améliore ce CV selon les souhaits du client.

Client : {{nom}} | Email : {{email}} | Tél : {{tel}}
Souhaits d'amélioration : {{note}}

Design : en-tête #1e3a5f, corps blanc, accents #2563eb, @media print marges 15mm.${FOOTER}`,

    lettre: `${SYS}
Rédige une lettre de motivation professionnelle en HTML (CSS inline, format A4).

Candidat : {{nom}} | Email : {{email}} | Tél : {{tel}}
Poste visé : {{poste}} | Entreprise : {{entreprise}}
Expérience : {{experience}} | Motivation : {{motivation}}
Notes / lettre existante : {{note}}

Structure : coordonnées candidat (gauche) / date + destinataire (droite) / objet en gras / corps percutant / formule de politesse. Marges 25mm, typographie professionnelle.${FOOTER}`,

    dossier: `${SYS}
Génère un guide d'aide pour démarches administratives en HTML (CSS inline, format A4).

Client : {{nom}} | Email : {{email}} | Tél : {{tel}}
Type de dossier : {{type}} ({{choix}}) | Besoin : {{description}} | Documents disponibles : {{documents}}

Contenu : 1) résumé de la situation 2) checklist documents à fournir ☐ 3) étapes numérotées 4) conseils pratiques et délais 5) coordonnées organismes (CAF/CPAM/Pôle Emploi/Préfecture Guyane…).
Design : en-tête #1e3a5f, accents #2563eb.${FOOTER}`,

    courrier: `${SYS}
Rédige un courrier officiel pour l'administration française en HTML (CSS inline, format A4).

Expéditeur : {{nom}} | Email : {{email}} | Tél : {{tel}}
Destinataire : {{destinataire}} | Objet : {{objet}} | Type : {{choix}}
Situation : {{description}}

Structure : coordonnées expéditeur (gauche) / ville + date (droite) / coordonnées destinataire / objet en gras / corps (contexte → demande → justification) / formule de politesse officielle. Marges 25mm.${FOOTER}`,

    sejour: `${SYS}
Tu es aussi spécialiste des démarches de titre de séjour en Guyane et en France. Génère un document d'aide personnalisé en HTML (CSS inline, format A4).

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Nationalité : {{nationalite}}
Type de demande : {{choix}} | Situation : {{situation}} | Documents disponibles : {{documents}}

Contenu :
1. Résumé de la situation et du type de demande
2. Démarches recommandées étape par étape (numérotées)
3. Checklist des documents à préparer ☐
4. Organismes compétents en Guyane (Préfecture, OFII, France Services…) avec adresses/horaires
5. Délais habituels et points de vigilance
6. Bandeau d'avertissement : "Ce document est une aide informatique. Il ne remplace pas un conseil juridique professionnel."

Design : en-tête fond rouge #b91c1c, accents #ef4444, corps blanc, @media print marges 15mm.${FOOTER}`,

    impot_comprendre: `${SYS}
Tu es aussi expert en fiscalité française et en aides sociales (Guyane / France).
Expert fiscal France/Guyane. Analyse cet avis d'imposition et produis un document HTML A4 CSS-inline structuré ainsi :
1. RÉSUMÉ (3 lignes max) : montant dû, échéance, situation fiscale
2. DÉCOMPOSITION LIGNE PAR LIGNE : chaque ligne de l'avis expliquée en langage simple
3. POINTS D'ATTENTION : surligné en orange si retard/pénalité/erreur probable
4. PROCHAINE ÉTAPE : action concrète à faire avant quelle date
5. CONTACT UTILE : DGFiP Guyane — 0809 401 401 / impots.gouv.fr

Client : {{nom}} | Revenus : {{revenus}} | Situation : {{situation}} | Question : {{description}}
Design : en-tête fond #0c4a6e, accents #0369a1, corps blanc, @media print marges 15mm.
RÈGLE : jamais de placeholder. Si donnée absente, adapte sans la mentionner.${FOOTER}`,

    impot_aide: `${SYS}
Tu es aussi expert en fiscalité française et en aides sociales (Guyane / France).
Expert fiscal France/Guyane. Produis un guide HTML A4 CSS-inline :
1. OBLIGATIONS : ce que ce client doit déclarer selon sa situation
2. DÉDUCTIONS POSSIBLES : liste exhaustive applicable à son profil (charges familiales, frais réels, DOM-TOM abattement 30–40%)
3. ERREURS FRÉQUENTES : 5 erreurs courantes pour ce profil
4. CALENDRIER FISCAL : dates clés pour sa situation
5. CONTACTS UTILES : DGFiP Guyane — 0809 401 401 / impots.gouv.fr

Client : {{nom}} | Revenus : {{revenus}} | Situation familiale : {{situation}} | Question : {{description}}
Design : en-tête fond #0c4a6e, accents #0369a1, corps blanc, @media print marges 15mm.
RÈGLE : abattement DOM-TOM toujours mentionné si applicable.${FOOTER}`,

    impot_courrier: `${SYS}
Tu es aussi expert en fiscalité française. Rédige un courrier officiel HTML A4 CSS-inline adressé à la DGFiP.
Structure : expéditeur (gauche) / Cayenne + date (droite) / destinataire / objet en gras / corps / formule officielle / signature
Destinataire : {{destinataire}} (sinon : Monsieur le Directeur des Finances Publiques de Guyane — 13 rue Lallouette, 97300 Cayenne)
Types de courrier selon l'objet :
- Demande de délai : motif légitime + proposition de plan d'apurement + référence article L.257 A du LPF
- Réclamation : faits chronologiques + préjudice + demande de révision + référence article R.197-1 du LPF
- Demande d'information : objet précis + référence avis + coordonnées

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Objet : {{objet}} | Situation : {{description}}
Design : structure épistolaire, marges 25mm.
RÈGLE : toujours inclure la référence légale adaptée au type de courrier.${FOOTER}`,

    naturalisation_situation: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane).
Expert naturalisation France/Guyane. Analyse l'éligibilité de ce client et produis un guide HTML A4 CSS-inline :
1. ÉLIGIBILITÉ : verdict clair (Éligible / Probablement éligible / Insuffisant) + justification selon critères légaux
2. CRITÈRES VÉRIFIÉS : tableau — Durée résidence (≥5 ans requis) / Intégration / Ressources stables / Casier judiciaire / Langue française — statut ✅ ⚠️ ❌ pour chaque
3. POINTS BLOQUANTS : si non éligible, exact motif légal + délai avant rééligibilité
4. PROCHAINE ÉTAPE : action concrète et délai
5. CONTACT : Préfecture de Guyane — 2 Cité Rebard, 97300 Cayenne — 05 94 39 45 00

Client : {{nom}} | Nationalité : {{nationalite}} | Durée résidence : {{duree}} | Famille : {{famille}} | Travail : {{travail}} | Situation : {{situation}}
Design : en-tête fond bleu marine #1e3a5f, accents #1d4ed8, corps blanc, @media print marges 15mm.
AVERTISSEMENT LÉGAL OBLIGATOIRE en rouge : "Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique. Consultez un avocat ou une association d'aide aux étrangers pour votre dossier officiel."${FOOTER}`,

    naturalisation_dossier: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane).
Expert naturalisation France/Guyane. Produis un guide de constitution de dossier HTML A4 CSS-inline :
1. DOCUMENTS OBLIGATOIRES : liste exhaustive avec ☐ checkbox, validité, original ou copie, traduction requise oui/non
2. DOCUMENTS COMPLÉMENTAIRES : pièces renforçant le dossier selon le profil client
3. PREUVES D'INTÉGRATION : liste adaptée au profil (travail, enfants scolarisés, associations, impôts, logement stable)
4. PIÈGES À ÉVITER : 5 erreurs qui font rejeter un dossier en Guyane
5. DÉPÔT : Préfecture Guyane — sur rendez-vous uniquement — 05 94 39 45 00
6. DÉLAIS : instruction 12-18 mois en Guyane, suivi dossier possible sur naturalisation.interieur.gouv.fr

Client : {{nom}} | Nationalité : {{nationalite}} | Durée résidence : {{duree}} | Documents disponibles : {{documents}}
Design : en-tête fond bleu marine #1e3a5f, accents #1d4ed8, corps blanc, @media print marges 15mm.
AVERTISSEMENT LÉGAL OBLIGATOIRE.${FOOTER}`,

    naturalisation_lettre: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane).
Expert naturalisation. Rédige une lettre de motivation HTML A4 CSS-inline pour une demande de naturalisation.
Structure : expéditeur / Cayenne + date / Monsieur le Préfet de Guyane, 2 Cité Rebard 97300 Cayenne / Objet : Demande de naturalisation française / corps / formule / signature
Corps en 4 paragraphes :
§1 PRÉSENTATION : identité, nationalité, durée de résidence en France/Guyane
§2 INTÉGRATION : vie professionnelle, sociale, familiale — concret et chiffré
§3 ATTACHEMENT : pourquoi la France, valeurs républicaines, contribution à la société
§4 ENGAGEMENT : respect des lois, projet de vie en France
Ton : respectueux, sincère, factuel — jamais suppliant

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Nationalité : {{nationalite}} | Durée résidence : {{duree}} | Famille : {{famille}} | Travail : {{travail}} | Motivation : {{motivation}} | Parcours : {{parcours}}
Design : structure épistolaire formelle, marges 25mm.
RÈGLE : personnaliser chaque paragraphe avec les données réelles du client. Zéro formule générique.${FOOTER}`
  };
}

function swFallbackPrompt() {
  return 'Tu es un assistant administratif. Génère un document HTML complet (CSS inline, format A4) pour : {{nom}}, email : {{email}}. Réponds UNIQUEMENT avec le code HTML complet.';
}

/* ── STEP 3 → 4 ───────────────────────────────────────────── */
function swGoStep4() {
  if (!SSW.html) return;
  const cfg = SVC[SSW.svc];
  const choiceLabel = (cfg.choices.find(c => c.id === SSW.choice) || {}).label || SSW.choice;

  document.getElementById('sw-recap').innerHTML = `
    <div class="sw-recap-row"><span>Client</span><span>${escSw(SSW.personal.prenom + ' ' + SSW.personal.nom)}</span></div>
    <div class="sw-recap-row"><span>Service</span><span>${cfg.icon} ${escSw(cfg.name)}</span></div>
    <div class="sw-recap-row"><span>Type</span><span>${escSw(choiceLabel)}</span></div>
    <div class="sw-recap-row sw-recap-total"><span>Total</span><span>${cfg.price}€</span></div>
    ${cfg.reviewRequired ? `<div class="sw-recap-review">⚠️ Ce service nécessite une vérification manuelle avant livraison du document final.</div>` : ''}
  `;
  document.getElementById('sw-pay-lbl').textContent = `Payer ${cfg.price}€ et obtenir mon document`;
  swGoStep(4);
}

function swPayTest() {
  SSW.paid = true;
  swClearDraft();
  swSaveOrder();
  swShowConfirm();
}

/* ── PAYMENT ──────────────────────────────────────────────── */
function swSwitchTab(btn, type) {
  document.querySelectorAll('.sw-pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const c = document.getElementById('sw-pay-card');
  const p = document.getElementById('sw-pay-paypal');
  if (c) c.style.display = type === 'card'   ? 'block' : 'none';
  if (p) p.style.display = type === 'paypal' ? 'block' : 'none';
}

function swPayPayPal() {
  const cfg     = SVC[SSW.svc] || {};
  const orderId = SSW.orderId || Date.now();
  SSW.orderId   = orderId;
  _swSaveState();
  const base   = location.origin;
  const params = new URLSearchParams({
    cmd:          '_xclick',
    business:     PAYPAL_EMAIL,
    amount:       cfg.price || 0,
    currency_code:'EUR',
    item_name:    "Dok'péyi — " + (cfg.name || SSW.svc),
    return:       base + '/service?success=1&order_id=' + orderId,
    cancel_return:base + '/service?s=' + SSW.svc + '&cancelled=1'
  });
  location.href = 'https://www.paypal.com/cgi-bin/webscr?' + params;
}

async function swPay() {
  if (IS_TEST_MODE) { swPayTest(); return; }

  if (document.getElementById('sw-pay-paypal')?.style.display !== 'none') {
    swPayPayPal(); return;
  }

  const btn = document.getElementById('sw-pay-btn');
  const lbl = document.getElementById('sw-pay-lbl');
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = '⏳ Redirection vers le paiement…';

  try {
    const cfg = SVC[SSW.svc] || {};
    _swSaveState(); /* sauvegarder l'état avant redirection */

    const res  = await fetch('/api/create-checkout', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        service: SSW.svc,
        amount:  cfg.price || 0,
        orderId: SSW.orderId || Date.now(),
        email:   SSW.personal.email,
        prenom:  SSW.personal.prenom,
        nom:     SSW.personal.nom
      })
    });
    const data = await res.json();

    if (!data.ok || !data.url) throw new Error(data.error || 'Erreur paiement');
    location.href = data.url; /* redirection vers Stripe Checkout */
  } catch(err) {
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = 'Réessayer';
    const errEl = document.createElement('p');
    errEl.style.cssText = 'color:#ef4444;font-size:.85rem;text-align:center;margin:10px 0 0';
    errEl.textContent = 'Erreur : ' + err.message;
    document.getElementById('sw-pay-btn')?.parentNode?.appendChild(errEl);
  }
}

function swSaveOrder() {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const cfg = SVC[SSW.svc];

    if (SSW.orderId) {
      /* ── Pipeline déjà lancé : enrichir la demande existante avec les infos personnelles ── */
      const update = {
        prenom:   SSW.personal.prenom  || '',
        nom:      SSW.personal.nom     || '',
        email:    SSW.personal.email   || '',
        whatsapp: SSW.personal.phone   || '',
        ville:    '',
        montant:  cfg ? cfg.price : 0,
        paid:     true
      };
      /* localStorage */
      const list = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
      const idx  = list.findIndex(d => d.id === SSW.orderId);
      if (idx !== -1) {
        Object.assign(list[idx], update);
      } else {
        list.unshift(Object.assign({ id: SSW.orderId, service: SSW.svc, date: now.toISOString().split('T')[0], heure: pad(now.getHours())+':'+pad(now.getMinutes()), statut: 'valide_manager', note: '', details: Object.assign({}, SSW.details, {'sw-choice': SSW.choice}) }, update));
      }
      localStorage.setItem('dok_demandes', JSON.stringify(list));
      /* Firebase */
      try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
          firebase.database().ref('dok-peyi/demandes/' + SSW.orderId).update(update);
      } catch(_) {}
      return;
    }

    /* ── Fallback : pipeline non lancé, créer la demande complète ── */
    const id = Date.now();
    const demande = {
      id,
      date:     now.toISOString().split('T')[0],
      heure:    pad(now.getHours()) + ':' + pad(now.getMinutes()),
      prenom:   SSW.personal.prenom,
      nom:      SSW.personal.nom,
      email:    SSW.personal.email,
      whatsapp: SSW.personal.phone || '',
      ville:    '',
      service:  SSW.svc,
      montant:  cfg ? cfg.price : 0,
      statut:   'valide_manager',
      details:  Object.assign({}, SSW.details, { 'sw-choice': SSW.choice }),
      note:     ''
    };
    SSW.orderId = id;
    const existing = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
    existing.unshift(demande);
    localStorage.setItem('dok_demandes', JSON.stringify(existing));
    try {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
        firebase.database().ref('dok-peyi/demandes/' + id).set(demande);
    } catch(_) {}
  } catch(_) {}
}

/**
 * Advance the current order to a new status.
 * Uses dokTransition() from lib/statuses.js to validate the move.
 *
 * @param {string} next   - Target status (use DOK_STATUS constants).
 * @param {object} [opts]
 * @param {boolean} [opts.force] - Skip validation (e.g. admin override).
 * @returns {boolean} true if the transition was applied.
 */
function swUpdateOrderStatus(next, opts) {
  if (!SSW.orderId) return false;

  const list = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
  const idx  = list.findIndex(d => d.id === SSW.orderId);
  if (idx === -1) return false;

  const result = (typeof dokTransition === 'function')
    ? dokTransition(list[idx].statut, next, opts)
    : { ok: true, status: next }; // graceful fallback if statuses.js not loaded

  if (!result.ok) {
    console.warn('[Dok\'péyi] Status transition blocked:', result.error);
    return false;
  }

  list[idx].statut = result.status;
  localStorage.setItem('dok_demandes', JSON.stringify(list));

  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
      firebase.database().ref('dok-peyi/demandes/' + SSW.orderId + '/statut').set(result.status);
  } catch(_) {}

  return true;
}

function swShowConfirm() {
  const cfg = SVC[SSW.svc];
  swGoStep(5);

  document.getElementById('sw-confirm-body').innerHTML = `
    <div class="sw-confirm-icon">🎉</div>
    <h2>Merci, ${escSw(SSW.personal.prenom)}&nbsp;!</h2>
    ${cfg.reviewRequired
      ? `<p class="sw-confirm-sub">Votre demande a bien été transmise à notre équipe.</p>
         <div class="sw-review-badge">📋 En cours de vérification — réponse sous 24–48h</div>
         <p style="font-size:.85rem;color:#64748b;max-width:420px;margin:0 auto 20px;line-height:1.6">${escSw(cfg.reviewMsg)}</p>`
      : `<p class="sw-confirm-sub">Votre document est prêt. Téléchargez-le puis imprimez-le ou enregistrez-le en PDF.</p>
         <button class="sw-btn-dl" onclick="swDownload()">⬇ Télécharger mon document</button>`
    }
    <p class="sw-confirm-email">Confirmation envoyée à <strong>${escSw(SSW.personal.email)}</strong></p>
    <a href="/" class="sw-btn-ghost" style="margin-top:24px;display:inline-flex">← Retour à l'accueil</a>
  `;
}

function swDownload() {
  if (!SSW.html) return;
  const svcName  = (SVC[SSW.svc] || {}).name || SSW.svc;
  const filename = (svcName + '_' + SSW.personal.prenom + '_' + SSW.personal.nom).replace(/[^a-zA-Z0-9_-]/g, '_');
  let html = SSW.html;
  if (/<title>/i.test(html))
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${filename}</title>`);
  else
    html = html.replace(/<head>/i, `<head><title>${filename}</title>`);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename + '.html' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/* ── PAYMENT HELPERS ──────────────────────────────────────── */
function swFmtCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function swFmtExp(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  input.value = v;
}

/* ── UTILITIES ────────────────────────────────────────────── */
function swShake(el) {
  if (!el) return;
  const t = el instanceof Element ? el : document.getElementById(el);
  if (!t) return;
  t.classList.remove('sw-shake');
  void t.offsetWidth;
  t.classList.add('sw-shake');
  if (t.focus) t.focus();
  setTimeout(() => t.classList.remove('sw-shake'), 600);
}

function escSw(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── DRAFT — sessionStorage save/restore ──────────────────── */
const DRAFT_KEY = 'dok_sw_draft';

function swSaveDraft() {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      svc:      SSW.svc,
      choice:   SSW.choice,
      personal: SSW.personal,
      details:  SSW.details
    }));
  } catch(_) {}
}

function swRestoreDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.svc !== SSW.svc) return false;
    if (d.choice)   SSW.choice   = d.choice;
    if (d.personal) SSW.personal = { ...SSW.personal, ...d.personal };
    if (d.details)  SSW.details  = d.details;

    /* Restore personal fields in the DOM */
    ['prenom','nom','email','phone'].forEach(k => {
      const el = document.getElementById('sw-' + k);
      if (el && SSW.personal[k]) el.value = SSW.personal[k];
    });
    return true;
  } catch(_) { return false; }
}

function swClearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch(_) {}
}

/* ── BEFOREUNLOAD — warn on step 3+ ───────────────────────── */
window.addEventListener('beforeunload', e => {
  if (SSW.step >= 3 && !SSW.paid) {
    e.preventDefault();
    e.returnValue = '';
  }
});
