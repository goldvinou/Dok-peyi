/* ============================================================
   DOK'PÉYI — Admin Panel JavaScript
   ============================================================ */

// ===== CONSTANTES =====
// ── Comptes utilisateurs — modifier les mots de passe ici ──────────────
const USERS = [
  { user: 'allan',  pass: 'Allan@2025',  nom: 'Allan',  role: 'admin',   color: '#2563eb' },
  { user: 'yonel',  pass: 'Yonel@2025',  nom: 'Yonel',  role: 'admin',   color: '#10b981' },
  { user: 'marvin', pass: 'Marvin@2025', nom: 'Marvin', role: 'admin',   color: '#f59e0b' }
];
// ── Rôles : admin = tout, manager = dashboard + demandes + stats ────────
const ROLE_SECTIONS = {
  admin:   ['dashboard','demandes','services','ia','stats'],
  manager: ['dashboard','demandes','stats']
};

const PRICES_DEFAULT = { cv: 8, lettre: 5, dossier: 12, courrier: 7 };
const SERVICE_NAMES  = { cv: 'CV Professionnel', lettre: 'Lettre de motivation', dossier: 'Dossier administratif', courrier: 'Courrier officiel' };
const SERVICE_ICONS  = { cv: '📄', lettre: '✉️', dossier: '📁', courrier: '📮' };

const STATUT_LABELS = {
  en_attente: 'En attente',
  en_cours:   'En cours',
  terminé:    'Terminé',
  annulé:     'Annulé'
};
const STATUT_CLASS = {
  en_attente: 'badge-attente',
  en_cours:   'badge-cours',
  terminé:    'badge-termine',
  annulé:     'badge-annule'
};

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
let demandes  = safeParse('dok_demandes') || [];
let services  = safeParse('dok_services') || buildDefaultServices();
let aiPrompts = safeParse('dok_ai_prompts') || buildDefaultPrompts();

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
- Format A4, marges 25mm, ton officiel adapté à l'administration${FOOTER}`
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
    description:   d['d-description']    || d['c-description'] || 'Non précisée',
    documents:     d['d-documents']       || 'Non précisés',
    destinataire:  d['c-destinataire']    || 'Non précisé',
    objet:         d['c-objet']           || 'Non précisé'
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
    courrier:{ name: 'Courrier officiel',      icon: '📮', price: 7,  active: true,  desc: 'Rédaction de courriers pour mairies, préfectures et administrations.' }
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
    try { sessionStorage.setItem('dok_auth_user', JSON.stringify(currentUser)); } catch(ex) {}
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
  try { sessionStorage.removeItem('dok_auth_user'); } catch(ex) {}
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
   INITIALISATION
   ============================================================ */
function init() {
  // Date dans la topbar
  const now = new Date();
  const el  = document.getElementById('topbar-date');
  if (el) el.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  refreshBadge();
  renderDashboard();

  // Firebase sync temps réel
  initFirebase();

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
    const saved = JSON.parse(sessionStorage.getItem('dok_auth_user') || 'null');
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
  stats:     'Statistiques'
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

  // Fermer la sidebar sur mobile
  closeSidebar();

  return false;
}

/* ============================================================
   SIDEBAR MOBILE
   ============================================================ */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sbOverlay').classList.toggle('visible');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('visible');
}

/* ============================================================
   BADGE DEMANDES EN ATTENTE
   ============================================================ */
function refreshBadge() {
  const count = demandes.filter(d => d.statut === 'en_attente').length;
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
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const total    = demandes.length;
  const termine  = demandes.filter(d => d.statut === 'terminé').length;
  const attente  = demandes.filter(d => d.statut === 'en_attente').length;
  const revenue  = demandes.filter(d => d.statut === 'terminé').reduce((s, d) => s + d.montant, 0);

  // KPIs
  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card blue">
      <div class="kpi-icon">📋</div>
      <div class="kpi-label">Total demandes</div>
      <div class="kpi-value">${total}</div>
      <div class="kpi-sub">Depuis le début</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">💶</div>
      <div class="kpi-label">Revenus générés</div>
      <div class="kpi-value">${revenue}€</div>
      <div class="kpi-sub">${termine} commandes terminées</div>
    </div>
    <div class="kpi-card orange">
      <div class="kpi-icon">⏳</div>
      <div class="kpi-label">En attente</div>
      <div class="kpi-value">${attente}</div>
      <div class="kpi-sub">À traiter</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-icon">📈</div>
      <div class="kpi-label">Taux de réussite</div>
      <div class="kpi-value">${total ? Math.round((termine / total) * 100) : 0}%</div>
      <div class="kpi-sub">Demandes complétées</div>
    </div>
  `;

  // Graphiques
  renderRevenueChart();
  renderDonutChart();

  // Tableau récent
  const recent = [...demandes].slice(0, 6);
  renderTable('recent-list', recent, true);
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
      .filter(dm => dm.date === str && dm.statut === 'terminé')
      .reduce((s, dm) => s + dm.montant, 0);
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
  const counts = { cv: 0, lettre: 0, dossier: 0, courrier: 0 };
  demandes.forEach(d => { if (counts[d.service] !== undefined) counts[d.service]++; });

  destroyChart('donut');
  const ctx = document.getElementById('ch-donut');
  if (!ctx) return;

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#6366f1'];
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
            <option value="en_attente" ${d.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
            <option value="en_cours"   ${d.statut === 'en_cours'   ? 'selected' : ''}>En cours</option>
            <option value="terminé"    ${d.statut === 'terminé'    ? 'selected' : ''}>Terminé</option>
            <option value="annulé"     ${d.statut === 'annulé'     ? 'selected' : ''}>Annulé</option>
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

function applyFilters() {
  const search  = (document.getElementById('f-search')  || {}).value || '';
  const statut  = (document.getElementById('f-statut')  || {}).value || 'all';
  const service = (document.getElementById('f-service') || {}).value || 'all';

  let filtered = [...demandes];

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(d =>
      d.prenom.toLowerCase().includes(q) ||
      d.nom.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q)
    );
  }
  if (statut  !== 'all') filtered = filtered.filter(d => d.statut  === statut);
  if (service !== 'all') filtered = filtered.filter(d => d.service === service);

  renderTable('demandes-table', filtered, false);
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
  if (db) fbUpdate(id, { statut: newStatus });
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
    'c-destinataire': 'Destinataire', 'c-objet': 'Objet', 'c-description': 'Description'
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

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-title">
      ${SERVICE_ICONS[d.service]} Demande #${d.id}
      <span class="badge ${STATUT_CLASS[d.statut] || ''}" style="margin-left:auto">${STATUT_LABELS[d.statut] || d.statut}</span>
    </div>

    <div class="modal-section cv-ai-section">
      <div class="modal-section-title">${{
        cv:       'Générer le CV',
        lettre:   'Rédiger la lettre de motivation',
        dossier:  'Générer le document d\'aide',
        courrier: 'Rédiger le courrier'
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
          cv:       isImprove ? 'Moderniser le CV' : 'Générer le CV',
          lettre:   'Rédiger la lettre',
          dossier:  'Générer le document',
          courrier: 'Rédiger le courrier'
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
          <p style="font-size:.79rem;color:var(--gray-600);margin-bottom:12px;line-height:1.5">Télécharge le PDF ci-dessus, puis clique le bouton d'envoi ci-dessous.<br>La commande sera automatiquement marquée <strong>Terminée</strong>.</p>
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
          <option value="en_attente" ${d.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
          <option value="en_cours"   ${d.statut === 'en_cours'   ? 'selected' : ''}>En cours</option>
          <option value="terminé"    ${d.statut === 'terminé'    ? 'selected' : ''}>Terminé</option>
          <option value="annulé"     ${d.statut === 'annulé'     ? 'selected' : ''}>Annulé</option>
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

  if (db) fbUpdate(d.id, { statut: d.statut, note: d.note });
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
    const cvChoix   = (d.details || {})['cv-choix'] || 'scratch';
    const promptKey = d.service === 'cv'
      ? (cvChoix === 'improve' ? 'cv_improve' : 'cv_scratch')
      : d.service;
    const template = aiPrompts[promptKey] || buildDefaultPrompts()[promptKey] || '';
    const prompt   = buildPromptFromTemplate(template, d);

    const _ctrl = new AbortController();
    const _tid  = setTimeout(() => _ctrl.abort(), 40000);
    let res;
    try {
      res = await fetch('/api/generate-cv', {
        method: 'POST',
        signal: _ctrl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
    } catch(fe) {
      clearTimeout(_tid);
      throw new Error(fe.name === 'AbortError' ? 'Délai dépassé (40s) — réessaie ou simplifie le prompt' : fe.message);
    }
    clearTimeout(_tid);
    let json;
    try { json = await res.json(); } catch(pe) { throw new Error(`HTTP ${res.status} — réponse non-JSON`); }
    if (!res.ok || json.error) throw new Error(`[${res.status}] ${json.error || 'Erreur API'}`);

    let rawCV = json.cv || '';
    // Strip markdown code fences if the AI wrapped the HTML
    rawCV = rawCV.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
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
  const svcLabel = { cv: 'CV', lettre: 'lettre de motivation', dossier: 'document administratif', courrier: 'courrier officiel' };
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
  const svcLabel = { cv: 'CV', lettre: 'lettre de motivation', dossier: 'document administratif', courrier: 'courrier officiel' };
  const doc     = svcLabel[d.service] || 'document';
  const subject = `Votre ${doc} — Dok'péyi`;
  const body    = `Bonjour ${d.prenom},\n\nVotre ${doc} est prêt. Vous trouverez le fichier PDF en pièce jointe.\n\nN'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement,\nL'équipe Dok'péyi`;
  window.location.href = `mailto:${d.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  markSent(id);
}

/* ── Marquer la commande comme terminée après envoi ── */
function markSent(id) {
  const d = demandes.find(dm => dm.id === id);
  if (!d || d.statut === 'terminé') return;
  d.statut = 'terminé';
  if (db) fbUpdate(id, { statut: 'terminé' });
  else    saveData();
  auditLog('document_envoyé', `#${id} — document envoyé au client`);
  refreshBadge();
  // Mettre à jour la modale ouverte
  const badge = document.querySelector('#modal-content .modal-title .badge');
  if (badge) { badge.textContent = 'Terminé'; badge.className = 'badge badge-termine'; }
  const sel = document.getElementById('modal-statut-sel');
  if (sel) sel.value = 'terminé';
  showToast('✅ Document envoyé — commande marquée Terminée !', 'success');
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
      vars: ['nom','email','tel','destinataire','objet','description'] }
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
  ['cv_scratch','cv_improve','lettre','dossier','courrier'].forEach(k => {
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
  const svcs    = ['cv', 'lettre', 'dossier', 'courrier'];
  const colors  = ['#2563eb', '#10b981', '#f59e0b', '#6366f1'];
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

      if (!firstLoad) {
        showToast('🔄 Données synchronisées en temps réel', 'success');
      }
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
