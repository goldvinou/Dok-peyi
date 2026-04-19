/* ============================================================
   DOK'PÉYI — CV Builder  (cv-builder.js)
   Aperçu temps réel · 3 templates · Stripe/PayPal
   ============================================================ */

const CB_TEST        = location.hostname === 'localhost'
  || location.hostname === '127.0.0.1'
  || new URLSearchParams(location.search).get('test') === '1';
const CB_PAYPAL_EMAIL = 'contact@dok-peyi.fr';

/* ── STATE ──────────────────────────────────────────────── */
const CB = {
  template:    'moderne',
  paid:        false,
  orderId:     null,
  payMethod:   'card',
  prenom: '', nom: '', titre: '', email: '', phone: '', adresse: '',
  resume: '',
  experiences: [],
  formations:  [],
  competences: [],
  langues:     []
};

/* ── INIT ───────────────────────────────────────────────── */
(function cbInit() {
  const params = new URLSearchParams(location.search);
  if (params.get('success') === '1') {
    CB.paid    = true;
    CB.orderId = params.get('order_id');
    history.replaceState({}, '', '/cv-builder');
  }
  CB.experiences.push({ poste: '', entreprise: '', debut: '', fin: '', desc: '' });
  CB.formations.push({ diplome: '', etablissement: '', annee: '' });
  CB.competences.push({ nom: '', niveau: 4 });
  CB.langues.push({ langue: 'Français', niveau: 'Langue maternelle' });

  cbRenderSection('experiences');
  cbRenderSection('formations');
  cbRenderSection('competences');
  cbRenderSection('langues');
  cbRender();
  if (CB.paid) cbShowPaid();
})();

/* ── FIELD UPDATE ───────────────────────────────────────── */
function cbField(key, value) {
  CB[key] = value;
  cbRender();
}

/* ── TEMPLATE SELECTOR ──────────────────────────────────── */
function cbTpl(name, btn) {
  CB.template = name;
  document.querySelectorAll('.cb-tpl-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cbRender();
}

/* ── TAB NAVIGATION ─────────────────────────────────────── */
function cbTab(name, btn) {
  document.querySelectorAll('.cb-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.cb-tab').forEach(t => t.classList.remove('active'));
  const sec = document.getElementById('cb-' + name);
  if (sec) sec.classList.add('active');
  btn.classList.add('active');
}

/* ── DYNAMIC SECTIONS ───────────────────────────────────── */
function cbAdd(section) {
  const defaults = {
    experiences: { poste: '', entreprise: '', debut: '', fin: '', desc: '' },
    formations:  { diplome: '', etablissement: '', annee: '' },
    competences: { nom: '', niveau: 3 },
    langues:     { langue: '', niveau: 'Courant' }
  };
  CB[section].push(Object.assign({}, defaults[section]));
  cbRenderSection(section);
  cbRender();
}

function cbRemove(section, i) {
  CB[section].splice(i, 1);
  cbRenderSection(section);
  cbRender();
}

function cbEntryField(section, i, key, value) {
  if (CB[section][i]) CB[section][i][key] = value;
  cbRender();
}

function cbSetLevel(section, i, level) {
  if (CB[section][i]) CB[section][i].niveau = level;
  cbRenderSection(section);
  cbRender();
}

function cbRenderSection(section) {
  const ids = {
    experiences: 'cb-exp-list',
    formations:  'cb-form-list',
    competences: 'cb-skills-list',
    langues:     'cb-lang-list'
  };
  const el = document.getElementById(ids[section]);
  if (!el) return;

  if (section === 'experiences') {
    el.innerHTML = CB.experiences.map((e, i) => `
      <div class="cb-entry">
        ${CB.experiences.length > 1 ? `<button class="cb-entry-rm" onclick="cbRemove('experiences',${i})">✕</button>` : ''}
        <div class="cb-fg">
          <label class="cb-label">Poste</label>
          <input class="cb-input" value="${esc(e.poste)}"
                 oninput="cbEntryField('experiences',${i},'poste',this.value)"
                 placeholder="Ex : Vendeur, Aide-soignant…">
        </div>
        <div class="cb-fg">
          <label class="cb-label">Entreprise / Employeur</label>
          <input class="cb-input" value="${esc(e.entreprise)}"
                 oninput="cbEntryField('experiences',${i},'entreprise',this.value)"
                 placeholder="Ex : Casino Cayenne, CHOG…">
        </div>
        <div class="cb-row">
          <div class="cb-fg">
            <label class="cb-label">De</label>
            <input class="cb-input" value="${esc(e.debut)}"
                   oninput="cbEntryField('experiences',${i},'debut',this.value)"
                   placeholder="2022">
          </div>
          <div class="cb-fg">
            <label class="cb-label">À</label>
            <input class="cb-input" value="${esc(e.fin)}"
                   oninput="cbEntryField('experiences',${i},'fin',this.value)"
                   placeholder="Aujourd'hui">
          </div>
        </div>
        <div class="cb-fg">
          <label class="cb-label">Description</label>
          <textarea class="cb-textarea" rows="3"
            oninput="cbEntryField('experiences',${i},'desc',this.value)"
            placeholder="Missions, responsabilités…">${esc(e.desc)}</textarea>
        </div>
      </div>`).join('');
  }

  else if (section === 'formations') {
    el.innerHTML = CB.formations.map((f, i) => `
      <div class="cb-entry">
        ${CB.formations.length > 1 ? `<button class="cb-entry-rm" onclick="cbRemove('formations',${i})">✕</button>` : ''}
        <div class="cb-fg">
          <label class="cb-label">Diplôme / Titre</label>
          <input class="cb-input" value="${esc(f.diplome)}"
                 oninput="cbEntryField('formations',${i},'diplome',this.value)"
                 placeholder="Ex : BEP Commerce, Bac Pro…">
        </div>
        <div class="cb-fg">
          <label class="cb-label">École / Établissement</label>
          <input class="cb-input" value="${esc(f.etablissement)}"
                 oninput="cbEntryField('formations',${i},'etablissement',this.value)"
                 placeholder="Ex : Lycée Félix Éboué, Cayenne">
        </div>
        <div class="cb-fg">
          <label class="cb-label">Année</label>
          <input class="cb-input" value="${esc(f.annee)}"
                 oninput="cbEntryField('formations',${i},'annee',this.value)"
                 placeholder="2020">
        </div>
      </div>`).join('');
  }

  else if (section === 'competences') {
    el.innerHTML = CB.competences.map((c, i) => `
      <div class="cb-entry" style="flex-direction:row;align-items:center;gap:10px;padding:10px 12px">
        <input class="cb-input" style="flex:1;margin:0" value="${esc(c.nom)}"
               oninput="cbEntryField('competences',${i},'nom',this.value)"
               placeholder="Ex : Word, Service client, Permis B…">
        <div class="cb-levels">
          ${[1,2,3,4,5].map(n =>
            `<div class="cb-level${c.niveau >= n ? ' on' : ''}"
                  onclick="cbSetLevel('competences',${i},${n})"
                  title="Niveau ${n}/5"></div>`
          ).join('')}
        </div>
        ${CB.competences.length > 1
          ? `<button class="cb-entry-rm" style="position:static;flex-shrink:0"
                     onclick="cbRemove('competences',${i})">✕</button>`
          : ''}
      </div>`).join('');
  }

  else if (section === 'langues') {
    const niveaux = ['Débutant','Intermédiaire','Courant','Bilingue','Langue maternelle'];
    el.innerHTML = CB.langues.map((l, i) => `
      <div class="cb-entry" style="flex-direction:row;align-items:center;gap:8px;padding:9px 12px">
        <input class="cb-input" style="flex:1;margin:0" value="${esc(l.langue)}"
               oninput="cbEntryField('langues',${i},'langue',this.value)"
               placeholder="Ex : Créole, Anglais, Portugais…">
        <select class="cb-select" style="flex:1"
                onchange="cbEntryField('langues',${i},'niveau',this.value)">
          ${niveaux.map(n =>
            `<option${l.niveau === n ? ' selected' : ''}>${n}</option>`
          ).join('')}
        </select>
        ${CB.langues.length > 1
          ? `<button class="cb-entry-rm" style="position:static;flex-shrink:0"
                     onclick="cbRemove('langues',${i})">✕</button>`
          : ''}
      </div>`).join('');
  }
}

/* ── HTML ESCAPE ────────────────────────────────────────── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escH(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── RENDER ENGINE ──────────────────────────────────────── */
function cbRender() {
  const a4 = document.getElementById('cb-a4');
  if (!a4) return;
  if      (CB.template === 'classique') a4.innerHTML = cbTplClassique();
  else if (CB.template === 'creatif')   a4.innerHTML = cbTplCreatif();
  else                                  a4.innerHTML = cbTplModerne();

  const wm = document.getElementById('cb-watermark');
  if (wm) wm.className = 'cb-watermark' + (CB.paid ? ' hidden' : '');
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE : MODERNE  (bleu marine + blanc)
═══════════════════════════════════════════════════════════ */
function cbTplModerne() {
  const nom    = escH((CB.prenom + ' ' + CB.nom).trim()) || 'Votre Nom';
  const titre  = escH(CB.titre) || 'Poste recherché';
  const contact = [CB.email, CB.phone, CB.adresse].filter(Boolean).map(escH).join(' · ');

  const exps   = CB.experiences.filter(e => e.poste || e.entreprise);
  const forms  = CB.formations.filter(f => f.diplome || f.etablissement);
  const skills = CB.competences.filter(c => c.nom);
  const langs  = CB.langues.filter(l => l.langue);

  const dots = (n) => [1,2,3,4,5].map(k =>
    `<div style="width:20px;height:6px;border-radius:3px;background:${n>=k?'#2563eb':'#e2e8f0'}"></div>`
  ).join('');

  const secTitle = (t) =>
    `<div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
      color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:4px;margin-bottom:10px">${t}</div>`;

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#1f2937;background:#fff">

  <!-- EN-TÊTE -->
  <div style="background:#1e3a5f;color:#fff;padding:26px 30px 22px">
    <div style="font-size:24px;font-weight:700;letter-spacing:-.4px;margin-bottom:3px">${nom}</div>
    <div style="font-size:13.5px;color:#93c5fd;font-weight:600;margin-bottom:9px">${titre}</div>
    ${contact ? `<div style="font-size:11px;color:#bfdbfe;opacity:.9">${contact}</div>` : ''}
  </div>

  <!-- CORPS 2 colonnes -->
  <div style="display:flex;gap:0;padding:0">

    <!-- Colonne gauche : compétences + langues -->
    <div style="width:170px;flex-shrink:0;padding:22px 18px;border-right:1px solid #f1f5f9;background:#f8fafc">
      ${skills.length ? `${secTitle('Compétences')}${skills.map(c => `
        <div style="margin-bottom:9px">
          <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:3px">${escH(c.nom)}</div>
          <div style="display:flex;gap:3px">${dots(c.niveau)}</div>
        </div>`).join('')}<br>` : ''}
      ${langs.length ? `${secTitle('Langues')}${langs.map(l => `
        <div style="margin-bottom:7px">
          <div style="font-size:12px;font-weight:600;color:#374151">${escH(l.langue)}</div>
          <div style="font-size:11px;color:#6b7280">${escH(l.niveau)}</div>
        </div>`).join('')}` : ''}
    </div>

    <!-- Colonne droite : profil + expériences + formation -->
    <div style="flex:1;padding:22px 24px">
      ${CB.resume ? `<div style="margin-bottom:18px">
        ${secTitle('Profil')}
        <div style="font-size:12.5px;color:#374151;line-height:1.6">${escH(CB.resume)}</div>
      </div>` : ''}

      ${exps.length ? `<div style="margin-bottom:18px">
        ${secTitle('Expériences')}
        ${exps.map(e => `
          <div style="margin-bottom:13px">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <div style="font-size:13px;font-weight:700;color:#111827">${escH(e.poste)}</div>
              ${e.debut ? `<div style="font-size:11px;color:#9ca3af;white-space:nowrap">${escH(e.debut)}${e.fin ? ' – ' + escH(e.fin) : ''}</div>` : ''}
            </div>
            ${e.entreprise ? `<div style="font-size:12px;font-weight:600;color:#4b5563;margin-bottom:3px">${escH(e.entreprise)}</div>` : ''}
            ${e.desc ? `<div style="font-size:11.5px;color:#6b7280;line-height:1.5">${escH(e.desc).replace(/\n/g,'<br>')}</div>` : ''}
          </div>`).join('')}
      </div>` : ''}

      ${forms.length ? `<div>
        ${secTitle('Formation')}
        ${forms.map(f => `
          <div style="margin-bottom:9px">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <div style="font-size:13px;font-weight:700;color:#111827">${escH(f.diplome)}</div>
              ${f.annee ? `<div style="font-size:11px;color:#9ca3af">${escH(f.annee)}</div>` : ''}
            </div>
            ${f.etablissement ? `<div style="font-size:12px;color:#4b5563">${escH(f.etablissement)}</div>` : ''}
          </div>`).join('')}
      </div>` : ''}
    </div>
  </div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE : CLASSIQUE  (typographie sobre, noir & blanc)
═══════════════════════════════════════════════════════════ */
function cbTplClassique() {
  const nom    = escH((CB.prenom + ' ' + CB.nom).trim()) || 'Votre Nom';
  const titre  = escH(CB.titre) || 'Poste recherché';
  const contact = [CB.email, CB.phone, CB.adresse].filter(Boolean).map(escH).join('  ·  ');

  const exps   = CB.experiences.filter(e => e.poste || e.entreprise);
  const forms  = CB.formations.filter(f => f.diplome || f.etablissement);
  const skills = CB.competences.filter(c => c.nom);
  const langs  = CB.langues.filter(l => l.langue);

  const sec = (title, body) => body ? `
    <div style="margin-bottom:18px">
      <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;
        color:#374151;border-bottom:1.5px solid #1f2937;padding-bottom:4px;margin-bottom:10px">${title}</div>
      ${body}
    </div>` : '';

  return `<div style="font-family:'Times New Roman',Georgia,serif;font-size:13px;line-height:1.55;
    color:#1f2937;background:#fff;padding:32px 36px">

  <!-- EN-TÊTE centré -->
  <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #1f2937;padding-bottom:16px">
    <div style="font-size:22px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
      color:#111827;margin-bottom:4px">${nom}</div>
    <div style="font-size:13px;color:#4b5563;font-style:italic;margin-bottom:7px">${titre}</div>
    ${contact ? `<div style="font-size:11px;color:#6b7280">${contact}</div>` : ''}
  </div>

  ${CB.resume ? sec('Profil',
    `<div style="font-size:12.5px;color:#374151;line-height:1.6;font-style:italic">${escH(CB.resume)}</div>`
  ) : ''}

  ${sec('Expériences professionnelles', exps.map(e => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <strong>${escH(e.poste)}${e.entreprise ? ' — ' + escH(e.entreprise) : ''}</strong>
        ${e.debut ? `<span style="font-size:11px;color:#6b7280;white-space:nowrap">${escH(e.debut)}${e.fin ? ' – ' + escH(e.fin) : ''}</span>` : ''}
      </div>
      ${e.desc ? `<div style="margin-top:3px;font-size:12px;color:#6b7280">${escH(e.desc).replace(/\n/g,'<br>')}</div>` : ''}
    </div>`).join(''))}

  ${sec('Formation', forms.map(f => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
      <span><strong>${escH(f.diplome)}</strong>${f.etablissement ? ' — ' + escH(f.etablissement) : ''}</span>
      ${f.annee ? `<span style="font-size:11px;color:#6b7280">${escH(f.annee)}</span>` : ''}
    </div>`).join(''))}

  ${skills.length || langs.length ? sec('Compétences &amp; Langues', `
    <div style="margin-bottom:6px">
      ${skills.map(c =>
        `<span style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;
          border-radius:4px;padding:2px 9px;font-size:11.5px;margin:0 4px 4px 0">${escH(c.nom)}</span>`
      ).join('')}
    </div>
    ${langs.length ? `<div>${langs.map(l =>
      `<span style="display:inline-block;background:#f9fafb;border:1px solid #e5e7eb;
        border-radius:4px;padding:2px 9px;font-size:11.5px;margin:0 4px 4px 0">
        ${escH(l.langue)} <span style="color:#6b7280">(${escH(l.niveau)})</span></span>`
    ).join('')}</div>` : ''}
  `) : ''}
</div>`;
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE : CRÉATIF  (bande latérale bleue)
═══════════════════════════════════════════════════════════ */
function cbTplCreatif() {
  const nom    = escH((CB.prenom + ' ' + CB.nom).trim()) || 'Votre Nom';
  const titre  = escH(CB.titre) || 'Poste recherché';

  const exps   = CB.experiences.filter(e => e.poste || e.entreprise);
  const forms  = CB.formations.filter(f => f.diplome || f.etablissement);
  const skills = CB.competences.filter(c => c.nom);
  const langs  = CB.langues.filter(l => l.langue);

  const initiales = ((CB.prenom[0] || '?') + (CB.nom[0] || '')).toUpperCase();

  const bar = (n) => [1,2,3,4,5].map(k =>
    `<div style="flex:1;height:5px;border-radius:3px;background:${n>=k?'#60a5fa':'rgba(255,255,255,.15)'}"></div>`
  ).join('');

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;
    color:#1f2937;background:#fff;display:flex;min-height:700px">

  <!-- BANDE GAUCHE -->
  <div style="width:195px;flex-shrink:0;background:#1e3a5f;padding:26px 18px;color:#fff">

    <div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.15);
      display:flex;align-items:center;justify-content:center;
      font-size:20px;font-weight:700;margin:0 auto 18px;letter-spacing:-1px">${initiales}</div>

    ${CB.email || CB.phone || CB.adresse ? `
    <div style="margin-bottom:18px">
      <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;
        color:#93c5fd;margin-bottom:7px">Contact</div>
      ${CB.email   ? `<div style="font-size:11px;color:#bfdbfe;word-break:break-all;margin-bottom:4px">✉ ${escH(CB.email)}</div>`   : ''}
      ${CB.phone   ? `<div style="font-size:11px;color:#bfdbfe;margin-bottom:4px">📞 ${escH(CB.phone)}</div>`   : ''}
      ${CB.adresse ? `<div style="font-size:11px;color:#bfdbfe">📍 ${escH(CB.adresse)}</div>` : ''}
    </div>` : ''}

    ${skills.length ? `
    <div style="margin-bottom:18px">
      <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;
        color:#93c5fd;margin-bottom:8px">Compétences</div>
      ${skills.map(c => `
        <div style="margin-bottom:8px">
          <div style="font-size:11.5px;color:#e0f2fe;margin-bottom:3px">${escH(c.nom)}</div>
          <div style="display:flex;gap:3px">${bar(c.niveau)}</div>
        </div>`).join('')}
    </div>` : ''}

    ${langs.length ? `
    <div>
      <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;
        color:#93c5fd;margin-bottom:7px">Langues</div>
      ${langs.map(l => `
        <div style="margin-bottom:5px">
          <div style="font-size:11.5px;font-weight:600;color:#e0f2fe">${escH(l.langue)}</div>
          <div style="font-size:10px;color:#93c5fd">${escH(l.niveau)}</div>
        </div>`).join('')}
    </div>` : ''}
  </div>

  <!-- CONTENU PRINCIPAL -->
  <div style="flex:1;padding:26px 26px 26px 22px">

    <div style="margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #e5e7eb">
      <div style="font-size:21px;font-weight:800;color:#111827;letter-spacing:-.4px">${nom}</div>
      <div style="font-size:13.5px;font-weight:600;color:#2563eb;margin-top:3px">${titre}</div>
    </div>

    ${CB.resume ? `
    <div style="margin-bottom:16px">
      <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
        color:#2563eb;margin-bottom:6px">Profil</div>
      <div style="font-size:12.5px;color:#4b5563;line-height:1.6">${escH(CB.resume)}</div>
    </div>` : ''}

    ${exps.length ? `
    <div style="margin-bottom:16px">
      <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
        color:#2563eb;margin-bottom:10px">Expériences</div>
      ${exps.map(e => `
        <div style="margin-bottom:12px;padding-left:12px;border-left:3px solid #2563eb">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <div style="font-size:13px;font-weight:700;color:#111827">${escH(e.poste)}</div>
            ${e.debut ? `<div style="font-size:11px;color:#9ca3af;white-space:nowrap">${escH(e.debut)}${e.fin ? ' – ' + escH(e.fin) : ''}</div>` : ''}
          </div>
          ${e.entreprise ? `<div style="font-size:12px;font-weight:600;color:#2563eb">${escH(e.entreprise)}</div>` : ''}
          ${e.desc ? `<div style="font-size:11.5px;color:#6b7280;margin-top:3px">${escH(e.desc).replace(/\n/g,'<br>')}</div>` : ''}
        </div>`).join('')}
    </div>` : ''}

    ${forms.length ? `
    <div>
      <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
        color:#2563eb;margin-bottom:10px">Formation</div>
      ${forms.map(f => `
        <div style="margin-bottom:9px">
          <div style="font-size:13px;font-weight:700;color:#111827">${escH(f.diplome)}</div>
          ${f.etablissement ? `<div style="font-size:12px;color:#4b5563">${escH(f.etablissement)}</div>` : ''}
          ${f.annee ? `<div style="font-size:11px;color:#9ca3af">${escH(f.annee)}</div>` : ''}
        </div>`).join('')}
    </div>` : ''}
  </div>
</div>`;
}

/* ── PAYMENT TABS ───────────────────────────────────────── */
function cbPayTab(btn, method) {
  CB.payMethod = method;
  document.querySelectorAll('.cb-pay-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* ── PAY ────────────────────────────────────────────────── */
async function cbPay() {
  if (CB_TEST)                  { cbPayTest();    return; }
  if (CB.payMethod === 'paypal') { cbPayPayPal(); return; }

  const btn = document.getElementById('cb-pay-btn');
  const lbl = document.getElementById('cb-pay-lbl');
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = '⏳ Redirection vers le paiement…';

  try {
    CB.orderId = CB.orderId || Date.now();
    const res  = await fetch('/api/create-checkout', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        service: 'cv',
        amount:  8,
        orderId: CB.orderId,
        email:   CB.email,
        prenom:  CB.prenom,
        nom:     CB.nom
      })
    });
    const data = await res.json();
    if (!data.ok || !data.url) throw new Error(data.error || 'Erreur paiement');
    location.href = data.url;
  } catch(err) {
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = '🔒 Payer 8€ et obtenir mon CV sans filigrane';
    const errEl = document.createElement('p');
    errEl.style.cssText = 'color:#ef4444;font-size:.82rem;text-align:center;margin:.5rem 0 0';
    errEl.textContent = 'Erreur : ' + err.message;
    document.getElementById('cb-pay-btn')?.insertAdjacentElement('afterend', errEl);
  }
}

function cbPayPayPal() {
  CB.orderId = CB.orderId || Date.now();
  const params = new URLSearchParams({
    cmd:           '_xclick',
    business:      CB_PAYPAL_EMAIL,
    amount:        '8',
    currency_code: 'EUR',
    item_name:     "Dok'péyi — CV Professionnel",
    return:        location.origin + '/cv-builder?success=1&order_id=' + CB.orderId,
    cancel_return: location.origin + '/cv-builder'
  });
  location.href = 'https://www.paypal.com/cgi-bin/webscr?' + params;
}

function cbPayTest() {
  CB.paid    = true;
  CB.orderId = CB.orderId || Date.now();
  cbShowPaid();
}

function cbShowPaid() {
  const wm   = document.getElementById('cb-watermark');
  const pBtn = document.getElementById('cb-print-btn');
  const pay  = document.getElementById('cb-pay-btn');
  const tabs = document.getElementById('cb-pay-tabs');
  if (wm)   wm.className = 'cb-watermark hidden';
  if (pBtn) pBtn.classList.add('visible');
  if (pay)  pay.style.display  = 'none';
  if (tabs) tabs.style.display = 'none';
  cbRender();
}

/* ── PDF ────────────────────────────────────────────────── */
function cbPrint() {
  window.print();
}
