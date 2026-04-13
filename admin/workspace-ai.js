/* ============================================================
   DOK'PÉYI — Workspace Assistants IA  (admin/workspace-ai.js)
   Module autonome, chargé après workspace-notes.js.

   Intercepte l'onglet 'ai' dans _renderComingSoon sans
   modifier les modules précédents.

   Fonctionnalités :
     • Deux sous-onglets : Claude (Anthropic) et ChatGPT (OpenAI)
     • Chat indépendant par service
     • Historique persistant par service (localStorage)
     • Contexte projet : boutons "Utiliser Claude / ChatGPT" dans Projets
     • Rendu Markdown basique des réponses
     • Indicateur de chargement animé
   ============================================================ */

/* ── Intercepter l'onglet 'ai' ───────────────────────────────
   Capture la fonction stub précédente et la chaîne si le tab
   n'est pas 'ai'.  */
(function () {
  const _prev = (typeof _renderComingSoon === 'function')
    ? _renderComingSoon
    : function () {};

  window._renderComingSoon = function (tab) {
    if (tab === 'ai') { renderWSAI(); return; }
    _prev(tab);
  };
})();


/* ── Constantes ───────────────────────────────────────────── */
const WAI_SERVICES = {
  claude: {
    id:     'claude',
    label:  'Claude',
    icon:   '🤖',
    color:  '#e56b28',
    accent: '#e56b2822',
    key:    'dok_ws_ai_claude',
    hint:   'claude-haiku-4-5'
  },
  gpt: {
    id:     'gpt',
    label:  'ChatGPT',
    icon:   '💬',
    color:  '#10a37f',
    accent: '#10a37f22',
    key:    'dok_ws_ai_gpt',
    hint:   'gpt-4o-mini'
  }
};

const WAI_MAX_HISTORY_DISPLAY = 60;  // max messages affichés
const WAI_MAX_HISTORY_API     = 10;  // max tours envoyés à l'API


/* ── État ─────────────────────────────────────────────────── */
let waiService  = 'claude';                           // onglet actif
let waiHistory  = { claude: [], gpt: [] };            // historique en mémoire
let waiLoading  = { claude: false, gpt: false };      // requête en cours


/* ── Persistance ──────────────────────────────────────────── */
function _waiLoadHistory() {
  Object.keys(WAI_SERVICES).forEach(svc => {
    try {
      const raw = localStorage.getItem(WAI_SERVICES[svc].key);
      if (raw) waiHistory[svc] = JSON.parse(raw);
    } catch (e) { waiHistory[svc] = []; }
  });
}
function _waiSaveHistory(svc) {
  try {
    const trimmed = waiHistory[svc].slice(-WAI_MAX_HISTORY_DISPLAY);
    waiHistory[svc] = trimmed;
    localStorage.setItem(WAI_SERVICES[svc].key, JSON.stringify(trimmed));
  } catch (e) {}
}
function _waiNow() { return new Date().toISOString(); }
function _waiFmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/* ── Markdown basique → HTML ──────────────────────────────── */
function _waiMd(text) {
  if (!text) return '';
  let s = String(text);

  // Blocs de code (``` ... ```)
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="wai-pre"><code>${_waiEsc(code.trim())}</code></pre>`);

  // Code inline
  s = s.replace(/`([^`\n]+)`/g, '<code class="wai-code">$1</code>');

  // Titres
  s = s.replace(/^#### (.+)$/gm, '<h5 class="wai-h">$1</h5>');
  s = s.replace(/^### (.+)$/gm,  '<h4 class="wai-h">$1</h4>');
  s = s.replace(/^## (.+)$/gm,   '<h3 class="wai-h">$1</h3>');
  s = s.replace(/^# (.+)$/gm,    '<h2 class="wai-h">$1</h2>');

  // Gras + italique
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g,         '<em>$1</em>');

  // Listes non ordonnées
  s = s.replace(/^[ \t]*[-*+] (.+)$/gm, '<li>$1</li>');
  s = s.replace(/(<li>[\s\S]*?<\/li>)(?=\s*(<li>|$))/g, m =>
    m.startsWith('<ul>') ? m : m);
  s = s.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul class="wai-ul">$1</ul>');

  // Listes ordonnées
  s = s.replace(/^[ \t]*\d+\. (.+)$/gm, '<li>$1</li>');

  // Séparateur
  s = s.replace(/^---+$/gm, '<hr class="wai-hr">');

  // Paragraphes (double saut de ligne → <p>)
  s = s.split(/\n{2,}/).map(para => {
    para = para.trim();
    if (!para) return '';
    if (/^<(h[2-5]|ul|pre|hr)/.test(para)) return para;
    return `<p class="wai-p">${para.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return s;
}

function _waiEsc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


/* ══════════════════════════════════════════════════════════
   RENDU PRINCIPAL
   ══════════════════════════════════════════════════════════ */
function renderWSAI() {
  const pane = document.getElementById('ws-ai-pane');
  if (!pane) return;

  _waiLoadHistory();

  pane.innerHTML = `
    <div class="wai-shell">

      <!-- ── En-tête avec onglets service ─────────────────── -->
      <div class="wai-header">
        <div class="wai-header-left">
          <span class="wai-header-icon">🤖</span>
          <span class="wai-header-title">Assistants IA</span>
        </div>
        <div class="wai-tabs" id="wai-tabs">
          ${Object.values(WAI_SERVICES).map(s => `
            <button class="wai-tab ${waiService===s.id?'wai-tab-active':''}"
                    id="wai-tab-${s.id}"
                    style="${waiService===s.id?`--tab-color:${s.color}`:'--tab-color:#4b5563'}"
                    onclick="waiSwitchService('${s.id}')">
              <span>${s.icon}</span>
              <span>${s.label}</span>
              <span class="wai-tab-hint">${s.hint}</span>
            </button>`).join('')}
        </div>
        <button class="wai-clear-btn" onclick="waiClearHistory()" title="Effacer l'historique">🗑 Effacer</button>
      </div>

      <!-- ── Zone de messages ──────────────────────────────── -->
      <div class="wai-messages" id="wai-messages"></div>

      <!-- ── Barre de saisie ───────────────────────────────── -->
      <div class="wai-input-bar">
        <div class="wai-input-service-dot"
             id="wai-input-dot"
             style="background:${WAI_SERVICES[waiService].color}"></div>
        <textarea class="wai-input" id="wai-input"
          placeholder="Pose ta question à ${WAI_SERVICES[waiService].label}…"
          rows="1"
          onkeydown="waiOnKeyDown(event)"
          oninput="waiAutoResize(this)"></textarea>
        <button class="wai-send-btn" id="wai-send-btn"
                onclick="waiSend()"
                style="background:linear-gradient(135deg,${WAI_SERVICES[waiService].color},${waiService==='claude'?'#b03020':'#0d7a60'})">
          ↑
        </button>
      </div>
      <div class="wai-input-footer">
        <span id="wai-input-label">
          ${WAI_SERVICES[waiService].icon} ${WAI_SERVICES[waiService].label} · Entrée pour envoyer, Maj+Entrée pour un saut de ligne
        </span>
      </div>

    </div>`;

  waiRenderMessages();
}


/* ── Changer de service (Claude ↔ ChatGPT) ────────────────── */
function waiSwitchService(svc) {
  if (!WAI_SERVICES[svc]) return;
  waiService = svc;
  const s = WAI_SERVICES[svc];

  /* Mettre à jour les onglets */
  Object.keys(WAI_SERVICES).forEach(k => {
    const btn = document.getElementById('wai-tab-' + k);
    if (!btn) return;
    btn.classList.toggle('wai-tab-active', k === svc);
    btn.style.setProperty('--tab-color', k === svc ? WAI_SERVICES[k].color : '#4b5563');
  });

  /* Mettre à jour l'input bar */
  const dot = document.getElementById('wai-input-dot');
  if (dot) dot.style.background = s.color;

  const inp = document.getElementById('wai-input');
  if (inp) inp.placeholder = `Pose ta question à ${s.label}…`;

  const sendBtn = document.getElementById('wai-send-btn');
  if (sendBtn) sendBtn.style.background =
    `linear-gradient(135deg,${s.color},${svc==='claude'?'#b03020':'#0d7a60'})`;

  const lbl = document.getElementById('wai-input-label');
  if (lbl) lbl.innerHTML = `${s.icon} ${s.label} · Entrée pour envoyer, Maj+Entrée pour un saut de ligne`;

  waiRenderMessages();
}


/* ── Rendu des messages du service actif ──────────────────── */
function waiRenderMessages() {
  const zone = document.getElementById('wai-messages');
  if (!zone) return;

  const msgs = waiHistory[waiService] || [];
  const s    = WAI_SERVICES[waiService];

  if (!msgs.length) {
    zone.innerHTML = `
      <div class="wai-welcome">
        <div class="wai-welcome-icon" style="color:${s.color}">${s.icon}</div>
        <div class="wai-welcome-title">Bonjour, je suis ${s.label}</div>
        <div class="wai-welcome-sub">Comment puis-je t'aider aujourd'hui ?</div>
        <div class="wai-suggestions">
          <button class="wai-sugg" onclick="waiSuggest('Résume les bonnes pratiques pour gérer un projet en équipe.')">
            📋 Gestion de projet
          </button>
          <button class="wai-sugg" onclick="waiSuggest('Donne-moi 5 conseils pour rédiger un rapport professionnel.')">
            ✍️ Rédaction
          </button>
          <button class="wai-sugg" onclick="waiSuggest('Explique-moi comment organiser une réunion efficace.')">
            📅 Organisation
          </button>
        </div>
      </div>`;
    return;
  }

  zone.innerHTML = msgs.map(m => _waiMsgHTML(m, s)).join('');

  /* Scroll en bas */
  zone.scrollTop = zone.scrollHeight;
}


/* ── HTML d'un message ────────────────────────────────────── */
function _waiMsgHTML(m, s) {
  const isUser = m.role === 'user';
  const time   = _waiFmt(m.ts);

  if (isUser) {
    return `
      <div class="wai-msg wai-msg-user">
        <div class="wai-bubble-user">${_waiEsc(m.content).replace(/\n/g,'<br>')}</div>
        <div class="wai-msg-time">${time}</div>
      </div>`;
  }

  return `
    <div class="wai-msg wai-msg-ai">
      <div class="wai-ai-avatar" style="background:${s.accent};border-color:${s.color};color:${s.color}">${s.icon}</div>
      <div class="wai-msg-ai-body">
        <div class="wai-bubble-ai" style="border-left-color:${s.color}">
          <div class="wai-ai-label" style="color:${s.color}">${s.label}</div>
          <div class="wai-ai-content">${_waiMd(m.content)}</div>
        </div>
        <div class="wai-msg-time">${time}</div>
      </div>
    </div>`;
}


/* ── Indicateur de chargement ─────────────────────────────── */
function _waiShowLoading() {
  const zone = document.getElementById('wai-messages');
  if (!zone) return;
  const s = WAI_SERVICES[waiService];
  const el = document.createElement('div');
  el.id        = 'wai-loading-indicator';
  el.className = 'wai-msg wai-msg-ai';
  el.innerHTML = `
    <div class="wai-ai-avatar" style="background:${s.accent};border-color:${s.color};color:${s.color}">${s.icon}</div>
    <div class="wai-loading-dots">
      <span></span><span></span><span></span>
    </div>`;
  zone.appendChild(el);
  zone.scrollTop = zone.scrollHeight;
}

function _waiRemoveLoading() {
  document.getElementById('wai-loading-indicator')?.remove();
}


/* ── Envoi d'un message ───────────────────────────────────── */
function waiSend() {
  const svc = waiService;
  if (waiLoading[svc]) return;

  const inp     = document.getElementById('wai-input');
  const prompt  = (inp?.value || '').trim();
  if (!prompt) return;

  /* Vider l'input */
  if (inp) { inp.value = ''; inp.style.height = 'auto'; }

  /* Ajouter message utilisateur */
  const userMsg = { role: 'user', content: prompt, ts: _waiNow() };
  waiHistory[svc].push(userMsg);
  _waiSaveHistory(svc);

  /* Afficher immédiatement */
  _waiAppendMessage(userMsg);
  _waiShowLoading();
  _waiSetSendDisabled(true);

  /* Construire l'historique pour l'API (sans les ts) */
  const apiHistory = waiHistory[svc]
    .slice(-WAI_MAX_HISTORY_API - 1, -1)          // les N derniers sans le msg qu'on vient d'ajouter
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  /* Appel API */
  waiLoading[svc] = true;
  fetch('/api/ai-chat', {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body:    JSON.stringify({ service: svc, prompt, history: apiHistory })
  })
  .then(r => r.json())
  .then(data => {
    _waiRemoveLoading();
    waiLoading[svc] = false;
    _waiSetSendDisabled(false);

    if (!data.ok) {
      _waiAppendError(data.error || 'Erreur inconnue');
      return;
    }

    const aiMsg = { role: 'assistant', content: data.reply || '', ts: _waiNow() };
    waiHistory[svc].push(aiMsg);
    _waiSaveHistory(svc);
    _waiAppendMessage(aiMsg);
  })
  .catch(err => {
    _waiRemoveLoading();
    waiLoading[svc] = false;
    _waiSetSendDisabled(false);
    _waiAppendError('Erreur réseau : ' + err.message);
  });
}

/* ── Ajoute un message dans la zone sans tout re-rendre ─────*/
function _waiAppendMessage(msg) {
  const zone = document.getElementById('wai-messages');
  if (!zone) return;

  /* Retirer l'état vide si présent */
  const welcome = zone.querySelector('.wai-welcome');
  if (welcome) welcome.remove();

  const s = WAI_SERVICES[waiService];
  zone.insertAdjacentHTML('beforeend', _waiMsgHTML(msg, s));
  zone.scrollTop = zone.scrollHeight;
}

function _waiAppendError(txt) {
  const zone = document.getElementById('wai-messages');
  if (!zone) return;
  zone.insertAdjacentHTML('beforeend',
    `<div class="wai-error">⚠️ ${_waiEsc(txt)}</div>`);
  zone.scrollTop = zone.scrollHeight;
}

function _waiSetSendDisabled(disabled) {
  const btn = document.getElementById('wai-send-btn');
  const inp = document.getElementById('wai-input');
  if (btn) btn.disabled = disabled;
  if (inp) inp.disabled = disabled;
}


/* ── Suggestion rapide ────────────────────────────────────── */
function waiSuggest(text) {
  const inp = document.getElementById('wai-input');
  if (inp) {
    inp.value = text;
    waiAutoResize(inp);
  }
  waiSend();
}


/* ── Effacer l'historique du service actif ────────────────── */
function waiClearHistory() {
  if (!confirm(`Effacer tout l'historique de ${WAI_SERVICES[waiService].label} ?`)) return;
  waiHistory[waiService] = [];
  _waiSaveHistory(waiService);
  waiRenderMessages();
}


/* ── Clavier : Entrée = envoyer, Maj+Entrée = saut de ligne ─ */
function waiOnKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    waiSend();
  }
}

/* ── Auto-resize textarea ─────────────────────────────────── */
function waiAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}


/* ══════════════════════════════════════════════════════════
   INTÉGRATION PROJETS
   Appelée depuis workspace-projects.js via les boutons
   "Utiliser Claude / ChatGPT" dans le panneau détail.
   ══════════════════════════════════════════════════════════ */
function waiOpenWithProject(svc, projTitle, projDesc) {
  /* 1. Basculer vers l'onglet Assistants IA */
  const tabBtn = document.getElementById('wst-ai');
  if (typeof showWSTab === 'function' && tabBtn) {
    showWSTab('ai', tabBtn);
  }

  /* 2. Sélectionner le bon service + re-rendre */
  waiService = svc;

  /* 3. Remplir le champ une fois le rendu terminé */
  setTimeout(() => {
    /* S'assurer que le module est rendu */
    const zone = document.getElementById('wai-messages');
    if (!zone) { renderWSAI(); }

    waiSwitchService(svc);

    const inp = document.getElementById('wai-input');
    if (!inp) return;

    const desc  = projDesc ? `\n\nDescription : ${projDesc}` : '';
    inp.value   = `J'ai besoin d'aide pour le projet "${projTitle}".${desc}`;
    waiAutoResize(inp);
    inp.focus();
    /* Positionner le curseur à la fin */
    inp.setSelectionRange(inp.value.length, inp.value.length);
  }, 120);
}
