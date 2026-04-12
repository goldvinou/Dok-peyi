/* ============================================================
   DOK'PÉYI — Admin Panel JavaScript
   ============================================================ */

// ===== CONSTANTES =====
const CREDENTIALS = { user: 'admin', pass: 'dokpeyi2025' };
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

// ===== DONNÉES =====
function safeParse(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch(e) { localStorage.removeItem(key); return null; }
}
let demandes = safeParse('dok_demandes') || [];
let services = safeParse('dok_services') || buildDefaultServices();

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
   AUTHENTIFICATION
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

function handleLogin(e) {
  if (e) e.preventDefault();
  adminLogin();
}

function logout() {
  if (!confirm('Confirmer la déconnexion ?')) return;
  sessionStorage.removeItem('dok_auth');
  hideApp();
  document.getElementById('lg-user').value = '';
  document.getElementById('lg-pass').value = '';
}

function togglePw() {
  const input = document.getElementById('lg-pass');
  input.type = input.type === 'password' ? 'text' : 'password';
}

/* ============================================================
   INITIALISATION
   ============================================================ */
function init() {
  // Date dans la topbar
  const now = new Date();
  document.getElementById('topbar-date').textContent =
    now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Badge demandes en attente
  refreshBadge();

  // Rendre le dashboard
  renderDashboard();

  // Détection de nouvelles commandes en temps réel (autre onglet)
  window.addEventListener('storage', function(e) {
    if (e.key !== 'dok_demandes') return;
    demandes = safeParse('dok_demandes') || [];
    refreshBadge();
    if (APP.section === 'dashboard') renderDashboard();
    if (APP.section === 'demandes')  applyFilters();
    showToast('Nouvelle commande reçue !', 'success');
  });
}

// Auth gérée par le script inline dans index.html

/* ============================================================
   NAVIGATION
   ============================================================ */
const SECTION_TITLES = {
  dashboard: 'Tableau de bord',
  demandes:  'Demandes',
  services:  'Services & Tarifs',
  stats:     'Statistiques'
};

function showSection(name, navEl) {
  // Relire les données fraîches depuis localStorage
  demandes = safeParse('dok_demandes') || [];

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

function quickChangeStatus(id, newStatus) {
  const dem = demandes.find(d => d.id === id);
  if (!dem) return;
  dem.statut = newStatus;
  saveData();
  refreshBadge();
  showToast(`Statut mis à jour : ${STATUT_LABELS[newStatus]}`, 'success');
}

function deleteDemande(id) {
  if (!confirm('Supprimer cette demande définitivement ?')) return;
  demandes = demandes.filter(d => d.id !== id);
  saveData();
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
        <div class="cv-actions-row">
          <button class="btn-modal-save" onclick="previewCV()">👁 Aperçu</button>
          <button class="btn-modal-save" onclick="downloadCV()">⬇ PDF</button>
          <a id="cv-mailto" class="btn-modal-cancel" style="text-decoration:none;display:inline-flex;align-items:center;padding:9px 14px" target="_blank">📧 Email</a>
          ${d.whatsapp ? `<a id="cv-wa" class="btn-modal-cancel" style="text-decoration:none;display:inline-flex;align-items:center;padding:9px 14px" target="_blank">💬 WhatsApp</a>` : ''}
        </div>
        <details class="cv-editor-details">
          <summary>✏️ Modifier le document généré</summary>
          <p style="font-size:.78rem;color:var(--gray-500);margin-bottom:8px">Modifie le HTML puis clique Aperçu.</p>
          <textarea id="cv-html-editor" rows="12" oninput="APP.generatedCV=this.value"></textarea>
          <button class="btn-ai-gen" onclick="previewCV()" style="margin-top:8px;font-size:.82rem;padding:9px 16px">🔄 Aperçu avec mes modifications</button>
        </details>
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

  saveData();
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
    const res = await fetch('/api/generate-cv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ demande: d })
    });
    let json;
    try { json = await res.json(); } catch(pe) { throw new Error(`HTTP ${res.status} — réponse non-JSON`); }
    if (!res.ok || json.error) throw new Error(`[${res.status}] ${json.error || 'Erreur API'}`);

    APP.generatedCV = json.cv;

    // Remplir l'éditeur HTML
    const editor = document.getElementById('cv-html-editor');
    if (editor) editor.value = json.cv;

    // Préparer lien email
    const mailto = document.getElementById('cv-mailto');
    if (mailto) {
      mailto.href = `mailto:${encodeURIComponent(d.email)}?subject=${encodeURIComponent("Votre CV Dok'péyi")}&body=${encodeURIComponent(`Bonjour ${d.prenom},\n\nVotre CV est prêt. Vous trouverez le fichier PDF en pièce jointe.\n\nCordialement,\nDok'péyi`)}`;
    }

    // Préparer lien WhatsApp
    const waEl = document.getElementById('cv-wa');
    if (waEl && d.whatsapp) {
      const num = d.whatsapp.replace(/[\s\-().]/g, '').replace(/^\+/, '');
      waEl.href = `https://wa.me/${num}?text=${encodeURIComponent(`Bonjour ${d.prenom}, votre CV est prêt ! Je vous l'envoie en pièce jointe.`)}`;
    }

    document.getElementById('cv-result').style.display = 'block';
    btn.textContent = '✅ CV généré — téléchargez ci-dessous';
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

function downloadCV() {
  if (!APP.generatedCV) return;
  const w = window.open('', '_blank');
  if (!w) { showToast('Autorisez les popups du navigateur', 'error'); return; }
  w.document.write(APP.generatedCV);
  w.document.close();
  setTimeout(() => { try { w.print(); } catch(e) {} }, 700);
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
   PERSISTANCE
   ============================================================ */
function saveData() {
  localStorage.setItem('dok_demandes', JSON.stringify(demandes));
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
