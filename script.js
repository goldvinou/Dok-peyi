/* ============================================================
   DOK'PÉYI — Script principal
   ============================================================ */

// ===== ÉTAT GLOBAL =====
const state = {
  step:       1,
  prenom:     '',
  nom:        '',
  email:      '',
  whatsapp:   '',
  service:    null,
  details:    {},
  payMethod:  'card',
  cvFileData: null,
  cvChoix:    null,
  cvSubStep:  1
};

const PRICES = {
  cv:      8,
  lettre:  5,
  dossier: 12,
  courrier: 7
};

const SERVICE_NAMES = {
  cv:      'CV Professionnel',
  lettre:  'Lettre de motivation',
  dossier: 'Dossier administratif',
  courrier: 'Courrier officiel'
};

/* ============================================================
   NAVIGATION ENTRE ÉTAPES
   ============================================================ */
function goNext(step) {
  if (step === 1) {
    const prenom = document.getElementById('f-prenom');
    const nom    = document.getElementById('f-nom');
    const email  = document.getElementById('f-email');
    if (!prenom.value.trim()) { markError(prenom); return; }
    if (!nom.value.trim())    { markError(nom);    return; }
    if (!email.value.trim() || !email.value.includes('@')) { markError(email); return; }
    state.prenom   = prenom.value.trim();
    state.nom      = nom.value.trim();
    state.email    = email.value.trim();
    const _prefix = (document.getElementById('f-prefix') || {}).value || '+594';
    const _num    = document.getElementById('f-whatsapp').value.trim();
    state.whatsapp = _num ? _prefix.replace(/-CA/, '') + ' ' + _num : '';
    showStep(2);
    return;
  }
  if (step === 2) {
    if (!state.service) {
      const grid = document.getElementById('serviceGrid');
      grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 500);
      return;
    }
    buildDynamicFields();
    showStep(3);
    return;
  }
  if (step === 3) {
    if (state.service === 'cv') {
      if (!state.cvChoix) {
        const ph = document.getElementById('cv-phase-choice');
        if (ph) { ph.classList.add('shake'); setTimeout(() => ph.classList.remove('shake'), 500); }
        return;
      }
      if (state.cvChoix === 'scratch') {
        if (!validateCVSubStep(state.cvSubStep)) return;
        if (state.cvSubStep < 4) { showCVSubStep(state.cvSubStep + 1); return; }
        saveDetails(); buildRecap(); showStep(4); return;
      }
      if (state.cvChoix === 'improve') {
        if (!state.cvFileData) {
          const z = document.getElementById('cv-fichier-zone');
          if (z) { z.classList.add('shake'); setTimeout(() => z.classList.remove('shake'), 500); }
          return;
        }
        const note = document.getElementById('cv-note');
        if (note && !note.value.trim()) { markError(note); return; }
        saveDetails(); buildRecap(); showStep(4); return;
      }
    } else {
      const firstReq = document.querySelector('#dynamic-fields [required]');
      if (firstReq && !firstReq.value.trim()) { markError(firstReq); return; }
      saveDetails(); buildRecap(); showStep(4); return;
    }
  }
}

function goPrev(step) {
  if (step === 3 && state.service === 'cv') {
    if (state.cvChoix === 'scratch' && state.cvSubStep > 1) {
      showCVSubStep(state.cvSubStep - 1); return;
    }
    if (state.cvChoix) { resetCVChoice(); return; }
  }
  showStep(step - 1);
}

function showStep(n) {
  // Cacher l'étape actuelle
  const current = document.querySelector('.form-step.active');
  if (current) current.classList.remove('active');

  // Afficher la nouvelle étape
  const target = document.getElementById(`step-${n}`);
  if (target) {
    target.classList.add('active');
    state.step = n;
  }

  // Mettre à jour la barre de progression (sauf étape 5)
  if (n <= 4) updateProgress(n);

  // Pré-sélectionner le service si déjà choisi
  if (n === 2 && state.service) applyServiceSelection();

  // Scroll vers le formulaire
  const section = document.getElementById('demande');
  if (section) {
    window.scrollTo({ top: section.offsetTop - 90, behavior: 'smooth' });
  }
}

function updateProgress(activeStep) {
  const steps = document.querySelectorAll('.prog-step');
  const lines = document.querySelectorAll('.prog-line');

  steps.forEach((el, i) => {
    const n = i + 1;
    el.classList.remove('active', 'done');
    const span = el.querySelector('span');
    if (n < activeStep) {
      el.classList.add('done');
      span.textContent = '✓';
    } else if (n === activeStep) {
      el.classList.add('active');
      span.textContent = n;
    } else {
      span.textContent = n;
    }
  });

  lines.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < activeStep);
  });
}

/* ============================================================
   VALIDATION
   ============================================================ */
function validateStep(step) {
  if (step === 1) {
    const prenom = document.getElementById('f-prenom');
    const nom    = document.getElementById('f-nom');
    const email  = document.getElementById('f-email');
    if (!prenom.value.trim()) { markError(prenom); return false; }
    if (!nom.value.trim())    { markError(nom);    return false; }
    if (!email.value.trim() || !email.value.includes('@')) { markError(email); return false; }
  }
  if (step === 2 && !state.service) {
    const grid = document.getElementById('serviceGrid');
    grid.classList.add('shake');
    setTimeout(() => grid.classList.remove('shake'), 500);
    return false;
  }
  if (step === 3) {
    if (state.service === 'cv') {
      if (!state.cvChoix) {
        const cards = document.querySelector('.cv-path-cards');
        if (cards) { cards.classList.add('shake'); setTimeout(() => cards.classList.remove('shake'), 500); }
        return false;
      }
      if (state.cvChoix === 'scratch') {
        const poste = document.getElementById('cv-poste');
        if (poste && !poste.value.trim()) { markError(poste); return false; }
      }
      if (state.cvChoix === 'improve') {
        if (!state.cvFileData) {
          const zone = document.getElementById('cv-fichier-zone');
          if (zone) { zone.classList.add('shake'); setTimeout(() => zone.classList.remove('shake'), 500); }
          return false;
        }
        const note = document.getElementById('cv-note');
        if (note && !note.value.trim()) { markError(note); return false; }
      }
      return true;
    }
    const firstRequired = document.querySelector('#dynamic-fields input[required], #dynamic-fields textarea[required]');
    if (firstRequired && !firstRequired.value.trim()) {
      markError(firstRequired);
      return false;
    }
  }
  return true;
}

function markError(el) {
  el.classList.add('error', 'shake');
  el.focus();
  setTimeout(() => el.classList.remove('shake', 'error'), 1200);
}

/* ============================================================
   SÉLECTION DU SERVICE
   ============================================================ */
function pickService(el) {
  document.querySelectorAll('.service-choice').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.service = el.dataset.val;
  document.getElementById('btn-step2-next').disabled = false;
}

function applyServiceSelection() {
  if (!state.service) return;
  const choice = document.querySelector(`.service-choice[data-val="${state.service}"]`);
  if (choice) {
    document.querySelectorAll('.service-choice').forEach(c => c.classList.remove('selected'));
    choice.classList.add('selected');
    document.getElementById('btn-step2-next').disabled = false;
  }
}

/* ============================================================
   CHAMPS DYNAMIQUES (ÉTAPE 3)
   ============================================================ */
const FIELD_CONFIGS = {
  cv: { title: 'Ton CV' },
  lettre: {
    title: 'Informations pour ta lettre de motivation',
    fields: [
      { id: 'l-poste', label: 'Poste visé *', type: 'text', placeholder: 'Ex: Vendeur(se) chez Leclerc Cayenne', required: true },
      { id: 'l-entreprise', label: 'Nom de l\'entreprise / organisme', type: 'text', placeholder: 'Ex: Leclerc Cayenne, Mairie de Kourou…' },
      { id: 'l-experience', label: 'Ton expérience en rapport avec ce poste', type: 'textarea', placeholder: 'Ce que tu as déjà fait en lien avec ce travail' },
      { id: 'l-motivation', label: 'Pourquoi ce poste t\'intéresse ?', type: 'textarea', placeholder: 'Ce qui te motive dans cette offre ou ce domaine' }
    ]
  },
  dossier: {
    title: 'Ton dossier administratif',
    fields: [
      {
        id: 'd-type', label: 'Type de dossier *', type: 'select', required: true,
        options: ['CAF / Aide sociale', 'Dossier logement (HLM)', 'Pôle Emploi / France Travail', 'Préfecture / Titre de séjour', 'Dossier scolaire / bourse', 'Autre']
      },
      { id: 'd-description', label: 'Décris ton besoin *', type: 'textarea', placeholder: 'Qu\'est-ce que tu essaies d\'obtenir ou de faire ?', required: true },
      { id: 'd-documents', label: 'Documents que tu as déjà', type: 'textarea', placeholder: 'Ex: Pièce d\'identité, justificatif de domicile, bulletins de salaire…' }
    ]
  },
  courrier: {
    title: 'Ton courrier officiel',
    fields: [
      { id: 'c-destinataire', label: 'Destinataire *', type: 'text', placeholder: 'Ex: Mairie de Cayenne, Préfecture de Guyane…', required: true },
      { id: 'c-objet', label: 'Objet du courrier *', type: 'text', placeholder: 'Ex: Demande de réclamation, signalement de problème…', required: true },
      { id: 'c-description', label: 'Décris ce que tu veux dire *', type: 'textarea', placeholder: 'Explique ta situation et ce que tu demandes', required: true }
    ]
  }
};

function buildDynamicFields() {
  const config = FIELD_CONFIGS[state.service];
  if (!config) return;

  document.getElementById('step3-title').textContent = config.title;
  const container = document.getElementById('dynamic-fields');
  container.innerHTML = '';

  if (state.service === 'cv') { buildCVFields(container); return; }

  for (const f of config.fields) {
    const group = document.createElement('div');
    group.className = 'form-group';

    // Champ upload fichier — traitement spécial
    if (f.type === 'file') {
      group.innerHTML = `
        <label>${f.label}</label>
        <div class="file-drop-zone" id="${f.id}-zone" onclick="document.getElementById('${f.id}').click()">
          <input type="file" id="${f.id}" accept="${f.accept}" style="display:none" onchange="handleCVFile(this,'${f.id}')">
          <div class="file-drop-inner">
            <div class="file-drop-icon">📎</div>
            <div class="file-drop-text">Clique pour télécharger ton CV</div>
            <div class="file-drop-hint">${f.hint || ''}</div>
          </div>
          <div class="file-chosen" id="${f.id}-chosen" style="display:none">
            <span class="file-chosen-icon">📄</span>
            <span id="${f.id}-chosen-name" class="file-chosen-name"></span>
            <button type="button" class="file-chosen-remove" onclick="event.stopPropagation();removeCVFile('${f.id}')">✕</button>
          </div>
        </div>`;
      container.appendChild(group);
      continue;
    }

    const label = document.createElement('label');
    label.htmlFor = f.id;
    label.textContent = f.label;
    group.appendChild(label);

    let el;
    if (f.type === 'select') {
      el = document.createElement('select');
      el.id = f.id;
      f.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        el.appendChild(option);
      });
    } else if (f.type === 'textarea') {
      el = document.createElement('textarea');
      el.id = f.id;
      el.placeholder = f.placeholder || '';
      el.rows = 3;
    } else {
      el = document.createElement('input');
      el.type = f.type;
      el.id = f.id;
      el.placeholder = f.placeholder || '';
    }

    if (f.required) el.required = true;
    group.appendChild(el);
    container.appendChild(group);
  }
}

function buildCVFields(container) {
  const tr = (typeof getTrans === 'function') ? getTrans() : {};
  const SECTEURS  = ['Commerce','Restauration & Hôtellerie','BTP & Travaux','Santé & Social','Administration & Bureautique','Transport & Logistique','Agriculture & Environnement','Éducation & Formation','Informatique & Tech','Autre'];
  const NIVEAUX   = ['Sans diplôme','CAP - BEP','BAC','BAC+2 (BTS, DUT)','BAC+3 (Licence)','BAC+4 (Master 1)','BAC+5 et plus','Formation professionnelle'];
  const LANGUES   = ['Français','Créole guyanais','Anglais','Espagnol','Portugais','Brésilien','Haïtien','Mandarin','Autre'];
  const DISPOS    = ['Immédiatement','Dans 1 mois','Dans 2 à 3 mois','À définir'];

  container.innerHTML = `
    <!-- Phase choix -->
    <div id="cv-phase-choice">
      <p class="cv-path-label">Que veux-tu faire ?</p>
      <div class="cv-path-cards">
        <div class="cv-path-card" id="cv-card-scratch" onclick="setCVChoice('scratch')">
          <div class="cv-path-icon">✏️</div>
          <div class="cv-path-title">Créer mon CV de A à Z</div>
          <div class="cv-path-desc">Tu remplis tes infos, on crée un CV professionnel complet</div>
        </div>
        <div class="cv-path-card" id="cv-card-improve" onclick="setCVChoice('improve')">
          <div class="cv-path-icon">✨</div>
          <div class="cv-path-title">Améliorer mon CV existant</div>
          <div class="cv-path-desc">Tu joins ton CV + tu expliques ce que tu veux changer</div>
        </div>
      </div>
    </div>

    <!-- Phase scratch : 4 sous-étapes -->
    <div id="cv-phase-scratch" style="display:none">
      <div class="cv-sub-progress">
        <div class="cv-sub-dot active" id="cvdot-1"><span>1</span><p>${tr.cv_step1_short||'Profil'}</p></div>
        <div class="cv-sub-line" id="cvline-1"></div>
        <div class="cv-sub-dot" id="cvdot-2"><span>2</span><p>${tr.cv_step2_short||'Objectif'}</p></div>
        <div class="cv-sub-line" id="cvline-2"></div>
        <div class="cv-sub-dot" id="cvdot-3"><span>3</span><p>${tr.cv_step3_short||'Parcours'}</p></div>
        <div class="cv-sub-line" id="cvline-3"></div>
        <div class="cv-sub-dot" id="cvdot-4"><span>4</span><p>${tr.cv_step4_short||'Finitions'}</p></div>
      </div>

      <div class="cv-sub-panel" id="cv-sub-1">
        <h4 class="cv-sub-title">${tr.cv_step1_title||'Qui êtes-vous ?'}</h4>
        <div class="form-group">
          <label for="cv-ville">${tr.cv_ville_label||'Ville / Commune'} *</label>
          <input type="text" id="cv-ville" placeholder="Ex: Cayenne, Kourou, Saint-Laurent…">
        </div>
        <div class="form-group">
          <label for="cv-disponibilite">${tr.cv_dispo_label||'Disponibilité'} *</label>
          <select id="cv-disponibilite">
            <option value="">— Choisir —</option>
            ${DISPOS.map(d=>`<option>${d}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="cv-sub-panel" id="cv-sub-2" style="display:none">
        <h4 class="cv-sub-title">${tr.cv_step2_title||'Votre objectif'}</h4>
        <div class="form-group">
          <label for="cv-poste">Poste recherché *</label>
          <input type="text" id="cv-poste" placeholder="Ex: Caissier(e), Agent d'entretien, Chauffeur…">
        </div>
        <div class="form-group">
          <label for="cv-secteur">${tr.cv_secteur_label||"Secteur d'activité"} *</label>
          <select id="cv-secteur">
            <option value="">— Choisir —</option>
            ${SECTEURS.map(s=>`<option>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="cv-niveau-etudes">${tr.cv_niveau_label||"Niveau d'études"} *</label>
          <select id="cv-niveau-etudes">
            <option value="">— Choisir —</option>
            ${NIVEAUX.map(n=>`<option>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${tr.cv_permis_label||'Permis de conduire'} *</label>
          <div class="radio-pills" id="cv-permis-group">
            <label class="radio-pill"><input type="radio" name="cv-permis" value="Oui"><span>Oui</span></label>
            <label class="radio-pill"><input type="radio" name="cv-permis" value="Non"><span>Non</span></label>
          </div>
        </div>
      </div>

      <div class="cv-sub-panel" id="cv-sub-3" style="display:none">
        <h4 class="cv-sub-title">${tr.cv_step3_title||'Votre parcours'}</h4>
        <div class="form-group">
          <label for="cv-experience">Expériences professionnelles</label>
          <textarea id="cv-experience" placeholder="Emplois, stages, bénévolat, missions…" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label for="cv-formation">Formation / Diplômes</label>
          <textarea id="cv-formation" placeholder="Ex: BEP Commerce, CAP, Bac Pro…" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="cv-competences">Compétences clés</label>
          <textarea id="cv-competences" placeholder="Maîtrise Word, travail en équipe, service client…" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>${tr.cv_langues_label||'Langues parlées'} * <span class="optional">(min. 1)</span></label>
          <div class="lang-pills" id="cv-langues-pills">
            ${LANGUES.map(l=>`<label class="lang-pill"><input type="checkbox" class="lang-pill-input" value="${l}"><span>${l}</span></label>`).join('')}
          </div>
        </div>
      </div>

      <div class="cv-sub-panel" id="cv-sub-4" style="display:none">
        <h4 class="cv-sub-title">${tr.cv_step4_title||'Derniers détails'}</h4>
        <div class="form-group">
          <label for="cv-infos">Informations supplémentaires <span class="optional">(optionnel)</span></label>
          <textarea id="cv-infos" placeholder="Centres d'intérêt, associations, autres infos…" rows="3"></textarea>
        </div>
        <div class="cv-recap-mini" id="cv-recap-mini"></div>
      </div>
    </div>

    <!-- Phase améliorer -->
    <div id="cv-phase-improve" style="display:none">
      <div class="form-group">
        <label>Ton CV actuel *</label>
        <div class="file-drop-zone" id="cv-fichier-zone" onclick="document.getElementById('cv-fichier').click()">
          <input type="file" id="cv-fichier" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display:none" onchange="handleCVFile(this,'cv-fichier')">
          <div class="file-drop-inner">
            <div class="file-drop-icon">📎</div>
            <div class="file-drop-text">Clique pour joindre ton CV</div>
            <div class="file-drop-hint">PDF, Word ou image — max 3 Mo</div>
          </div>
          <div class="file-chosen" id="cv-fichier-chosen" style="display:none">
            <span class="file-chosen-icon">📄</span>
            <span id="cv-fichier-chosen-name" class="file-chosen-name"></span>
            <button type="button" class="file-chosen-remove" onclick="event.stopPropagation();removeCVFile('cv-fichier')">✕</button>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="cv-note">Ce que tu veux changer *</label>
        <textarea id="cv-note" placeholder="Ex: Moderniser le design, reformuler mes expériences, le rendre plus professionnel…" rows="4"></textarea>
      </div>
    </div>
  `;
  if (state.cvChoix) setCVChoice(state.cvChoix);
}

function setCVChoice(choice) {
  state.cvChoix   = choice;
  state.cvSubStep = 1;
  const phChoice  = document.getElementById('cv-phase-choice');
  const phScratch = document.getElementById('cv-phase-scratch');
  const phImprove = document.getElementById('cv-phase-improve');
  if (phChoice)  phChoice.style.display  = choice ? 'none' : '';
  if (phScratch) phScratch.style.display = choice === 'scratch' ? '' : 'none';
  if (phImprove) phImprove.style.display = choice === 'improve' ? '' : 'none';
  if (choice === 'scratch') showCVSubStep(1);
  const titleEl = document.getElementById('step3-title');
  if (titleEl) {
    if (choice === 'scratch') titleEl.textContent = '✏️ Créer mon CV';
    else if (choice === 'improve') titleEl.textContent = '✨ Améliorer mon CV';
    else titleEl.textContent = 'Ton CV';
  }
}

function resetCVChoice() {
  state.cvChoix   = null;
  state.cvSubStep = 1;
  const phChoice  = document.getElementById('cv-phase-choice');
  const phScratch = document.getElementById('cv-phase-scratch');
  const phImprove = document.getElementById('cv-phase-improve');
  if (phChoice)  phChoice.style.display  = '';
  if (phScratch) phScratch.style.display = 'none';
  if (phImprove) phImprove.style.display = 'none';
  const titleEl = document.getElementById('step3-title');
  if (titleEl) titleEl.textContent = 'Ton CV';
}

function showCVSubStep(n) {
  state.cvSubStep = n;
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById('cv-sub-' + i);
    if (panel) panel.style.display = i === n ? '' : 'none';
    const dot = document.getElementById('cvdot-' + i);
    if (dot) {
      dot.classList.remove('active', 'done');
      if (i < n)      dot.classList.add('done');
      else if (i === n) dot.classList.add('active');
    }
    if (i < 4) {
      const line = document.getElementById('cvline-' + i);
      if (line) line.classList.toggle('done', i < n);
    }
  }
  if (n === 4) updateCVRecapMini();
}

function validateCVSubStep(n) {
  if (n === 1) {
    const ville = document.getElementById('cv-ville');
    const dispo = document.getElementById('cv-disponibilite');
    if (!ville || !ville.value.trim()) { if (ville) markError(ville); return false; }
    if (!dispo || !dispo.value)        { if (dispo) markError(dispo); return false; }
    return true;
  }
  if (n === 2) {
    const poste  = document.getElementById('cv-poste');
    const secteur = document.getElementById('cv-secteur');
    const niveau  = document.getElementById('cv-niveau-etudes');
    const permis  = document.querySelector('[name="cv-permis"]:checked');
    if (!poste  || !poste.value.trim())  { if (poste)  markError(poste);  return false; }
    if (!secteur || !secteur.value)      { if (secteur) markError(secteur); return false; }
    if (!niveau  || !niveau.value)       { if (niveau)  markError(niveau);  return false; }
    if (!permis) {
      const pg = document.getElementById('cv-permis-group');
      if (pg) { pg.classList.add('shake'); setTimeout(() => pg.classList.remove('shake'), 500); }
      return false;
    }
    return true;
  }
  if (n === 3) {
    const langues = document.querySelectorAll('.lang-pill-input:checked');
    if (langues.length === 0) {
      const lp = document.getElementById('cv-langues-pills');
      if (lp) { lp.classList.add('shake'); setTimeout(() => lp.classList.remove('shake'), 500); }
      return false;
    }
    return true;
  }
  return true;
}

function updateCVRecapMini() {
  const el = document.getElementById('cv-recap-mini');
  if (!el) return;
  const get = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  const langues = [...document.querySelectorAll('.lang-pill-input:checked')].map(c => c.value);
  const permis  = (document.querySelector('[name="cv-permis"]:checked') || {}).value || '—';
  el.innerHTML = `
    <div class="cv-recap-grid">
      <div class="cv-recap-item"><span class="cv-recap-key">Ville</span><span class="cv-recap-val">${escHtml(get('cv-ville')||'—')}</span></div>
      <div class="cv-recap-item"><span class="cv-recap-key">Disponibilité</span><span class="cv-recap-val">${escHtml(get('cv-disponibilite')||'—')}</span></div>
      <div class="cv-recap-item"><span class="cv-recap-key">Poste</span><span class="cv-recap-val">${escHtml(get('cv-poste')||'—')}</span></div>
      <div class="cv-recap-item"><span class="cv-recap-key">Secteur</span><span class="cv-recap-val">${escHtml(get('cv-secteur')||'—')}</span></div>
      <div class="cv-recap-item"><span class="cv-recap-key">Niveau études</span><span class="cv-recap-val">${escHtml(get('cv-niveau-etudes')||'—')}</span></div>
      <div class="cv-recap-item"><span class="cv-recap-key">Permis</span><span class="cv-recap-val">${escHtml(permis)}</span></div>
      <div class="cv-recap-item cv-recap-full"><span class="cv-recap-key">Langues</span><span class="cv-recap-val">${escHtml(langues.join(', ')||'—')}</span></div>
    </div>`;
}

function saveDetails() {
  if (state.service === 'cv') {
    state.details = { 'cv-choix': state.cvChoix || 'scratch' };
    if (state.cvChoix === 'improve') {
      state.details['cv-note'] = (document.getElementById('cv-note') || {}).value || '';
      if (state.cvFileData) state.details['cv-fichier'] = state.cvFileData;
    } else {
      ['cv-ville','cv-disponibilite','cv-poste','cv-secteur','cv-niveau-etudes',
       'cv-experience','cv-formation','cv-competences','cv-infos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) state.details[id] = el.value;
      });
      // Langues (checkboxes)
      const langues = [...document.querySelectorAll('.lang-pill-input:checked')].map(c => c.value);
      state.details['cv-langues'] = langues.join(', ');
      // Permis (radio)
      const permisEl = document.querySelector('[name="cv-permis"]:checked');
      state.details['cv-permis'] = permisEl ? permisEl.value : '';
    }
    return;
  }
  const config = FIELD_CONFIGS[state.service];
  if (!config) return;
  state.details = {};
  config.fields.forEach(f => {
    if (f.type === 'file') return;
    const el = document.getElementById(f.id);
    if (el) state.details[f.id] = el.value;
  });
}

/* Gestion upload CV */
function handleCVFile(input, fieldId) {
  const file = input.files[0];
  if (!file) return;
  const MAX = 3 * 1024 * 1024; // 3 Mo
  if (file.size > MAX) {
    alert('Fichier trop grand (max 3 Mo). Essaie de compresser ton PDF.');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    state.cvFileData = { name: file.name, type: file.type, size: file.size, data: e.target.result };
    const chosen     = document.getElementById(fieldId + '-chosen');
    const chosenName = document.getElementById(fieldId + '-chosen-name');
    const zone       = document.getElementById(fieldId + '-zone');
    if (chosenName) chosenName.textContent = file.name;
    if (chosen)  chosen.style.display  = 'flex';
    if (zone)    zone.querySelector('.file-drop-inner').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeCVFile(fieldId) {
  state.cvFileData = null;
  const input      = document.getElementById(fieldId);
  const chosen     = document.getElementById(fieldId + '-chosen');
  const zone       = document.getElementById(fieldId + '-zone');
  if (input)   input.value = '';
  if (chosen)  chosen.style.display = 'none';
  if (zone)    zone.querySelector('.file-drop-inner').style.display = 'flex';
}

/* ============================================================
   RÉCAPITULATIF (ÉTAPE 4)
   ============================================================ */
function buildRecap() {
  const recap = document.getElementById('recap');
  const price = PRICES[state.service] || '—';
  const name  = SERVICE_NAMES[state.service] || '—';

  recap.innerHTML = `
    <div class="recap-row"><span>Nom</span><span>${escHtml(state.prenom)} ${escHtml(state.nom)}</span></div>
    <div class="recap-row"><span>Email</span><span>${escHtml(state.email)}</span></div>
    <div class="recap-row"><span>Service</span><span>${escHtml(name)}</span></div>
    <div class="recap-row"><span>Total à payer</span><span>${price}€</span></div>
  `;

  document.getElementById('pay-label').textContent = `Payer ${price}€ et recevoir mon document`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   PAIEMENT (ÉTAPE 4)
   ============================================================ */
function switchTab(btn, type) {
  document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  state.payMethod = type;
  document.getElementById('pay-card').classList.toggle('hidden', type !== 'card');
  document.getElementById('pay-paypal').classList.toggle('hidden', type !== 'paypal');
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

function processPayment() {
  // Validation carte
  if (state.payMethod === 'card') {
    const num = (document.getElementById('card-num').value || '').replace(/\s/g, '');
    const exp = (document.getElementById('card-exp').value || '');
    const cvv = (document.getElementById('card-cvv').value || '');
    if (num.length < 16 || !exp.includes('/') || cvv.length < 3) {
      alert('Merci de compléter correctement les informations de ta carte bancaire.');
      return;
    }
  }

  // Afficher le spinner
  const btn = document.getElementById('btn-pay');
  btn.disabled = true;
  document.getElementById('pay-label').classList.add('hidden');
  document.getElementById('pay-spinner').classList.remove('hidden');

  // Simuler le traitement (2 s)
  setTimeout(() => {
    // Sauvegarder la demande pour l'admin
    try {
      const _now = new Date();
      const _pad = n => String(n).padStart(2, '0');
      const _id  = Date.now();

      // Extraire le fichier CV pour le stocker séparément (éviter quota 5 Mo)
      const _details = Object.assign({}, state.details || {});
      if (_details['cv-fichier'] && _details['cv-fichier'].data) {
        const _fileKey = 'dok_cv_' + _id;
        try { localStorage.setItem(_fileKey, _details['cv-fichier'].data); } catch(e) {}
        _details['cv-fichier'] = {
          name: _details['cv-fichier'].name,
          type: _details['cv-fichier'].type,
          size: _details['cv-fichier'].size,
          key:  _fileKey
        };
      }

      const newDemande = {
        id:      _id,
        date:    _now.toISOString().split('T')[0],
        heure:   _pad(_now.getHours()) + ':' + _pad(_now.getMinutes()),
        prenom:  state.prenom,
        nom:     state.nom,
        email:   state.email,
        whatsapp:state.whatsapp || '',
        ville:   state.details['cv-ville'] || '',
        service: state.service,
        montant: PRICES[state.service] || 0,
        statut:  'en_attente',
        details: _details,
        note:    ''
      };
      const existing = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
      existing.unshift(newDemande);
      localStorage.setItem('dok_demandes', JSON.stringify(existing));
    } catch(e) {}

    showConfirmation();
  }, 2000);
}

function showConfirmation() {
  // Masquer la progression
  document.querySelector('.progress-bar').style.display = 'none';

  // Afficher l'étape 5
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  const step5 = document.getElementById('step-5');
  step5.classList.add('active');

  document.getElementById('s-name').textContent  = state.prenom;
  document.getElementById('s-email').textContent = state.email;

  const section = document.getElementById('demande');
  if (section) window.scrollTo({ top: section.offsetTop - 90, behavior: 'smooth' });
}

/* ============================================================
   RÉINITIALISATION
   ============================================================ */
function resetForm() {
  // Réinitialiser l'état
  state.step      = 1;
  state.prenom    = '';
  state.nom       = '';
  state.email     = '';
  state.whatsapp  = '';
  state.service    = null;
  state.details    = {};
  state.payMethod  = 'card';
  state.cvFileData = null;
  state.cvChoix   = null;
  state.cvSubStep = 1;

  // Réinitialiser le formulaire HTML
  document.getElementById('mainForm').reset();

  // Réinitialiser les choix de service
  document.querySelectorAll('.service-choice').forEach(c => c.classList.remove('selected'));
  document.getElementById('btn-step2-next').disabled = true;

  // Réinitialiser le bouton de paiement
  const btnPay = document.getElementById('btn-pay');
  btnPay.disabled = false;
  document.getElementById('pay-label').classList.remove('hidden');
  document.getElementById('pay-spinner').classList.add('hidden');

  // Ré-afficher la progression
  document.querySelector('.progress-bar').style.display = '';

  // Onglet carte par défaut
  document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.pay-tab').classList.add('active');
  document.getElementById('pay-card').classList.remove('hidden');
  document.getElementById('pay-paypal').classList.add('hidden');

  // Retour à l'étape 1
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  updateProgress(1);

  const section = document.getElementById('demande');
  if (section) window.scrollTo({ top: section.offsetTop - 90, behavior: 'smooth' });
}

/* ============================================================
   MENU HAMBURGER
   ============================================================ */
(function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    const [s1, s2, s3] = btn.querySelectorAll('span');
    if (open) {
      s1.style.transform = 'rotate(45deg) translate(5px, 5px)';
      s2.style.opacity   = '0';
      s3.style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      s1.style.transform = '';
      s2.style.opacity   = '';
      s3.style.transform = '';
    }
  });

  // Fermer au clic sur un lien
  menu.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      const [s1, s2, s3] = btn.querySelectorAll('span');
      s1.style.transform = '';
      s2.style.opacity   = '';
      s3.style.transform = '';
    });
  });
})();

/* ============================================================
   OMBRE NAVBAR AU SCROLL
   ============================================================ */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.style.boxShadow = window.scrollY > 10
    ? '0 4px 24px rgba(0,0,0,.08)'
    : '';
}, { passive: true });

/* ============================================================
   PRÉ-SÉLECTION DEPUIS LES BOUTONS EXTERNES
   ============================================================ */
document.querySelectorAll('[data-service]').forEach(el => {
  el.addEventListener('click', () => {
    const svc = el.dataset.service;
    if (!svc) return;
    state.service = svc;
    // S'applique quand l'étape 2 sera affichée
    setTimeout(applyServiceSelection, 80);
  });
});

/* ============================================================
   ANIMATIONS D'APPARITION AU SCROLL
   ============================================================ */
(function initReveal() {
  const targets = document.querySelectorAll('.card, .step, .advantage, .testimonial');
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
})();
