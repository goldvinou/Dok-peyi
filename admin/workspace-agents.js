/* ============================================================
   DOK'PÉYI — Module Équipe IA (workspace-agents.js)
   Rendu via renderAgentsPanel() depuis showSection('agents')
   ============================================================ */

let _agentEditing = null; // id de l'agent en cours d'édition

const TONE_LABELS = {
  friendly:     '🤝 Amical',
  professional: '💼 Professionnel',
  formal:       '📋 Formel',
  concise:      '⚡ Concis'
};

const FOCUS_LABELS = {
  accuracy:     '🎯 Précision',
  completeness: '📋 Exhaustivité',
  clarity:      '💡 Clarté',
  speed:        '🚀 Rapidité'
};

/* ============================================================
   POINT D'ENTRÉE
   ============================================================ */
function renderAgentsPanel() {
  const root = document.getElementById('agents-root');
  if (!root) return;
  _agentEditing = null;
  _agentRender(root);
}

function _agentRender(root) {
  root.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <div style="margin-bottom:24px">
        <h2 style="font-size:1.15rem;font-weight:800;color:var(--dark);letter-spacing:-.03em;margin-bottom:6px">
          🤖 Mon équipe IA
        </h2>
        <p style="font-size:.84rem;color:var(--gray-500);line-height:1.5;max-width:560px">
          Configure l'empreinte de chaque agent IA — ses instructions, son ton et son focus qualité.
          Ces paramètres sont utilisés à chaque génération de document.
        </p>
      </div>

      <div class="agents-grid" id="agents-grid">
        ${AI_TEAM.map(a => _agentCard(a)).join('')}
      </div>

      <div id="agent-editor-wrap"></div>
    </div>
  `;

  if (_agentEditing) _agentRenderEditor(_agentEditing);
}

/* ============================================================
   CARTE AGENT
   ============================================================ */
function _agentCard(agent) {
  const isEditing = _agentEditing === agent.id;
  const disabled  = !agent.enabled;

  return `
    <div class="agent-card ${isEditing ? 'agent-card-active' : ''} ${disabled ? 'agent-card-disabled' : ''}"
         onclick="agentToggleEditor('${agent.id}')">
      <div class="agent-card-before" style="background:${agent.color}"></div>

      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
        <div class="agent-avatar" style="background:${agent.color}1a;color:${agent.color}">
          ${agent.icon}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="agent-status-dot" style="background:${agent.enabled ? '#22c55e' : '#94a3b8'}"></span>
          <span style="font-size:.72rem;font-weight:600;color:${agent.enabled ? '#16a34a' : 'var(--gray-400)'}">
            ${agent.enabled ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      <div class="agent-name">${_aEsc(agent.nom)}</div>
      <div class="agent-role">${_aEsc(agent.role)}</div>
      <div style="font-size:.75rem;color:var(--gray-400);margin-bottom:14px;line-height:1.4">
        ${_aEsc(agent.specialite)}
      </div>

      <div class="agent-tags">
        <span class="agent-tag">${TONE_LABELS[agent.tone] || agent.tone}</span>
        <span class="agent-tag">${FOCUS_LABELS[agent.qualityFocus] || agent.qualityFocus}</span>
      </div>

      <div style="margin-top:14px;font-size:.78rem;font-weight:600;color:${isEditing ? agent.color : 'var(--gray-500)'};
                  display:flex;align-items:center;gap:5px">
        ${isEditing ? '▲ Fermer' : '⚙️ Configurer'}
      </div>
    </div>
  `;
}

/* ============================================================
   TOGGLE ÉDITEUR
   ============================================================ */
function agentToggleEditor(agentId) {
  _agentEditing = _agentEditing === agentId ? null : agentId;
  const root = document.getElementById('agents-root');
  if (root) _agentRender(root);
}

/* ============================================================
   ÉDITEUR
   ============================================================ */
function _agentRenderEditor(agentId) {
  const wrap  = document.getElementById('agent-editor-wrap');
  if (!wrap) return;
  const agent = AI_TEAM.find(a => a.id === agentId);
  if (!agent) return;

  wrap.innerHTML = `
    <div class="agent-editor" style="border-top:3px solid ${agent.color}">
      <div class="agent-editor-title">
        <span style="font-size:1.4rem">${agent.icon}</span>
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--dark)">${_aEsc(agent.nom)}</div>
          <div style="font-size:.78rem;color:var(--gray-500);font-weight:500">${_aEsc(agent.role)}</div>
        </div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
          <label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-size:.82rem;font-weight:600;color:var(--gray-600)">
            <input type="checkbox" id="agent-enabled-${agentId}" ${agent.enabled ? 'checked' : ''}
              style="width:16px;height:16px;accent-color:${agent.color};cursor:pointer">
            Agent actif
          </label>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px">
        <div class="agent-field">
          <label>Ton de communication</label>
          <select id="agent-tone-${agentId}" class="agent-select" style="width:100%">
            ${Object.entries(TONE_LABELS).map(([v, l]) =>
              `<option value="${v}" ${agent.tone === v ? 'selected' : ''}>${l}</option>`
            ).join('')}
          </select>
        </div>
        <div class="agent-field">
          <label>Focus qualité</label>
          <select id="agent-focus-${agentId}" class="agent-select" style="width:100%">
            ${Object.entries(FOCUS_LABELS).map(([v, l]) =>
              `<option value="${v}" ${agent.qualityFocus === v ? 'selected' : ''}>${l}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <div class="agent-field">
        <label>Instructions système — empreinte de l'agent</label>
        <div style="font-size:.73rem;color:var(--gray-400);margin-bottom:7px;line-height:1.4">
          Ces instructions définissent le comportement et la personnalité de ${_aEsc(agent.nom)}.
          Elles sont injectées en tête de chaque génération.
        </div>
        <textarea id="agent-prompt-${agentId}" class="agent-textarea" rows="6"
          placeholder="Décris ici le rôle, la personnalité et les règles de ${_aEsc(agent.nom)}…"
        >${_aEsc(agent.systemPrompt || '')}</textarea>
      </div>

      <div class="agent-field">
        <label>Contexte supplémentaire <span style="font-weight:400;text-transform:none;letter-spacing:0">(optionnel)</span></label>
        <div style="font-size:.73rem;color:var(--gray-400);margin-bottom:7px;line-height:1.4">
          Informations métier, exemples, contraintes spécifiques à transmettre à l'agent.
        </div>
        <textarea id="agent-instructions-${agentId}" class="agent-textarea" rows="3"
          placeholder="Ex : Toujours utiliser le vouvoiement. Éviter les abréviations…"
        >${_aEsc(agent.instructions || '')}</textarea>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">
        <button onclick="agentSave('${agentId}')"
          style="padding:10px 22px;border-radius:10px;border:none;font-size:.85rem;font-weight:700;
                 background:${agent.color};color:#fff;cursor:pointer;transition:opacity .2s"
          onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
          💾 Enregistrer
        </button>
        <button onclick="agentReset('${agentId}')"
          style="padding:10px 18px;border-radius:10px;border:1.5px solid var(--gray-200);
                 font-size:.85rem;font-weight:600;background:#fff;color:var(--gray-600);cursor:pointer">
          ↺ Réinitialiser
        </button>
        <button onclick="agentToggleEditor('${agentId}')"
          style="padding:10px 18px;border-radius:10px;border:1.5px solid var(--gray-200);
                 font-size:.85rem;font-weight:600;background:#fff;color:var(--gray-500);cursor:pointer;margin-left:auto">
          ✕ Fermer
        </button>
      </div>
    </div>
  `;
}

/* ============================================================
   SAUVEGARDER
   ============================================================ */
function agentSave(agentId) {
  const agent = AI_TEAM.find(a => a.id === agentId);
  if (!agent) return;

  const enabledEl      = document.getElementById('agent-enabled-' + agentId);
  const toneEl         = document.getElementById('agent-tone-' + agentId);
  const focusEl        = document.getElementById('agent-focus-' + agentId);
  const promptEl       = document.getElementById('agent-prompt-' + agentId);
  const instructionsEl = document.getElementById('agent-instructions-' + agentId);

  if (enabledEl)      agent.enabled      = enabledEl.checked;
  if (toneEl)         agent.tone         = toneEl.value;
  if (focusEl)        agent.qualityFocus = focusEl.value;
  if (promptEl)       agent.systemPrompt = promptEl.value.trim();
  if (instructionsEl) agent.instructions = instructionsEl.value.trim();

  saveAIAgents();

  // Re-rend la grille (garde l'éditeur ouvert)
  const grid = document.getElementById('agents-grid');
  if (grid) grid.innerHTML = AI_TEAM.map(a => _agentCard(a)).join('');
}

/* ============================================================
   RÉINITIALISER
   ============================================================ */
function agentReset(agentId) {
  if (!confirm(`Réinitialiser les instructions de ${AI_TEAM.find(a => a.id === agentId)?.nom || agentId} aux valeurs par défaut ?`)) return;

  const defaults = buildDefaultAgents();
  const def = defaults.find(a => a.id === agentId);
  const idx = AI_TEAM.findIndex(a => a.id === agentId);
  if (def && idx !== -1) {
    AI_TEAM[idx] = { ...AI_TEAM[idx], ...def };
    saveAIAgents();
    // Ré-ouvre l'éditeur avec les valeurs fraîches
    const root = document.getElementById('agents-root');
    if (root) _agentRender(root);
    _agentRenderEditor(agentId);
    showToast('↺ Instructions réinitialisées', 'success');
  }
}

/* ============================================================
   HELPER
   ============================================================ */
function _aEsc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
