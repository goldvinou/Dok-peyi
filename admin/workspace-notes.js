/* ============================================================
   DOK'PÉYI — Workspace Notes  (admin/workspace-notes.js)
   Module autonome, chargé après workspace-tasks.js.

   Intercepte l'onglet 'notes' dans _renderComingSoon sans
   modifier les modules précédents.

   Fonctionnalités :
     • Créer / modifier / supprimer une note
     • Notes générales ou liées à un projet
     • Liste à gauche, éditeur à droite (split-panel)
     • Recherche plein texte (titre + contenu)
     • Filtre par projet
     • Auto-save pendant la frappe (debounce 600 ms)
     • Persistance localStorage (dok_ws_notes)
   ============================================================ */

/* ── Intercepter l'onglet 'notes' ────────────────────────────
   Capture la fonction stub précédente et la chaîne si le tab
   n'est pas 'notes'.  */
(function () {
  const _prev = (typeof _renderComingSoon === 'function')
    ? _renderComingSoon
    : function () {};

  window._renderComingSoon = function (tab) {
    if (tab === 'notes') { renderWSNotes(); return; }
    _prev(tab);
  };
})();


/* ── Constantes ───────────────────────────────────────────── */
const NTE_COLORS = [
  { id: 'blue',   hex: '#388bfd', bg: '#0d2346' },
  { id: 'green',  hex: '#3fb950', bg: '#0a2b10' },
  { id: 'orange', hex: '#f0883e', bg: '#2d1a08' },
  { id: 'pink',   hex: '#e879f9', bg: '#2b0a2d' },
  { id: 'gray',   hex: '#8b949e', bg: '#1a1f27' }
];


/* ── État ─────────────────────────────────────────────────── */
let nteList      = _nteLoad('dok_ws_notes') || [];
let nteSelected  = null;    // id de la note ouverte
let nteFilter    = 'all';   // 'all' | projectId
let nteSearch    = '';      // texte de recherche
let _nteDebounce = null;    // timer auto-save
let _nteDirty    = false;   // modifications non sauvegardées


/* ── Persistance ──────────────────────────────────────────── */
function _nteLoad(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
function _nteSave() {
  try { localStorage.setItem('dok_ws_notes', JSON.stringify(nteList)); } catch (e) {}
}
function _nteId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function _nteNow() { return new Date().toISOString(); }

/* ── Projets depuis localStorage ──────────────────────────── */
function _nteProjects() {
  try {
    const raw = localStorage.getItem('dok_ws_projects');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

/* ── Escaping ─────────────────────────────────────────────── */
function _nteEsc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Formatage de date ────────────────────────────────────── */
function _nteFmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)   return 'à l\'instant';
  if (diff < 3600000) return `il y a ${Math.floor(diff/60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff/3600000)} h`;
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

/* ── Couleur d'une note ────────────────────────────────────── */
function _nteColor(note) {
  return NTE_COLORS.find(c => c.id === note.color) || NTE_COLORS[0];
}


/* ══════════════════════════════════════════════════════════
   RENDU PRINCIPAL
   ══════════════════════════════════════════════════════════ */
function renderWSNotes() {
  const pane = document.getElementById('ws-notes-pane');
  if (!pane) return;

  const projects = _nteProjects();

  pane.innerHTML = `
    <div class="nte-shell">

      <!-- ── Panneau gauche : liste ───────────────────────── -->
      <div class="nte-sidebar">

        <!-- Toolbar sidebar -->
        <div class="nte-sidebar-head">
          <button class="nte-btn-new" onclick="nteCreateNew()">
            <span class="nte-btn-new-icon">＋</span>
            <span>Nouvelle note</span>
          </button>

          <!-- Recherche -->
          <div class="nte-search-wrap">
            <span class="nte-search-icon">🔍</span>
            <input class="nte-search" id="nte-search-inp"
              placeholder="Rechercher…"
              oninput="nteOnSearch(this.value)"
              value="${_nteEsc(nteSearch)}" />
          </div>

          <!-- Filtre projet -->
          <div class="nte-proj-filter">
            <select class="nte-proj-sel" id="nte-proj-sel"
              onchange="nteSetFilter(this.value)">
              <option value="all" ${nteFilter==='all'?'selected':''}>Tous les projets</option>
              <option value="__none__" ${nteFilter==='__none__'?'selected':''}>— Sans projet —</option>
              ${projects.map(p =>
                `<option value="${_nteEsc(p.id)}" ${nteFilter===p.id?'selected':''}>${_nteEsc(p.title)}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <!-- Liste des notes -->
        <div class="nte-list" id="nte-list"></div>
      </div>

      <!-- ── Panneau droit : éditeur ──────────────────────── -->
      <div class="nte-editor-pane" id="nte-editor-pane">
        <div class="nte-empty-state" id="nte-empty-state">
          <div class="nte-empty-icon">📝</div>
          <div class="nte-empty-title">Aucune note sélectionnée</div>
          <div class="nte-empty-sub">Ouvre une note ou crée-en une nouvelle.</div>
          <button class="nte-btn-new nte-btn-new-center" onclick="nteCreateNew()">
            <span class="nte-btn-new-icon">＋</span>
            <span>Nouvelle note</span>
          </button>
        </div>
        <div class="nte-editor" id="nte-editor" style="display:none"></div>
      </div>

    </div>`;

  nteRenderList();

  /* Si une note était ouverte, la rouvrir */
  if (nteSelected) {
    const still = nteList.find(n => n.id === nteSelected);
    if (still) _nteOpenEditor(still); else nteSelected = null;
  }
}


/* ══════════════════════════════════════════════════════════
   LISTE
   ══════════════════════════════════════════════════════════ */
function nteRenderList() {
  const list = document.getElementById('nte-list');
  if (!list) return;

  const projects = _nteProjects();
  const prjMap   = {};
  projects.forEach(p => { prjMap[p.id] = p.title; });

  /* Filtrer */
  const q = nteSearch.toLowerCase().trim();
  const filtered = nteList.filter(n => {
    const prjOk = nteFilter === 'all'
      || (nteFilter === '__none__' && !n.projectId)
      || n.projectId === nteFilter;
    const srchOk = !q
      || (n.title   || '').toLowerCase().includes(q)
      || (n.content || '').toLowerCase().includes(q);
    return prjOk && srchOk;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="nte-list-empty">
      <span style="font-size:1.6rem">🗒️</span>
      <span>${q || nteFilter !== 'all' ? 'Aucun résultat' : 'Aucune note. Crée-en une !'}</span>
    </div>`;
    return;
  }

  /* Tri : note sélectionnée en tête, puis par date mise à jour */
  filtered.sort((a, b) => {
    if (a.id === nteSelected) return -1;
    if (b.id === nteSelected) return 1;
    return (b.updated || b.ts) > (a.updated || a.ts) ? 1 : -1;
  });

  list.innerHTML = filtered.map(n => {
    const col     = _nteColor(n);
    const prjName = n.projectId ? (prjMap[n.projectId] || 'Projet') : null;
    const excerpt = (n.content || '').replace(/\s+/g,' ').trim().slice(0, 80);
    const isOpen  = n.id === nteSelected;

    return `
      <div class="nte-card ${isOpen ? 'nte-card-active' : ''}"
           id="nte-card-${n.id}"
           onclick="nteOpenNote('${n.id}')">
        <div class="nte-card-accent" style="background:${col.hex}"></div>
        <div class="nte-card-body">
          <div class="nte-card-top">
            <span class="nte-card-title">${_nteEsc(n.title) || '<em style="opacity:.4">Sans titre</em>'}</span>
            <span class="nte-card-date">${_nteFmtDate(n.updated || n.ts)}</span>
          </div>
          ${prjName ? `<span class="nte-card-prj" style="background:${col.bg};color:${col.hex}">📁 ${_nteEsc(prjName)}</span>` : ''}
          ${excerpt ? `<p class="nte-card-excerpt">${_nteEsc(excerpt)}${(n.content||'').length > 80 ? '…' : ''}</p>` : ''}
        </div>
      </div>`;
  }).join('');
}


/* ══════════════════════════════════════════════════════════
   ÉDITEUR
   ══════════════════════════════════════════════════════════ */
function nteOpenNote(id) {
  /* Sauvegarder les modifications en cours avant de changer */
  if (_nteDirty && nteSelected && nteSelected !== id) {
    _nteFlushEditor();
  }

  const note = nteList.find(n => n.id === id);
  if (!note) return;
  nteSelected = id;
  nteRenderList();       // met à jour la carte active
  _nteOpenEditor(note);
}

function _nteOpenEditor(note) {
  const editorPane = document.getElementById('nte-editor-pane');
  const emptyState = document.getElementById('nte-empty-state');
  const editor     = document.getElementById('nte-editor');
  if (!editorPane || !editor) return;

  const col      = _nteColor(note);
  const projects = _nteProjects();
  const prjMap   = {};
  projects.forEach(p => { prjMap[p.id] = p.title; });

  if (emptyState) emptyState.style.display = 'none';
  editor.style.display = 'flex';

  editor.innerHTML = `
    <!-- Header éditeur -->
    <div class="nte-ed-head">
      <!-- Sélecteur couleur -->
      <div class="nte-color-picker" id="nte-color-picker">
        ${NTE_COLORS.map(c => `
          <button class="nte-color-dot ${note.color === c.id ? 'nte-color-active' : ''}"
                  style="background:${c.hex}"
                  title="${c.id}"
                  onclick="nteSetColor('${note.id}','${c.id}')"></button>
        `).join('')}
      </div>

      <!-- Lien projet -->
      <div class="nte-ed-proj-wrap">
        <select class="nte-ed-proj-sel" id="nte-ed-proj"
                onchange="nteSetProject('${note.id}', this.value)">
          <option value="">— Sans projet —</option>
          ${projects.map(p =>
            `<option value="${_nteEsc(p.id)}" ${note.projectId===p.id?'selected':''}>${_nteEsc(p.title)}</option>`
          ).join('')}
        </select>
      </div>

      <!-- Actions -->
      <div class="nte-ed-actions">
        <span class="nte-save-status" id="nte-save-status"></span>
        <button class="nte-btn-del" onclick="nteDelete('${note.id}')" title="Supprimer la note">🗑</button>
      </div>
    </div>

    <!-- Accent bar couleur -->
    <div class="nte-ed-accent-bar" id="nte-ed-accent-bar" style="background:${col.hex}"></div>

    <!-- Titre -->
    <div class="nte-ed-title-wrap">
      <textarea class="nte-ed-title" id="nte-ed-title"
        placeholder="Titre de la note…"
        maxlength="160"
        rows="1"
        oninput="nteAutoResize(this); nteTriggerSave('${note.id}')"
        >${_nteEsc(note.title)}</textarea>
    </div>

    <!-- Date -->
    <div class="nte-ed-meta">
      Modifié ${_nteFmtDate(note.updated || note.ts)}
    </div>

    <!-- Contenu -->
    <textarea class="nte-ed-content" id="nte-ed-content"
      placeholder="Commence à écrire…"
      oninput="nteTriggerSave('${note.id}')"
      >${_nteEsc(note.content)}</textarea>`;

  /* Auto-resize du titre */
  const titleEl = document.getElementById('nte-ed-title');
  if (titleEl) nteAutoResize(titleEl);

  _nteDirty = false;
}


/* ── Auto-resize textarea titre ──────────────────────────── */
function nteAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}


/* ── Déclenche une sauvegarde différée (debounce 600 ms) ─── */
function nteTriggerSave(id) {
  _nteDirty = true;
  const statusEl = document.getElementById('nte-save-status');
  if (statusEl) statusEl.textContent = '…';
  clearTimeout(_nteDebounce);
  _nteDebounce = setTimeout(() => _nteFlushEditor(id), 600);
}


/* ── Récupère et sauvegarde les valeurs de l'éditeur ──────── */
function _nteFlushEditor(id) {
  const targetId = id || nteSelected;
  if (!targetId) return;
  const note = nteList.find(n => n.id === targetId);
  if (!note) return;

  const titleEl   = document.getElementById('nte-ed-title');
  const contentEl = document.getElementById('nte-ed-content');
  if (!titleEl || !contentEl) return;

  note.title   = titleEl.value.trim();
  note.content = contentEl.value;
  note.updated = _nteNow();
  _nteDirty    = false;

  _nteSave();

  /* Feedback visuel */
  const statusEl = document.getElementById('nte-save-status');
  if (statusEl) {
    statusEl.textContent = 'Sauvegardé ✓';
    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
  }

  /* Rafraîchir la carte dans la liste (titre + extrait) sans perdre le focus */
  _nteRefreshCard(note);
}


/* ── Met à jour uniquement la carte de la liste ───────────── */
function _nteRefreshCard(note) {
  const card = document.getElementById('nte-card-' + note.id);
  if (!card) return;
  nteRenderList();   // simple re-render liste (légère)
}


/* ══════════════════════════════════════════════════════════
   ACTIONS
   ══════════════════════════════════════════════════════════ */

/* ── Créer une nouvelle note ──────────────────────────────── */
function nteCreateNew() {
  /* Flush avant de créer */
  if (_nteDirty && nteSelected) _nteFlushEditor();

  const note = {
    id:        _nteId(),
    title:     '',
    content:   '',
    projectId: nteFilter !== 'all' && nteFilter !== '__none__' ? nteFilter : null,
    color:     'blue',
    ts:        _nteNow(),
    updated:   _nteNow()
  };

  nteList.unshift(note);
  _nteSave();
  nteSelected = note.id;
  nteRenderList();
  _nteOpenEditor(note);

  /* Focus direct sur le titre */
  setTimeout(() => {
    const t = document.getElementById('nte-ed-title');
    if (t) t.focus();
  }, 60);
}


/* ── Changer la couleur d'une note ────────────────────────── */
function nteSetColor(id, colorId) {
  const note = nteList.find(n => n.id === id);
  if (!note) return;
  note.color   = colorId;
  note.updated = _nteNow();
  _nteSave();

  /* Mettre à jour les dots actifs */
  document.querySelectorAll('.nte-color-dot').forEach(btn => {
    btn.classList.toggle('nte-color-active', btn.title === colorId);
  });

  /* Mettre à jour la barre de couleur */
  const col  = _nteColor(note);
  const bar  = document.getElementById('nte-ed-accent-bar');
  if (bar) bar.style.background = col.hex;

  _nteRefreshCard(note);
}


/* ── Lier à un projet ─────────────────────────────────────── */
function nteSetProject(id, projectId) {
  const note = nteList.find(n => n.id === id);
  if (!note) return;
  note.projectId = projectId || null;
  note.updated   = _nteNow();
  _nteSave();
  _nteRefreshCard(note);
}


/* ── Supprimer une note ───────────────────────────────────── */
function nteDelete(id) {
  if (!confirm('Supprimer cette note définitivement ?')) return;
  nteList  = nteList.filter(n => n.id !== id);
  _nteSave();

  if (nteSelected === id) {
    nteSelected = null;
    clearTimeout(_nteDebounce);
    _nteDirty   = false;
    const emptyState = document.getElementById('nte-empty-state');
    const editor     = document.getElementById('nte-editor');
    if (emptyState) emptyState.style.display = 'flex';
    if (editor)     editor.style.display     = 'none';
  }

  nteRenderList();
}


/* ── Recherche ────────────────────────────────────────────── */
function nteOnSearch(val) {
  nteSearch = val;
  nteRenderList();
}


/* ── Filtre projet ────────────────────────────────────────── */
function nteSetFilter(val) {
  nteFilter = val;
  nteRenderList();
}
