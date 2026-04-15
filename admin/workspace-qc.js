/* ============================================================
   DOK'PÉYI — Module Contrôle Qualité (workspace-qc.js)
   Rendu via renderQualiteControl() depuis showSection('controle')
   ============================================================ */

/* ── État du module ── */
let qcSelected     = null;   // id de la demande sélectionnée
let qcFilter       = 'a_verifier'; // filtre actif
let qcCommentDraft = '';

/* ── Filtre tabs config ── */
const QC_FILTERS = [
  { id: 'all',                label: 'Toutes',          count: true  },
  { id: 'a_verifier',         label: '⏳ À vérifier',   count: true  },
  { id: 'correction_demandee',label: '❌ Correction',    count: true  },
  { id: 'en_redaction',       label: '✍️ En rédaction', count: false },
  { id: 'valide_manager',     label: '✅ Validés',       count: false },
  { id: 'assignee',           label: '👤 Assignées',    count: false },
];

/* ============================================================
   POINT D'ENTRÉE
   ============================================================ */
function renderQualiteControl() {
  const root = document.getElementById('qc-root');
  if (!root) return;

  root.innerHTML = `
    <div class="qc-shell">
      <div class="qc-list-panel" id="qc-list-panel">
        <div class="qc-list-head">
          <div class="qc-list-title">Contrôle qualité</div>
          <div class="qc-filter-row" id="qc-filters"></div>
        </div>
        <div class="qc-list-body" id="qc-list-body"></div>
      </div>
      <div class="qc-detail-panel" id="qc-detail-panel">
        <div class="qc-detail-empty">
          <div class="qc-detail-empty-icon">🔍</div>
          <div style="font-size:.85rem;font-weight:600;color:#475569">Sélectionne une demande</div>
          <div style="font-size:.75rem;color:#334155">Choisis une demande dans la liste pour voir le détail et agir</div>
        </div>
      </div>
    </div>
  `;

  _qcRenderFilters();
  _qcRenderList();
  _qcUpdateBadge();
}

/* ============================================================
   FILTRES
   ============================================================ */
function _qcRenderFilters() {
  const el = document.getElementById('qc-filters');
  if (!el) return;

  const role = currentUser?.role;

  // Le rédacteur n'a que "Mes demandes" et "Envoyées au contrôle"
  const tabs = role === 'redacteur'
    ? [
        { id: 'all',        label: 'Mes demandes', count: false },
        { id: 'a_verifier', label: '📤 Envoyées',   count: false },
      ]
    : QC_FILTERS;

  el.innerHTML = tabs.map(f =>
    `<button class="qc-filter ${qcFilter === f.id ? 'active' : ''}"
       onclick="qcSetFilter('${f.id}')">${f.label}</button>`
  ).join('');
}

function qcSetFilter(id) {
  qcFilter = id;
  _qcRenderFilters();
  _qcRenderList();
}

/* ============================================================
   LISTE
   ============================================================ */
function _qcRenderList() {
  const el = document.getElementById('qc-list-body');
  if (!el) return;

  const role = currentUser?.role;
  const uid  = currentUser?.user;

  // Filtrage selon rôle
  let pool = (demandes || []).filter(d => {
    if (role === 'redacteur') {
      // Le rédacteur ne voit que ses demandes assignées
      return d._qc?.assignedTo === uid;
    }
    return true; // admin / manager voient tout
  });

  // Filtrage selon onglet
  if (qcFilter !== 'all') {
    pool = pool.filter(d => d.statut === qcFilter);
  }

  // Tri : d'abord a_verifier, puis correction, puis le reste — par date décroissante
  const PRIO = { a_verifier: 0, correction_demandee: 1, assignee: 2, en_redaction: 3 };
  pool.sort((a, b) => {
    const pa = PRIO[a.statut] ?? 9;
    const pb = PRIO[b.statut] ?? 9;
    if (pa !== pb) return pa - pb;
    return (b.id || 0) - (a.id || 0);
  });

  if (!pool.length) {
    el.innerHTML = `<div class="qc-empty">
      <div style="font-size:1.8rem;opacity:.3">📭</div>
      <div>Aucune demande${qcFilter !== 'all' ? ' dans ce filtre' : ''}</div>
    </div>`;
    return;
  }

  el.innerHTML = pool.map(d => _qcCard(d)).join('');
}

function _qcCard(d) {
  const sel      = d.id === qcSelected ? 'selected' : '';
  const badge    = _qcStatusBadge(d.statut);
  const aiLabel  = _qcAILabel(d);
  const assignee = d._qc?.assignedTo
    ? _qcRedacteurChip(d._qc.assignedTo)
    : '';

  return `
    <div class="qc-card ${sel}" onclick="qcSelect(${d.id})">
      <div class="qc-card-top">
        <div>
          <div class="qc-card-name">${_qcEsc((d.prenom || '') + ' ' + (d.nom || ''))}</div>
          <div class="qc-card-svc">${_qcSvcName(d.service)} · #${d.id}</div>
        </div>
        ${badge}
      </div>
      <div class="qc-card-meta">
        <span class="qc-card-date">📅 ${_qcFmt(d.date || d.createdAt)}</span>
        ${assignee}
      </div>
      ${aiLabel ? `<div style="margin-top:5px;font-size:.67rem;color:#475569">${aiLabel}</div>` : ''}
    </div>
  `;
}

/* ============================================================
   SÉLECTION + DÉTAIL
   ============================================================ */
function qcSelect(id) {
  qcSelected = id;
  _qcRenderList();
  _qcRenderDetail();
}

function _qcRenderDetail() {
  const panel = document.getElementById('qc-detail-panel');
  if (!panel) return;

  const d = (demandes || []).find(x => x.id === qcSelected);
  if (!d) {
    panel.innerHTML = `
      <div class="qc-detail-empty">
        <div class="qc-detail-empty-icon">🔍</div>
        <div style="font-size:.85rem;font-weight:600;color:#475569">Sélectionne une demande</div>
      </div>`;
    return;
  }

  const role     = currentUser?.role;
  const canAct   = role === 'admin' || role === 'manager';
  const isOwn    = _qcIsOwn(d);

  panel.innerHTML = `
    <div class="qc-detail-head">
      <div>
        <div class="qc-detail-client">${_qcEsc((d.prenom || '') + ' ' + (d.nom || ''))}</div>
        <div class="qc-detail-meta">
          <span>${_qcSvcName(d.service)}</span>
          <span>·</span>
          <span>#${d.id}</span>
          <span>·</span>
          <span>${_qcFmt(d.date || d.createdAt)}</span>
          ${d._qc?.assignedTo ? `<span>· 👤 ${_qcGetUserName(d._qc.assignedTo)}</span>` : ''}
        </div>
      </div>
      ${_qcStatusBadge(d.statut)}
    </div>

    <div class="qc-detail-body">
      <!-- Prévisualisation document -->
      <div class="qc-doc-pane">
        <div class="qc-doc-label">Aperçu document</div>
        ${_qcRenderDocPreview(d)}
      </div>

      <!-- Panneau actions -->
      <div class="qc-action-pane">

        ${_qcRenderAITeam(d)}

        ${canAct ? `
        <div class="qc-section-label">⚡ Actions</div>

        ${d.statut !== 'valide_manager' ? `
        <button class="qc-btn qc-btn-valider" onclick="qcValider(${d.id})">
          ✅ Valider — Prêt au paiement
        </button>` : ''}

        ${d.statut !== 'correction_demandee' ? `
        <button class="qc-btn qc-btn-correction" onclick="qcDemanderCorrection(${d.id})">
          ❌ Demander une correction
        </button>` : ''}

        <button class="qc-btn qc-btn-relancer" onclick="qcRelancerGeneration(${d.id})">
          🔄 Relancer la génération IA
        </button>

        <div class="qc-section-label">👤 Assigner</div>
        <div class="qc-assign-row" id="qc-assign-row-${d.id}">
          ${_qcAssignChips(d)}
        </div>
        ` : ''}

        ${isOwn && role === 'redacteur' ? `
        <div class="qc-section-label">📤 Envoi contrôle</div>
        <button class="qc-btn qc-btn-envoyer" onclick="qcEnvoyerControle(${d.id})">
          📤 Envoyer au contrôle qualité
        </button>
        ` : ''}

        <div class="qc-section-label">💬 Commentaire interne</div>
        <textarea class="qc-comment-input" id="qc-comment-${d.id}" rows="3"
          placeholder="Ajouter un commentaire interne…"
          oninput="qcCommentDraft=this.value"></textarea>
        <button class="qc-btn-comment" onclick="qcAddComment(${d.id})">
          Envoyer le commentaire
        </button>

        <div class="qc-section-label">📋 Historique</div>
        ${_qcRenderHistory(d)}
      </div>
    </div>
  `;
}

/* ── Prévisualisation document ── */
function _qcRenderDocPreview(d) {
  const html = d._documents?.final || d._generatedHTML || d._cvHtml;

  if (html) {
    const esc = html.replace(/"/g, '&quot;');
    return `<iframe class="qc-doc-frame" srcdoc="${esc}" sandbox="allow-same-origin"></iframe>`;
  }

  return `
    <div class="qc-doc-none">
      <div style="font-size:2rem;opacity:.3">📄</div>
      <div style="font-weight:600;color:#475569">Document non encore généré</div>
      <div style="font-size:.75rem;color:#334155;text-align:center;max-width:180px">
        Utilise "Relancer la génération IA" pour produire le document
      </div>
    </div>
  `;
}

/* ── Historique ── */
function _qcRenderHistory(d) {
  const hist = d._qc?.history || [];
  const comments = (d._qc?.comments || []).map(c => ({
    action: 'commentaire', userId: c.userId, userName: c.userName,
    ts: c.ts, comment: c.text
  }));

  const all = [...hist, ...comments].sort((a, b) =>
    new Date(b.ts) - new Date(a.ts)
  );

  if (!all.length) {
    return `<div class="qc-empty"><div>Aucune action enregistrée</div></div>`;
  }

  return `<div class="qc-history">${all.map(h => `
    <div class="qc-hist-item ${h.action || ''}">
      <div class="qc-hist-who">${_qcEsc(h.userName || h.userId || '—')}</div>
      <div class="qc-hist-text">${_qcEsc(h.comment || _qcHistLabel(h.action))}</div>
      <div class="qc-hist-time">${_qcFmtAbs(h.ts)}</div>
    </div>
  `).join('')}</div>`;
}

/* ── IA team dans la demande ── */
function _qcRenderAITeam(d) {
  if (typeof AI_TEAM === 'undefined' || !AI_TEAM?.length) return '';
  const at = d._aiTeam;
  if (!at) return '';

  const steps = [
    { key: 'accueil',      icon: '🤝', label: 'Accueil'       },
    { key: 'generation',   icon: '✍️', label: 'Rédaction'     },
    { key: 'verification', icon: '🔍', label: 'Vérification'  },
    { key: 'optimisation', icon: '⚡', label: 'Optimisation'  },
  ];

  const rows = steps
    .filter(s => at[s.key])
    .map(s => {
      const entry  = at[s.key];
      const agent  = AI_TEAM.find(a => a.id === entry.aiId) || { nom: entry.aiId, color: '#475569' };
      return `
        <div class="qc-ai-step">
          <div class="qc-ai-dot" style="background:${agent.color}"></div>
          <div class="qc-ai-info">
            <span class="qc-ai-name" style="color:${agent.color}">${s.icon} ${agent.nom}</span>
            <span class="qc-ai-role">${agent.role || s.label}</span>
          </div>
          <div class="qc-ai-ts">${_qcFmtAbs(entry.at)}</div>
        </div>
      `;
    });

  if (!rows.length) return '';

  return `
    <div class="qc-section-label">🤖 Équipe IA</div>
    <div class="qc-ai-timeline">${rows.join('')}</div>
  `;
}

/* ============================================================
   ACTIONS
   ============================================================ */
function qcValider(id) {
  _qcAction(id, 'valide_manager', 'valide_manager', '✅ Validé — prêt au paiement');
}

function qcDemanderCorrection(id) {
  const comment = prompt('Décris la correction attendue (obligatoire) :');
  if (!comment || !comment.trim()) {
    showToast('Un commentaire est obligatoire pour demander une correction', 'error');
    return;
  }
  _qcAction(id, 'correction_demandee', 'correction_demandee',
    '❌ Correction demandée', comment.trim());
}

async function qcRelancerGeneration(id) {
  const d = (demandes || []).find(x => x.id === id);
  if (!d) return;

  showToast('🔄 Relance de la génération IA…', 'info');

  try {
    const resp = await fetch('/api/generate-cv', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, service: d.service, details: d.details })
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();

    if (json.html || json.document) {
      d._documents = d._documents || {};
      d._documents.final = json.html || json.document;
      d._generatedHTML = d._documents.final;

      const changes = { _documents: d._documents, _generatedHTML: d._generatedHTML, statut: 'generated' };
      d.statut = 'generated';

      try { localStorage.setItem('dok_demandes', JSON.stringify(demandes)); } catch(_) {}
      if (typeof db !== 'undefined' && db)
        db.ref('dok-peyi/demandes/' + id).update(changes);

      refreshBadge();
      qcSelect(id); // re-render detail
      showToast('✅ Document régénéré avec succès', 'success');
    } else {
      showToast('⚠️ Génération terminée mais document vide', 'error');
    }
  } catch (e) {
    showToast('❌ Erreur lors de la génération : ' + e.message, 'error');
  }
}

function qcEnvoyerControle(id) {
  _qcAction(id, 'a_verifier', 'a_verifier', '📤 Envoyé au contrôle qualité');
}

function qcAddComment(id) {
  const el = document.getElementById('qc-comment-' + id);
  const text = (el?.value || qcCommentDraft || '').trim();
  if (!text) { showToast('Commentaire vide', 'error'); return; }

  const d = (demandes || []).find(x => x.id === id);
  if (!d) return;

  const comment = {
    userId:   currentUser.user,
    userName: currentUser.nom,
    text,
    ts: new Date().toISOString()
  };

  const qc = d._qc || { comments: [], history: [] };
  qc.comments = [...(qc.comments || []), comment];
  d._qc = qc;

  try { localStorage.setItem('dok_demandes', JSON.stringify(demandes)); } catch(_) {}
  if (typeof db !== 'undefined' && db)
    db.ref('dok-peyi/demandes/' + id).update({ _qc: qc });

  if (el) el.value = '';
  qcCommentDraft = '';

  _qcRenderDetail();
  showToast('💬 Commentaire ajouté', 'success');
}

function qcAssigner(id, userId) {
  const d = (demandes || []).find(x => x.id === id);
  if (!d) return;

  const qc = d._qc || { comments: [], history: [] };
  const prevAssignee = qc.assignedTo;

  qc.assignedTo = (prevAssignee === userId) ? null : userId; // toggle
  qc.assignedAt = new Date().toISOString();

  const newStatus = qc.assignedTo ? 'assignee' : d.statut;

  _qcAction(id, newStatus, 'assignee',
    qc.assignedTo
      ? `👤 Assignée à ${_qcGetUserName(userId)}`
      : '👤 Désassignée');
}

/* ── Cœur : mutation + sync ── */
function _qcAction(id, newStatus, action, logLabel, comment) {
  const d = (demandes || []).find(x => x.id === id);
  if (!d) return;

  const histEntry = {
    action,
    userId:   currentUser.user,
    userName: currentUser.nom,
    ts:       new Date().toISOString(),
    comment:  comment || ''
  };

  const qc = d._qc || { comments: [], history: [] };
  qc.history = [...(qc.history || []), histEntry];

  // Assigner pour les actions d'assignation
  if (action === 'assignee' && comment === undefined) {
    // géré par qcAssigner
  }

  // Marquer l'étape IA vérification
  if (typeof AI_TEAM !== 'undefined' && (newStatus === 'valide_manager' || newStatus === 'correction_demandee')) {
    d._aiTeam = d._aiTeam || {};
    if (!d._aiTeam.verification) {
      const viktor = AI_TEAM.find(a => a.id === 'viktor');
      if (viktor) {
        d._aiTeam.verification = {
          aiId: 'viktor',
          at:   new Date().toISOString(),
          label: newStatus === 'valide_manager' ? 'Qualité vérifiée ✅' : 'Correction demandée ❌'
        };
      }
    }
  }

  d.statut = newStatus;
  d._qc    = qc;

  const changes = { statut: newStatus, _qc: qc };
  if (d._aiTeam) changes._aiTeam = d._aiTeam;

  try { localStorage.setItem('dok_demandes', JSON.stringify(demandes)); } catch(_) {}
  if (typeof db !== 'undefined' && db)
    db.ref('dok-peyi/demandes/' + id).update(changes);

  refreshBadge();
  _qcUpdateBadge();
  _qcRenderList();
  _qcRenderDetail();
  showToast(logLabel, 'success');
}

/* ============================================================
   BADGE NAV
   ============================================================ */
function _qcUpdateBadge() {
  const n = (demandes || []).filter(d =>
    d.statut === 'a_verifier' || d.statut === 'correction_demandee'
  ).length;
  const el = document.getElementById('nb-controle');
  if (el) { el.textContent = n; el.style.display = n ? 'flex' : 'none'; }
}

/* ============================================================
   HELPERS UI
   ============================================================ */
function _qcStatusBadge(st) {
  const STATUT_LABELS = window.STATUT_LABELS || {};
  const STATUT_CLASS  = window.STATUT_CLASS  || {};
  const label = STATUT_LABELS[st] || st;
  const cls   = STATUT_CLASS[st]  || '';
  return `<span class="badge ${cls}" style="font-size:.68rem;white-space:nowrap">${label}</span>`;
}

function _qcAssignChips(d) {
  if (typeof USERS === 'undefined') return '';
  const redacteurs = USERS.filter(u => u.role === 'redacteur' || u.role === 'manager');
  return redacteurs.map(u => {
    const active = d._qc?.assignedTo === u.user ? 'active' : '';
    return `<button class="qc-assign-chip ${active}"
      style="${active ? `color:${u.color};border-color:${u.color}` : ''}"
      onclick="qcAssigner(${d.id}, '${u.user}')">
      <span style="width:7px;height:7px;border-radius:50%;background:${u.color};display:inline-block"></span>
      ${_qcEsc(u.nom)}
    </button>`;
  }).join('');
}

function _qcRedacteurChip(userId) {
  if (typeof USERS === 'undefined') return '';
  const u = USERS.find(x => x.user === userId);
  if (!u) return '';
  return `<span class="qc-card-author">
    <span class="qc-avatar-xs" style="background:${u.color||'#475569'}">${u.nom.charAt(0)}</span>
    ${_qcEsc(u.nom)}
  </span>`;
}

function _qcGetUserName(userId) {
  if (typeof USERS === 'undefined') return userId;
  const u = USERS.find(x => x.user === userId);
  return u ? u.nom : userId;
}

function _qcAILabel(d) {
  if (typeof AI_TEAM === 'undefined' || !d._aiTeam) return '';
  const last = ['verification', 'optimisation', 'generation', 'accueil']
    .find(k => d._aiTeam[k]);
  if (!last) return '';
  const entry = d._aiTeam[last];
  const agent = AI_TEAM.find(a => a.id === entry.aiId);
  if (!agent) return '';
  return `${agent.icon || '🤖'} ${agent.nom} (IA) · ${entry.label || agent.specialite}`;
}

function _qcSvcName(service) {
  const SVC = {
    cv: 'CV Pro', lettre: 'Lettre motivation', dossier: 'Dossier admin',
    courrier: 'Courrier officiel', sejour: 'Titre de séjour',
    impot: 'Avis d\'impôt', naturalisation: 'Naturalisation'
  };
  return SVC[service] || service || '—';
}

function _qcHistLabel(action) {
  const MAP = {
    valide_manager:      '✅ Validé par le manager',
    correction_demandee: '❌ Correction demandée',
    a_verifier:          '📤 Envoyé au contrôle',
    assignee:            '👤 Demande assignée',
    commentaire:         '💬 Commentaire',
    en_redaction:        '✍️ Prise en charge',
    pret_paiement:       '💳 Prêt au paiement',
  };
  return MAP[action] || action || '—';
}

function _qcIsOwn(d) {
  const role = currentUser?.role;
  const uid  = currentUser?.user;
  return role === 'admin' || role === 'manager' || d._qc?.assignedTo === uid;
}

function _qcEsc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _qcFmt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const diff = Date.now() - d.getTime();
    if (diff < 60000)   return 'À l\'instant';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'min';
    if (diff < 86400000)return Math.floor(diff / 3600000) + 'h';
    if (diff < 604800000)return Math.floor(diff / 86400000) + 'j';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch(_) { return iso; }
}

function _qcFmtAbs(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch(_) { return iso; }
}
