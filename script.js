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
  cvFileData: null   // { name, type, size, data: 'data:...base64...' }
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
  if (!validateStep(step)) return;

  // Sauvegarde des données
  if (step === 1) {
    state.prenom   = document.getElementById('f-prenom').value.trim();
    state.nom      = document.getElementById('f-nom').value.trim();
    state.email    = document.getElementById('f-email').value.trim();
    const _prefix = (document.getElementById('f-prefix') || {}).value || '+594';
    const _num    = document.getElementById('f-whatsapp').value.trim();
    state.whatsapp = _num ? _prefix.replace(/-CA/, '') + ' ' + _num : '';
  }
  if (step === 3) saveDetails();

  const next = step + 1;
  if (next === 3) buildDynamicFields();
  if (next === 4) buildRecap();

  showStep(next);
}

function goPrev(step) {
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
    // Vérifier le premier champ obligatoire
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
  cv: {
    title: 'Informations pour ton CV',
    fields: [
      { id: 'cv-poste',   label: 'Poste recherché *', type: 'text', placeholder: 'Ex: Agent d\'entretien, Caissier(e), Chauffeur…', required: true },
      { id: 'cv-experience', label: 'Tes expériences professionnelles', type: 'textarea', placeholder: 'Décris tes emplois, stages, bénévolat…' },
      { id: 'cv-formation',  label: 'Tes formations / diplômes',        type: 'textarea', placeholder: 'Ex: BEP Commerce, CAP, Bac Pro…' },
      { id: 'cv-competences',label: 'Tes compétences',                   type: 'textarea', placeholder: 'Ex: Permis B, maîtrise Word, langues parlées…' },
      { id: 'cv-infos',      label: 'Informations supplémentaires',      type: 'textarea', placeholder: 'Centres d\'intérêt, informations à ajouter…' },
      { id: 'cv-fichier', label: 'Ton CV actuel (optionnel)', type: 'file', accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png', hint: 'PDF, Word ou image — max 3 Mo. Sinon laisse vide, on en crée un nouveau.' }
    ]
  },
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

function saveDetails() {
  const config = FIELD_CONFIGS[state.service];
  if (!config) return;
  state.details = {};
  config.fields.forEach(f => {
    if (f.type === 'file') return; // géré séparément via state.cvFileData
    const el = document.getElementById(f.id);
    if (el) state.details[f.id] = el.value;
  });
  // Inclure le fichier CV si uploadé
  if (state.cvFileData) state.details['cv-fichier'] = state.cvFileData;
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
        ville:   '',
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
