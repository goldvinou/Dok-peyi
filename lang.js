/* ============================================================
   DOK'PÉYI — Language System
   Langues des communautés immigrées en Guyane
   ============================================================ */

/* ===== CONFIGURATION DES LANGUES ===== */
const LANGS = [
  { code: 'fr', flag: '🇫🇷', name: 'Français',         native: 'France · Guyane',   dir: 'ltr' },
  { code: 'pt', flag: '🇧🇷', name: 'Português',        native: 'Brasil',             dir: 'ltr' },
  { code: 'ht', flag: '🇭🇹', name: 'Kreyòl ayisyen',  native: 'Ayiti',              dir: 'ltr' },
  { code: 'nl', flag: '🇸🇷', name: 'Nederlands',       native: 'Surinam',            dir: 'ltr' },
  { code: 'ar', flag: '🇸🇾', name: 'العربية',          native: 'سوريا · Syrie',      dir: 'rtl' },
];

/* ===== TRADUCTIONS ===== */
const T = {

  /* ─────────── FRANÇAIS (défaut) ─────────── */
  fr: {
    nav_comment: 'Comment ça marche',
    nav_services: 'Services',
    nav_tarifs: 'Tarifs',
    nav_cta: 'Faire ma demande',
    hero_badge: '✅ Simple · Rapide · Fiable',
    hero_t1: "Besoin d'aide",
    hero_t2: 'pour tes papiers\u00a0?',
    hero_t3: 'On\u2019s\u2019occupe de tout.',
    hero_sub: 'CV, lettres, dossiers administratifs\u2026 fais ta demande en quelques minutes.',
    hero_btn1: 'Faire ma demande',
    hero_btn2: 'Comment ça marche\u00a0?',
    stat1: 'Demandes traitées',
    stat2: 'Délai moyen',
    stat3: 'Satisfaits',
    how_title: 'Comment ça marche\u00a0?',
    how_sub: 'Trois étapes simples, zéro stress',
    s1_title: 'Tu expliques ton besoin',
    s1_desc: 'Remplis le formulaire en quelques minutes avec les informations dont tu as besoin',
    s2_title: 'On traite ta demande rapidement',
    s2_desc: 'Ton document est préparé avec soin et professionnalisme selon tes informations',
    s3_title: 'Tu reçois ton document',
    s3_desc: 'Télécharge ou reçois par email ton document finalisé, prêt à être utilisé',
    svc_title: 'Nos services',
    svc_sub: 'Tout ce dont tu as besoin pour tes démarches',
    svc1_name: 'Création de CV',
    svc1_desc: 'Un CV professionnel, clair et efficace pour décrocher un emploi',
    svc2_name: 'Lettre de motivation',
    svc2_desc: 'Une lettre personnalisée et convaincante pour ta candidature',
    svc3_name: 'Aide aux dossiers',
    svc3_desc: 'Accompagnement pour monter ton dossier CAF, logement, emploi\u2026',
    svc4_name: 'Courriers officiels',
    svc4_desc: 'Rédaction pour mairies, préfectures, administrations et autres',
    from: 'à partir de',
    btn_start: 'Commencer',
    btn_choose: 'Choisir',
    adv1_t: 'Rapide',        adv1_d: 'Résultat en moins de 24h',
    adv2_t: 'Simple',        adv2_d: 'Pas de jargon, pas de complexité',
    adv3_t: 'Sans prise de tête', adv3_d: 'On s\'occupe de tout pour toi',
    adv4_t: 'Accessible à tous',  adv4_d: 'Adapté à chaque situation',
    pricing_title: 'Tarifs clairs et transparents',
    pricing_sub: 'Tu sais exactement ce que tu paies avant de commencer',
    form_title: 'Fais ta demande',
    form_sub: 'Remplis ce formulaire, on s\'occupe du reste',
    testi_title: 'Ils nous font confiance',
    footer_tagline: 'Ton aide administrative simple et accessible, où que tu sois.',
    footer_nav: 'Navigation',
    footer_contact: 'Contact',
    footer_legal: 'Dok\'péyi est un service d\'aide à la rédaction et à la préparation de documents. Les informations doivent être vérifiées avant utilisation.',
    cv_ville_label:   'Ville / Commune',
    cv_dispo_label:   'Disponibilité',
    cv_secteur_label: "Secteur d'activité",
    cv_niveau_label:  "Niveau d'études",
    cv_permis_label:  'Permis de conduire',
    cv_langues_label: 'Langues parlées',
    cv_step1_short:   'Profil',
    cv_step2_short:   'Objectif',
    cv_step3_short:   'Parcours',
    cv_step4_short:   'Finitions',
    cv_step1_title:   'Qui êtes-vous ?',
    cv_step2_title:   'Votre objectif',
    cv_step3_title:   'Votre parcours',
    cv_step4_title:   'Derniers détails',
    lang_title: 'Choisissez votre langue',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر',
    lang_confirm: 'Continuer →',
  },

  /* ─────────── PORTUGUÊS (Brésil) ─────────── */
  pt: {
    nav_comment: 'Como funciona',
    nav_services: 'Serviços',
    nav_tarifs: 'Preços',
    nav_cta: 'Fazer pedido',
    hero_badge: '✅ Simples · Rápido · Confiável',
    hero_t1: 'Precisa de ajuda',
    hero_t2: 'com seus documentos?',
    hero_t3: 'Nós cuidamos de tudo.',
    hero_sub: 'CV, cartas, documentos administrativos… faça seu pedido em poucos minutos.',
    hero_btn1: 'Fazer meu pedido',
    hero_btn2: 'Como funciona?',
    stat1: 'Pedidos processados',
    stat2: 'Prazo médio',
    stat3: 'Satisfeitos',
    how_title: 'Como funciona?',
    how_sub: 'Três passos simples, sem estresse',
    s1_title: 'Você explica sua necessidade',
    s1_desc: 'Preencha o formulário em poucos minutos com as informações que você precisa',
    s2_title: 'Processamos seu pedido rapidamente',
    s2_desc: 'Seu documento é preparado com cuidado e profissionalismo',
    s3_title: 'Você recebe seu documento',
    s3_desc: 'Baixe ou receba por e-mail seu documento finalizado, pronto para usar',
    svc_title: 'Nossos serviços',
    svc_sub: 'Tudo que você precisa para suas necessidades',
    svc1_name: 'Criação de Currículo',
    svc1_desc: 'Um currículo profissional, claro e eficaz para conseguir emprego',
    svc2_name: 'Carta de apresentação',
    svc2_desc: 'Uma carta personalizada e convincente para sua candidatura',
    svc3_name: 'Ajuda com processos',
    svc3_desc: 'Acompanhamento para montar seu processo de moradia, emprego…',
    svc4_name: 'Correspondência oficial',
    svc4_desc: 'Redação para prefeituras, administrações e outros',
    from: 'a partir de',
    btn_start: 'Começar',
    btn_choose: 'Escolher',
    adv1_t: 'Rápido',         adv1_d: 'Resultado em menos de 24h',
    adv2_t: 'Simples',        adv2_d: 'Sem jargão, sem complicação',
    adv3_t: 'Sem dor de cabeça', adv3_d: 'Cuidamos de tudo para você',
    adv4_t: 'Para todos',     adv4_d: 'Adaptado a cada situação',
    pricing_title: 'Preços claros e transparentes',
    pricing_sub: 'Você sabe exatamente o que paga antes de começar',
    form_title: 'Faça seu pedido',
    form_sub: 'Preencha este formulário, cuidamos do resto',
    testi_title: 'Eles confiam em nós',
    footer_tagline: 'Sua ajuda administrativa simples e acessível, onde quer que você esteja.',
    footer_nav: 'Navegação',
    footer_contact: 'Contato',
    footer_legal: 'Dok\'péyi é um serviço de ajuda na redação e preparação de documentos. As informações devem ser verificadas antes do uso.',
    cv_ville_label:   'Cidade / Município',
    cv_dispo_label:   'Disponibilidade',
    cv_secteur_label: 'Setor de atividade',
    cv_niveau_label:  'Nível de escolaridade',
    cv_permis_label:  'Carta de condução',
    cv_langues_label: 'Idiomas falados',
    cv_step1_short:   'Perfil',
    cv_step2_short:   'Objetivo',
    cv_step3_short:   'Percurso',
    cv_step4_short:   'Detalhes',
    cv_step1_title:   'Quem é você?',
    cv_step2_title:   'Seu objetivo',
    cv_step3_title:   'Seu percurso',
    cv_step4_title:   'Últimos detalhes',
    lang_title: 'Choisissez votre langue',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر',
    lang_confirm: 'Continuar →',
  },

  /* ─────────── KREYÒL AYISYEN (Haïti) ─────────── */
  ht: {
    nav_comment: 'Kijan li mache',
    nav_services: 'Sèvis',
    nav_tarifs: 'Pri',
    nav_cta: 'Fè demann mwen',
    hero_badge: '✅ Senp · Rapid · Serye',
    hero_t1: 'Ou bezwen èd',
    hero_t2: 'pou papye ou yo\u00a0?',
    hero_t3: 'Nou okipe tout bagay.',
    hero_sub: 'CV, lèt, dosye administratif… fè demann ou an kèk minit.',
    hero_btn1: 'Fè demann mwen',
    hero_btn2: 'Kijan li mache\u00a0?',
    stat1: 'Demann trete',
    stat2: 'Delè mwayen',
    stat3: 'Satisfè',
    how_title: 'Kijan li mache\u00a0?',
    how_sub: 'Twa etap senp, zero stres',
    s1_title: 'Ou eksplike bezwen ou',
    s1_desc: 'Ranpli fòmilè a an kèk minit avèk enfòmasyon ou bezwen yo',
    s2_title: 'Nou trete demann ou rapid',
    s2_desc: 'Dokiman ou prepare avèk swen ak pwofesyonalis',
    s3_title: 'Ou resevwa dokiman ou',
    s3_desc: 'Telechaje oswa resevwa pa imèl dokiman ou finalize, pare pou itilize',
    svc_title: 'Sèvis nou yo',
    svc_sub: 'Tout sa ou bezwen pou demarach ou yo',
    svc1_name: 'Kreyasyon CV',
    svc1_desc: 'Yon CV pwofesyonèl, klè ak efikas pou jwenn travay',
    svc2_name: 'Lèt motivasyon',
    svc2_desc: 'Yon lèt pèsonalize ak konvenkan pou kandidati ou',
    svc3_name: 'Èd pou dosye yo',
    svc3_desc: 'Akonpayman pou monte dosye CAF, lojman, travay ou…',
    svc4_name: 'Lèt ofisyèl',
    svc4_desc: 'Rédaksyon pou mairie, administrasyon ak lòt',
    from: 'apati de',
    btn_start: 'Kòmanse',
    btn_choose: 'Chwazi',
    adv1_t: 'Rapid',          adv1_d: 'Rezilta nan mwens pase 24h',
    adv2_t: 'Senp',           adv2_d: 'Pa gen jagon, pa gen konplikasyon',
    adv3_t: 'San tèt chaje',  adv3_d: 'Nou okipe tout bagay pou ou',
    adv4_t: 'Aksesib pou tout moun', adv4_d: 'Adapte pou chak sitiyasyon',
    pricing_title: 'Pri klè ak transparan',
    pricing_sub: 'Ou konnen egzakteman sa ou peye anvan ou kòmanse',
    form_title: 'Fè demann ou',
    form_sub: 'Ranpli fòmilè sa a, nou okipe rès la',
    testi_title: 'Yo fè nou konfyans',
    footer_tagline: 'Èd administratif senp ak aksesib pou ou, kèlkeswa kote ou ye.',
    footer_nav: 'Navigasyon',
    footer_contact: 'Kontak',
    footer_legal: 'Dok\'péyi se yon sèvis èd pou rédaksyon ak preparasyon dokiman. Enfòmasyon yo dwe verifye anvan itilizasyon.',
    cv_ville_label:   'Vil / Komin',
    cv_dispo_label:   'Disponibilite',
    cv_secteur_label: 'Sektè aktivite',
    cv_niveau_label:  'Nivo etid',
    cv_permis_label:  'Pèmi kondui',
    cv_langues_label: 'Lang pale yo',
    cv_step1_short:   'Profil',
    cv_step2_short:   'Objektif',
    cv_step3_short:   'Eksperyans',
    cv_step4_short:   'Detay',
    cv_step1_title:   'Kiyès ou ye?',
    cv_step2_title:   'Objektif ou',
    cv_step3_title:   'Eksperyans ou',
    cv_step4_title:   'Dènye detay',
    lang_title: 'Choisissez votre langue',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر',
    lang_confirm: 'Kontinye →',
  },

  /* ─────────── NEDERLANDS (Surinam) ─────────── */
  nl: {
    nav_comment: 'Hoe het werkt',
    nav_services: 'Diensten',
    nav_tarifs: 'Tarieven',
    nav_cta: 'Mijn aanvraag',
    hero_badge: '✅ Eenvoudig · Snel · Betrouwbaar',
    hero_t1: 'Hulp nodig',
    hero_t2: 'bij uw papieren?',
    hero_t3: 'Wij regelen alles.',
    hero_sub: 'CV, brieven, administratieve dossiers… doe uw aanvraag in enkele minuten.',
    hero_btn1: 'Mijn aanvraag doen',
    hero_btn2: 'Hoe werkt het?',
    stat1: 'Aanvragen verwerkt',
    stat2: 'Gemiddelde tijd',
    stat3: 'Tevreden',
    how_title: 'Hoe werkt het?',
    how_sub: 'Drie eenvoudige stappen, geen stress',
    s1_title: 'U legt uw behoefte uit',
    s1_desc: 'Vul het formulier in een paar minuten in met de informatie die u nodig heeft',
    s2_title: 'Wij verwerken uw aanvraag snel',
    s2_desc: 'Uw document wordt zorgvuldig en professioneel voorbereid',
    s3_title: 'U ontvangt uw document',
    s3_desc: 'Download of ontvang per e-mail uw afgeronde document, klaar voor gebruik',
    svc_title: 'Onze diensten',
    svc_sub: 'Alles wat u nodig heeft voor uw administratie',
    svc1_name: 'CV opstellen',
    svc1_desc: 'Een professioneel, duidelijk en effectief CV om een baan te vinden',
    svc2_name: 'Motivatiebrief',
    svc2_desc: 'Een gepersonaliseerde en overtuigende brief voor uw sollicitatie',
    svc3_name: 'Hulp bij dossiers',
    svc3_desc: 'Begeleiding bij het opstellen van uw dossier voor huisvesting, werk…',
    svc4_name: 'Officiële brieven',
    svc4_desc: 'Opstellen van brieven voor gemeenten, overheden en anderen',
    from: 'vanaf',
    btn_start: 'Beginnen',
    btn_choose: 'Kiezen',
    adv1_t: 'Snel',           adv1_d: 'Resultaat in minder dan 24u',
    adv2_t: 'Eenvoudig',      adv2_d: 'Geen jargon, geen complexiteit',
    adv3_t: 'Geen gedoe',     adv3_d: 'Wij regelen alles voor u',
    adv4_t: 'Voor iedereen',  adv4_d: 'Aangepast aan elke situatie',
    pricing_title: 'Duidelijke en transparante tarieven',
    pricing_sub: 'U weet precies wat u betaalt voordat u begint',
    form_title: 'Doe uw aanvraag',
    form_sub: 'Vul dit formulier in, wij regelen de rest',
    testi_title: 'Ze vertrouwen ons',
    footer_tagline: 'Uw eenvoudige en toegankelijke administratieve hulp, waar u ook bent.',
    footer_nav: 'Navigatie',
    footer_contact: 'Contact',
    footer_legal: 'Dok\'péyi is een hulpdienst voor het opstellen en voorbereiden van documenten. Informatie moet worden geverifieerd voor gebruik.',
    cv_ville_label:   'Stad / Gemeente',
    cv_dispo_label:   'Beschikbaarheid',
    cv_secteur_label: 'Bedrijfstak',
    cv_niveau_label:  'Opleidingsniveau',
    cv_permis_label:  'Rijbewijs',
    cv_langues_label: 'Gesproken talen',
    cv_step1_short:   'Profiel',
    cv_step2_short:   'Doel',
    cv_step3_short:   'Loopbaan',
    cv_step4_short:   'Details',
    cv_step1_title:   'Wie bent u?',
    cv_step2_title:   'Uw doel',
    cv_step3_title:   'Uw loopbaan',
    cv_step4_title:   'Laatste details',
    lang_title: 'Choisissez votre langue',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر',
    lang_confirm: 'Doorgaan →',
  },

  /* ─────────── العربية (Syrie · Moyen-Orient) ─────────── */
  ar: {
    nav_comment: 'كيف يعمل',
    nav_services: 'الخدمات',
    nav_tarifs: 'الأسعار',
    nav_cta: 'قدّم طلبك',
    hero_badge: '✅ بسيط · سريع · موثوق',
    hero_t1: 'تحتاج مساعدة',
    hero_t2: 'في أوراقك؟',
    hero_t3: 'نحن نتولى كل شيء.',
    hero_sub: 'سيرة ذاتية، رسائل، ملفات إدارية... قدم طلبك في دقائق.',
    hero_btn1: 'قدّم طلبي',
    hero_btn2: 'كيف يعمل؟',
    stat1: 'طلب تمت معالجته',
    stat2: 'متوسط الوقت',
    stat3: 'راضون',
    how_title: 'كيف يعمل؟',
    how_sub: 'ثلاث خطوات بسيطة، بدون توتر',
    s1_title: 'تشرح احتياجك',
    s1_desc: 'أكمل النموذج في دقائق بالمعلومات التي تحتاجها',
    s2_title: 'نعالج طلبك بسرعة',
    s2_desc: 'يتم تحضير وثيقتك بعناية واحترافية وفق معلوماتك',
    s3_title: 'تستلم وثيقتك',
    s3_desc: 'قم بتنزيل وثيقتك النهائية أو استلمها عبر البريد الإلكتروني',
    svc_title: 'خدماتنا',
    svc_sub: 'كل ما تحتاجه لإجراءاتك',
    svc1_name: 'إنشاء سيرة ذاتية',
    svc1_desc: 'سيرة ذاتية احترافية وواضحة وفعّالة للحصول على عمل',
    svc2_name: 'رسالة تحفيزية',
    svc2_desc: 'رسالة مخصصة ومقنعة لترشحك',
    svc3_name: 'مساعدة في الملفات',
    svc3_desc: 'مرافقة لإعداد ملف السكن والعمل والمساعدات الاجتماعية',
    svc4_name: 'المراسلات الرسمية',
    svc4_desc: 'صياغة رسائل للبلديات والإدارات والجهات الرسمية',
    from: 'ابتداءً من',
    btn_start: 'ابدأ',
    btn_choose: 'اختر',
    adv1_t: 'سريع',           adv1_d: 'نتيجة في أقل من 24 ساعة',
    adv2_t: 'بسيط',           adv2_d: 'بدون مصطلحات معقدة',
    adv3_t: 'بدون متاعب',    adv3_d: 'نتولى كل شيء عنك',
    adv4_t: 'للجميع',         adv4_d: 'مكيّف لكل وضع',
    pricing_title: 'أسعار واضحة وشفافة',
    pricing_sub: 'تعرف بالضبط ما ستدفع قبل البدء',
    form_title: 'قدّم طلبك',
    form_sub: 'أكمل هذا النموذج، نتكفل بالباقي',
    testi_title: 'يثقون بنا',
    footer_tagline: 'مساعدتك الإدارية البسيطة والميسورة، أينما كنت.',
    footer_nav: 'التنقل',
    footer_contact: 'التواصل',
    footer_legal: '.Dok\'péyi خدمة مساعدة في صياغة وتحضير الوثائق. يجب التحقق من المعلومات قبل الاستخدام',
    cv_ville_label:   'المدينة / البلدية',
    cv_dispo_label:   'التوفر',
    cv_secteur_label: 'قطاع النشاط',
    cv_niveau_label:  'المستوى الدراسي',
    cv_permis_label:  'رخصة القيادة',
    cv_langues_label: 'اللغات المتحدثة',
    cv_step1_short:   'الملف',
    cv_step2_short:   'الهدف',
    cv_step3_short:   'المسار',
    cv_step4_short:   'التفاصيل',
    cv_step1_title:   'من أنت؟',
    cv_step2_title:   'هدفك المهني',
    cv_step3_title:   'مسارك المهني',
    cv_step4_title:   'تفاصيل أخيرة',
    lang_title: 'Choisissez votre langue',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر',
    lang_confirm: 'متابعة ←',
  },
};

/* ============================================================
   ÉTAT & LOGIQUE
   ============================================================ */
let currentLang = localStorage.getItem('dok_lang') || null;
let selectedCode = currentLang || 'fr';

function getLang() { return LANGS.find(l => l.code === selectedCode) || LANGS[0]; }
function getTrans() { return T[selectedCode] || T.fr; }

/* ============================================================
   SÉLECTEUR DE LANGUE — Création du DOM
   ============================================================ */
function createPicker() {
  const overlay = document.createElement('div');
  overlay.className = 'lang-overlay';
  overlay.id = 'lang-overlay';

  const t = T.fr; // Le picker lui-même reste en version neutre

  overlay.innerHTML = `
    <div class="lang-modal" id="lang-modal" role="dialog" aria-modal="true" aria-label="Language selection">
      <div class="lang-header">
        <span class="lang-globe">🌍</span>
        <h2 class="lang-title">${t.lang_title}</h2>
        <p class="lang-subtitle">${t.lang_sub}</p>
      </div>
      <div class="lang-grid" id="lang-grid">
        ${LANGS.map(l => `
          <button class="lang-card${l.code === selectedCode ? ' selected' : ''}"
                  data-code="${l.code}"
                  onclick="selectLang('${l.code}')"
                  aria-label="${l.name}"
                  type="button">
            <span class="lang-check">✓</span>
            <span class="lang-flag">${l.flag}</span>
            <span class="lang-name">${l.name}</span>
            <span class="lang-native">${l.native}</span>
          </button>
        `).join('')}
      </div>
      <button class="lang-confirm" id="lang-confirm" onclick="confirmLang()" type="button">
        ${t.lang_confirm}
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Déclencher l'animation d'entrée
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('ready'));
  });

  // Fermeture au clic sur l'overlay (pas le modal)
  overlay.addEventListener('click', e => {
    if (e.target === overlay && currentLang) closePicker();
  });

  // Trap focus
  trapFocus(overlay);
}

function selectLang(code) {
  selectedCode = code;
  document.querySelectorAll('.lang-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.code === code);
  });
  // Mettre à jour le bouton confirm avec la traduction
  const confirmBtn = document.getElementById('lang-confirm');
  if (confirmBtn) confirmBtn.textContent = T[code]?.lang_confirm || 'Continuer →';
}

function confirmLang() {
  currentLang = selectedCode;
  localStorage.setItem('dok_lang', selectedCode);
  applyTranslation(selectedCode);
  closePicker();
}

function closePicker() {
  const overlay = document.getElementById('lang-overlay');
  if (!overlay) return;
  overlay.classList.remove('ready');
  setTimeout(() => overlay.remove(), 500);
}

function openPicker() {
  const existing = document.getElementById('lang-overlay');
  if (existing) existing.remove();
  selectedCode = currentLang || 'fr';
  createPicker();
}

/* ============================================================
   APPLICATION DES TRADUCTIONS
   ============================================================ */
function applyTranslation(code) {
  const tr = T[code] || T.fr;
  const lang = LANGS.find(l => l.code === code) || LANGS[0];

  // Direction (RTL / LTR)
  document.documentElement.setAttribute('lang', code);
  document.documentElement.setAttribute('dir', lang.dir);

  // Appliquer chaque clé
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (tr[key] !== undefined) el.textContent = tr[key];
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (tr[key] !== undefined) el.placeholder = tr[key];
  });

  // Mettre à jour le bouton langue dans la nav
  updateNavLangBtn(lang);
}

/* ============================================================
   BOUTON LANGUE DANS LA NAVBAR
   ============================================================ */
function createNavLangBtn() {
  const lang = getLang();
  const btn = document.createElement('button');
  btn.className = 'lang-switcher-btn';
  btn.id = 'lang-switcher-btn';
  btn.setAttribute('aria-label', 'Changer de langue');
  btn.onclick = openPicker;
  btn.innerHTML = `
    <span class="lang-flag-sm">${lang.flag}</span>
    <span class="lang-code-sm">${lang.code.toUpperCase()}</span>
  `;
  return btn;
}

function updateNavLangBtn(lang) {
  const btn = document.getElementById('lang-switcher-btn');
  if (!btn) return;
  btn.innerHTML = `
    <span class="lang-flag-sm">${lang.flag}</span>
    <span class="lang-code-sm">${lang.code.toUpperCase()}</span>
  `;
}

function injectNavBtn() {
  // Desktop nav
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.appendChild(createNavLangBtn());
  // Mobile menu
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) {
    const mobileBtn = createNavLangBtn();
    mobileBtn.id = 'lang-switcher-btn-mobile';
    mobileBtn.style.marginTop = '4px';
    mobileMenu.appendChild(mobileBtn);
  }
}

/* ============================================================
   ACCESSIBILITÉ — FOCUS TRAP
   ============================================================ */
function trapFocus(el) {
  const focusable = el.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  el.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (e.key === 'Escape' && currentLang) closePicker();
  });
  setTimeout(() => first && first.focus(), 100);
}

/* ============================================================
   INITIALISATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Injecter le bouton dans la nav
  injectNavBtn();

  if (currentLang) {
    // Langue déjà choisie → appliquer directement
    selectedCode = currentLang;
    applyTranslation(currentLang);
  } else {
    // Première visite → montrer le sélecteur
    setTimeout(createPicker, 400);
  }
});
