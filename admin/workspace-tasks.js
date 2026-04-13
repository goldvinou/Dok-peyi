/* ============================================================
   DOK'PÉYI — Workspace Tâches  (admin/workspace-tasks.js)
   Module autonome, chargé après workspace-projects.js.

   Intercepte l'onglet 'tasks' dans _renderComingSoon sans
   modifier les modules précédents.

   Fonctionnalités :
     • Créer une tâche (titre, projet lié, responsable, statut)
     • Affichage groupé par projet
     • Cycle de statut : À faire → En cours → Terminé
     • Filtres : statut + responsable
     • Persistance localStorage (dok_ws_tasks)
   ============================================================ */

/* ── Intercepter l'onglet 'tasks' ────────────────────────────
   Capture la fonction stub précédente et la chaîne si le tab
   n'est pas 'tasks'.  */
(function () {
  const _prev = (typeof _renderComingSoon === 'function')
    ? _renderComingSoon
    : function () {};

  window._renderComingSoon = function (tab) {
    if (tab === 'tasks') { renderWSTasks(); return; }
    _prev(tab);
  };
})();


/* ── Constantes ───────────────────────────────────────────── */
const TSK_USERS = [
  { id: 'allan',  name: 'Allan',  avatar: 'AL', color: '#388bfd' },
  { id: 'yonel',  name: 'Yonel',  avatar: 'YO', color: '#3fb950' },
  { id: 'marvin', name: 'Marvin', avatar: 'MV', color: '#f78166' }
];

const TSK_STATUS = {
  todo:       { label: 'À faire',   cls: 'tsk-sp-todo',  icon: '○' },
  inprogress: { label: 'En cours',  cls: 'tsk-sp-prog',  icon: '◑' },
  done:       { label: 'Terminé',   cls: 'tsk-sp-done',  icon: '●' }
};

const TSK_CYCLE = { todo: 'inprogress', inprogress: 'done', done: 'todo' };


/* ── État ─────────────────────────────────────────────────── */
let tskList      = _tskLoad('dok_ws_tasks')     || [];
let tskFilterSt  = 'all';    // 'all' | 'todo' | 'inprogress' | 'done'
let tskFilterUs  = 'all';    // 'all' | 'allan' | 'yonel' | 'marvin'
let tskNewOpen   = false;    // formulaire "nouvelle tâche" visible


/* ── Persistance ──────────────────────────────────────────── */
function _tskLoad(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
function _tskSave() {
  try { localStorage.setItem('dok_ws_tasks', JSON.stringify(tskList)); } catch (e) {}
}
function _tskId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function _tskNow() { return new Date().toISOString(); }

/* ── Récupère la liste des projets depuis localStorage ─────── */
function _tskProjects() {
  try {
    const raw = localStorage.getItem('dok_ws_projects');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

/* ── Escaping HTML ────────────────────────────────────────── */
function _tskEsc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ── Rendu principal ──────────────────────────────────────── */
function renderWSTasks() {
  const pane = document.getElementById('ws-tasks-pane');
  if (!pane) return;

  pane.innerHTML = `
    <div class="tsk-shell">

      <!-- Toolbar -->
      <div class="tsk-toolbar">
        <div class="tsk-toolbar-left">
          <span class="tsk-title-label">Tâches</span>
          <span class="tsk-count" id="tsk-count-badge"></span>
        </div>
        <div class="tsk-toolbar-right">

          <!-- Filtre statut -->
          <div class="tsk-filter-group" id="tsk-filter-status">
            <button class="tsk-flt active" data-v="all"        onclick="tskSetSt('all')">Toutes</button>
            <button class="tsk-flt"        data-v="todo"       onclick="tskSetSt('todo')">○ À faire</button>
            <button class="tsk-flt"        data-v="inprogress" onclick="tskSetSt('inprogress')">◑ En cours</button>
            <button class="tsk-flt"        data-v="done"       onclick="tskSetSt('done')">● Terminé</button>
          </div>

          <!-- Filtre responsable -->
          <div class="tsk-filter-group" id="tsk-filter-user">
            <button class="tsk-flt active" data-v="all"    onclick="tskSetUs('all')">Tous</button>
            ${TSK_USERS.map(u => `
            <button class="tsk-flt" data-v="${u.id}" onclick="tskSetUs('${u.id}')">
              <span class="tsk-av" style="background:${u.color}">${u.avatar}</span>${u.name}
            </button>`).join('')}
          </div>

          <button class="tsk-btn-new" onclick="tskToggleNew()">
            <span style="font-size:1.1rem;line-height:1">＋</span> Nouvelle tâche
          </button>
        </div>
      </div>

      <!-- Formulaire nouvelle tâche (masqué par défaut) -->
      <div class="tsk-new-form" id="tsk-new-form" style="display:none">
        <div class="tsk-new-inner">
          <div class="tsk-new-row">
            <input class="tsk-input" id="tsk-new-title" placeholder="Titre de la tâche…" maxlength="120" />
          </div>
          <div class="tsk-new-row tsk-new-row-2col">
            <select class="tsk-input tsk-select" id="tsk-new-project">
              <option value="">— Aucun projet —</option>
            </select>
            <select class="tsk-input tsk-select" id="tsk-new-assignee">
              <option value="">— Aucun responsable —</option>
              ${TSK_USERS.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
            <select class="tsk-input tsk-select" id="tsk-new-status">
              ${Object.entries(TSK_STATUS).map(([k,v]) =>
                `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>
          <div class="tsk-new-actions">
            <button class="tsk-btn-cancel" onclick="tskToggleNew()">Annuler</button>
            <button class="tsk-btn-save"   onclick="tskSaveNew()">Créer la tâche</button>
          </div>
        </div>
      </div>

      <!-- Corps : groupes par projet -->
      <div class="tsk-body" id="tsk-body"></div>

    </div>`;

  _tskPopulateProjectSelect();
  tskRenderBody();
}


/* ── Peuple le <select> projet avec les projets existants ──── */
function _tskPopulateProjectSelect() {
  const sel = document.getElementById('tsk-new-project');
  if (!sel) return;
  const projects = _tskProjects();
  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.title;
    sel.appendChild(opt);
  });
}


/* ── Filtres ──────────────────────────────────────────────── */
function tskSetSt(val) {
  tskFilterSt = val;
  _tskActivateFilter('tsk-filter-status', val);
  tskRenderBody();
}
function tskSetUs(val) {
  tskFilterUs = val;
  _tskActivateFilter('tsk-filter-user', val);
  tskRenderBody();
}
function _tskActivateFilter(groupId, val) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.querySelectorAll('.tsk-flt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.v === val);
  });
}


/* ── Corps : rendu groupé par projet ──────────────────────── */
function tskRenderBody() {
  const body = document.getElementById('tsk-body');
  if (!body) return;

  /* Filtrer */
  const filtered = tskList.filter(t => {
    const stOk = tskFilterSt === 'all' || t.status === tskFilterSt;
    const usOk = tskFilterUs === 'all' || t.assigneeId === tskFilterUs;
    return stOk && usOk;
  });

  /* Badge de comptage */
  const badge = document.getElementById('tsk-count-badge');
  if (badge) badge.textContent = filtered.length || '';

  if (!filtered.length) {
    body.innerHTML = `<div class="tsk-empty">
      <div class="tsk-empty-icon">✅</div>
      <div class="tsk-empty-msg">Aucune tâche${tskFilterSt !== 'all' || tskFilterUs !== 'all' ? ' pour ces filtres' : ''}.</div>
    </div>`;
    return;
  }

  /* Grouper par projet */
  const groups   = {};   // projectId → { name, tasks[] }
  const projects = _tskProjects();
  const prjMap   = {};
  projects.forEach(p => { prjMap[p.id] = p.title; });

  filtered.forEach(t => {
    const gid   = t.projectId || '__none__';
    const gname = t.projectId ? (prjMap[t.projectId] || 'Projet inconnu') : 'Sans projet';
    if (!groups[gid]) groups[gid] = { name: gname, tasks: [] };
    groups[gid].tasks.push(t);
  });

  /* Tri des groupes : "Sans projet" en dernier */
  const groupOrder = Object.keys(groups).sort((a, b) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return groups[a].name.localeCompare(groups[b].name);
  });

  body.innerHTML = groupOrder.map(gid => {
    const g = groups[gid];
    return `
      <div class="tsk-group">
        <div class="tsk-group-header">
          <span class="tsk-group-icon">📁</span>
          <span class="tsk-group-name">${_tskEsc(g.name)}</span>
          <span class="tsk-group-count">${g.tasks.length}</span>
        </div>
        <div class="tsk-group-items">
          ${g.tasks.map(_tskRow).join('')}
        </div>
      </div>`;
  }).join('');
}


/* ── Ligne d'une tâche ────────────────────────────────────── */
function _tskRow(t) {
  const st  = TSK_STATUS[t.status] || TSK_STATUS.todo;
  const usr = TSK_USERS.find(u => u.id === t.assigneeId);
  const dateStr = t.ts ? new Date(t.ts).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) : '';

  return `
    <div class="tsk-row" id="tsk-row-${t.id}">
      <!-- Bouton cycle statut -->
      <button class="tsk-status-btn ${st.cls}" title="Changer le statut" onclick="tskCycleStatus('${t.id}')">
        ${st.icon}
      </button>

      <!-- Titre -->
      <span class="tsk-row-title ${t.status === 'done' ? 'tsk-done-text' : ''}">${_tskEsc(t.title)}</span>

      <!-- Responsable -->
      ${usr
        ? `<span class="tsk-av tsk-av-sm" style="background:${usr.color}" title="${usr.name}">${usr.avatar}</span>`
        : `<span class="tsk-av tsk-av-sm tsk-av-none" title="Non assigné">—</span>`}

      <!-- Date -->
      <span class="tsk-row-date">${dateStr}</span>

      <!-- Supprimer -->
      <button class="tsk-del-btn" title="Supprimer" onclick="tskDelete('${t.id}')">✕</button>
    </div>`;
}


/* ── Formulaire nouvelle tâche ────────────────────────────── */
function tskToggleNew() {
  tskNewOpen = !tskNewOpen;
  const form = document.getElementById('tsk-new-form');
  if (!form) return;

  if (tskNewOpen) {
    form.style.display = 'block';
    requestAnimationFrame(() => { form.classList.add('tsk-new-open'); });
    const inp = document.getElementById('tsk-new-title');
    if (inp) setTimeout(() => inp.focus(), 120);
  } else {
    form.classList.remove('tsk-new-open');
    setTimeout(() => { if (!tskNewOpen) form.style.display = 'none'; }, 280);
  }
}

function tskSaveNew() {
  const titleEl    = document.getElementById('tsk-new-title');
  const projectEl  = document.getElementById('tsk-new-project');
  const assigneeEl = document.getElementById('tsk-new-assignee');
  const statusEl   = document.getElementById('tsk-new-status');
  if (!titleEl) return;

  const title = titleEl.value.trim();
  if (!title) { titleEl.focus(); titleEl.classList.add('tsk-input-err'); return; }
  titleEl.classList.remove('tsk-input-err');

  const assigneeId = assigneeEl ? assigneeEl.value : '';
  const usr        = TSK_USERS.find(u => u.id === assigneeId);

  const task = {
    id:           _tskId(),
    title,
    projectId:    projectEl  ? (projectEl.value  || null) : null,
    assigneeId:   assigneeId || null,
    assigneeName: usr ? usr.name : '',
    status:       statusEl   ? (statusEl.value   || 'todo') : 'todo',
    ts:           _tskNow()
  };

  tskList.unshift(task);
  _tskSave();

  /* Reset form */
  titleEl.value = '';
  if (projectEl)  projectEl.value  = '';
  if (assigneeEl) assigneeEl.value = '';
  if (statusEl)   statusEl.value   = 'todo';

  tskToggleNew();
  tskRenderBody();
}


/* ── Cycle de statut ──────────────────────────────────────── */
function tskCycleStatus(id) {
  const task = tskList.find(t => t.id === id);
  if (!task) return;

  task.status = TSK_CYCLE[task.status] || 'todo';
  _tskSave();

  /* Mise à jour chirurgicale de la ligne */
  const row = document.getElementById('tsk-row-' + id);
  if (row) {
    const st  = TSK_STATUS[task.status];
    const btn = row.querySelector('.tsk-status-btn');
    if (btn) {
      btn.className = 'tsk-status-btn ' + st.cls;
      btn.textContent = st.icon;
    }
    const lbl = row.querySelector('.tsk-row-title');
    if (lbl) {
      lbl.classList.toggle('tsk-done-text', task.status === 'done');
    }
    /* Si le filtre est actif et que cette tâche ne correspond plus, re-render complet */
    if (tskFilterSt !== 'all' && task.status !== tskFilterSt) {
      tskRenderBody();
    }
  } else {
    tskRenderBody();
  }
}


/* ── Suppression ──────────────────────────────────────────── */
function tskDelete(id) {
  if (!confirm('Supprimer cette tâche ?')) return;
  tskList = tskList.filter(t => t.id !== id);
  _tskSave();
  tskRenderBody();
}
