/* ============================================================
   DOK'PÉYI — CV Wizard  (cv.js)
   ============================================================ */

/* ── STATE ── */
const CW = {
  step:    1,
  choice:  null,   // 'create' | 'improve' | 'pro'
  file:    null,
  html:    null    // generated CV HTML string
};

/* ── LOADING MESSAGES ── */
const MSGS = [
  'On analyse tes informations…',
  'Mise en forme du contenu…',
  'Optimisation du design…',
  'On vérifie les détails…',
  'Dernières retouches…',
  'Presque prêt\u00a0!'
];

/* ── PROGRESS LABELS ── */
const PROG = [
  null,
  { lbl: 'Ton choix',    pct: '25%',  pctlbl: 'Étape 1 / 4' },
  { lbl: 'Tes infos',    pct: '50%',  pctlbl: 'Étape 2 / 4' },
  { lbl: 'Génération',   pct: '75%',  pctlbl: 'Étape 3 / 4' },
  { lbl: 'Ton CV',       pct: '100%', pctlbl: 'Terminé ✓'   }
];

/* ============================================================
   NAVIGATION
   ============================================================ */
function cwGoStep(n) {
  document.querySelectorAll('.cw-step').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('cw-s' + n);
  if (el) el.classList.add('active');
  CW.step = n;

  const p = PROG[n];
  if (p) {
    document.getElementById('cw-fill').style.width = p.pct;
    document.getElementById('cw-prog-lbl').textContent = p.lbl;
    document.getElementById('cw-prog-pct').textContent = p.pctlbl;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cwNext(from) {
  if (from === 1) {
    if (!CW.choice) return;
    cwBuildForm();
    cwGoStep(2);
  } else if (from === 2) {
    if (!cwValidate()) return;
    cwGoStep(3);
    cwGenerate();
  }
}

/* ── CHOICE SELECTION ── */
function cwPick(c, el) {
  CW.choice = c;
  document.querySelectorAll('.cw-choice').forEach(e => {
    e.classList.remove('selected');
    e.querySelector('.cw-choice-chk').textContent = '';
  });
  el.classList.add('selected');
  el.querySelector('.cw-choice-chk').textContent = '✓';
  document.getElementById('btn-s1').disabled = false;
}

/* ============================================================
   BUILD DYNAMIC FORM (ÉTAPE 2)
   ============================================================ */
function cwBuildForm() {
  const fields = document.getElementById('s2-fields');
  const title  = document.getElementById('s2-title');
  const sub    = document.getElementById('s2-sub');

  if (CW.choice === 'create') {
    title.textContent = 'Tes informations';
    sub.textContent   = 'Pas besoin d\'être parfait, on s\'occupe du reste ✌️';
    fields.innerHTML  = `
      <div class="cw-hint">💡 Plus tu nous donnes de détails, meilleur sera ton CV</div>
      <div class="cw-fg">
        <label class="cw-label">Prénom et nom *</label>
        <input class="cw-input" id="f-nom" type="text" placeholder="Ex : Marie Dupont" autocomplete="name">
      </div>
      <div class="cw-fg">
        <label class="cw-label">Poste ou métier recherché *</label>
        <input class="cw-input" id="f-poste" type="text" placeholder="Ex : Caissier(e), Agent d'entretien, Chauffeur…">
      </div>
      <div class="cw-fg">
        <label class="cw-label">Email ou numéro de téléphone</label>
        <input class="cw-input" id="f-contact" type="text" placeholder="Ex : marie@email.com ou 0694 123 456" autocomplete="email">
      </div>
      <div class="cw-fg">
        <label class="cw-label">Expériences professionnelles</label>
        <textarea class="cw-textarea" id="f-exp" placeholder="Ex : 2 ans comme vendeur chez Casino Cayenne, bénévole à la Croix-Rouge…" rows="4"></textarea>
      </div>
      <div class="cw-fg">
        <label class="cw-label">Formation et diplômes</label>
        <textarea class="cw-textarea" id="f-form" placeholder="Ex : BEP Commerce, Bac Pro Vente, permis B…" rows="2"></textarea>
      </div>
      <div class="cw-fg">
        <label class="cw-label">Compétences</label>
        <textarea class="cw-textarea" id="f-comp" placeholder="Ex : Travail en équipe, maîtrise Word, service client…" rows="2"></textarea>
      </div>`;
  } else {
    const isPro = CW.choice === 'pro';
    title.textContent = isPro ? 'Rends ton CV professionnel' : 'Améliore ton CV';
    sub.textContent   = 'Joins ton CV et dis-nous ce que tu veux changer';
    fields.innerHTML  = `
      <div class="cw-fg">
        <label class="cw-label">Ton CV actuel *</label>
        <div class="cw-file-zone" id="cw-fzone" onclick="document.getElementById('cw-finput').click()">
          <input type="file" id="cw-finput" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                 style="display:none" onchange="cwFile(this)">
          <div id="cw-finner">
            <div class="cw-fi">📎</div>
            <div class="cw-ft">Clique pour joindre ton CV</div>
            <div class="cw-fh">PDF, Word ou image · max 3 Mo</div>
          </div>
          <div class="cw-fchosen" id="cw-fchosen" style="display:none">
            <span>📄</span>
            <span class="cw-fname" id="cw-fname"></span>
            <button class="cw-frm" type="button" onclick="event.stopPropagation();cwRmFile()">✕</button>
          </div>
        </div>
      </div>
      <div class="cw-fg">
        <label class="cw-label">Que veux-tu changer ou améliorer ? *</label>
        <textarea class="cw-textarea" id="f-note"
          placeholder="Ex : Moderniser le design, reformuler mes expériences, le rendre plus clair…" rows="4"></textarea>
      </div>
      ${isPro ? `
      <div class="cw-fg">
        <label class="cw-label">Style souhaité</label>
        <div class="cw-spills">
          <input type="radio" name="cw-style" id="st-m" value="Moderne" checked>
          <label for="st-m">🎨 Moderne</label>
          <input type="radio" name="cw-style" id="st-c" value="Classique">
          <label for="st-c">📋 Classique</label>
          <input type="radio" name="cw-style" id="st-s" value="Simple">
          <label for="st-s">✨ Simple</label>
        </div>
      </div>` : ''}`;
  }
}

/* ── FILE HANDLING ── */
function cwFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { alert('Fichier trop grand (max 3 Mo).'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = e => {
    CW.file = { name: file.name, type: file.type };
    document.getElementById('cw-fname').textContent    = file.name;
    document.getElementById('cw-fchosen').style.display = 'flex';
    document.getElementById('cw-finner').style.display  = 'none';
    document.getElementById('cw-fzone').classList.add('ok');
  };
  reader.readAsDataURL(file);
}

function cwRmFile() {
  CW.file = null;
  document.getElementById('cw-finput').value           = '';
  document.getElementById('cw-fchosen').style.display  = 'none';
  document.getElementById('cw-finner').style.display   = '';
  document.getElementById('cw-fzone').classList.remove('ok');
}

/* ============================================================
   VALIDATION
   ============================================================ */
function cwValidate() {
  const err = document.getElementById('s2-err');
  err.classList.remove('on');

  if (CW.choice === 'create') {
    const nom   = document.getElementById('f-nom');
    const poste = document.getElementById('f-poste');
    if (!nom?.value.trim())   { cwMarkErr(nom,   err); return false; }
    if (!poste?.value.trim()) { cwMarkErr(poste, err); return false; }
    return true;
  } else {
    const note = document.getElementById('f-note');
    if (!note?.value.trim()) { cwMarkErr(note, err); return false; }
    return true;
  }
}

function cwMarkErr(el, errBox) {
  if (el) {
    el.classList.add('err', 'shake');
    el.focus();
    setTimeout(() => el.classList.remove('shake', 'err'), 1200);
  }
  if (errBox) errBox.classList.add('on');
}

/* ============================================================
   GÉNÉRATION (ÉTAPE 3 → ÉTAPE 4)
   ============================================================ */
async function cwGenerate() {
  /* Rotate loading messages */
  let mi = 0;
  const msgEl = document.getElementById('cw-load-msg');
  const timer = setInterval(() => {
    mi = (mi + 1) % MSGS.length;
    msgEl.style.opacity = '0';
    setTimeout(() => { msgEl.textContent = MSGS[mi]; msgEl.style.opacity = '1'; }, 350);
  }, 4500);

  const prompt = cwPrompt();

  try {
    const res  = await fetch('/api/generate-cv', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    clearInterval(timer);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    CW.html = (data.cv || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    if (!CW.html || !CW.html.startsWith('<')) throw new Error('La réponse était invalide, réessaie.');

    cwRenderPreview();
    cwGoStep(4);

  } catch (err) {
    clearInterval(timer);
    cwGoStep(2);
    const errEl = document.getElementById('s2-err');
    errEl.textContent = err.name === 'AbortError'
      ? 'Délai dépassé (45s) — simplifie le texte et réessaie.'
      : 'Erreur : ' + err.message;
    errEl.classList.add('on');
  }
}

/* ── PROMPT BUILDER ── */
function cwPrompt() {
  const FOOTER = '\n\nRéponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.';

  if (CW.choice === 'create') {
    const nom    = (document.getElementById('f-nom')?.value    || '').trim();
    const poste  = (document.getElementById('f-poste')?.value  || '').trim();
    const cont   = (document.getElementById('f-contact')?.value || '').trim();
    const exp    = (document.getElementById('f-exp')?.value    || '').trim();
    const form   = (document.getElementById('f-form')?.value   || '').trim();
    const comp   = (document.getElementById('f-comp')?.value   || '').trim();

    return `Tu es un expert en design et rédaction de CV professionnels.
Crée un CV complet, moderne et professionnel en HTML autonome (CSS inline, sans JavaScript, format A4 prêt à imprimer).

INFORMATIONS DU CANDIDAT :
Nom complet : ${nom}
Poste souhaité : ${poste}
Contact : ${cont || 'Non précisé'}
Expériences professionnelles : ${exp || 'Débutant — à valoriser au mieux'}
Formation / Diplômes : ${form || 'Non précisée'}
Compétences : ${comp || 'Non précisées'}

RÈGLES DE DESIGN STRICTES :
- body : fond blanc (#ffffff), texte sombre (#1f2937), AUCUN dégradé sur le body
- En-tête : fond bleu marine #1e3a5f, texte blanc — NOM en grand, poste, coordonnées
- Corps : fond blanc avec sections : Profil · Expériences · Formation · Compétences
- Titres de section : couleur #2563eb, séparateurs fins, icônes simples optionnelles
- Police system-ui/Arial, taille corps 13-14px, interligne 1.6
- Mise en page 1-2 pages A4, contenu VISIBLE et lisible
- @media print : marges 15mm${FOOTER}`;

  } else {
    const note  = (document.getElementById('f-note')?.value || '').trim();
    const style = (document.querySelector('[name="cw-style"]:checked')?.value) || 'Moderne';
    const action = CW.choice === 'improve' ? 'améliorer' : 'rendre plus professionnel';
    const file   = CW.file ? `\nFichier joint : ${CW.file.name}` : '';

    return `Tu es un expert en design et rédaction de CV professionnels.
Le client souhaite ${action} son CV existant.${file}

SOUHAITS DU CLIENT :
${note}

STYLE DEMANDÉ : ${style}

RÈGLES STRICTES :
- body : fond blanc (#ffffff), texte sombre (#1f2937), AUCUN dégradé sur le body entier
- Contenu COMPLET et LISIBLE : sections bien remplies, texte visible sur fond clair
${style === 'Moderne'   ? '- En-tête coloré #1e3a5f, icônes de section, accents #2563eb' :
  style === 'Classique' ? '- En-tête sobre gris foncé #1f2937, mise en page traditionnelle' :
                          '- En-tête minimaliste, beaucoup d\'espace blanc, typographie épurée'}
- Police system-ui/Arial, taille corps 13-14px, interligne 1.6
- Format A4 — @media print : marges 15mm${FOOTER}`;
  }
}

/* ============================================================
   PREVIEW IFRAME
   ============================================================ */
function cwRenderPreview() {
  const frame = document.getElementById('cw-prev-frame');
  const wrap  = document.getElementById('cw-prev-wrap');
  if (!frame || !CW.html) return;

  /* A4 at screen resolution = 794 × 1123 px */
  const A4W = 794;
  const A4H = 1123;

  frame.style.width    = A4W + 'px';
  frame.style.height   = A4H + 'px';
  frame.style.position = 'absolute';
  frame.style.top      = '0';
  frame.style.left     = '0';

  function rescale() {
    const scale = wrap.clientWidth / A4W;
    frame.style.transform       = `scale(${scale})`;
    frame.style.transformOrigin = 'top left';
    wrap.style.height           = (A4H * scale) + 'px';
  }

  frame.srcdoc = CW.html;
  rescale();
  window.addEventListener('resize', rescale, { passive: true });
}

/* ============================================================
   TÉLÉCHARGEMENT
   ============================================================ */
function cwDlFree() {
  if (!CW.html) return;
  const wm = `<style>
body::before{
  content:"DOK'PÉYI";
  position:fixed;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-28deg);
  font-size:5rem;font-weight:900;
  color:rgba(30,58,95,.09);
  pointer-events:none;z-index:9999;
  white-space:nowrap;letter-spacing:.2em;
  font-family:system-ui,Arial,sans-serif;
}
</style>`;
  const html = CW.html.replace('</head>', wm + '</head>');
  cwBlob(html, 'mon-cv-dokpeyi.html');
}

function cwDlClean() {
  if (!CW.html) return;
  cwBlob(CW.html, 'mon-cv-professionnel.html');
  cwClosePay();
}

function cwBlob(html, name) {
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================================================
   PAIEMENT
   ============================================================ */
function cwOpenPay() {
  document.getElementById('pay-form').style.display = '';
  document.getElementById('pay-ok').style.display   = 'none';
  document.getElementById('pay-lbl').textContent    = '🔒 Payer 8€ et télécharger';
  document.getElementById('btn-pay').disabled       = false;
  document.getElementById('cw-overlay').classList.add('open');
}

function cwClosePay() {
  document.getElementById('cw-overlay').classList.remove('open');
}

function cwOverlayClick(e) {
  if (e.target === document.getElementById('cw-overlay')) cwClosePay();
}

function cwPay() {
  const num = (document.getElementById('pay-num')?.value || '').replace(/\s/g, '');
  const exp = (document.getElementById('pay-exp')?.value || '');
  const cvv = (document.getElementById('pay-cvv')?.value || '');
  if (num.length < 16 || !exp.includes('/') || cvv.length < 3) {
    alert('Merci de compléter les informations de ta carte bancaire.');
    return;
  }
  const btn = document.getElementById('btn-pay');
  btn.disabled = true;
  document.getElementById('pay-lbl').textContent = 'Traitement en cours…';
  setTimeout(() => {
    document.getElementById('pay-form').style.display = 'none';
    document.getElementById('pay-ok').style.display   = '';
  }, 2000);
}

function fmtCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function fmtExp(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
  input.value = v;
}

/* ============================================================
   RESTART
   ============================================================ */
function cwRestart() {
  CW.choice = null;
  CW.file   = null;
  CW.html   = null;
  document.querySelectorAll('.cw-choice').forEach(el => {
    el.classList.remove('selected');
    el.querySelector('.cw-choice-chk').textContent = '';
  });
  document.getElementById('btn-s1').disabled = true;
  cwGoStep(1);
}
