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
  { code: 'ar',  flag: '🇸🇾', name: 'العربية',          native: 'سوريا · Syrie',      dir: 'rtl' },
  { code: 'en',  flag: '🇬🇾', name: 'English',          native: 'Guyana',              dir: 'ltr' },
  { code: 'gcr', flag: '🇬🇫', name: 'Kréyòl Gwiyannè', native: 'Guyane · Kréyòl',    dir: 'ltr' },
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
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'Continuer →',
    ap_eyebrow: "Dok'péyi — Guyane française",
    ap_hero_sub: 'Des documents professionnels en quelques minutes. Conçu pour la Guyane. Accessible à tous, sans exception.',
    ap_stat1_l: 'Services disponibles', ap_stat2_l: 'Délai de livraison', ap_stat3_l: 'Livré par email', ap_stat4_l: 'Données protégées',
    ap_mission_title: 'Notre mission', ap_mission_sub: "Rendre l'administration accessible, sans exception",
    ap_svc_title: 'Ce que nous faisons', ap_svc_sub: 'Sept services, un seul objectif\u00a0: simplifier vos démarches',
    svc5_name: 'Titre de séjour', svc6_name: "Avis d'impôt", svc7_name: 'Naturalisation',
    ap_guyane_eyebrow: 'Ancrage local', ap_guyane_title: 'Guyane d\u2019abord.',
    ap_orga_eyebrow: 'Organismes référencés',
    ap_engage_title: 'Notre engagement', ap_engage_sub: 'Des principes non négociables',
    ap_eng1_t: 'Livraison rapide', ap_eng2_t: 'Confidentialité RGPD', ap_eng3_t: 'IA + expertise humaine',
    ap_eng4_t: "Prêts à l'emploi", ap_eng5_t: 'Spécificité Guyane', ap_eng6_t: 'Transparence totale',
    ap_btn_start: 'Commencer ma demande', ap_btn_cgv: 'Lire les CGV',
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
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'Continuar →',
    ap_eyebrow: "Dok'péyi — Guiana Francesa",
    ap_hero_sub: 'Documentos profissionais em poucos minutos. Feito para a Guiana. Acessível a todos, sem exceção.',
    ap_stat1_l: 'Serviços disponíveis', ap_stat2_l: 'Prazo de entrega', ap_stat3_l: 'Entregue por e-mail', ap_stat4_l: 'Dados protegidos',
    ap_mission_title: 'Nossa missão', ap_mission_sub: 'Tornar a administração acessível, sem exceção',
    ap_svc_title: 'O que fazemos', ap_svc_sub: 'Sete serviços, um único objetivo: simplificar seus processos',
    svc5_name: 'Autorização de residência', svc6_name: 'Aviso de imposto', svc7_name: 'Naturalização',
    ap_guyane_eyebrow: 'Ancoragem local', ap_guyane_title: 'Guiana primeiro.',
    ap_orga_eyebrow: 'Organismos referenciados',
    ap_engage_title: 'Nosso compromisso', ap_engage_sub: 'Princípios inegociáveis',
    ap_eng1_t: 'Entrega rápida', ap_eng2_t: 'Confidencialidade RGPD', ap_eng3_t: 'IA + expertise humana',
    ap_eng4_t: 'Prontos para uso', ap_eng5_t: 'Especificidade Guiana', ap_eng6_t: 'Total transparência',
    ap_btn_start: 'Começar meu pedido', ap_btn_cgv: 'Ler os Termos',
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
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'Kontinye →',
    ap_eyebrow: "Dok'péyi — Gwiyan Fransè",
    ap_hero_sub: 'Dokiman pwofesyonèl nan kèk minit. Fèt pou Gwiyan. Aksesib pou tout moun, san eksepsyon.',
    ap_stat1_l: 'Sèvis disponib', ap_stat2_l: 'Delè livrezon', ap_stat3_l: 'Livre pa imèl', ap_stat4_l: 'Done pwoteje',
    ap_mission_title: 'Misyon nou', ap_mission_sub: 'Rann administrasyon an aksesib, san eksepsyon',
    ap_svc_title: 'Sa nou fè', ap_svc_sub: 'Sèt sèvis, yon sèl objektif: senplifye demarach ou yo',
    svc5_name: 'Tit rezidans', svc6_name: 'Avi enpo', svc7_name: 'Natiralizasyon',
    ap_guyane_eyebrow: 'Rasin lokal', ap_guyane_title: 'Gwiyan dabò.',
    ap_orga_eyebrow: 'Òganizasyon refèranse yo',
    ap_engage_title: 'Angajman nou', ap_engage_sub: 'Prensip ki pa negosyab',
    ap_eng1_t: 'Livrezon rapid', ap_eng2_t: 'Konfidansyalite RGPD', ap_eng3_t: 'IA + ekspètiz imen',
    ap_eng4_t: 'Prè pou itilize', ap_eng5_t: 'Spesifisitye Gwiyan', ap_eng6_t: 'Transparans total',
    ap_btn_start: 'Kòmanse demann mwen', ap_btn_cgv: 'Li CGV yo',
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
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'Doorgaan →',
    ap_eyebrow: "Dok'péyi — Frans-Guyana",
    ap_hero_sub: 'Professionele documenten in enkele minuten. Ontworpen voor Guyana. Toegankelijk voor iedereen, zonder uitzondering.',
    ap_stat1_l: 'Beschikbare diensten', ap_stat2_l: 'Levertijd', ap_stat3_l: 'Per e-mail geleverd', ap_stat4_l: 'Gegevens beschermd',
    ap_mission_title: 'Onze missie', ap_mission_sub: 'Administratie toegankelijk maken voor iedereen',
    ap_svc_title: 'Wat wij doen', ap_svc_sub: 'Zeven diensten, één doel: uw administratie vereenvoudigen',
    svc5_name: 'Verblijfsvergunning', svc6_name: 'Belastingaanslag', svc7_name: 'Naturalisatie',
    ap_guyane_eyebrow: 'Lokale verankering', ap_guyane_title: 'Guyana eerst.',
    ap_orga_eyebrow: 'Geregistreerde organisaties',
    ap_engage_title: 'Onze toewijding', ap_engage_sub: 'Niet-onderhandelbare principes',
    ap_eng1_t: 'Snelle levering', ap_eng2_t: 'AVG-vertrouwelijkheid', ap_eng3_t: 'AI + menselijke expertise',
    ap_eng4_t: 'Gebruiksklaar', ap_eng5_t: 'Specifiek voor Guyana', ap_eng6_t: 'Volledige transparantie',
    ap_btn_start: 'Mijn aanvraag starten', ap_btn_cgv: 'Lees de AV',
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
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'متابعة ←',
    ap_eyebrow: "Dok'péyi — غويانا الفرنسية",
    ap_hero_sub: 'وثائق احترافية في دقائق. مصمم لغويانا. متاح للجميع، بدون استثناء.',
    ap_stat1_l: 'الخدمات المتاحة', ap_stat2_l: 'مهلة التسليم', ap_stat3_l: 'مسلّم عبر البريد الإلكتروني', ap_stat4_l: 'بيانات محمية',
    ap_mission_title: 'مهمتنا', ap_mission_sub: 'جعل الإدارة في متناول الجميع، بدون استثناء',
    ap_svc_title: 'ما نفعله', ap_svc_sub: 'سبع خدمات، هدف واحد: تبسيط إجراءاتكم',
    svc5_name: 'تصريح إقامة', svc6_name: 'إشعار ضريبي', svc7_name: 'التجنيس',
    ap_guyane_eyebrow: 'الجذور المحلية', ap_guyane_title: 'غويانا أولاً.',
    ap_orga_eyebrow: 'الهيئات المعتمدة',
    ap_engage_title: 'التزامنا', ap_engage_sub: 'مبادئ غير قابلة للتفاوض',
    ap_eng1_t: 'تسليم سريع', ap_eng2_t: 'سرية البيانات', ap_eng3_t: 'الذكاء الاصطناعي + خبرة بشرية',
    ap_eng4_t: 'جاهز للاستخدام', ap_eng5_t: 'خصوصية غويانا', ap_eng6_t: 'شفافية كاملة',
    ap_btn_start: 'بدء طلبي', ap_btn_cgv: 'قراءة الشروط',
  },

  /* ─────────── ENGLISH (Guyana) ─────────── */
  en: {
    nav_comment: 'How it works',
    nav_services: 'Services',
    nav_tarifs: 'Pricing',
    nav_cta: 'Make a request',
    hero_badge: '✅ Simple · Fast · Reliable',
    hero_t1: 'Need help',
    hero_t2: 'with your documents?',
    hero_t3: 'We handle everything.',
    hero_sub: 'CV, letters, administrative files… make your request in a few minutes.',
    hero_btn1: 'Make my request',
    hero_btn2: 'How does it work?',
    stat1: 'Requests processed',
    stat2: 'Average time',
    stat3: 'Satisfied',
    how_title: 'How does it work?',
    how_sub: 'Three simple steps, zero stress',
    s1_title: 'You explain your need',
    s1_desc: 'Fill in the form in a few minutes with the information you need',
    s2_title: 'We process your request quickly',
    s2_desc: 'Your document is prepared with care and professionalism',
    s3_title: 'You receive your document',
    s3_desc: 'Download or receive by email your finalized document, ready to use',
    svc_title: 'Our services',
    svc_sub: 'Everything you need for your administrative tasks',
    svc1_name: 'CV Creation',
    svc1_desc: 'A professional, clear and effective CV to get a job',
    svc2_name: 'Cover letter',
    svc2_desc: 'A personalized and convincing letter for your application',
    svc3_name: 'File assistance',
    svc3_desc: 'Support for building your CAF, housing or employment file\u2026',
    svc4_name: 'Official letters',
    svc4_desc: 'Writing for town halls, prefectures, administrations and others',
    from: 'from',
    btn_start: 'Start',
    btn_choose: 'Choose',
    adv1_t: 'Fast',            adv1_d: 'Result in less than 24h',
    adv2_t: 'Simple',          adv2_d: 'No jargon, no complexity',
    adv3_t: 'Hassle-free',     adv3_d: 'We handle everything for you',
    adv4_t: 'For everyone',    adv4_d: 'Adapted to every situation',
    pricing_title: 'Clear and transparent pricing',
    pricing_sub: 'You know exactly what you pay before you start',
    form_title: 'Make your request',
    form_sub: 'Fill in this form, we handle the rest',
    testi_title: 'They trust us',
    footer_tagline: 'Your simple and accessible administrative help, wherever you are.',
    footer_nav: 'Navigation',
    footer_contact: 'Contact',
    footer_legal: "Dok'péyi is a document writing and preparation assistance service. Information must be verified before use.",
    cv_ville_label:   'City / Town',
    cv_dispo_label:   'Availability',
    cv_secteur_label: 'Industry',
    cv_niveau_label:  'Education level',
    cv_permis_label:  "Driver's licence",
    cv_langues_label: 'Languages spoken',
    cv_step1_short:   'Profile',
    cv_step2_short:   'Goal',
    cv_step3_short:   'Experience',
    cv_step4_short:   'Details',
    cv_step1_title:   'Who are you?',
    cv_step2_title:   'Your goal',
    cv_step3_title:   'Your experience',
    cv_step4_title:   'Final details',
    lang_title: 'Choose your language',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'Continue →',
    ap_eyebrow: "Dok'péyi — French Guiana",
    ap_hero_sub: 'Professional documents in minutes. Built for French Guiana. Accessible to everyone, without exception.',
    ap_stat1_l: 'Available services', ap_stat2_l: 'Delivery time', ap_stat3_l: 'Delivered by email', ap_stat4_l: 'Data protected',
    ap_mission_title: 'Our mission', ap_mission_sub: 'Making administration accessible, without exception',
    ap_svc_title: 'What we do', ap_svc_sub: 'Seven services, one goal: simplify your administrative tasks',
    svc5_name: 'Residence permit', svc6_name: 'Tax notice', svc7_name: 'Naturalisation',
    ap_guyane_eyebrow: 'Local roots', ap_guyane_title: 'Guiana first.',
    ap_orga_eyebrow: 'Referenced organisations',
    ap_engage_title: 'Our commitment', ap_engage_sub: 'Non-negotiable principles',
    ap_eng1_t: 'Fast delivery', ap_eng2_t: 'GDPR confidentiality', ap_eng3_t: 'AI + human expertise',
    ap_eng4_t: 'Ready to use', ap_eng5_t: 'Guiana specificity', ap_eng6_t: 'Full transparency',
    ap_btn_start: 'Start my request', ap_btn_cgv: 'Read the T&Cs',
  },

  /* ─────────── KRÉYÒL GWIYANNÈ (Créole guyanais) ─────────── */
  gcr: {
    nav_comment: 'Kouman sa ka maché',
    nav_services: 'Sèvis',
    nav_tarifs: 'Pri',
    nav_cta: 'Fè demann mwen',
    hero_badge: '✅ Senp · Rapid · Serye',
    hero_t1: 'Ou bizwen èd',
    hero_t2: 'pou papyé ou\u00a0?',
    hero_t3: 'Nou ka okipé tout bagay.',
    hero_sub: 'CV, lèt, dosyé administratif\u2026 fè demann ou an kèk minit.',
    hero_btn1: 'Fè demann mwen',
    hero_btn2: 'Kouman sa ka maché\u00a0?',
    stat1: 'Demann trayité',
    stat2: 'Délé mwayen',
    stat3: 'Satisfè',
    how_title: 'Kouman sa ka maché\u00a0?',
    how_sub: 'Twa étap senp, zéro stres',
    s1_title: 'Ou ekspliké sa ou bizwen',
    s1_desc: 'Ranpli fòmilè-a an kèk minit avèk tout enfòmasyon ou bizwen',
    s2_title: 'Nou trayité demann ou vit',
    s2_desc: 'Dosyé ou préparé avèk swen é pwofésyonalism',
    s3_title: 'Ou resevwé dosyé ou',
    s3_desc: 'Téléchajé ou resevwé pa imèl dosyé finalizé ou, prèt pou sèvi',
    svc_title: 'Sèvis nou yo',
    svc_sub: 'Tout sa ou bizwen pou démarich ou yo',
    svc1_name: 'Kreyasyon CV',
    svc1_desc: 'Yon CV pwofésyonèl, klè é efikas pou jwenn travay',
    svc2_name: 'Lèt motivasyon',
    svc2_desc: 'Yon lèt pèsonalizé é konvenkan pou kandidati ou',
    svc3_name: 'Èd pou dosyé yo',
    svc3_desc: 'Akonpanyeman pou montè dosyé CAF, lojman, travay ou\u2026',
    svc4_name: 'Lèt ofisyèl',
    svc4_desc: 'Rédaksyon pou mèri, préfèkti, administrasyon é lot',
    from: 'a pati de',
    btn_start: 'Koumansé',
    btn_choose: 'Chwazi',
    adv1_t: 'Rapid',           adv1_d: 'Rézilta an mwens de 24h',
    adv2_t: 'Senp',            adv2_d: 'Pa ni jagon, pa ni konplikasyon',
    adv3_t: 'San tèt chajé',   adv3_d: 'Nou ka okipé tout bagay pou ou',
    adv4_t: 'Pou tout moun',   adv4_d: 'Adapté pou chak sitiyasyon',
    pricing_title: 'Pri klè é transparan',
    pricing_sub: 'Ou sav egzakteman sa ou ka payé avan ou koumansé',
    form_title: 'Fè demann ou',
    form_sub: 'Ranpli fòmilè-a, nou ka okipé rès-la',
    testi_title: 'Yo fè nou konfyans',
    footer_tagline: 'Èd administratif senp é aksèsib pou ou, kèlkèswa kote ou yé.',
    footer_nav: 'Navigasyon',
    footer_contact: 'Kontak',
    footer_legal: "Dok'péyi sé yon sèvis èd pou rédaksyon é préparasyon dosyé. Enfòmasyon yo dwa vérifiyé avan itilizasyon.",
    cv_ville_label:   'Vil / Komin',
    cv_dispo_label:   'Disponibilité',
    cv_secteur_label: 'Sèktè aktivité',
    cv_niveau_label:  'Nivo étid',
    cv_permis_label:  'Pèmi kondui',
    cv_langues_label: 'Lang ou ka palé yo',
    cv_step1_short:   'Pwofil',
    cv_step2_short:   'Objèktif',
    cv_step3_short:   'Ekspéryans',
    cv_step4_short:   'Détay',
    cv_step1_title:   'Kisasa ou yé\u00a0?',
    cv_step2_title:   'Objèktif ou',
    cv_step3_title:   'Ekspéryans ou',
    cv_step4_title:   'Dènié détay',
    lang_title: 'Choisissez votre langue',
    lang_sub: 'Choisissez · Escolha · Chwazi · Kies · اختر · Choose',
    lang_confirm: 'Continue →',
    ap_eyebrow: "Dok'péyi — Gwiyan Fransèz",
    ap_hero_sub: 'Dokiman pwofésyonèl an kèk minit. Fèt pou Gwiyan. Aksèsib pou tout moun, san eksèpsyon.',
    ap_stat1_l: 'Sèvis disponib', ap_stat2_l: 'Délé livrezon', ap_stat3_l: 'Livré pa imèl', ap_stat4_l: 'Donné pwotéjé',
    ap_mission_title: 'Misyon nou', ap_mission_sub: 'Rann administrasyon aksèsib, san eksèpsyon',
    ap_svc_title: 'Sa nou ka fè', ap_svc_sub: 'Sèt sèvis, yon sèl objèktif: senplifiyé démarich ou yo',
    svc5_name: 'Tit séjou', svc6_name: 'Avi lenpò', svc7_name: 'Natiralizasyon',
    ap_guyane_eyebrow: 'Anraj lokal', ap_guyane_title: 'Gwiyan avan.',
    ap_orga_eyebrow: 'Òganizasyon référancé yo',
    ap_engage_title: 'Angajman nou', ap_engage_sub: 'Prinsip ki pa négosyab',
    ap_eng1_t: 'Livrezon rapid', ap_eng2_t: 'Konfidansyalité RGPD', ap_eng3_t: 'IA + ekspètiz imen',
    ap_eng4_t: 'Prèt pou sèvi', ap_eng5_t: 'Spésifisité Gwiyan', ap_eng6_t: 'Transparan total',
    ap_btn_start: 'Koumansé demann mwen', ap_btn_cgv: 'Li CGV-a',
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
