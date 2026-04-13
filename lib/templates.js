/* ============================================================
   DOK'PÉYI — Document Templates  (lib/templates.js)
   ES module — imported by lib/pipeline.js only.

   Responsibilities:
     1. Receive parsed AI content + order personal data
     2. Return a complete, self-contained HTML document
     3. Guarantee deterministic output — no random layout from AI

   render(service, content, personal, format)
     format = 'json'  → dispatch to a fixed template function
     format = 'html'  → passthrough (AI already produced the HTML)

   Fully implemented:  cv (scratch + pro)
   Passthrough (html): lettre, courrier, dossier, sejour, cv/improve
   ============================================================ */

const DISCLAIMER =
  "Document généré par Dok\u2019péyi\u00a0· Service d\u2019aide à la rédaction · Ne remplace pas un professionnel du droit.";


/* ── PUBLIC ENTRY POINT ──────────────────────────────────── */

/**
 * Render a content object or raw HTML string into a final HTML document.
 *
 * @param {string}        service  - Service key: cv|lettre|courrier|dossier|sejour
 * @param {object|string} content  - Parsed AI output (object for json, string for html)
 * @param {object}        personal - { prenom, nom, email, whatsapp }
 * @param {'json'|'html'} format   - Matches buildPrompt() return value
 * @returns {string} Complete HTML document.
 */
export function render(service, content, personal, format) {
  if (format === 'html') {
    // Legacy path — AI already produced the full HTML; return as-is.
    return typeof content === 'string' ? content : '';
  }

  // JSON path — dispatch to the appropriate template
  switch (service) {
    case 'cv': return _renderCV(content, personal);
    default:
      // Safety net: if a JSON-mode service has no template yet,
      // return an error document so the failure is visible.
      return _renderMissingTemplate(service);
  }
}


/* ── CV TEMPLATE ─────────────────────────────────────────── */

function _renderCV(data, personal) {
  const { meta = {}, sections = [] } = data || {};
  const fullName = [personal.prenom, personal.nom].filter(Boolean).join(' ');
  const poste    = meta.poste || '';

  const sectionsHTML = sections
    .filter(s => _hasContent(s))
    .map(s => _renderSection(s))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CV\u00a0\u2014 ${esc(fullName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,system-ui,sans-serif;background:#fff;color:#1e293b;font-size:10.5pt;line-height:1.55}
/* ── header ── */
.cv-header{background:#1e3a5f;color:#fff;padding:30px 40px 26px}
.cv-name{font-size:1.9rem;font-weight:800;letter-spacing:.3px}
.cv-poste{font-size:1rem;color:#93c5fd;margin-top:7px;font-weight:500}
.cv-contacts{display:flex;flex-wrap:wrap;gap:18px;margin-top:14px;font-size:.8rem;opacity:.82}
/* ── body ── */
.cv-body{padding:26px 40px}
.cv-section{margin-bottom:24px}
.cv-section-title{font-size:.67rem;font-weight:800;text-transform:uppercase;
  letter-spacing:1.6px;color:#2563eb;border-bottom:2px solid #2563eb;
  padding-bottom:5px;margin-bottom:13px}
/* paragraph section */
.cv-para{font-size:.85rem;color:#374151;line-height:1.7;
  padding:12px 15px;background:#eff6ff;border-left:3px solid #2563eb;
  border-radius:0 5px 5px 0}
/* items section */
.cv-item{margin-bottom:11px}
.cv-item-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cv-item-title{font-weight:700;font-size:.88rem}
.cv-item-period{font-size:.76rem;color:#6b7280;white-space:nowrap;flex-shrink:0}
.cv-item-subtitle{font-size:.79rem;color:#4b5563;margin-top:2px}
.cv-item-bullets{margin-top:5px;padding-left:16px;font-size:.8rem;color:#374151;line-height:1.6}
.cv-item-bullets li{margin-bottom:2px}
/* chips section */
.cv-chips{display:flex;flex-wrap:wrap;gap:7px}
.cv-chip{background:#eff6ff;color:#1d4ed8;font-size:.75rem;padding:4px 12px;
  border-radius:99px;font-weight:600}
/* footer */
.cv-footer{text-align:center;margin-top:28px;padding-top:10px;
  border-top:1px solid #e5e7eb;font-size:.63rem;color:#9ca3af;font-style:italic}
/* print */
@media print{@page{margin:15mm}body{margin:0}.cv-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="cv-header">
  <div class="cv-name">${esc(fullName)}</div>
  ${poste ? `<div class="cv-poste">${esc(poste)}</div>` : ''}
  <div class="cv-contacts">
    ${personal.email    ? `<span>&#9993; ${esc(personal.email)}</span>`    : ''}
    ${personal.whatsapp ? `<span>&#9742; ${esc(personal.whatsapp)}</span>` : ''}
  </div>
</div>
<div class="cv-body">
${sectionsHTML}
</div>
<div class="cv-footer">${esc(DISCLAIMER)}</div>
</body>
</html>`;
}

function _renderSection(sec) {
  const title = `<div class="cv-section-title">${esc(sec.title || '')}</div>`;
  let body = '';

  if (sec.type === 'paragraph') {
    body = `<div class="cv-para">${esc(sec.content || '')}</div>`;

  } else if (sec.type === 'items') {
    body = (sec.items || []).map(item => {
      const bullets = (item.bullets || []).length
        ? `<ul class="cv-item-bullets">${item.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
        : '';
      return `<div class="cv-item">
  <div class="cv-item-head">
    <span class="cv-item-title">${esc(item.title || '')}</span>
    ${item.period ? `<span class="cv-item-period">${esc(item.period)}</span>` : ''}
  </div>
  ${item.subtitle ? `<div class="cv-item-subtitle">${esc(item.subtitle)}</div>` : ''}
  ${bullets}
</div>`;
    }).join('\n');

  } else if (sec.type === 'chips') {
    body = `<div class="cv-chips">${
      (sec.items || []).map(c => `<span class="cv-chip">${esc(c)}</span>`).join('')
    }</div>`;
  }

  return `<div class="cv-section">\n${title}\n${body}\n</div>`;
}

/** Return false if the section carries no meaningful content. */
function _hasContent(sec) {
  if (!sec) return false;
  if (sec.type === 'paragraph') return !!(sec.content || '').trim();
  if (sec.type === 'items')  return Array.isArray(sec.items) && sec.items.length > 0;
  if (sec.type === 'chips')  return Array.isArray(sec.items) && sec.items.length > 0;
  return true;
}


/* ── HELPERS ─────────────────────────────────────────────── */

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _renderMissingTemplate(service) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Template manquant</title></head><body style="font-family:sans-serif;padding:40px;color:#b91c1c">
<h2>Template non implémenté pour le service &ldquo;${esc(service)}&rdquo;</h2>
<p>Ce service utilise le mode JSON mais aucun template n'a encore été défini.</p>
</body></html>`;
}
