/* ============================================================
   DOK'PÉYI — Module Équipe IA (workspace-agents.js)
   ============================================================ */

let _agentEditing = null;

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

/* ── Entrée principale ── */
function renderAgentsPanel() {
  const root = document.getElementById('agents-root');
  if (!root) return;
  _agentEditing = null;
  root.innerHTML = _agentBuildShell();
  _agentBindCards();
}

/* ── HTML de la coquille principale ── */
function _agentBuildShell() {
  var cards = '';
  for (var i = 0; i < AI_TEAM.length; i++) {
    cards += _agentCard(AI_TEAM[i]);
  }
  return '<div style="max-width:960px;margin:0 auto">'
    + '<div style="margin-bottom:24px">'
    + '<h2 style="font-size:1.1rem;font-weight:800;color:var(--dark);margin-bottom:6px">🤖 Mon équipe IA</h2>'
    + '<p style="font-size:.84rem;color:var(--gray-500);line-height:1.5;max-width:540px">'
    + 'Configure l\'empreinte de chaque agent IA. Ces instructions sont utilisées à chaque génération de document.'
    + '</p></div>'
    + '<div class="agents-grid" id="agents-grid">' + cards + '</div>'
    + '<div id="agent-editor-wrap" style="margin-top:0"></div>'
    + '</div>';
}

/* ── HTML d'une carte agent ── */
function _agentCard(agent) {
  var isActive  = _agentEditing === agent.id;
  var statusColor = agent.enabled ? '#22c55e' : '#94a3b8';
  var statusText  = agent.enabled ? 'Actif'   : 'Inactif';
  var statusTextColor = agent.enabled ? '#16a34a' : '#94a3b8';
  var toneLabel  = TONE_LABELS[agent.tone]         || agent.tone;
  var focusLabel = FOCUS_LABELS[agent.qualityFocus] || agent.qualityFocus;
  var borderColor = isActive ? agent.color : '#e2e8f0';
  var configLabel = isActive ? '▲ Fermer' : '⚙️ Configurer';
  var configColor = isActive ? agent.color : '#64748b';

  return '<div class="agent-card' + (isActive ? ' agent-card-active' : '') + '"'
    + ' data-agent-id="' + agent.id + '"'
    + ' style="border-color:' + borderColor + ';cursor:pointer">'
    + '<div class="agent-card-before" style="background:' + agent.color + '"></div>'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">'
    + '<div class="agent-avatar" style="background:' + agent.color + '22;color:' + agent.color + '">'
    + agent.icon + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px">'
    + '<span style="width:8px;height:8px;border-radius:50%;background:' + statusColor + ';display:inline-block"></span>'
    + '<span style="font-size:.72rem;font-weight:600;color:' + statusTextColor + '">' + statusText + '</span>'
    + '</div></div>'
    + '<div class="agent-name">' + _aEsc(agent.nom) + '</div>'
    + '<div class="agent-role">' + _aEsc(agent.role) + '</div>'
    + '<div style="font-size:.75rem;color:var(--gray-400);margin-bottom:14px">' + _aEsc(agent.specialite) + '</div>'
    + '<div class="agent-tags">'
    + '<span class="agent-tag">' + toneLabel + '</span>'
    + '<span class="agent-tag">' + focusLabel + '</span>'
    + '</div>'
    + '<div style="margin-top:14px;font-size:.78rem;font-weight:600;color:' + configColor + '">'
    + configLabel + '</div>'
    + '</div>';
}

/* ── Attacher les événements après rendu ── */
function _agentBindCards() {
  var grid = document.getElementById('agents-grid');
  if (!grid) return;
  var cards = grid.querySelectorAll('.agent-card');
  for (var i = 0; i < cards.length; i++) {
    (function(card) {
      card.addEventListener('click', function() {
        var id = card.getAttribute('data-agent-id');
        _agentEditing = (_agentEditing === id) ? null : id;
        _agentRefreshGrid();
        _agentRefreshEditor();
      });
    })(cards[i]);
  }
}

/* ── Rafraîchir la grille sans recréer la coquille ── */
function _agentRefreshGrid() {
  var grid = document.getElementById('agents-grid');
  if (!grid) return;
  var cards = '';
  for (var i = 0; i < AI_TEAM.length; i++) {
    cards += _agentCard(AI_TEAM[i]);
  }
  grid.innerHTML = cards;
  _agentBindCards();
}

/* ── Rafraîchir le panneau éditeur ── */
function _agentRefreshEditor() {
  var wrap = document.getElementById('agent-editor-wrap');
  if (!wrap) return;

  if (!_agentEditing) {
    wrap.innerHTML = '';
    return;
  }

  var agent = null;
  for (var i = 0; i < AI_TEAM.length; i++) {
    if (AI_TEAM[i].id === _agentEditing) { agent = AI_TEAM[i]; break; }
  }
  if (!agent) { wrap.innerHTML = ''; return; }

  /* Options selects */
  var toneOptions = '';
  var toneKeys = Object.keys(TONE_LABELS);
  for (var t = 0; t < toneKeys.length; t++) {
    var tv = toneKeys[t];
    toneOptions += '<option value="' + tv + '"' + (agent.tone === tv ? ' selected' : '') + '>'
      + TONE_LABELS[tv] + '</option>';
  }

  var focusOptions = '';
  var focusKeys = Object.keys(FOCUS_LABELS);
  for (var f = 0; f < focusKeys.length; f++) {
    var fv = focusKeys[f];
    focusOptions += '<option value="' + fv + '"' + (agent.qualityFocus === fv ? ' selected' : '') + '>'
      + FOCUS_LABELS[fv] + '</option>';
  }

  wrap.innerHTML = '<div class="agent-editor" style="border-top:3px solid ' + agent.color + ';margin-top:20px">'

    /* En-tête */
    + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">'
    + '<span style="font-size:1.6rem">' + agent.icon + '</span>'
    + '<div><div style="font-size:1rem;font-weight:800;color:var(--dark)">' + _aEsc(agent.nom) + '</div>'
    + '<div style="font-size:.78rem;color:var(--gray-500)">' + _aEsc(agent.role) + '</div></div>'
    + '<label style="margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.82rem;font-weight:600;color:var(--gray-600);cursor:pointer">'
    + '<input type="checkbox" id="agent-enabled-' + agent.id + '"' + (agent.enabled ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:' + agent.color + '">'
    + 'Agent actif</label>'
    + '</div>'

    /* Ton + Focus */
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px">'
    + '<div class="agent-field"><label>Ton de communication</label>'
    + '<select id="agent-tone-' + agent.id + '" class="agent-select" style="width:100%">' + toneOptions + '</select></div>'
    + '<div class="agent-field"><label>Focus qualité</label>'
    + '<select id="agent-focus-' + agent.id + '" class="agent-select" style="width:100%">' + focusOptions + '</select></div>'
    + '</div>'

    /* System prompt */
    + '<div class="agent-field">'
    + '<label>Instructions système — empreinte de l\'agent</label>'
    + '<div style="font-size:.73rem;color:var(--gray-400);margin-bottom:7px">Ces instructions définissent le comportement de ' + _aEsc(agent.nom) + '. Elles préfixent chaque génération.</div>'
    + '<textarea id="agent-prompt-' + agent.id + '" class="agent-textarea" rows="6">' + _aEsc(agent.systemPrompt || '') + '</textarea>'
    + '</div>'

    /* Notes sup */
    + '<div class="agent-field">'
    + '<label>Contexte supplémentaire <span style="font-weight:400;text-transform:none;letter-spacing:0">(optionnel)</span></label>'
    + '<textarea id="agent-instructions-' + agent.id + '" class="agent-textarea" rows="3"'
    + ' placeholder="Vouvoiement, contraintes métier, exemples…">' + _aEsc(agent.instructions || '') + '</textarea>'
    + '</div>'

    /* Boutons */
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px">'
    + '<button id="agent-save-btn-' + agent.id + '" style="padding:10px 22px;border-radius:10px;border:none;font-size:.85rem;font-weight:700;background:' + agent.color + ';color:#fff;cursor:pointer">💾 Enregistrer</button>'
    + '<button id="agent-reset-btn-' + agent.id + '" style="padding:10px 18px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:.85rem;font-weight:600;background:#fff;color:#64748b;cursor:pointer">↺ Réinitialiser</button>'
    + '<button id="agent-close-btn-' + agent.id + '" style="padding:10px 18px;border-radius:10px;border:1.5px solid #e2e8f0;font-size:.85rem;font-weight:600;background:#fff;color:#94a3b8;cursor:pointer;margin-left:auto">✕ Fermer</button>'
    + '</div>'
    + '</div>';

  /* Boutons — event listeners */
  var saveBtn  = document.getElementById('agent-save-btn-'  + agent.id);
  var resetBtn = document.getElementById('agent-reset-btn-' + agent.id);
  var closeBtn = document.getElementById('agent-close-btn-' + agent.id);
  var agentId  = agent.id;

  if (saveBtn)  saveBtn.addEventListener('click',  function() { _agentSave(agentId); });
  if (resetBtn) resetBtn.addEventListener('click', function() { _agentReset(agentId); });
  if (closeBtn) closeBtn.addEventListener('click', function() {
    _agentEditing = null;
    _agentRefreshGrid();
    _agentRefreshEditor();
  });
}

/* ── Sauvegarder ── */
function _agentSave(agentId) {
  var agent = null;
  for (var i = 0; i < AI_TEAM.length; i++) {
    if (AI_TEAM[i].id === agentId) { agent = AI_TEAM[i]; break; }
  }
  if (!agent) return;

  var elEnabled      = document.getElementById('agent-enabled-'      + agentId);
  var elTone         = document.getElementById('agent-tone-'         + agentId);
  var elFocus        = document.getElementById('agent-focus-'        + agentId);
  var elPrompt       = document.getElementById('agent-prompt-'       + agentId);
  var elInstructions = document.getElementById('agent-instructions-' + agentId);

  if (elEnabled)      agent.enabled      = elEnabled.checked;
  if (elTone)         agent.tone         = elTone.value;
  if (elFocus)        agent.qualityFocus = elFocus.value;
  if (elPrompt)       agent.systemPrompt = elPrompt.value.trim();
  if (elInstructions) agent.instructions = elInstructions.value.trim();

  saveAIAgents();
  _agentRefreshGrid();
}

/* ── Réinitialiser ── */
function _agentReset(agentId) {
  var nom = '';
  for (var i = 0; i < AI_TEAM.length; i++) {
    if (AI_TEAM[i].id === agentId) { nom = AI_TEAM[i].nom; break; }
  }
  if (!confirm('Réinitialiser les instructions de ' + nom + ' aux valeurs par défaut ?')) return;

  var defaults = buildDefaultAgents();
  for (var d = 0; d < defaults.length; d++) {
    if (defaults[d].id === agentId) {
      for (var j = 0; j < AI_TEAM.length; j++) {
        if (AI_TEAM[j].id === agentId) {
          AI_TEAM[j] = defaults[d];
          break;
        }
      }
      break;
    }
  }

  saveAIAgents();
  _agentRefreshGrid();
  _agentRefreshEditor();
  showToast('↺ Instructions réinitialisées', 'success');
}

/* ── Helper échappement HTML ── */
function _aEsc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
