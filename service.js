/* ============================================================
   DOK'PÉYI — Service Wizard  (service.js)
   Un seul moteur pour tous les services : CV, Lettre,
   Courrier, Dossier, Titre de séjour.
   ============================================================ */

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
        { id: 'poste',       label: 'Poste recherché *',            type: 'text',     placeholder: 'Ex : Employé(e) polyvalent(e), Aide-soignant(e)…', required: true },
        { id: 'experience',  label: 'Expériences professionnelles', type: 'textarea', placeholder: 'Postes occupés, entreprises, durées… (laissez vide si débutant)', required: false },
        { id: 'formation',   label: 'Formation / Diplômes',         type: 'textarea', placeholder: 'Niveau d\'études, diplômes, centres de formation…', required: false },
        { id: 'competences', label: 'Compétences',                  type: 'textarea', placeholder: 'Logiciels, langues, permis, savoir-faire…', required: false },
        { id: 'infos',       label: 'Informations supplémentaires', type: 'textarea', placeholder: 'Loisirs, disponibilité, mobilité géographique…', required: false }
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
        { id: 'nationalite', label: 'Nationalité *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Surinamaise…', required: true },
        { id: 'situation',   label: 'Votre situation actuelle *',    type: 'textarea', placeholder: 'Depuis quand êtes-vous en Guyane/France ? Avec quel document ? Quel est votre projet de séjour ?', required: true },
        { id: 'documents',   label: 'Documents dont vous disposez', type: 'textarea', placeholder: 'Passeport, visa, actes d\'état civil, attestation d\'hébergement, contrats de travail…', required: false }
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

/* ── STATE ───────────────────────────────────────────────── */
const SSW = {
  svc:      null,
  step:     1,
  choice:   null,
  personal: { prenom: '', nom: '', email: '', phone: '' },
  details:  {},
  html:     null,
  paid:     false,
  orderId:  null   // set by swSaveOrder(), used by swUpdateOrderStatus()
};

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', swInit);

function swInit() {
  const s = new URLSearchParams(location.search).get('s') || '';
  if (!SVC[s]) { location.href = '/'; return; }
  SSW.svc = s;

  const cfg = SVC[s];
  const root = document.documentElement;
  root.style.setProperty('--sw-color', cfg.color);
  root.style.setProperty('--sw-light', cfg.light);

  // Decompose hex for rgba() usage in CSS
  const hex = cfg.color.replace('#', '');
  root.style.setProperty('--sw-rgb',
    parseInt(hex.slice(0,2),16) + ',' +
    parseInt(hex.slice(2,4),16) + ',' +
    parseInt(hex.slice(4,6),16));

  document.getElementById('sw-hero-icon').textContent  = cfg.icon;
  document.getElementById('sw-hero-name').textContent  = cfg.name;
  document.getElementById('sw-hero-price').textContent = cfg.price + '€';
  document.title = cfg.name + ' — Dok\'péyi';

  swRenderChoices();
  swGoStep(1);
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
    swGoStep(3);
    swGenerate();
  }
}

/* ── BUILD FORM (step 2) ──────────────────────────────────── */
function swBuildForm() {
  const questions = SVC[SSW.svc].questions(SSW.choice);
  const titles = {
    cv: 'Vos informations professionnelles',
    lettre: 'Votre candidature',
    courrier: 'Votre courrier officiel',
    dossier: 'Votre dossier administratif',
    sejour: 'Votre situation'
  };
  document.getElementById('sw-q-title').textContent = titles[SSW.svc] || 'Informations';

  document.getElementById('sw-fields').innerHTML = questions.map(q => `
    <div class="sw-fg">
      <label for="sw-f-${q.id}">${escSw(q.label)}</label>
      ${q.type === 'textarea'
        ? `<textarea id="sw-f-${q.id}" data-fid="${q.id}" ${q.required ? 'data-req="1"' : ''}
             placeholder="${escSw(q.placeholder || '')}" rows="4"></textarea>`
        : `<input type="text" id="sw-f-${q.id}" data-fid="${q.id}" ${q.required ? 'data-req="1"' : ''}
             placeholder="${escSw(q.placeholder || '')}">`}
    </div>`).join('');

  // Restore values if returning from step 3
  Object.entries(SSW.details).forEach(([k, v]) => {
    const el = document.getElementById('sw-f-' + k);
    if (el) el.value = v;
  });
}

/* ── GENERATE (step 3) ────────────────────────────────────── */
async function swGenerate() {
  const loading = document.getElementById('sw-loading');
  const preview = document.getElementById('sw-preview');
  if (loading) { loading.style.display = 'flex'; loading.innerHTML = _loadingHTML(); }
  if (preview) preview.style.display = 'none';

  const msgs = [
    'On analyse vos informations…',
    'Rédaction en cours…',
    'Mise en forme du document…',
    'Vérification des détails…',
    'Finitions en cours…',
    'Presque prêt\u00a0!'
  ];
  let mi = 0;
  const msgEl = document.getElementById('sw-loading-msg');
  const timer = setInterval(() => {
    mi = (mi + 1) % msgs.length;
    if (msgEl) msgEl.textContent = msgs[mi];
  }, 3500);

  try {
    const res  = await fetch('/api/generate-cv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: swBuildPrompt() })
    });
    clearInterval(timer);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    SSW.html = (data.cv || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    if (loading) loading.style.display = 'none';
    if (preview) {
      preview.style.display = 'block';
      const iframe = document.getElementById('sw-iframe');
      if (iframe) {
        iframe.srcdoc  = SSW.html;
        iframe.onload  = swScaleFrame;
        swScaleFrame();
      }
    }
  } catch(e) {
    clearInterval(timer);
    if (loading) loading.innerHTML = `
      <div style="text-align:center;padding:24px 16px">
        <div style="font-size:2.5rem;margin-bottom:12px">❌</div>
        <div style="color:#ef4444;font-weight:700;margin-bottom:8px">Erreur de génération</div>
        <div style="color:#64748b;font-size:.87rem;margin-bottom:20px">${escSw(e.message)}</div>
        <button class="sw-btn-ghost" onclick="swGoStep(2)">← Retour et réessayer</button>
      </div>`;
  }
}

function _loadingHTML() {
  return `
    <div class="sw-spinner"></div>
    <div class="sw-loading-msg" id="sw-loading-msg">Génération en cours…</div>
    <div class="sw-loading-sub">L'IA rédige votre document — cela prend 10 à 30 secondes.</div>`;
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

  const key = SSW.svc === 'cv'
    ? (SSW.choice === 'improve' ? 'cv_improve' : 'cv_scratch')
    : SSW.svc;

  const tpl = (prompts[key] && prompts[key].trim()) ? prompts[key] : (swDefaultPrompts()[key] || swFallbackPrompt());

  const d = SSW.details, p = SSW.personal;
  const vars = {
    nom:          (p.prenom + ' ' + p.nom).trim(),
    email:        p.email        || '',
    tel:          p.phone        || '',
    poste:        d.poste        || '',
    experience:   d.experience   || '',
    formation:    d.formation    || '',
    competences:  d.competences  || '',
    infos:        d.infos        || '',
    note:         d.note         || '',
    entreprise:   d.entreprise   || '',
    motivation:   d.motivation   || '',
    type:         d.type         || (SSW.choice !== 'autre' ? SSW.choice : '') || '',
    description:  d.description  || '',
    documents:    d.documents    || '',
    destinataire: d.destinataire || '',
    objet:        d.objet        || '',
    nationalite:  d.nationalite  || '',
    situation:    d.situation    || '',
    choix:        SSW.choice     || '',
    revenus:      d.revenus      || '',
    duree:        d.duree        || '',
    famille:      d.famille      || '',
    travail:      d.travail      || '',
    parcours:     d.parcours     || ''
  };

  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : '');
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

    impot: `${SYS}
Tu es aussi expert en fiscalité française et en aides sociales (Guyane / France). Génère un document d'aide personnalisé en HTML (CSS inline, format A4).

Client : {{nom}} | Email : {{email}} | Tél : {{tel}}
Type de demande : {{choix}} | Type d'avis / Objet : {{type}} {{objet}}
Revenus : {{revenus}} | Situation familiale : {{situation}}
Description / Question : {{description}} | Destinataire : {{destinataire}}

Contenu selon le choix :
• "comprendre" → Explication pédagogique de l'avis, signification des montants, droits et recours possibles
• "aide" → Aides et exonérations auxquelles le client peut prétendre, démarches pour les obtenir
• "courrier" → Courrier officiel formel adressé aux services fiscaux (marges 25mm, structure réglementaire)

Coordonnées utiles : DGFIP Guyane, Centre des impôts de Cayenne, 0809 401 401, impots.gouv.fr.
Design : en-tête fond #0c4a6e, accents #0369a1, corps blanc, @media print marges 15mm.${FOOTER}`,

    naturalisation: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane). Génère un document d'aide complet en HTML (CSS inline, format A4).

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Nationalité : {{nationalite}}
Durée en France : {{duree}} | Famille : {{famille}} | Travail : {{travail}}
Type de demande : {{choix}} | Infos complémentaires : {{situation}} | Documents : {{documents}}
Parcours : {{parcours}} | Motivation : {{motivation}}

Contenu selon le choix :
• "situation" → Analyse des critères légaux (5 ans résidence, intégration, moralité, B1 français) + évaluation personnalisée + recommandations claires
• "dossier" → Checklist complète ☐ des documents requis + étapes chronologiques numérotées + délais habituels (12-24 mois)
• "lettre" → Lettre d'intégration officielle format épistolaire (HTML A4, 1-2 pages, ton personnel mais formel)

Organismes : Préfecture de Guyane (Cayenne), sous-préfecture Saint-Laurent-du-Maroni, France Services, OFII Guyane.
Bandeau d'avertissement obligatoire : "Ce document est une aide informatique. Il ne remplace pas une consultation à la préfecture ou un conseil juridique."
Design : en-tête fond bleu marine #1e3a5f, accents #2563eb, corps blanc, @media print marges 15mm.${FOOTER}`
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

/* ── PAYMENT ──────────────────────────────────────────────── */
function swSwitchTab(btn, type) {
  document.querySelectorAll('.sw-pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const c = document.getElementById('sw-pay-card');
  const p = document.getElementById('sw-pay-paypal');
  if (c) c.style.display = type === 'card'   ? 'block' : 'none';
  if (p) p.style.display = type === 'paypal' ? 'block' : 'none';
}

function swPay() {
  const cardEl = document.getElementById('sw-pay-card');
  if (cardEl && cardEl.style.display !== 'none') {
    const num = (document.getElementById('sw-card-num')?.value || '').replace(/\s/g, '');
    const exp =  document.getElementById('sw-card-exp')?.value || '';
    const cvv =  document.getElementById('sw-card-cvv')?.value || '';
    if (num.length < 16 || !exp.includes('/') || cvv.length < 3) {
      swShake(cardEl); return;
    }
  }
  const btn = document.getElementById('sw-pay-btn');
  const lbl = document.getElementById('sw-pay-lbl');
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = '⏳ Traitement en cours…';

  setTimeout(() => {
    SSW.paid = true;
    swSaveOrder();
    swShowConfirm();
  }, 2000);
}

function swSaveOrder() {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const id  = Date.now();
    const cfg = SVC[SSW.svc];

    // Default to 'submitted'. The wizard will call swUpdateOrderStatus() to
    // advance through the pipeline as the user progresses.
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
      montant:  cfg.price,
      statut:   'submitted',
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
