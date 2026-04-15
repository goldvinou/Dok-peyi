/* ============================================================
   DOK'PÉYI — Mission Control IA  (workspace-ia-dashboard.js)
   ============================================================ */

/* ── Mapping statuts → colonne agent ── */
var IA_LANES = [
  {
    agentId:  'lucas',
    statuses: { submitted: 1, en_attente: 1, pending: 1 },
    stepLabel: 'Réception & accueil'
  },
  {
    agentId:  'emma',
    statuses: { processing: 1, generated: 1, en_cours: 1, en_redaction: 1, assignee: 1 },
    stepLabel: 'Rédaction & génération'
  },
  {
    agentId:  'sofia',
    statuses: { pending_payment: 1, pret_paiement: 1 },
    stepLabel: 'Optimisation'
  },
  {
    agentId:  'lea',
    statuses: { pole_qualite: 1 },
    stepLabel: 'Pôle Qualité & Présentation'
  },
  {
    agentId:  'viktor',
    statuses: { needs_review: 1, a_verifier: 1, correction_demandee: 1, valide_manager: 1, paid: 1, delivered: 1 },
    stepLabel: 'Validation finale'
  }
];

/* ── Point d'entrée ── */
function renderIaDashboard() {
  var root = document.getElementById('qc-root');
  if (!root) return;
  root.innerHTML = _iaDashBuild();
}

/* ── Shell principal ── */
function _iaDashBuild() {
  /* Stats globales */
  var total  = demandes.length;
  var active = 0;
  var done   = 0;
  var today  = 0;
  var todayStr = new Date().toISOString().split('T')[0];

  for (var i = 0; i < demandes.length; i++) {
    var d = demandes[i];
    var st = d.statut || '';
    if (st === 'terminé' || st === 'delivered' || st === 'paid' || st === 'annulé') {
      done++;
    } else {
      active++;
    }
    var dt = (d.date || d.updatedAt || d.createdAt || '').split('T')[0];
    if (dt === todayStr) today++;
  }

  var successRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return '<div class="ia-dash-shell">'
    /* ── Stats bar ── */
    + '<div class="ia-dash-stats">'
    + _iaStatCard('📋', 'Total demandes', total,       '#3b82f6')
    + _iaStatCard('⚡', 'En traitement',  active,      '#f59e0b')
    + _iaStatCard('✅', 'Complétées',     done,        '#22c55e')
    + _iaStatCard('📅', "Aujourd'hui",    today,       '#8b5cf6')
    + _iaStatCard('📈', 'Taux succès',    successRate + '%', '#06b6d4')
    + '</div>'
    /* ── Corps principal ── */
    + '<div class="ia-dash-body">'
    + '<div class="ia-dash-pipeline">' + _iaDashPipeline() + '</div>'
    + '<div class="ia-dash-feed-col">'  + _iaDashFeed()    + '</div>'
    + '</div>'
    /* ── Bouton flottant activité (mobile uniquement) ── */
    + '<button class="ia-feed-mob-btn" onclick="_iaToggleMobFeed(this)" aria-label="Activité en direct">'
    + '<span class="ia-feed-live-dot" style="width:6px;height:6px;margin:0"></span> Activité'
    + '</button>'
    + '</div>';
}

/* ── Carte stat ── */
function _iaStatCard(icon, label, value, color) {
  return '<div class="ia-stat-card">'
    + '<div class="ia-stat-icon" style="color:' + color + '">' + icon + '</div>'
    + '<div class="ia-stat-value" style="color:' + color + '">' + value + '</div>'
    + '<div class="ia-stat-label">' + label + '</div>'
    + '</div>';
}

/* ── Pipeline Kanban (4 colonnes) ── */
function _iaDashPipeline() {
  var html = '';
  for (var i = 0; i < IA_LANES.length; i++) {
    var lane  = IA_LANES[i];
    var agent = _iaFindAgent(lane.agentId);
    if (!agent) continue;

    /* Demandes actives dans cette colonne */
    var cols = [];
    for (var j = 0; j < demandes.length; j++) {
      if (lane.statuses[demandes[j].statut]) cols.push(demandes[j]);
    }
    var count  = cols.length;
    var isBusy = count > 0;

    html += '<div class="ia-lane">'
      /* En-tête colonne */
      + '<div class="ia-lane-head" style="border-top:3px solid ' + agent.color + '">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      + '<div class="ia-lane-avatar" style="background:' + agent.color + '22;color:' + agent.color + '">'
      + agent.icon
      + '</div>'
      + '<div>'
      + '<div class="ia-lane-name">' + _iaEsc(agent.nom) + '</div>'
      + '<div class="ia-lane-role">' + _iaEsc(agent.role) + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="ia-lane-status">'
      + '<span class="ia-lane-dot" style="background:' + (isBusy ? agent.color : '#334155') + ';'
      + (isBusy ? 'box-shadow:0 0 6px ' + agent.color + '88' : '') + '"></span>'
      + '<span style="color:' + (isBusy ? agent.color : '#334155') + ';font-weight:' + (isBusy ? '700' : '500') + '">'
      + (isBusy ? count + ' tâche' + (count > 1 ? 's' : '') + ' active' + (count > 1 ? 's' : '') : 'En attente')
      + '</span>'
      + '</div>'
      + '</div>'
      /* Corps colonne */
      + '<div class="ia-lane-body">';

    if (cols.length === 0) {
      html += '<div class="ia-lane-empty">'
        + '<div style="font-size:2rem;opacity:.15;margin-bottom:8px">' + agent.icon + '</div>'
        + '<div style="font-size:.72rem;color:#1e293b;text-align:center">Aucune tâche en cours</div>'
        + '</div>';
    } else {
      var shown = cols.slice(0, 8);
      for (var k = 0; k < shown.length; k++) {
        html += _iaLaneCard(shown[k], agent.color);
      }
      if (cols.length > 8) {
        html += '<div style="text-align:center;padding:8px 0;font-size:.7rem;color:#475569">'
          + '+ ' + (cols.length - 8) + ' autres</div>';
      }
    }

    html += '</div></div>';
  }
  return html;
}

/* ── Carte demande dans une colonne ── */
function _iaLaneCard(d, color) {
  var svcIcon = (typeof SERVICE_ICONS !== 'undefined' && SERVICE_ICONS[d.service]) || '📄';
  var svcName = (typeof SERVICE_NAMES !== 'undefined' && SERVICE_NAMES[d.service]) || (d.service || '—');
  var ago     = _iaTimeAgo(d.date || d.updatedAt || d.createdAt);
  var client  = _iaClientName(d);

  return '<div class="ia-lane-card" style="border-left:3px solid ' + color + '">'
    + '<div class="ia-lcard-top">'
    + '<span class="ia-lcard-name">' + _iaEsc(client) + '</span>'
    + '<span class="ia-lcard-time">' + ago + '</span>'
    + '</div>'
    + '<div class="ia-lcard-svc">' + svcIcon + ' ' + _iaEsc(svcName) + '</div>'
    + '</div>';
}

/* ── Flux d'activité live ── */
function _iaDashFeed() {
  /* Construire la liste d'événements depuis _aiTeam de chaque demande */
  var AI_STEPS = [
    { key: 'accueil',      agentId: 'lucas'  },
    { key: 'generation',   agentId: 'emma'   },
    { key: 'optimisation', agentId: 'sofia'  },
    { key: 'presentation', agentId: 'lea'    },
    { key: 'verification', agentId: 'viktor' }
  ];

  var events = [];
  for (var i = 0; i < demandes.length; i++) {
    var d = demandes[i];
    if (!d._aiTeam) continue;
    for (var s = 0; s < AI_STEPS.length; s++) {
      var step  = AI_STEPS[s];
      var entry = d._aiTeam[step.key];
      if (!entry || !entry.at) continue;
      events.push({ at: entry.at, agentId: step.agentId, label: entry.label || step.key, dem: d });
    }
  }

  /* Tri par date décroissante */
  events.sort(function(a, b) { return new Date(b.at) - new Date(a.at); });

  var html = '<div class="ia-feed">'
    + '<div class="ia-feed-title">'
    + '<span class="ia-feed-live-dot"></span>'
    + 'Activité en direct'
    + '</div>';

  if (events.length === 0) {
    html += '<div class="ia-feed-empty">'
      + '<div style="font-size:2.5rem;opacity:.12;margin-bottom:12px">📡</div>'
      + '<div style="font-size:.78rem;color:#1e293b;line-height:1.5;text-align:center">L\'activité de votre équipe<br>IA apparaîtra ici</div>'
      + '</div>';
  } else {
    var shown = events.slice(0, 40);
    for (var e = 0; e < shown.length; e++) {
      html += _iaFeedItem(shown[e]);
    }
  }

  html += '</div>';
  return html;
}

/* ── Item du flux d'activité ── */
function _iaFeedItem(ev) {
  var agent = _iaFindAgent(ev.agentId);
  if (!agent) return '';
  var d       = ev.dem;
  var svcIcon = (typeof SERVICE_ICONS !== 'undefined' && SERVICE_ICONS[d.service]) || '📄';

  return '<div class="ia-feed-item">'
    + '<div class="ia-feed-dot" style="background:' + agent.color + '22;color:' + agent.color + '">' + agent.icon + '</div>'
    + '<div class="ia-feed-content">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:2px">'
    + '<span class="ia-feed-agent" style="color:' + agent.color + '">' + _iaEsc(agent.nom) + '</span>'
    + '<span class="ia-feed-time">' + _iaTimeAgo(ev.at) + '</span>'
    + '</div>'
    + '<div class="ia-feed-action">' + _iaEsc(ev.label) + '</div>'
    + '<div class="ia-feed-dem">' + svcIcon + ' ' + _iaEsc(_iaClientName(d)) + '</div>'
    + '</div>'
    + '</div>';
}

/* ── Toggle activité mobile ── */
function _iaToggleMobFeed(btn) {
  var feed = document.querySelector('.ia-dash-feed-col');
  if (!feed) return;
  var visible = feed.style.display === 'flex';
  feed.style.display = visible ? 'none' : 'flex';
  btn.style.background = visible ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.06)';
}

/* ── Helpers ── */
function _iaFindAgent(id) {
  for (var i = 0; i < AI_TEAM.length; i++) {
    if (AI_TEAM[i].id === id) return AI_TEAM[i];
  }
  return null;
}

function _iaClientName(d) {
  return d.nom || d.client || d.clientNom || d.name || 'Client inconnu';
}

function _iaTimeAgo(iso) {
  if (!iso) return '—';
  var diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff) || diff < 0) return '—';
  var s = Math.floor(diff / 1000);
  if (s < 60)    return 'à l\'instant';
  if (s < 3600)  return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'j';
}

function _iaEsc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
