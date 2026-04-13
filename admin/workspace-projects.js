/* ============================================================
   DOK'PÉYI — Workspace Projets  (admin/workspace-projects.js)
   Module autonome, chargé après workspace-chat.js.

   Intercepte l'onglet 'projects' dans _renderComingSoon sans
   modifier workspace-chat.js.

   Fonctionnalités :
     • Liste des projets avec filtre par statut
     • Création inline (titre, description, statut)
     • Panneau détail latéral : description + changement de statut
     • Commentaires par projet
     • Suppression de projet
     • Persistance localStorage (dok_ws_projects)
   ============================================================ */

/* ── Intercepter l'onglet 'projects' ─────────────────────────
   Capture la fonction stub précédente et la chaîne si le tab
   n'est pas 'projects'.  */
(function () {
  const _prev = (typeof _renderComingSoon === 'function')
    ? _renderComingSoon
    : function () {};

  window._renderComingSoon = function (tab) {
    if (tab === 'projects') { renderWSProjects(); return; }
    _prev(tab);
  };
})();


/* ── État ─────────────────────────────────────────────────── */
let prjList     = _prjLoad('dok_ws_projects') || [];
let prjFilter   = 'all';       // 'all' | 'todo' | 'inprogress' | 'done'
let prjSelected = null;        // id du projet ouvert en détail
let prjNewOpen  = false;       // formulaire "nouveau projet" visible


/* ── Persistance ──────────────────────────────────────────── */
function _prjLoad(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
function _prjSave() {
  try { localStorage.setItem('dok_ws_projects', JSON.stringify(prjList)); } catch (e) {}
}
function _prjId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function _prjNow() { return new Date().toISOString(); }
function _prjFmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now - d) / 3600000);
  if (diffH < 1)   return 'à l\'instant';
  if (diffH < 24)  return `${diffH}h`;
  if (diffH < 168) return `${Math.floor(diffH / 24)}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function _prjFmtLong(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
function _prjEsc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Méta statuts ─────────────────────────────────────────── */
const PRJ_STATUS = {
  todo:       { label: 'À faire',   cls: 'prj-sp-todo',  icon: '○' },
  inprogress: { label: 'En cours',  cls: 'prj-sp-prog',  icon: '◕' },
  done:       { label: 'Terminé',   cls: 'prj-sp-done',  icon: '✓' }
};


/* ============================================================
   RENDU PRINCIPAL
   ============================================================ */
function renderWSProjects() {
  prjList = _prjLoad('dok_ws_projects') || prjList;
  const pane = document.getElementById('ws-projects-pane');
  if (!pane) return;

  pane.innerHTML = `
    <div class="prj-shell">

      <!-- En-tête ─────────────────────────────────────────── -->
      <div class="prj-header">
        <div class="prj-header-left">
          <div class="prj-header-icon">📂</div>
          <div>
            <div class="prj-header-title">Projets</div>
            <div class="prj-header-sub" id="prj-count"></div>
          </div>
        </div>
        <button class="prj-btn-new" id="prj-btn-new" onclick="prjToggleNewForm()">
          + Nouveau projet
        </button>
      </div>

      <!-- Formulaire nouveau projet (collapsed par défaut) ── -->
      <div class="prj-new-form" id="prj-new-form" style="display:none">
        <div class="prj-form-title">Nouveau projet</div>
        <div class="prj-form-row">
          <div class="prj-form-group" style="flex:2">
            <label class="prj-label">Titre *</label>
            <input class="prj-input" id="prj-f-title"
              placeholder="Nom du projet" maxlength="80"
              onkeydown="if(event.key==='Enter')prjSaveNew()">
          </div>
          <div class="prj-form-group" style="flex:1">
            <label class="prj-label">Statut</label>
            <select class="prj-select" id="prj-f-status">
              <option value="todo">À faire</option>
              <option value="inprogress">En cours</option>
              <option value="done">Terminé</option>
            </select>
          </div>
        </div>
        <div class="prj-form-group">
          <label class="prj-label">Description</label>
          <textarea class="prj-textarea" id="prj-f-desc"
            placeholder="Objectif, contexte…" rows="3"></textarea>
        </div>
        <div class="prj-form-actions">
          <button class="prj-btn-cancel" onclick="prjToggleNewForm()">Annuler</button>
          <button class="prj-btn-save"   onclick="prjSaveNew()">Créer le projet</button>
        </div>
      </div>

      <!-- Filtres ──────────────────────────────────────────── -->
      <div class="prj-filters" id="prj-filters">
        <button class="prj-filter ${prjFilter==='all'?'active':''}"
          onclick="prjSetFilter('all',this)">Tous</button>
        <button class="prj-filter ${prjFilter==='todo'?'active':''}"
          onclick="prjSetFilter('todo',this)"><span class="prj-flt-dot todo"></span>À faire</button>
        <button class="prj-filter ${prjFilter==='inprogress'?'active':''}"
          onclick="prjSetFilter('inprogress',this)"><span class="prj-flt-dot prog"></span>En cours</button>
        <button class="prj-filter ${prjFilter==='done'?'active':''}"
          onclick="prjSetFilter('done',this)"><span class="prj-flt-dot done"></span>Terminé</button>
      </div>

      <!-- Contenu : grille + détail ────────────────────────── -->
      <div class="prj-content" id="prj-content">
        <div class="prj-body" id="prj-body"></div>
        <div class="prj-detail" id="prj-detail" style="display:none"></div>
      </div>

    </div>`;

  prjRenderCount();
  prjRenderGrid();
  if (prjSelected) prjOpenDetail(prjSelected);
}

/* ── Compteur ── */
function prjRenderCount() {
  const el = document.getElementById('prj-count');
  if (!el) return;
  const n = prjList.length;
  el.textContent = n === 0 ? 'Aucun projet' : `${n} projet${n > 1 ? 's' : ''}`;
}


/* ============================================================
   GRILLE DE CARTES
   ============================================================ */
function prjRenderGrid() {
  const el = document.getElementById('prj-body');
  if (!el) return;

  const filtered = prjFilter === 'all'
    ? prjList
    : prjList.filter(p => p.status === prjFilter);

  if (filtered.length === 0) {
    el.innerHTML = `
      <div class="prj-empty">
        <div class="prj-empty-icon">📂</div>
        <div class="prj-empty-title">
          ${prjFilter === 'all' ? 'Aucun projet pour l\'instant' : 'Aucun projet dans ce statut'}
        </div>
        ${prjFilter === 'all'
          ? '<div class="prj-empty-sub">Créez votre premier projet avec le bouton ci-dessus.</div>'
          : ''}
      </div>`;
    return;
  }

  el.innerHTML = filtered.map(p => _prjCard(p)).join('');
}

function _prjCard(p) {
  const meta    = PRJ_STATUS[p.status] || PRJ_STATUS.todo;
  const ccount  = (p.comments || []).length;
  const owner   = (typeof USERS !== 'undefined')
    ? USERS.find(u => u.user === p.ownerId) || {}
    : {};
  const oColor  = owner.color || '#64748b';
  const oInit   = (p.ownerNom || '?').charAt(0).toUpperCase();
  const isOpen  = prjSelected === p.id;

  return `
    <div class="prj-card ${isOpen ? 'selected' : ''}" onclick="prjOpenDetail('${p.id}')">
      <div class="prj-card-top">
        <span class="prj-sp ${meta.cls}">${meta.icon} ${meta.label}</span>
        <span class="prj-card-age">${_prjFmt(p.ts)}</span>
      </div>
      <div class="prj-card-title">${_prjEsc(p.title)}</div>
      ${p.desc
        ? `<div class="prj-card-desc">${_prjEsc(p.desc)}</div>`
        : ''}
      <div class="prj-card-foot">
        <div class="prj-card-owner">
          <div class="prj-owner-dot" style="background:${oColor}">${oInit}</div>
          <span>${_prjEsc(p.ownerNom || '—')}</span>
        </div>
        <div class="prj-card-comments">
          <span>💬</span> ${ccount}
        </div>
      </div>
    </div>`;
}


/* ============================================================
   FILTRE STATUT
   ============================================================ */
function prjSetFilter(val, btn) {
  prjFilter   = val;
  prjSelected = null;
  document.querySelectorAll('.prj-filter').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  prjRenderGrid();
  prjCloseDetail();
}


/* ============================================================
   FORMULAIRE NOUVEAU PROJET
   ============================================================ */
function prjToggleNewForm() {
  prjNewOpen = !prjNewOpen;
  const form = document.getElementById('prj-new-form');
  const btn  = document.getElementById('prj-btn-new');
  if (!form) return;

  if (prjNewOpen) {
    form.style.display = 'block';
    form.style.animation = 'prjSlideDown .25s cubic-bezier(0.16,1,0.3,1)';
    if (btn) btn.textContent = '✕ Fermer';
    setTimeout(() => document.getElementById('prj-f-title')?.focus(), 80);
  } else {
    form.style.display = 'none';
    if (btn) btn.textContent = '+ Nouveau projet';
    // Reset champs
    const t = document.getElementById('prj-f-title');
    const d = document.getElementById('prj-f-desc');
    const s = document.getElementById('prj-f-status');
    if (t) t.value = '';
    if (d) d.value = '';
    if (s) s.value = 'todo';
  }
}

function prjSaveNew() {
  const title  = (document.getElementById('prj-f-title')?.value || '').trim();
  const desc   = (document.getElementById('prj-f-desc')?.value  || '').trim();
  const status = document.getElementById('prj-f-status')?.value || 'todo';

  if (!title) {
    document.getElementById('prj-f-title')?.focus();
    if (typeof showToast !== 'undefined') showToast('Le titre est obligatoire', 'error');
    return;
  }

  const who = (typeof currentUser !== 'undefined' && currentUser)
    ? { ownerId: currentUser.user, ownerNom: currentUser.nom }
    : { ownerId: 'anon', ownerNom: 'Inconnu' };

  const project = {
    id: _prjId(), title, desc, status,
    ...who,
    ts: _prjNow(),
    comments: []
  };

  prjList.unshift(project);
  _prjSave();

  prjToggleNewForm();      // fermer le formulaire
  prjRenderCount();
  prjRenderGrid();
  prjOpenDetail(project.id);

  if (typeof showToast !== 'undefined') showToast('Projet créé', 'success');
}


/* ============================================================
   PANNEAU DÉTAIL
   ============================================================ */
function prjOpenDetail(id) {
  const proj = prjList.find(p => p.id === id);
  if (!proj) return;

  prjSelected = id;

  // Marquer la carte sélectionnée
  document.querySelectorAll('.prj-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.prj-card[onclick*="'${id}'"]`)?.classList.add('selected');

  const detail = document.getElementById('prj-detail');
  if (!detail) return;

  detail.style.display = 'flex';
  detail.innerHTML     = _prjDetailHTML(proj);

  // Focus sur le champ de commentaire
  setTimeout(() => document.getElementById('prj-cmt-input')?.focus(), 120);
}

function prjCloseDetail() {
  prjSelected = null;
  const detail = document.getElementById('prj-detail');
  if (detail) detail.style.display = 'none';
}

function _prjDetailHTML(p) {
  const meta = PRJ_STATUS[p.status] || PRJ_STATUS.todo;
  const commentsHTML = (p.comments || []).length === 0
    ? `<div class="prj-no-cmt">Aucun commentaire. Soyez le premier !</div>`
    : (p.comments || []).map(c => _prjCommentHTML(c)).join('');

  return `
    <!-- Titre barre du détail -->
    <div class="prj-detail-header">
      <div class="prj-detail-title">${_prjEsc(p.title)}</div>
      <button class="prj-close-btn" onclick="prjCloseDetail()" title="Fermer">✕</button>
    </div>

    <!-- Corps scrollable -->
    <div class="prj-detail-body">

      <!-- Statut + supprimer ──────────────────────────────── -->
      <div class="prj-detail-meta">
        <div>
          <div class="prj-detail-label">Statut</div>
          <div class="prj-status-btns">
            ${Object.entries(PRJ_STATUS).map(([k, v]) => `
              <button class="prj-st-btn ${p.status === k ? 'active ' + v.cls : ''}"
                onclick="prjChangeStatus('${p.id}','${k}')">
                ${v.icon} ${v.label}
              </button>`).join('')}
          </div>
        </div>
        <button class="prj-del-btn" onclick="prjDelete('${p.id}')" title="Supprimer le projet">
          🗑
        </button>
      </div>

      <!-- Description ─────────────────────────────────────── -->
      ${p.desc ? `
        <div class="prj-detail-section">
          <div class="prj-detail-label">Description</div>
          <div class="prj-detail-desc">${_prjEsc(p.desc).replace(/\n/g, '<br>')}</div>
        </div>` : ''}

      <!-- Infos ───────────────────────────────────────────── -->
      <div class="prj-detail-section">
        <div class="prj-detail-label">Créé par</div>
        <div class="prj-detail-info">
          ${(() => {
            const u = (typeof USERS !== 'undefined')
              ? USERS.find(u => u.user === p.ownerId) || {} : {};
            return `<div class="prj-owner-dot" style="background:${u.color||'#64748b'};width:22px;height:22px;font-size:.62rem">
              ${(p.ownerNom||'?').charAt(0).toUpperCase()}</div>
              <span>${_prjEsc(p.ownerNom||'—')}</span>
              <span style="color:#4b5563;font-size:.74rem">· ${_prjFmtLong(p.ts)}</span>`;
          })()}
        </div>
      </div>

      <!-- Commentaires ────────────────────────────────────── -->
      <div class="prj-detail-section" style="flex:1">
        <div class="prj-detail-label">Commentaires
          <span class="prj-cmt-count">${(p.comments||[]).length}</span>
        </div>
        <div class="prj-comments-list" id="prj-comments-list">
          ${commentsHTML}
        </div>
      </div>

    </div><!-- /body -->

    <!-- Saisie commentaire (sticky bas) ─────────────────── -->
    <div class="prj-cmt-form">
      <div class="prj-cmt-row">
        ${(() => {
          const u = (typeof USERS !== 'undefined' && typeof currentUser !== 'undefined' && currentUser)
            ? USERS.find(u => u.user === currentUser.user) || {} : {};
          return `<div class="prj-owner-dot" style="background:${u.color||'#3b82f6'};width:28px;height:28px;font-size:.72rem;flex-shrink:0">
            ${(currentUser?.nom||'?').charAt(0).toUpperCase()}</div>`;
        })()}
        <input class="prj-cmt-input" id="prj-cmt-input"
          placeholder="Ajouter un commentaire…"
          onkeydown="if(event.key==='Enter')prjAddComment('${p.id}')">
        <button class="prj-cmt-send" onclick="prjAddComment('${p.id}')">↑</button>
      </div>
    </div>`;
}

function _prjCommentHTML(c) {
  const u = (typeof USERS !== 'undefined')
    ? USERS.find(u => u.user === c.userId) || {} : {};
  const color = u.color || '#64748b';
  const init  = (c.nom || '?').charAt(0).toUpperCase();
  return `
    <div class="prj-comment">
      <div class="prj-owner-dot" style="background:${color};width:28px;height:28px;font-size:.68rem;flex-shrink:0">${init}</div>
      <div class="prj-cmt-body">
        <div class="prj-cmt-header">
          <span class="prj-cmt-name">${_prjEsc(c.nom)}</span>
          <span class="prj-cmt-time">${_prjFmt(c.ts)}</span>
        </div>
        <div class="prj-cmt-text">${_prjEsc(c.text).replace(/\n/g, '<br>')}</div>
      </div>
    </div>`;
}


/* ============================================================
   ACTIONS PROJET
   ============================================================ */
function prjChangeStatus(id, status) {
  const proj = prjList.find(p => p.id === id);
  if (!proj) return;
  proj.status = status;
  _prjSave();

  // Rafraîchir boutons de statut dans le détail
  const meta = PRJ_STATUS[status] || PRJ_STATUS.todo;
  document.querySelectorAll('.prj-st-btn').forEach(b => {
    const k = b.getAttribute('onclick').match(/'([^']+)'\)$/)?.[1];
    b.className = 'prj-st-btn' + (k === status ? ` active ${PRJ_STATUS[k]?.cls||''}` : '');
  });

  // Rafraîchir la carte dans la grille
  const card = document.querySelector(`.prj-card[onclick*="'${id}'"]`);
  if (card) card.outerHTML = _prjCard(proj);

  if (typeof showToast !== 'undefined')
    showToast(`Statut mis à jour : ${meta.label}`, 'success');
}

function prjAddComment(id) {
  const input = document.getElementById('prj-cmt-input');
  const text  = (input?.value || '').trim();
  if (!text) return;

  const who = (typeof currentUser !== 'undefined' && currentUser)
    ? { userId: currentUser.user, nom: currentUser.nom }
    : { userId: 'anon', nom: 'Inconnu' };

  const proj = prjList.find(p => p.id === id);
  if (!proj) return;

  if (!proj.comments) proj.comments = [];
  const cmt = { id: _prjId(), ...who, ts: _prjNow(), text };
  proj.comments.push(cmt);
  _prjSave();

  if (input) input.value = '';

  // Injecter le commentaire sans re-rendre tout le détail
  const list = document.getElementById('prj-comments-list');
  if (list) {
    const noMsg = list.querySelector('.prj-no-cmt');
    if (noMsg) noMsg.remove();
    list.insertAdjacentHTML('beforeend', _prjCommentHTML(cmt));
    list.scrollTop = list.scrollHeight;
  }

  // Mettre à jour le compteur
  const counter = document.querySelector('.prj-cmt-count');
  if (counter) counter.textContent = proj.comments.length;

  // Mettre à jour le compteur dans la carte (si visible)
  const cardFoot = document.querySelector(`.prj-card[onclick*="'${id}'"] .prj-card-comments`);
  if (cardFoot) cardFoot.innerHTML = `<span>💬</span> ${proj.comments.length}`;
}

function prjDelete(id) {
  if (!confirm('Supprimer ce projet définitivement ?')) return;
  prjList    = prjList.filter(p => p.id !== id);
  prjSelected = null;
  _prjSave();
  prjRenderCount();
  prjRenderGrid();
  prjCloseDetail();
  if (typeof showToast !== 'undefined') showToast('Projet supprimé', 'success');
}
