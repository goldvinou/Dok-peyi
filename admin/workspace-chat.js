/* ============================================================
   DOK'PÉYI — Workspace Chat  (admin/workspace-chat.js)
   Module indépendant chargé après admin.js.

   Responsabilités :
     • renderWorkspace()     — point d'entrée appelé par showSection()
     • showWSTab()           — navigation entre les onglets du workspace
     • Chat interne en temps réel (localStorage + Firebase si dispo)
     • Upload de fichiers : aperçu image inline, téléchargement sinon
   ============================================================ */

/* ── État global du workspace ──────────────────────────────── */
let wsCurrentTab  = 'home';
let wsAttachments = [];          // fichiers en attente d'envoi

/* ── Données chat ──────────────────────────────────────────── */
let wsMessages = _wsLoad('dok_ws_chat') || [];

function _wsLoad(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
function _wsSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}
function _wsId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function _wsNow() { return new Date().toISOString(); }

/** Format d'affichage d'un timestamp ISO. */
function _wsFmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now - d) / 60000);
  if (diffMin < 1)    return 'à l\'instant';
  if (diffMin < 60)   return `${diffMin} min`;
  if (diffMin < 1440) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
       + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Format de la date du jour pour les séparateurs. */
function _wsDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Aujourd\'hui';
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}


/* ============================================================
   POINT D'ENTRÉE — appelé par showSection('workspace')
   ============================================================ */
function renderWorkspace() {
  // Recharger depuis localStorage à chaque ouverture de section
  wsMessages = _wsLoad('dok_ws_chat') || wsMessages;

  // Peupler les éléments UI du nouveau layout
  _wspUpdateUserUI();
  _wspUpdateDate();

  showWSTab(wsCurrentTab);
}

/* ── Peupler avatar + nom + rôle dans sidebar et header ─────── */
function _wspUpdateUserUI() {
  const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
  if (!u) return;

  const init  = (u.nom || '?').charAt(0).toUpperCase();
  const role  = u.role === 'admin' ? 'Admin' : 'Manager';
  const color = u.color || '#3b82f6';

  // Sidebar profile
  const av   = document.getElementById('wsp-av');
  const nm   = document.getElementById('wsp-name');
  const rl   = document.getElementById('wsp-role');
  if (av) { av.textContent = init; av.style.background = `linear-gradient(135deg, ${color}, ${color}88)`; }
  if (nm)   nm.textContent  = u.nom  || '—';
  if (rl)   rl.textContent  = role;

  // Header
  const hav  = document.getElementById('wsp-h-av');
  const hnm  = document.getElementById('wsp-h-name');
  const hbdg = document.getElementById('wsp-h-badge');
  if (hav) { hav.textContent = init; hav.style.background = `linear-gradient(135deg, ${color}, ${color}88)`; }
  if (hnm)   hnm.textContent  = u.nom  || '—';
  if (hbdg)  hbdg.textContent = role;
}

/* ── Afficher la date dans le header ─────────────────────────── */
function _wspUpdateDate() {
  const el = document.getElementById('wsp-h-date');
  if (!el) return;
  const d   = new Date();
  const dn  = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dd  = d.getDate();
  const dm  = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  el.innerHTML = `
    <div class="wsp-h-dn">${dn}</div>
    <div class="wsp-h-dd">${dd}</div>
    <div class="wsp-h-dm">${dm}</div>`;
}

/* ============================================================
   NAVIGATION ONGLETS
   ============================================================ */
function showWSTab(tab, el) {
  wsCurrentTab = tab;

  // Masquer tous les panneaux
  document.querySelectorAll('.ws-pane').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  // Désactiver tous les items nav (wsp-item + legacy ws-tab)
  document.querySelectorAll('.wsp-item').forEach(t => t.classList.remove('active'));

  // Activer le panneau cible
  const pane = document.getElementById(`ws-${tab}-pane`);
  if (pane) { pane.style.display = 'flex'; pane.classList.add('active'); }

  // Activer l'item nav
  if (el) {
    // Remonter au .wsp-item si le clic vient d'un élément enfant
    const item = el.closest ? (el.closest('.wsp-item') || el) : el;
    item.classList.add('active');
  } else {
    const btn = document.getElementById(`wst-${tab}`);
    if (btn) btn.classList.add('active');
  }

  // Rendu à la demande
  if      (tab === 'home') renderWSHome();
  else if (tab === 'chat') _renderChat();
  else                     _renderComingSoon(tab);

  return false; // prevent <a> default navigation
}


/* ============================================================
   HOME DASHBOARD
   ============================================================ */
function renderWSHome() {
  const pane = document.getElementById('ws-home-pane');
  if (!pane) return;

  /* ── Lire les données ── */
  const projects = _wspReadLS('dok_ws_projects') || [];
  const tasks    = _wspReadLS('dok_ws_tasks')    || [];

  const prjActive = projects.filter(p => p.status !== 'done').length;
  const tasksTodo = tasks.filter(t => t.status === 'todo').length;
  const prjDone   = projects.filter(p => p.status === 'done').length;

  /* ── Projets pour la liste (tous par défaut) ── */
  let homeFilter = 'all';

  pane.innerHTML = `
    <div class="wsp-home" id="wsp-home-scroll">

      <!-- Actions rapides -->
      <div class="wsp-qa">
        <button class="wsp-qa-btn wsp-qa-primary"
          onclick="showWSTab('projects',document.getElementById('wst-projects'));setTimeout(()=>typeof prjToggleNewForm==='function'&&prjToggleNewForm(),120)">
          <span class="wsp-qa-icon">＋</span>
          <span>Nouveau projet</span>
        </button>
        <button class="wsp-qa-btn wsp-qa-secondary"
          onclick="showWSTab('tasks',document.getElementById('wst-tasks'));setTimeout(()=>typeof tskToggleNew==='function'&&tskToggleNew(),120)">
          <span class="wsp-qa-icon">✅</span>
          <span>Nouvelle tâche</span>
        </button>
        <button class="wsp-qa-btn wsp-qa-secondary"
          onclick="showWSTab('chat',document.getElementById('wst-chat'))">
          <span class="wsp-qa-icon">💬</span>
          <span>Ouvrir chat</span>
        </button>
        <button class="wsp-qa-btn wsp-qa-secondary"
          onclick="showWSTab('ai',document.getElementById('wst-ai'))">
          <span class="wsp-qa-icon">🤖</span>
          <span>Assistant IA</span>
        </button>
      </div>

      <!-- Stats -->
      <div class="wsp-stats">
        <div class="wsp-stat">
          <div class="wsp-stat-icon">📁</div>
          <div class="wsp-stat-val">${prjActive}</div>
          <div class="wsp-stat-lbl">Projets<br>actifs</div>
        </div>
        <div class="wsp-stat-sep"></div>
        <div class="wsp-stat">
          <div class="wsp-stat-icon">⏳</div>
          <div class="wsp-stat-val orange">${tasksTodo}</div>
          <div class="wsp-stat-lbl">À faire<br>aujourd'hui</div>
        </div>
        <div class="wsp-stat-sep"></div>
        <div class="wsp-stat">
          <div class="wsp-stat-icon">✅</div>
          <div class="wsp-stat-val green">${prjDone}</div>
          <div class="wsp-stat-lbl">Projets<br>terminés</div>
        </div>
      </div>

      <!-- Projets récents -->
      <div>
        <div class="wsp-prj-head">
          <span class="wsp-prj-title">Projets</span>
          <div class="wsp-prj-filters" id="wsp-home-filters">
            <button class="wsp-prj-flt on"  onclick="wspHomeFilter('all',this)">Tous</button>
            <button class="wsp-prj-flt"     onclick="wspHomeFilter('todo',this)">À faire</button>
            <button class="wsp-prj-flt"     onclick="wspHomeFilter('inprogress',this)">En cours</button>
            <button class="wsp-prj-flt"     onclick="wspHomeFilter('done',this)">Terminé</button>
          </div>
        </div>
        <div class="wsp-prj-list" id="wsp-home-prjlist"></div>
      </div>

    </div>`;

  _wspRenderPrjList('all');
}

function wspHomeFilter(val, btn) {
  document.querySelectorAll('#wsp-home-filters .wsp-prj-flt').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  _wspRenderPrjList(val);
}

function _wspRenderPrjList(filter) {
  const el = document.getElementById('wsp-home-prjlist');
  if (!el) return;

  const projects = _wspReadLS('dok_ws_projects') || [];
  const tasks    = _wspReadLS('dok_ws_tasks')    || [];
  const STATUS   = { todo:'wsp-sp-todo', inprogress:'wsp-sp-prog', done:'wsp-sp-done' };
  const LABELS   = { todo:'À faire', inprogress:'En cours', done:'Terminé' };
  const BARS     = { todo:'#4b5563', inprogress:'#388bfd', done:'#3fb950' };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  if (!filtered.length) {
    el.innerHTML = `<div class="wsp-prj-empty">Aucun projet${filter!=='all'?' dans cette catégorie':''}.</div>`;
    return;
  }

  el.innerHTML = filtered.slice(0, 8).map(p => {
    const prjTasks = tasks.filter(t => t.projectId === p.id);
    const done     = prjTasks.filter(t => t.status === 'done').length;
    const total    = prjTasks.length;
    const pct      = total ? Math.round(done / total * 100) : 0;
    const barColor = BARS[p.status] || '#4b5563';
    const sp       = STATUS[p.status] || 'wsp-sp-todo';
    const lbl      = LABELS[p.status] || 'À faire';

    return `
      <div class="wsp-prj-row" onclick="showWSTab('projects',document.getElementById('wst-projects'));setTimeout(()=>typeof prjOpenDetail==='function'&&prjOpenDetail('${p.id}'),150)">
        <span class="wsp-prj-row-icon">📁</span>
        <div class="wsp-prj-row-body">
          <div class="wsp-prj-row-name">${_esc(p.title)}</div>
          <div class="wsp-prj-row-sub">
            <span class="wsp-sp ${sp}">${lbl}</span>
            <div class="wsp-prj-bar-wrap"><div class="wsp-prj-bar" style="width:${pct}%;background:${barColor}"></div></div>
            <span class="wsp-prj-tasks">${done}/${total} tâches</span>
          </div>
        </div>
        <span class="wsp-prj-arrow">›</span>
      </div>`;
  }).join('');
}

function _wspReadLS(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}


/* ============================================================
   STUB — autres onglets (non implémentés dans ce fichier)
   ============================================================ */
function _renderComingSoon(tab) {
  const labels = {
    projects: '📂 Projets',
    tasks:    '✅ Tâches',
    notes:    '📝 Notes',
    ai:       '🤖 Assistants IA'
  };
  const pane = document.getElementById(`ws-${tab}-pane`);
  if (!pane) return;
  pane.innerHTML = `
    <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#94a3b8;padding:60px">
      <div style="font-size:3rem">${labels[tab]?.split(' ')[0] || '🔧'}</div>
      <div style="font-weight:700;font-size:1rem;color:#475569">${labels[tab] || tab}</div>
      <div style="font-size:.85rem">Module en cours de développement</div>
    </div>`;
}

/* ============================================================
   NOTIFICATIONS (bell) — stub minimal
   ============================================================ */
function toggleWSNotifs() {
  const panel = document.getElementById('ws-notif-panel');
  if (!panel) return;
  const visible = panel.style.display === 'block';
  panel.style.display = visible ? 'none' : 'block';
  if (!visible) panel.innerHTML = `
    <div class="ws-notif-header"><h4>Notifications</h4></div>
    <div class="ws-notif-empty">Aucune notification pour l'instant</div>`;
}
// Fermer le panneau si on clique ailleurs
document.addEventListener('click', e => {
  const panel = document.getElementById('ws-notif-panel');
  const btn   = e.target.closest('.ws-notif-btn');
  if (panel && !btn && !panel.contains(e.target)) {
    panel.style.display = 'none';
  }
});


/* ============================================================
   CHAT — RENDU PRINCIPAL
   ============================================================ */
function _renderChat() {
  const pane = document.getElementById('ws-chat-pane');
  if (!pane) return;

  const memberCount = typeof USERS !== 'undefined' ? USERS.length : 3;

  pane.innerHTML = `
    <div class="chat-shell">

      <!-- En-tête -->
      <div class="chat-header">
        <div class="chat-header-icon">💬</div>
        <div>
          <div class="chat-header-title">Chat équipe Dok'péyi</div>
          <div class="chat-header-sub">Allan · Yonel · Marvin</div>
        </div>
        <div class="chat-header-members" id="chat-members"></div>
      </div>

      <!-- Zone de messages -->
      <div class="chat-messages" id="chat-messages"></div>

      <!-- Zone de saisie -->
      <div class="chat-input-area">
        <div class="chat-attach-preview" id="chat-attach-preview"></div>
        <div class="chat-input-row">
          <label class="chat-attach-btn" title="Joindre un fichier (max 3 Mo)">
            <span style="pointer-events:none">📎</span>
            <input type="file" id="chat-file-input" multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              style="display:none" onchange="chatHandleFiles(this)">
          </label>
          <textarea
            class="chat-input" id="chat-input"
            placeholder="Écrire un message… (Entrée pour envoyer)"
            rows="1"
            onkeydown="chatKeyDown(event)"
            oninput="chatAutoResize(this)"
          ></textarea>
          <button class="chat-send-btn" id="chat-send-btn"
            onclick="chatSend()" title="Envoyer (Entrée)">
            ↑
          </button>
        </div>
      </div>

    </div>`;

  _renderChatMembers();
  _renderChatMessages();

  // Écoute Firebase si disponible
  _chatFirebaseListen();
}

/* ── Avatars membres dans le header ── */
function _renderChatMembers() {
  const el = document.getElementById('chat-members');
  if (!el || typeof USERS === 'undefined') return;

  const colors = USERS.map(u => u.color || '#3b82f6');
  el.innerHTML = USERS.map((u, i) =>
    `<div class="chat-member-dot" style="background:${colors[i]}" title="${u.nom}">${u.nom.charAt(0)}</div>`
  ).join('') + `<span class="chat-online-label">● En ligne</span>`;
}

/* ── Liste de messages ── */
function _renderChatMessages() {
  const el = document.getElementById('chat-messages');
  if (!el) return;

  if (wsMessages.length === 0) {
    el.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">💬</div>
        <p>Pas encore de messages.<br>Commencez la conversation !</p>
      </div>`;
    return;
  }

  let html = '';
  let lastDay = null;

  wsMessages.forEach(msg => {
    const day = _wsDay(msg.ts);
    if (day !== lastDay) {
      html += `<div class="chat-date-sep">${day}</div>`;
      lastDay = day;
    }
    html += _renderOneMessage(msg);
  });

  el.innerHTML = html;
  _scrollToBottom(el);

  // Lightbox images
  el.querySelectorAll('.chat-img').forEach(img => {
    img.onclick = () => _openImageLightbox(img.src, img.title);
  });
}

function _renderOneMessage(msg) {
  const isMine = msg.userId === (typeof currentUser !== 'undefined' ? currentUser?.user : null);
  const user   = (typeof USERS !== 'undefined')
    ? USERS.find(u => u.user === msg.userId) || {}
    : {};
  const color  = user.color || '#64748b';
  const init   = (msg.userName || '?').charAt(0).toUpperCase();

  const filesHtml = (msg.files || []).map(f => {
    if (f.type && f.type.startsWith('image/')) {
      return `<img src="${f.data}" class="chat-img" title="${_esc(f.name)}" loading="lazy">`;
    }
    const ext  = f.name.split('.').pop().toUpperCase();
    const icon = _fileIcon(f.type || '');
    return `<a href="${f.data}" download="${_esc(f.name)}" class="chat-file-link">
      ${icon} <span>${_esc(f.name)}</span>
      <span style="font-size:.68rem;opacity:.6;margin-left:4px">${ext}</span>
    </a>`;
  }).join('');

  return `
    <div class="chat-msg${isMine ? ' mine' : ''}">
      <div class="chat-msg-avatar" style="background:${color}">${init}</div>
      <div class="chat-msg-body">
        <div class="chat-msg-name">${_esc(msg.userName)}</div>
        ${msg.text
          ? `<div class="chat-msg-text">${_esc(msg.text).replace(/\n/g, '<br>')}</div>`
          : ''}
        ${filesHtml}
        <div class="chat-msg-time">${_wsFmt(msg.ts)}</div>
      </div>
    </div>`;
}

function _fileIcon(mime) {
  if (mime.includes('pdf'))   return '📄';
  if (mime.includes('word') || mime.includes('doc'))  return '📝';
  if (mime.includes('sheet') || mime.includes('xls')) return '📊';
  if (mime.includes('zip'))   return '🗜';
  if (mime.includes('text'))  return '📃';
  return '📎';
}

function _scrollToBottom(el) {
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}


/* ============================================================
   CHAT — ENVOI DE MESSAGE
   ============================================================ */
function chatSend() {
  const input = document.getElementById('chat-input');
  const text  = (input?.value || '').trim();

  if (!text && wsAttachments.length === 0) return;
  if (typeof currentUser === 'undefined' || !currentUser) {
    if (typeof showToast !== 'undefined') showToast('Non connecté', 'error');
    return;
  }

  const msg = {
    id:       _wsId(),
    userId:   currentUser.user,
    userName: currentUser.nom,
    ts:       _wsNow(),
    text:     text,
    files:    [...wsAttachments]
  };

  wsMessages.push(msg);
  _wsSave('dok_ws_chat', wsMessages);

  // Sync Firebase si disponible
  _chatFirebasePush(msg);

  // Reset saisie
  wsAttachments = [];
  if (input) { input.value = ''; input.style.height = 'auto'; }
  const prev = document.getElementById('chat-attach-preview');
  if (prev)  prev.innerHTML = '';

  // Mettre à jour l'affichage
  _renderChatMessages();
}

function chatKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatSend();
  }
}

function chatAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 110) + 'px';
}


/* ============================================================
   CHAT — UPLOAD FICHIERS
   ============================================================ */
const CHAT_MAX_SIZE = 3 * 1024 * 1024; // 3 Mo

function chatHandleFiles(input) {
  const files = Array.from(input.files);
  let queued  = 0;

  files.forEach(file => {
    if (file.size > CHAT_MAX_SIZE) {
      if (typeof showToast !== 'undefined')
        showToast(`"${file.name}" dépasse 3 Mo — ignoré`, 'error');
      return;
    }

    queued++;
    const reader = new FileReader();
    reader.onload = ev => {
      wsAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: ev.target.result
      });
      _renderAttachPreview();
    };
    reader.readAsDataURL(file);
  });

  input.value = ''; // reset pour permettre re-sélection du même fichier
}

function _renderAttachPreview() {
  const el = document.getElementById('chat-attach-preview');
  if (!el) return;

  el.innerHTML = wsAttachments.map((f, i) => {
    const icon = f.type.startsWith('image/') ? '🖼' : _fileIcon(f.type);
    const kb   = (f.size / 1024).toFixed(0);
    return `<div class="chat-attach-chip">
      ${icon} <span>${_esc(f.name)}</span>
      <span style="opacity:.55">(${kb} Ko)</span>
      <button onclick="chatRemoveAttach(${i})" title="Retirer">✕</button>
    </div>`;
  }).join('');
}

function chatRemoveAttach(i) {
  wsAttachments.splice(i, 1);
  _renderAttachPreview();
}


/* ============================================================
   LIGHTBOX IMAGE
   ============================================================ */
function _openImageLightbox(src, title) {
  // Supprimer ancienne lightbox si elle existe
  document.getElementById('chat-lightbox')?.remove();

  const lb = document.createElement('div');
  lb.id = 'chat-lightbox';
  lb.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;
    background:rgba(0,0,0,.88);backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:14px;cursor:zoom-out;
    animation:overlayIn .2s ease;`;

  const img = document.createElement('img');
  img.src = src;
  img.title = title || '';
  img.style.cssText = `
    max-width:90vw;max-height:82vh;border-radius:12px;
    box-shadow:0 32px 80px rgba(0,0,0,.7);
    animation:modalIn .25s cubic-bezier(0.34,1.56,0.64,1);`;

  const cap = document.createElement('div');
  cap.textContent = title || '';
  cap.style.cssText = 'color:#94a3b8;font-size:.82rem;text-align:center;';

  const close = document.createElement('button');
  close.textContent = '✕';
  close.style.cssText = `
    position:fixed;top:18px;right:22px;background:rgba(255,255,255,.12);
    border:none;color:#fff;width:36px;height:36px;border-radius:50%;
    font-size:1rem;cursor:pointer;display:flex;align-items:center;
    justify-content:center;transition:background .15s;`;
  close.onmouseenter = () => close.style.background = 'rgba(255,255,255,.22)';
  close.onmouseleave = () => close.style.background = 'rgba(255,255,255,.12)';

  lb.append(img, cap, close);
  document.body.appendChild(lb);

  const dismiss = () => lb.remove();
  lb.addEventListener('click', e => { if (e.target === lb || e.target === close) dismiss(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', handler); }
  });
}


/* ============================================================
   FIREBASE — sync optionnelle
   ============================================================ */
let _chatFirebaseListened = false;

function _chatFirebaseListen() {
  if (typeof db === 'undefined' || !db || _chatFirebaseListened) return;
  _chatFirebaseListened = true;

  try {
    db.ref('workspace/chat').on('value', snap => {
      const data = snap.val();
      if (!data) return;

      // Reconstruire le tableau depuis le snapshot
      const remote = Object.values(data).sort((a, b) =>
        new Date(a.ts) - new Date(b.ts));

      // Fusionner sans doublons (par id)
      const ids = new Set(wsMessages.map(m => m.id));
      remote.forEach(m => { if (!ids.has(m.id)) wsMessages.push(m); });
      wsMessages.sort((a, b) => new Date(a.ts) - new Date(b.ts));
      _wsSave('dok_ws_chat', wsMessages);

      // Re-rendre uniquement si on est dans le chat
      if (wsCurrentTab === 'chat') _renderChatMessages();
    });
  } catch (e) { /* Firebase non configuré */ }
}

function _chatFirebasePush(msg) {
  if (typeof db === 'undefined' || !db) return;
  try {
    db.ref(`workspace/chat/${msg.id}`).set(msg);
  } catch (e) { /* silencieux */ }
}


/* ============================================================
   UTILITAIRE INTERNE
   ============================================================ */
function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
