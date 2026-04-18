/* ============================================================
   DOK'PÉYI — Service Wizard  (service.js)
   Un seul moteur pour tous les services : CV, Lettre,
   Courrier, Dossier, Titre de séjour.
   ============================================================ */

/* ── LISTES PRÉDÉFINIES (CV) ──────────────────────────────── */
const CV_POSTES_GROUPS = [
  { label: 'BTP / Industrie',         options: ['Ouvrier BTP','Maçon','Coffreur','Électricien','Plombier','Carreleur','Peintre en bâtiment','Chef de chantier','Conducteur d\'engins','Métreur','Technicien de maintenance','Soudeur'] },
  { label: 'Santé / Social',          options: ['Infirmier(e) diplômé(e) d\'État','Aide-soignant(e)','Auxiliaire de vie','Agent de service hospitalier','Éducateur spécialisé','Assistant(e) social(e)','Puéricultrice','Médecin généraliste'] },
  { label: 'Éducation / Formation',   options: ['Professeur des écoles','Professeur certifié','AESH','Animateur périscolaire','Formateur professionnel','CPE'] },
  { label: 'Administration / Juridique', options: ['Agent administratif','Secrétaire','Assistant(e) de direction','Gestionnaire RH','Comptable','Agent fonction publique','Juriste'] },
  { label: 'Commerce / Vente',        options: ['Vendeur(se)','Conseiller(e) de vente','Responsable de rayon','Caissier(e)','Commercial(e)','Manager de rayon'] },
  { label: 'Transport / Logistique',  options: ['Chauffeur PL','Chauffeur VL','Livreur','Magasinier','Cariste'] },
  { label: 'Agriculture / Environnement', options: ['Ouvrier agricole','Technicien agricole','Agent forestier','Pêcheur','Technicien environnement'] },
  { label: 'Numérique / Technique',   options: ['Développeur web','Technicien informatique','Administrateur réseau'] },
  { label: 'Restauration / Hôtellerie', options: ['Cuisinier','Aide cuisinier','Serveur','Réceptionniste','Agent d\'entretien'] }
];

const CV_DIPLOMES_GROUPS = [
  { label: 'Diplômes courants', options: [
    'Aucun diplôme','CFG','CFGP','CAP','BEP',
    'BAC Professionnel','BAC Général','BAC Technologique',
    'BTS','DUT/BUT','DEUG','Licence','Licence Professionnelle','Master','Master Professionnel','Doctorat',
    'BTS SP3S','DEAS','DEAP','DEEJE','Diplôme d\'État Infirmier','Diplôme d\'État Aide-soignant',
    'Certificat de qualification professionnelle (CQP)','Titre professionnel AFPA','Habilitations électriques (B0/H0/BR/BC)'
  ]}
];

const CV_COMPETENCES_GROUPS = [
  { label: 'Transversales',    options: ['Travail en équipe','Autonomie','Rigueur','Ponctualité','Adaptabilité','Gestion du stress','Communication','Sens du service','Organisation','Prise d\'initiative','Polyvalence','Gestion des priorités'] },
  { label: 'Techniques BTP',   options: ['Lecture de plans','PPSPS','Travail en hauteur sécurisé','Conduite d\'engins','Coffrages','Maçonnerie','Électricité','Plomberie','Soudure','Habilitation électrique'] },
  { label: 'Techniques Santé', options: ['Soins infirmiers','Gestion de la douleur','Soins intensifs','Tutorat étudiants','Gestion de dossiers patients'] },
  { label: 'Techniques Commerce', options: ['Techniques de vente','Gestion de caisse','Merchandising','Gestion des stocks','Relation client','Objectifs commerciaux'] },
  { label: 'Techniques Admin', options: ['Maîtrise Word/Excel','Logiciels métier','Gestion documentaire','Comptabilité','Droit du travail','Marchés publics'] },
  { label: 'Langues',          options: ['Français','Anglais','Espagnol','Portugais brésilien','Créole guyanais','Créole haïtien','Néerlandais','Arabe'] },
  { label: 'Permis',           options: ['Permis B','Permis C (PL)','Permis CE','CACES R482','CACES R489','Permis bateau','Permis moto'] }
];

/* ── TEMPLATES CV ─────────────────────────────────────────── */
const CV_TEMPLATES = {
  classique: {
    id: 'classique', nom: 'Classique', prix: 0,
    description: 'Épuré et professionnel',
    style: `
STYLE IMPOSÉ — respecte-le exactement :
- Format A4, fond blanc, CSS inline uniquement
- En-tête : nom 2.2rem Georgia gras noir, titre 0.85rem Arial #666 lettres-spacing:0.15em, contact en ligne séparés par ·
- Layout : flexbox, sidebar gauche 28% fond #f5f5f5 padding:20px, corps droit 72% padding:25px
- Sidebar : cercle 80px #2c3e50 avec initiales blanches (si pas de photo), compétences en liste puces carrées, langues si présentes
- Titres de section : 0.7rem majuscules letter-spacing:0.12em + border-bottom 2px solid #2c3e50 + margin-bottom:10px
- Expérience : poste en gras, entreprise en #2c3e50, dates en gris 0.85rem, bullets avec tiret — et padding-left:15px
- Couleur accent unique : #2c3e50`
  },
  elite: {
    id: 'elite', nom: 'Élite', prix: 4,
    description: 'Sidebar sombre, impact fort',
    style: `
STYLE IMPOSÉ — respecte-le exactement :
- Format A4, CSS inline uniquement
- Layout : sidebar gauche 32% fond #1a1a2e texte blanc, corps droit 68% blanc
- Sidebar : cercle 90px bordure 3px #e94560, nom 1.1rem bold blanc, titre 0.75rem #e94560, contact icônes unicode (✉ 📞), compétences avec barres de progression (div fond #333, fill #e94560, height:4px), section centres d'intérêt en bas
- Corps : sections avec titre précédé d'un rond coloré #e94560 (●), timeline verticale : ligne 2px #f0f0f0, points ronds #e94560
- Expérience : poste gras, entreprise italique #e94560, dates gris
- Accent : #e94560 (rouge vif) sur fond sombre sidebar`
  },
  corporate: {
    id: 'corporate', nom: 'Corporate', prix: 2,
    description: 'Navy et sobre, idéal fonction publique',
    style: `
STYLE IMPOSÉ — respecte-le exactement :
- Format A4, CSS inline uniquement
- En-tête full-width fond #1b2a4a padding:25px : nom 2rem blanc lettres-spacing:-0.02em, titre 0.8rem #7eb3e8 lettres espacées, contact blanc 0.85rem
- Cercle photo 75px en haut droite de l'en-tête bordure 3px #7eb3e8
- Corps : 2 colonnes égales padding:20px gap:25px — Gauche : Contact détaillé · Compétences · Langues — Droite : Profil · Expérience · Formation
- Titres de section : 0.75rem majuscules #1b2a4a + ligne 1px #7eb3e8
- Accent : #1b2a4a (navy) + #7eb3e8 (bleu clair)`
  },
  impact: {
    id: 'impact', nom: 'Impact', prix: 2,
    description: 'Dynamique, idéal commerce et BTP',
    style: `
STYLE IMPOSÉ — respecte-le exactement :
- Format A4, CSS inline uniquement
- En-tête : fond #16213e position:relative, pseudo-effet triangle via div absolu #0f3460 skewY(-3deg), nom 2rem blanc bold, titre #4fc3f7
- Layout : sidebar gauche 30% fond #0f3460 texte blanc, corps 70% blanc
- Sidebar : cercle 85px bordure #4fc3f7, contact en liste, compétences points ronds (● rempli = niveau, ○ = vide, max 5)
- Corps : sections titres en #e94560 0.75rem majuscules, timeline avec points ronds #4fc3f7 et ligne verticale
- Hobbies : tags inline fond #f0f4ff texte #0f3460 border-radius:12px
- Accents : #16213e + #0f3460 + #4fc3f7 + #e94560`
  },
  prestige: {
    id: 'prestige', nom: 'Prestige', prix: 4,
    description: 'Or et élégance, idéal santé et éducation',
    style: `
STYLE IMPOSÉ — respecte-le exactement :
- Format A4, CSS inline uniquement
- En-tête : fond blanc, formes décoratives triangles #c9a84c opacity:0.15 en coins, nom centré 2.2rem Georgia gras, titre #c9a84c lettres espacées
- Cercle photo 95px bordure double : 3px solid #c9a84c + 2px solid blanc offset
- Corps : 2 colonnes — gauche 35% fond #faf6ee, droite 65% blanc — Gauche : Contact · Compétences barres fond #e8d9b0 fill #c9a84c · Langues cercles % — Droite : Profil · Expérience timeline · Formation
- Titres : Georgia italic #8b6914 + ligne ornementale #c9a84c
- Accents : #c9a84c (or) + #8b6914 (brun) + #faf6ee (crème)`
  },
  executive: {
    id: 'executive', nom: 'Executive', prix: 7,
    description: 'Ultra-minimaliste premium, direction et cadres',
    style: `
STYLE IMPOSÉ — respecte-le exactement :
- Format A4, CSS inline uniquement
- En-tête : fond blanc, nom 3rem Georgia tracking:-0.03em noir #1a1a1a, ligne fine 1px #1a1a1a width:60px margin:8px 0, titre 0.8rem #888 lettres-spacing:0.3em majuscules, contact 0.8rem #666 en ligne
- Photo optionnelle : 70px×70px filter:grayscale(100%) float:right margin-top:-10px
- Corps : colonne unique max-width:550px margin:auto padding:30px
- Sections : titre 0.65rem majuscules tracking:0.2em #888 + ligne 0.5px #ddd margin-bottom:20px — BEAUCOUP d'espace blanc
- Expérience : poste 1rem gras #1a1a1a, entreprise + dates inline #888 0.85rem, bullets minimalistes padding-left:12px
- Zéro couleur : uniquement #1a1a1a #666 #888 #ddd blanc`
  }
};
/* Exposé globalement pour la page catalogue */
window.CV_TEMPLATES = CV_TEMPLATES;

/* ── LISTES PRÉDÉFINIES (LETTRE) ──────────────────────────── */
const LETTRE_ENTREPRISES_GROUPS = [
  { label: 'Secteur public / Collectivités',  options: ['Mairie de Cayenne','Mairie de Kourou','Mairie de Saint-Laurent-du-Maroni','Mairie de Rémire-Montjoly','Mairie de Matoury','Collectivité Territoriale de Guyane (CTG)','Préfecture de Guyane','Rectorat de Guyane','CAF de Guyane','CPAM de Guyane','Pôle emploi Guyane','Mission Locale Régionale de Guyane'] },
  { label: 'Grande distribution / Commerce',  options: ['Leclerc Cayenne','Leclerc Kourou','Carrefour Matoury','Géant Casino Cayenne','Super U','Intermarché','Bricomarché','Mr.Bricolage','Cora Cayenne'] },
  { label: 'BTP / Industrie',                 options: ['CMA-CGM','Ariane Group','CNES Kourou','ENDEL','Vinci Construction','Eiffage','Bouygues','SIMKO','SPL Grand Projet','SGDE','EDF Guyane','GDF Suez'] },
  { label: 'Santé / Social',                  options: ['Centre Hospitalier de Cayenne (CHC)','CH de l\'Ouest Guyanais (Saint-Laurent)','CH de Kourou','Clinique Véronique','Centre Médico-Psychologique','Conseil départemental','ARS Guyane','Croix-Rouge Française','La Cimade Guyane'] },
  { label: 'Transport / Logistique',          options: ['Air France','Air Caraïbes','Corsair','Chronopost','DHL Guyane','La Poste Guyane','Agglo Cayenne (RDTG)','Compagnie des Transports Guyanais'] },
  { label: 'Éducation / Formation',           options: ['Université de Guyane','Lycée Melkior-Garré','Lycée Gaston Monnerville','Collège Auguste Dédé','AFPA Guyane','GRETA','CFA BTP Guyane'] },
  { label: 'Autre / Saisir manuellement',     options: [] }
];

const LETTRE_SECTEUR_TAGS = [
  { label: 'Atouts à mettre en avant', options: [
    'Expérience locale Guyane','Bilinguisme français/créole','Connaissance du public précaire','Permis B','Mobilité géographique','Disponibilité immédiate','Sens du service public','Travail en équipe pluriculturelle','Adaptabilité climat équatorial','Expérience avec publics allophones'
  ]}
];

/* ── LISTES PRÉDÉFINIES (COURRIER) ────────────────────────── */
const COURRIER_DESTINATAIRES_GROUPS = [
  { label: 'Organismes sociaux',      options: ['CAF de Guyane','CPAM de Guyane','Pôle emploi Guyane','CARSAT','URSSAF Guyane','MSA Guyane','Mission Locale Régionale de Guyane'] },
  { label: 'Préfectoral / État',      options: ['Préfecture de Guyane — Service des étrangers','Préfecture de Guyane — Bureau des naturalisations','Sous-préfecture de Saint-Laurent-du-Maroni','OFII Guyane','Consulat (à préciser)'] },
  { label: 'Impôts / Trésor',         options: ['Centre des impôts de Cayenne','Centre des impôts de Kourou','Centre des impôts de Saint-Laurent','Trésor Public','Service des amendes'] },
  { label: 'Justice',                 options: ['Tribunal judiciaire de Cayenne','Tribunal administratif de Cayenne','Conseil des prud\'hommes','Défenseur des droits','Maison de la justice et du droit'] },
  { label: 'Logement',                options: ['SIMKO (bailleur social)','SIGUY','Action Logement Guyane','ADIL Guyane','Commission DALO'] },
  { label: 'Santé',                   options: ['ARS Guyane','Centre Hospitalier de Cayenne','MDPH Guyane','Conseil départemental — service social'] },
  { label: 'Éducation',               options: ['Rectorat de Guyane','DSDEN Guyane','Inspection académique'] },
  { label: 'Collectivités',           options: ['Mairie de Cayenne','Mairie de Kourou','Mairie de Saint-Laurent-du-Maroni','Mairie de Rémire-Montjoly','Mairie de Matoury','Collectivité Territoriale de Guyane (CTG)'] }
];

const COURRIER_OBJET_TYPES = [
  { label: 'Type de courrier', options: [
    'Demande de documents','Demande de rendez-vous','Demande d\'information','Réclamation','Contestation','Demande de délai','Signalement','Demande d\'aide','Autre'
  ]}
];

/* ── LISTES PRÉDÉFINIES (DOSSIER) ──────────────────────────── */
const DOSSIER_CAF_PRESTATIONS = [
  { label: 'Type de prestation', options: ['RSA', 'APL', 'AAH', 'PAJE', 'ALS', 'ASF', 'Autre prestation CAF'] }
];
const DOSSIER_CAF_SITUATION_PRO = [
  { label: 'Situation professionnelle', options: ['Sans emploi', 'Salarié(e)', 'Indépendant(e)', 'Étudiant(e)', 'En formation', 'Retraité(e)', 'Congé parental'] }
];
const DOSSIER_CAF_FOYER = [
  { label: 'Composition du foyer', options: ['Seul(e) sans enfant', 'Seul(e) avec 1 enfant', 'Seul(e) avec 2 enfants', 'Seul(e) avec 3 enfants ou +', 'En couple sans enfant', 'En couple avec 1 enfant', 'En couple avec 2 enfants', 'En couple avec 3 enfants ou +'] }
];
const DOSSIER_LOGEMENT_TYPES = [
  { label: 'Type de demande', options: ['HLM (logement social classique)', 'Mutation (changer de logement HLM)', 'Logement d\'urgence', 'Hébergement d\'urgence (115)'] }
];
const DOSSIER_LOGEMENT_SITUATIONS = [
  { label: 'Situation actuelle', options: ['Sans domicile fixe', 'Hébergé(e) chez un tiers', 'Logement insalubre', 'Suroccupé (trop de personnes)', 'Logement inadapté au handicap', 'Expulsion imminente'] }
];
const DOSSIER_AIDE_TYPES = [
  { label: 'Type d\'aide', options: ['Aide alimentaire', 'Aide énergie (électricité / gaz)', 'Aide eau potable', 'Aide mobilité (transport)', 'Aide obsèques', 'Aide rentrée scolaire'] }
];
const DOSSIER_AIDE_ORGANISMES = [
  { label: 'Organisme cible', options: ['CCAS (Centre Communal d\'Action Sociale)', 'MSA Guyane', 'CAF de Guyane', 'Département 973 — service social', 'Croix-Rouge Guyane'] }
];

/* ── CONFIG PAR SERVICE ───────────────────────────────────── */
const SVC = {
  cv: {
    name: 'CV Professionnel', icon: '📄', color: '#2563eb', light: '#eff6ff', price: 8,
    reviewRequired: false,
    choices: [
      { id: 'scratch', icon: '✏️', label: 'Créer de A à Z',       desc: 'Je n\'ai pas encore de CV' },
      { id: 'improve', icon: '✨', label: 'Améliorer l\'existant', desc: 'Mon CV existe, je veux le moderniser' },
      { id: 'pro',     icon: '🎯', label: 'Professionnaliser',     desc: 'Donner un look expert à mon profil' }
    ],
    questions: function(choice) {
      if (choice === 'improve') return [
        { id: 'note', label: 'Que souhaitez-vous améliorer ?', type: 'textarea',
          placeholder: 'Décrivez les changements souhaités (design, contenu, mise en page…)', required: true }
      ];
      return [
        { id: 'cv_template', label: 'Modèle de CV', type: 'template-picker', required: false },
        { id: 'poste',       label: 'Poste recherché *',            type: 'hybrid-select', placeholder: 'Ou saisir un poste non listé…', required: true,  groups: CV_POSTES_GROUPS },
        { id: 'experience',  label: 'Expériences professionnelles', type: 'textarea',      placeholder: 'Postes occupés, entreprises, durées… (laissez vide si débutant)', required: false },
        { id: 'formation',   label: 'Formation / Diplômes',         type: 'hybrid-select', placeholder: 'Ou saisir un diplôme non listé…', required: false, groups: CV_DIPLOMES_GROUPS },
        { id: 'competences', label: 'Compétences',                  type: 'tags',          placeholder: 'Ajouter vos propres compétences (séparées par des virgules)…', required: false, groups: CV_COMPETENCES_GROUPS },
        { id: 'infos',       label: 'Informations supplémentaires', type: 'textarea',      placeholder: 'Loisirs, disponibilité, mobilité géographique…', required: false }
      ];
    }
  },

  lettre: {
    name: 'Lettre de motivation', icon: '✉️', color: '#10b981', light: '#ecfdf5', price: 5,
    reviewRequired: false,
    choices: [
      { id: 'create',  icon: '✏️', label: 'Créer une lettre',      desc: 'Pour une candidature précise' },
      { id: 'improve', icon: '✨', label: 'Améliorer ma lettre',    desc: 'La rendre plus percutante' },
      { id: 'adapt',   icon: '🔄', label: 'Adapter pour un poste', desc: 'Cibler une offre spécifique' }
    ],
    questions: function(choice) {
      if (choice === 'improve') return [
        { id: 'poste', label: 'Pour quel poste ?',                              type: 'text',     placeholder: 'Poste visé', required: true },
        { id: 'note',  label: 'Ta lettre actuelle + ce que tu veux améliorer', type: 'textarea', placeholder: 'Colle ta lettre ici et décris les améliorations souhaitées…', required: true }
      ];
      if (choice === 'adapt') return [
        { id: 'poste',          label: 'Nouveau poste visé *',  type: 'hybrid-select', placeholder: 'Ou saisir un poste non listé…', required: true, groups: CV_POSTES_GROUPS },
        { id: 'entreprise',     label: 'Entreprise cible *',    type: 'hybrid-select', placeholder: 'Ou saisir une entreprise non listée…', required: true, groups: LETTRE_ENTREPRISES_GROUPS },
        { id: 'secteur_lettre', label: 'Mettez en avant',       type: 'tags',          placeholder: 'Ajouter d\'autres atouts (séparés par des virgules)…', required: false, groups: LETTRE_SECTEUR_TAGS },
        { id: 'note',           label: 'Ta lettre existante',   type: 'textarea',      placeholder: 'Colle ta lettre actuelle ici…', required: true }
      ];
      return [
        { id: 'poste',          label: 'Poste visé *',                     type: 'hybrid-select', placeholder: 'Ou saisir un poste non listé…', required: true, groups: CV_POSTES_GROUPS },
        { id: 'entreprise',     label: 'Entreprise / Organisme *',         type: 'hybrid-select', placeholder: 'Ou saisir une entreprise non listée…', required: true, groups: LETTRE_ENTREPRISES_GROUPS },
        { id: 'secteur_lettre', label: 'Mettez en avant',                  type: 'tags',          placeholder: 'Ajouter d\'autres atouts (séparés par des virgules)…', required: false, groups: LETTRE_SECTEUR_TAGS },
        { id: 'experience',     label: 'Expérience en lien avec ce poste', type: 'textarea',      placeholder: 'Ce qui te qualifie pour ce poste…', required: false },
        { id: 'motivation',     label: 'Pourquoi ce poste t\'intéresse ?', type: 'textarea',      placeholder: 'Ce qui t\'attire dans ce poste ou cette entreprise…', required: false }
      ];
    }
  },

  courrier: {
    name: 'Courrier officiel', icon: '📮', color: '#7c3aed', light: '#f5f3ff', price: 7,
    reviewRequired: false,
    choices: [
      { id: 'demande',      icon: '📋', label: 'Demande',      desc: 'Demander une information ou un document' },
      { id: 'reclamation',  icon: '⚠️', label: 'Réclamation', desc: 'Signaler un problème ou un litige' },
      { id: 'contestation', icon: '⚖️', label: 'Contestation', desc: 'Contester une décision administrative' }
    ],
    questions: function() {
      return [
        { id: 'destinataire', label: 'Destinataire *',      type: 'hybrid-select', placeholder: 'Ou saisir un destinataire non listé…', required: true, groups: COURRIER_DESTINATAIRES_GROUPS },
        { id: 'objet_type',   label: 'Type de courrier *',  type: 'tags',          placeholder: '', required: true, single: true, groups: COURRIER_OBJET_TYPES },
        { id: 'objet',        label: 'Objet du courrier *', type: 'text',          placeholder: 'Résumé en une ligne', required: true },
        { id: 'description',  label: 'Votre situation *',   type: 'textarea',      placeholder: 'Décrivez votre situation et ce que vous demandez…', required: true }
      ];
    }
  },

  dossier: {
    name: 'Dossier administratif', icon: '📁', color: '#f59e0b', light: '#fffbeb', price: 12,
    reviewRequired: false,
    choices: [
      { id: 'caf',      icon: '👶', label: 'CAF / Allocations', desc: 'RSA, APL, allocations familiales…' },
      { id: 'logement', icon: '🏠', label: 'Logement social',   desc: 'HLM, logement d\'urgence…' },
      { id: 'aide',     icon: '🤝', label: 'Aide sociale',      desc: 'Minima sociaux, aides diverses…' },
      { id: 'autre',    icon: '📋', label: 'Autre dossier',     desc: 'Emploi, santé, formation…' }
    ],
    questions: function(choice) {
      const q = [];
      if (choice === 'caf') {
        q.push({ id: 'prestation',    label: 'Type de prestation *',        type: 'tags',   placeholder: '', required: true,  single: true, groups: DOSSIER_CAF_PRESTATIONS });
        q.push({ id: 'situation_pro', label: 'Situation professionnelle *', type: 'tags',   placeholder: '', required: true,  single: true, groups: DOSSIER_CAF_SITUATION_PRO });
        q.push({ id: 'foyer',         label: 'Composition du foyer *',      type: 'tags',   placeholder: '', required: true,  single: true, groups: DOSSIER_CAF_FOYER });
        q.push({ id: 'revenus',       label: 'Revenus annuels déclarés',    type: 'select', options: ['Je ne sais pas / Non déclaré', 'Moins de 5 000 €', '5 000 – 10 000 €', '10 000 – 15 000 €', '15 000 – 20 000 €', 'Plus de 20 000 €'], required: false });
      } else if (choice === 'logement') {
        q.push({ id: 'type_demande',       label: 'Type de demande *',              type: 'tags',   placeholder: '', required: true,  single: true, groups: DOSSIER_LOGEMENT_TYPES });
        q.push({ id: 'departement',        label: 'Département de résidence *',     type: 'text',   placeholder: 'Ex : 973 (Guyane), 75 (Paris)…', required: true });
        q.push({ id: 'anciennete_liste',   label: 'Ancienneté sur liste d\'attente', type: 'select', options: ['Nouvelle demande', 'Moins de 1 an', '1 – 2 ans', '2 – 5 ans', 'Plus de 5 ans'], required: false });
        q.push({ id: 'situation_actuelle', label: 'Situation actuelle',              type: 'tags',   placeholder: '', required: false, groups: DOSSIER_LOGEMENT_SITUATIONS });
      } else if (choice === 'aide') {
        q.push({ id: 'type_aide',       label: 'Type d\'aide recherché *', type: 'tags', placeholder: '', required: true,  groups: DOSSIER_AIDE_TYPES });
        q.push({ id: 'organisme_cible', label: 'Organisme cible *',        type: 'tags', placeholder: '', required: true,  single: true, groups: DOSSIER_AIDE_ORGANISMES });
      } else if (choice === 'autre') {
        q.push({ id: 'type',      label: 'Nature du dossier *',      type: 'text', placeholder: 'Ex : Pôle Emploi, Retraite, Dossier scolaire…', required: true });
        q.push({ id: 'organisme', label: 'Organisme destinataire *', type: 'text', placeholder: 'Ex : Préfecture, MDPH, Mairie…',                required: true });
      }
      q.push({ id: 'description', label: 'Votre situation et votre besoin *', type: 'textarea', placeholder: 'Expliquez ce que vous cherchez à obtenir, votre situation actuelle…', required: true });
      q.push({ id: 'documents',   label: 'Documents que vous avez déjà',      type: 'textarea', placeholder: 'Ex : Carte d\'identité, justificatif de domicile, bulletins de salaire…', required: false });
      return q;
    }
  },

  sejour: {
    name: 'Titre de séjour', icon: '🛂', color: '#ef4444', light: '#fef2f2', price: 15,
    reviewRequired: true,
    reviewMsg: 'Votre dossier a été transmis à notre équipe. Un conseiller vous contactera par email sous 24 à 48h pour valider votre demande et vous guider dans les prochaines étapes.',
    choices: [
      { id: 'premiere',       icon: '🆕', label: 'Première demande',      desc: 'Je n\'ai pas encore de titre de séjour' },
      { id: 'renouvellement', icon: '🔄', label: 'Renouvellement',         desc: 'Mon titre de séjour arrive à expiration' },
      { id: 'regularisation', icon: '⚖️', label: 'Régularisation',        desc: 'Je souhaite régulariser ma situation' },
      { id: 'information',    icon: '❓', label: 'Demande d\'information', desc: 'Comprendre mes droits et démarches' }
    ],
    questions: function() {
      return [
        { id: 'nationalite',      label: 'Nationalité *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Surinamaise…', required: true },
        { id: 'situation',        label: 'Votre situation actuelle *',    type: 'textarea', placeholder: 'Depuis quand êtes-vous en Guyane/France ? Avec quel document ? Quel est votre projet de séjour ?', required: true },
        { id: 'documents',        label: 'Documents dont vous disposez', type: 'textarea', placeholder: 'Passeport, visa, actes d\'état civil, attestation d\'hébergement, contrats de travail…', required: false },
        { id: 'visa_actuel',      label: 'Visa ou titre actuel',          type: 'select',   options: ['Aucun', 'Visa touriste', 'Visa étudiant', 'Visa travail', 'Titre de séjour en cours', 'Autre'], required: false },
        { id: 'date_expiration',  label: 'Date d\'expiration de votre titre/visa actuel', type: 'date', required: false },
        { id: 'duree_presence',   label: 'Durée de présence en France/Guyane',            type: 'select', options: ['Moins de 1 an', '1-2 ans', '2-5 ans', '5-10 ans', 'Plus de 10 ans'], required: false },
        { id: 'situation_pro',    label: 'Situation professionnelle',                      type: 'select', options: ['Sans emploi', 'Salarié', 'Indépendant', 'Étudiant', 'Retraité'], required: false },
        { id: 'historique_refus', label: 'Avez-vous déjà eu un refus de titre de séjour ?', type: 'radio', options: ['oui', 'non'], required: false }
      ];
    }
  },

  impot: {
    name: 'Avis d\'impôt', icon: '🧾', color: '#0369a1', light: '#e0f2fe', price: 10,
    reviewRequired: false,
    choices: [
      { id: 'comprendre', icon: '💡', label: 'Comprendre mon avis',  desc: 'Décoder mon avis d\'imposition ou de non-imposition' },
      { id: 'aide',       icon: '🤝', label: 'Aide liée à l\'impôt', desc: 'Réductions, exonérations, aides CAF, délais de paiement…' },
      { id: 'courrier',   icon: '📮', label: 'Écrire aux impôts',    desc: 'Contester, demander un délai, faire une réclamation' }
    ],
    questions: function(choice) {
      if (choice === 'courrier') return [
        { id: 'destinataire', label: 'Destinataire *',      type: 'text',     placeholder: 'Ex : Trésor Public de Guyane, DGFIP, Centre des impôts de Cayenne…', required: true },
        { id: 'objet',        label: 'Objet du courrier *', type: 'text',     placeholder: 'Ex : Demande de délai de paiement, contestation d\'imposition…', required: true },
        { id: 'description',  label: 'Votre situation *',   type: 'textarea', placeholder: 'Expliquez votre situation et ce que vous demandez…', required: true }
      ];
      return [
        { id: 'type',        label: 'Type d\'avis *',              type: 'text',     placeholder: 'Ex : Avis d\'imposition, avis de non-imposition, taxe foncière…', required: true },
        { id: 'revenus',     label: 'Revenus annuels',              type: 'text',     placeholder: 'Ex : 18 000€/an, RSA uniquement, sans revenus…', required: false },
        { id: 'situation',   label: 'Situation familiale',          type: 'text',     placeholder: 'Ex : Célibataire, marié(e) avec 2 enfants, veuf(ve)…', required: false },
        { id: 'description', label: 'Votre question / demande *',  type: 'textarea', placeholder: 'Qu\'est-ce que vous ne comprenez pas ? Quel type d\'aide cherchez-vous ?', required: true }
      ];
    }
  },

  naturalisation: {
    name: 'Naturalisation', icon: '🇫🇷', color: '#1d4ed8', light: '#eff6ff', price: 20,
    reviewRequired: true,
    reviewMsg: 'Votre dossier a été transmis à notre équipe. Un conseiller spécialisé vous contactera sous 24 à 48h pour analyser votre éligibilité et vous accompagner dans la procédure.',
    choices: [
      { id: 'situation', icon: '🔍', label: 'Vérifier mon éligibilité', desc: 'Suis-je en mesure de faire une demande ?' },
      { id: 'dossier',   icon: '📁', label: 'Préparer mon dossier',      desc: 'Liste complète des documents et étapes à suivre' },
      { id: 'lettre',    icon: '✍️', label: 'Lettre d\'intégration',     desc: 'Rédiger ma lettre de motivation de vie en France' }
    ],
    questions: function(choice) {
      if (choice === 'lettre') return [
        { id: 'nationalite', label: 'Nationalité actuelle *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…', required: true },
        { id: 'duree',       label: 'Durée de résidence en France *',         type: 'text',     placeholder: 'Ex : 5 ans, depuis 2018…', required: true },
        { id: 'parcours',    label: 'Votre parcours en France *',             type: 'textarea', placeholder: 'Vie sociale, emploi, associations, liens avec la France…', required: true },
        { id: 'famille',     label: 'Situation familiale',                    type: 'text',     placeholder: 'Ex : Marié(e) à un(e) Français(e), enfants nés en France…', required: false },
        { id: 'motivation',  label: 'Pourquoi souhaitez-vous la nationalité ?', type: 'textarea', placeholder: 'Vos raisons personnelles, votre attachement aux valeurs françaises…', required: false }
      ];
      return [
        { id: 'nationalite', label: 'Nationalité actuelle *',                 type: 'text',     placeholder: 'Ex : Haïtienne, Brésilienne, Camerounaise…', required: true },
        { id: 'duree',       label: 'Durée de résidence en France *',         type: 'text',     placeholder: 'Ex : 5 ans, depuis 2018…', required: true },
        { id: 'famille',     label: 'Situation familiale',                    type: 'text',     placeholder: 'Ex : Marié(e) à un(e) Français(e), enfants nés en France…', required: false },
        { id: 'travail',     label: 'Situation professionnelle',              type: 'text',     placeholder: 'Ex : CDI, fonctionnaire, auto-entrepreneur, sans emploi…', required: false },
        { id: 'situation',   label: 'Informations complémentaires',           type: 'textarea', placeholder: 'Casier judiciaire vierge ? Niveau de français ? Titre de séjour actuel ?', required: false },
        { id: 'documents',   label: 'Documents dont vous disposez',           type: 'textarea', placeholder: 'Passeport, titre de séjour, actes d\'état civil, diplômes, bulletins de salaire…', required: false }
      ];
    }
  }
};

/* ── IMPORT — choix qui impliquent un document existant ─────── */
const IMPORT_CHOICES = {
  cv:     ['improve', 'pro'],
  lettre: ['improve', 'adapt'],
  sejour: ['renouvellement', 'regularisation'],
  impot:  ['comprendre', 'aide']
};

/* ── TEST MODE — bouton paiement fictif ─────────────────── */
const IS_TEST_MODE = location.hostname === 'localhost'
  || location.hostname === '127.0.0.1'
  || new URLSearchParams(location.search).get('test') === '1';

/* ── PAYPAL — email du compte PayPal Business ────────────── */
const PAYPAL_EMAIL = 'contact@dok-peyi.fr';

/* ── MODIFY DOC — paramètres ─────────────────────────────── */
const FREE_MODIFICATIONS = 2;

/* Sections proposées au panneau de modification, par service.
   Utilisé par _swModifyPanelInit pour peupler #sw-modify-section. */
const MODIFY_SECTIONS = {
  cv: [
    'En-tête (Nom, titre, contact)',
    'Profil / Accroche',
    'Expérience professionnelle',
    'Formation',
    'Compétences',
    'Langues',
    'Centres d\u2019intérêt',
    'Style global / Mise en page'
  ],
  lettre: [
    'En-tête / Coordonnées',
    'Accroche (1er paragraphe)',
    'Pourquoi eux (2e paragraphe)',
    'Pourquoi moi (3e paragraphe)',
    'Projection / Conclusion',
    'Formule de politesse',
    'Style global / Mise en page'
  ],
  courrier: [
    'Expéditeur / Destinataire',
    'Objet',
    'Corps (argumentation)',
    'Références légales',
    'Formule de politesse',
    'Style global / Mise en page'
  ],
  dossier: [
    'Introduction / Résumé',
    'Checklist documents',
    'Étapes de la démarche',
    'Organismes et contacts',
    'Conseils et délais',
    'Style global / Mise en page'
  ],
  sejour: [
    'Analyse de situation',
    'Documents requis',
    'Étapes de la procédure',
    'Organismes et contacts',
    'Avertissements légaux',
    'Style global / Mise en page'
  ],
  impot: [
    'Résumé et verdict',
    'Décomposition de l\u2019avis',
    'Points d\u2019attention',
    'Prochaine étape',
    'Contacts DGFiP',
    'Style global / Mise en page'
  ],
  naturalisation: [
    'Analyse d\u2019éligibilité',
    'Critères vérifiés',
    'Documents requis',
    'Lettre de motivation',
    'Organismes et contacts',
    'Avertissements légaux',
    'Style global / Mise en page'
  ]
};

/* ── STATE ───────────────────────────────────────────────── */
const SSW = {
  svc:             null,
  step:            1,
  choice:          null,
  personal:        { prenom: '', nom: '', email: '', phone: '' },
  details:         {},
  html:            null,
  paid:            false,
  orderId:         null,
  importFile:      null,   // fichier importé { name, type, data }
  importExtracted: null,   // champs extraits par l'IA depuis le document
  modifyCount:     0,      // nombre de modifications CV effectuées
  htmlVersions:    []      // historique des versions HTML avant chaque modification
};

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', swInit);

function swInit() {
  const params = new URLSearchParams(location.search);

  /* ── Retour depuis Stripe Checkout ── */
  if (params.get('success') === '1') {
    const restoredSvc = _swRestoreState();
    if (restoredSvc && SVC[restoredSvc]) {
      _swApplyTheme(restoredSvc);
      SSW.paid = true;
      swClearDraft();
      swSaveOrder();
      swShowConfirm();
      _swSendConfirmationEmail();
      history.replaceState({}, '', '/service?s=' + restoredSvc);
      return;
    }
  }
  if (params.get('cancelled') === '1') {
    const s = params.get('s') || '';
    if (SVC[s]) {
      _swApplyTheme(s);
      _swRestoreState();
      swGoStep(4);
      history.replaceState({}, '', '/service?s=' + s);
      return;
    }
  }

  const s = params.get('s') || '';
  if (!SVC[s]) { location.href = '/'; return; }
  SSW.svc = s;
  _swApplyTheme(s);

  /* Pré-sélection du template CV depuis le paramètre URL (ex: depuis cv-catalogue.html) */
  const tplParam = params.get('template') || '';
  if (tplParam && CV_TEMPLATES[tplParam]) {
    SSW.details = SSW.details || {};
    SSW.details.cv_template = tplParam;
  }

  swRenderChoices();
  swRestoreDraft();
  swGoStep(1);
}

function _swApplyTheme(s) {
  SSW.svc = s;
  const cfg  = SVC[s];
  const root = document.documentElement;
  root.style.setProperty('--sw-color', cfg.color);
  root.style.setProperty('--sw-light', cfg.light);
  const hex = cfg.color.replace('#', '');
  root.style.setProperty('--sw-rgb',
    parseInt(hex.slice(0,2),16) + ',' +
    parseInt(hex.slice(2,4),16) + ',' +
    parseInt(hex.slice(4,6),16));
  document.getElementById('sw-hero-icon').textContent  = cfg.icon;
  document.getElementById('sw-hero-name').textContent  = cfg.name;
  document.getElementById('sw-hero-price').textContent = cfg.price + '€';
  document.title = cfg.name + ' — Dok\'péyi';
}

/* Sauvegarde SSW dans localStorage avant redirection Stripe */
function _swSaveState() {
  try { localStorage.setItem('dok_ssw_pending', JSON.stringify(SSW)); } catch(_) {}
}

/* Restaure SSW depuis localStorage, retourne le service restauré */
function _swRestoreState() {
  try {
    const raw = localStorage.getItem('dok_ssw_pending');
    if (!raw) return null;
    const saved = JSON.parse(raw);
    Object.assign(SSW, saved);
    localStorage.removeItem('dok_ssw_pending');
    return SSW.svc;
  } catch(_) { return null; }
}

/* Envoie l'email de confirmation au client */
async function _swSendConfirmationEmail() {
  try {
    const cfg = SVC[SSW.svc] || {};
    await fetch('/api/send-email', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        type:  'order_confirmation',
        order: {
          id:      SSW.orderId,
          service: SSW.svc,
          prenom:  SSW.personal.prenom,
          nom:     SSW.personal.nom,
          email:   SSW.personal.email,
          montant: cfg.price || 0
        }
      })
    });
  } catch(_) {}
}

/* ── PROGRESS ─────────────────────────────────────────────── */
function swGoStep(n) {
  document.querySelectorAll('.sw-step').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('sw-s' + n);
  if (el) el.classList.add('active');
  SSW.step = n;

  const vis = Math.min(n, 4);
  document.querySelectorAll('.sw-prog-step').forEach(dot => {
    const sn = parseInt(dot.dataset.n);
    dot.classList.remove('active', 'done');
    if (sn < vis)      dot.classList.add('done');
    else if (sn === vis) dot.classList.add('active');
  });

  const prog = document.getElementById('sw-progress');
  if (prog) prog.style.display = n >= 5 ? 'none' : '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── CHOICES ──────────────────────────────────────────────── */
function swRenderChoices() {
  const grid = document.getElementById('sw-choices');
  if (!grid) return;
  grid.innerHTML = SVC[SSW.svc].choices.map(c => `
    <div class="sw-choice" data-id="${c.id}" onclick="swPick('${c.id}',this)">
      <div class="sw-choice-icon">${c.icon}</div>
      <div class="sw-choice-body">
        <div class="sw-choice-name">${c.label}</div>
        <div class="sw-choice-desc">${c.desc}</div>
      </div>
      <div class="sw-choice-chk">○</div>
    </div>`).join('');
}

function swPick(id, el) {
  SSW.choice = id;
  document.querySelectorAll('.sw-choice').forEach(e => {
    e.classList.remove('selected');
    e.querySelector('.sw-choice-chk').textContent = '○';
  });
  el.classList.add('selected');
  el.querySelector('.sw-choice-chk').textContent = '✓';
}

/* ── STEP NAVIGATION ──────────────────────────────────────── */
function swNext(from) {
  if (from === 1) {
    const pr = document.getElementById('sw-prenom');
    const nm = document.getElementById('sw-nom');
    const em = document.getElementById('sw-email');
    if (!pr.value.trim()) { swShake(pr); return; }
    if (!nm.value.trim()) { swShake(nm); return; }
    if (!em.value.trim() || !em.value.includes('@')) { swShake(em); return; }
    if (!SSW.choice) { swShake(document.getElementById('sw-choices')); return; }

    SSW.personal = {
      prenom: pr.value.trim(),
      nom:    nm.value.trim(),
      email:  em.value.trim(),
      phone:  (document.getElementById('sw-phone')?.value || '').trim()
    };
    swSaveDraft();
    swBuildForm();
    swGoStep(2);
    return;
  }

  if (from === 2) {
    let ok = true;
    document.querySelectorAll('#sw-fields [data-req]').forEach(el => {
      if (!el.value.trim()) { swShake(el); ok = false; }
    });
    if (!ok) return;

    SSW.details = {};
    document.querySelectorAll('#sw-fields [data-fid]').forEach(el => {
      SSW.details[el.dataset.fid] = el.value.trim();
    });
    swSaveDraft();
    swGoStep(3);
    swGenerate();
  }
}

/* ── IMPORT FILE HANDLERS ─────────────────────────────────── */

function _swImportStatus(type, msg) {
  const el = document.getElementById('sw-import-status');
  if (!el) return;
  el.className    = 'sw-import-status' + (type ? ' sw-import-status--' + type : '');
  el.textContent  = msg || '';
  el.style.display = msg ? 'block' : 'none';
}

function _swApplyExtracted(ext) {
  const map = { 'sw-prenom': 'prenom', 'sw-nom': 'nom', 'sw-email': 'email', 'sw-phone': 'phone' };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && ext[key]) el.value = ext[key];
  });
}

function swHandleImport(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';

  if (file.size > 3 * 1024 * 1024) {
    swShake(document.querySelector('.sw-import-btn'));
    return;
  }

  /* Affichage immédiat du fichier choisi */
  const chosen = document.getElementById('sw-import-chosen');
  const btn    = document.querySelector('.sw-import-btn');
  const nm     = document.getElementById('sw-import-name');
  if (nm)     nm.textContent       = file.name;
  if (chosen) chosen.style.display = 'flex';
  if (btn)    btn.style.display    = 'none';

  const canAnalyze = file.type === 'application/pdf' || file.type.startsWith('image/');

  if (!canAnalyze) {
    SSW.importFile = { name: file.name, type: file.type };
    _swImportStatus('neutral', 'Document joint · remplissez les champs ci-dessous');
    return;
  }

  _swImportStatus('loading', 'Analyse du document en cours…');

  const reader = new FileReader();
  reader.onload = async e => {
    SSW.importFile = { name: file.name, type: file.type, data: e.target.result };
    try {
      const res  = await fetch('/api/extract-doc', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ file: { data: e.target.result, type: file.type, name: file.name } })
      });
      const data = await res.json();
      if (data.ok && data.extracted) {
        SSW.importExtracted = data.extracted;
        _swApplyExtracted(data.extracted);
        const filled = Object.values(data.extracted).filter(v => v && String(v).trim()).length;
        _swImportStatus(
          filled > 0 ? 'success' : 'neutral',
          filled > 0
            ? 'Informations détectées — vérifiez et modifiez si nécessaire'
            : 'Document joint · remplissez les champs ci-dessous'
        );
      } else {
        _swImportStatus('neutral', 'Document joint · remplissez les champs ci-dessous');
      }
    } catch(_) {
      _swImportStatus('neutral', 'Document joint · remplissez les champs ci-dessous');
    }
  };
  reader.readAsDataURL(file);
}

function swRemoveImport() {
  SSW.importFile      = null;
  SSW.importExtracted = null;
  document.getElementById('sw-import-chosen').style.display = 'none';
  document.querySelector('.sw-import-btn').style.display    = 'flex';
  _swImportStatus('', '');
}

/* ── BUILD FORM (step 2) ──────────────────────────────────── */
function swBuildForm() {
  const questions = SVC[SSW.svc].questions(SSW.choice);
  const titles = {
    cv:             'Vos informations professionnelles',
    lettre:         'Votre candidature',
    courrier:       'Votre courrier officiel',
    dossier:        'Votre dossier administratif',
    sejour:         'Votre situation',
    impot:          'Votre demande',
    naturalisation: 'Votre dossier de naturalisation'
  };
  document.getElementById('sw-q-title').textContent = titles[SSW.svc] || 'Informations';

  /* Bouton import — uniquement si le choix implique un document existant */
  const showImport = (IMPORT_CHOICES[SSW.svc] || []).includes(SSW.choice);

  const importHtml = showImport ? `
    <div class="sw-import-wrap">
      <input type="file" id="sw-import-input" accept=".pdf,.jpg,.jpeg,.png"
             style="display:none" onchange="swHandleImport(this)">
      <button type="button" class="sw-import-btn"
              onclick="document.getElementById('sw-import-input').click()">
        <span class="sw-import-icon">⬆️</span>
        <span>
          <span class="sw-import-title">Gagnez du temps — importer votre document</span>
          <span class="sw-import-hint">PDF ou image · max 3 Mo · facultatif</span>
        </span>
      </button>
      <div class="sw-import-chosen" id="sw-import-chosen" style="display:none">
        <span>📄</span><span id="sw-import-name"></span>
        <button type="button" onclick="swRemoveImport()">✕</button>
      </div>
      <div class="sw-import-status" id="sw-import-status" style="display:none"></div>
    </div>` : '';

  document.getElementById('sw-fields').innerHTML = importHtml + questions.map(q => {
    const req = q.required ? 'data-req="1"' : '';
    let field;
    if (q.type === 'textarea') {
      field = `<textarea id="sw-f-${q.id}" data-fid="${q.id}" ${req}
                 placeholder="${escSw(q.placeholder || '')}" rows="4"></textarea>`;
    } else if (q.type === 'select') {
      const opts = (q.options || []).map(o => `<option value="${escSw(o)}">${escSw(o)}</option>`).join('');
      field = `<select id="sw-f-${q.id}" data-fid="${q.id}" ${req}>
                 <option value="">— Choisir —</option>${opts}
               </select>`;
    } else if (q.type === 'date') {
      field = `<input type="date" id="sw-f-${q.id}" data-fid="${q.id}" ${req}>`;
    } else if (q.type === 'radio') {
      const opts = (q.options || []).map(o =>
        `<label class="sw-radio"><input type="radio" name="sw-r-${q.id}" value="${escSw(o)}"
           onchange="document.getElementById('sw-f-${q.id}').value=this.value"> ${escSw(o)}</label>`
      ).join('');
      field = `<div class="sw-radio-group">${opts}</div>
               <input type="hidden" id="sw-f-${q.id}" data-fid="${q.id}" ${req}>`;
    } else if (q.type === 'hybrid-select') {
      const groups = (q.groups || []).map(g =>
        `<optgroup label="${escSw(g.label)}">${g.options.map(o =>
          `<option value="${escSw(o)}">${escSw(o)}</option>`
        ).join('')}</optgroup>`
      ).join('');
      field = `<div class="sw-hybrid">
                 <select class="sw-hybrid-select" onchange="swHybridPick('${q.id}', this.value); this.selectedIndex=0;">
                   <option value="">— Choisir dans la liste —</option>
                   ${groups}
                   <option value="__autre__">Autre (préciser ci-dessous)</option>
                 </select>
                 <input type="text" class="sw-hybrid-input" id="sw-f-${q.id}" data-fid="${q.id}" ${req}
                        placeholder="${escSw(q.placeholder || '')}">
               </div>`;
    } else if (q.type === 'tags') {
      const isSingle = !!q.single;
      const groups = (q.groups || []).map(g =>
        `<div class="sw-tags-cat">
           ${g.label ? `<div class="sw-tags-cat-title">${escSw(g.label)}</div>` : ''}
           <div class="sw-tags-cat-btns">
             ${g.options.map(o => `<button type="button" class="sw-tag-btn" data-tag="${escSw(o)}">${isSingle ? '' : '+ '}${escSw(o)}</button>`).join('')}
           </div>
         </div>`
      ).join('');
      const freeField = isSingle ? '' : `<textarea class="sw-tags-free" id="sw-tags-free-${q.id}" rows="2"
                           placeholder="${escSw(q.placeholder || '')}"
                           oninput="swTagsSync('${q.id}')"></textarea>`;
      field = `<div class="sw-tags-wrap${isSingle ? ' sw-tags-wrap--single' : ''}" id="sw-tags-wrap-${q.id}" data-single="${isSingle ? '1' : '0'}">
                 <div class="sw-tags-chips" id="sw-tags-chips-${q.id}" data-selected="[]"></div>
                 ${groups}
                 ${freeField}
                 <input type="hidden" id="sw-f-${q.id}" data-fid="${q.id}" ${req}>
               </div>`;
    } else if (q.type === 'template-picker') {
      const cards = Object.values(CV_TEMPLATES).map(t => {
        const priceHtml = t.prix === 0
          ? '<span class="sw-tpl-price sw-tpl-price--free">Inclus</span>'
          : `<span class="sw-tpl-price sw-tpl-price--paid">+${t.prix}€</span>`;
        return `<div class="sw-tpl-card" data-tpl="${escSw(t.id)}" onclick="swTplSelect('${escSw(t.id)}')">
                  <div class="sw-tpl-swatch sw-tpl-swatch--${escSw(t.id)}"></div>
                  <div class="sw-tpl-info">
                    <span class="sw-tpl-name">${escSw(t.nom)}</span>${priceHtml}
                    <span class="sw-tpl-desc">${escSw(t.description)}</span>
                  </div>
                </div>`;
      }).join('');
      field = `<div class="sw-tpl-wrap" id="sw-tpl-wrap">
                 <div class="sw-tpl-grid">${cards}</div>
                 <a href="/cv-catalogue" target="_blank" class="sw-tpl-catalogue-link">
                   Voir le catalogue complet →
                 </a>
                 <input type="hidden" id="sw-f-${q.id}" data-fid="${q.id}" value="classique">
               </div>`;
    } else {
      field = `<input type="text" id="sw-f-${q.id}" data-fid="${q.id}" ${req}
                 placeholder="${escSw(q.placeholder || '')}">`;
    }
    return `<div class="sw-fg"><label for="sw-f-${q.id}">${escSw(q.label)}</label>${field}</div>`;
  }).join('');

  /* Brancher les boutons de tag (event delegation évitée au profit d'un câblage direct) */
  document.querySelectorAll('#sw-fields .sw-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.sw-tags-wrap');
      if (wrap) swTagAdd(wrap.id.replace('sw-tags-wrap-', ''), btn.dataset.tag);
    });
  });

  /* Initialiser le template-picker : sélectionner la valeur courante */
  if (document.getElementById('sw-tpl-wrap')) {
    const stored = (SSW.details && SSW.details.cv_template) || 'classique';
    swTplSelect(CV_TEMPLATES[stored] ? stored : 'classique');
  }

  /* Restaurer l'état visuel de l'import si retour depuis l'étape 3 */
  if (showImport && SSW.importFile) {
    document.getElementById('sw-import-name').textContent     = SSW.importFile.name;
    document.getElementById('sw-import-chosen').style.display = 'flex';
    document.querySelector('.sw-import-btn').style.display    = 'none';
    if (SSW.importExtracted) {
      const filled = Object.values(SSW.importExtracted).filter(v => v?.trim()).length;
      _swImportStatus(
        filled > 0 ? 'success' : 'neutral',
        filled > 0 ? 'Informations détectées — vérifiez et modifiez si nécessaire'
                   : 'Document joint · remplissez les champs ci-dessous'
      );
    }
  }

  /* Pré-remplissage depuis extraction (si pas déjà rempli manuellement) */
  if (SSW.importExtracted) {
    Object.entries(SSW.importExtracted).forEach(([k, v]) => {
      const el = document.getElementById('sw-f-' + k);
      if (el && v && !el.value) el.value = v;
    });
  }

  /* Restore values if returning from step 3 (prioritaire sur l'extraction) */
  Object.entries(SSW.details).forEach(([k, v]) => {
    const el = document.getElementById('sw-f-' + k);
    if (el && v) {
      el.value = v;
      /* Si c'est un champ radio (hidden input), cocher le bouton correspondant */
      if (el.type === 'hidden') {
        const radio = document.querySelector(`input[name="sw-r-${k}"][value="${v}"]`);
        if (radio) radio.checked = true;
      }
    }
  });

  /* Restaurer les champs tags : la valeur stockée est remise dans la zone libre
     (on ne tente pas de re-cocher les tags pour éviter une parse ambiguë). */
  document.querySelectorAll('#sw-fields .sw-tags-wrap').forEach(wrap => {
    const id = wrap.id.replace('sw-tags-wrap-', '');
    const stored = (SSW.details[id] || '').trim();
    const isSingle = wrap.dataset.single === '1';
    if (isSingle) {
      if (stored) {
        const chips = wrap.querySelector('.sw-tags-chips');
        chips.dataset.selected = JSON.stringify([stored]);
        _swRenderChips(id);
        wrap.querySelectorAll('.sw-tag-btn').forEach(b => {
          b.classList.toggle('sw-tag-btn--added', b.dataset.tag === stored);
        });
      }
    } else {
      const free = wrap.querySelector('.sw-tags-free');
      if (free && stored && !free.value) free.value = stored;
    }
    swTagsSync(id);
  });
}

/* ── HYBRID-SELECT + TAGS HELPERS ─────────────────────────── */

/** Sélection dans un <select> hybride : copie la valeur dans l'input texte associé. */
function swHybridPick(id, val) {
  const input = document.getElementById('sw-f-' + id);
  if (!input) return;
  if (val && val !== '__autre__') {
    input.value = val;
  } else if (val === '__autre__') {
    input.value = '';
    input.focus();
  }
}

/** Ajoute un tag à la sélection d'un champ "tags". */
function swTagAdd(id, tag) {
  const wrap = document.getElementById('sw-tags-wrap-' + id);
  if (!wrap || !tag) return;
  const chips = wrap.querySelector('.sw-tags-chips');
  const isSingle = wrap.dataset.single === '1';
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  if (isSingle) {
    if (selected.length === 1 && selected[0] === tag) return;
    selected = [tag];
    chips.dataset.selected = JSON.stringify(selected);
    _swRenderChips(id);
    wrap.querySelectorAll('.sw-tag-btn').forEach(b => {
      b.classList.toggle('sw-tag-btn--added', b.dataset.tag === tag);
    });
    swTagsSync(id);
    return;
  }
  if (selected.includes(tag)) return;
  selected.push(tag);
  chips.dataset.selected = JSON.stringify(selected);
  _swRenderChips(id);
  wrap.querySelectorAll('.sw-tag-btn').forEach(b => {
    if (b.dataset.tag === tag) b.classList.add('sw-tag-btn--added');
  });
  swTagsSync(id);
}

/** Retire un tag de la sélection. */
function swTagRemove(id, tag) {
  const wrap = document.getElementById('sw-tags-wrap-' + id);
  if (!wrap) return;
  const chips = wrap.querySelector('.sw-tags-chips');
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  selected = selected.filter(t => t !== tag);
  chips.dataset.selected = JSON.stringify(selected);
  _swRenderChips(id);
  wrap.querySelectorAll('.sw-tag-btn').forEach(b => {
    if (b.dataset.tag === tag) b.classList.remove('sw-tag-btn--added');
  });
  swTagsSync(id);
}

/** Rerend les chips pour un champ tags à partir de dataset.selected. */
function _swRenderChips(id) {
  const chips = document.getElementById('sw-tags-chips-' + id);
  if (!chips) return;
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  chips.innerHTML = selected.map(t =>
    `<span class="sw-tag-chip" data-tag="${escSw(t)}">${escSw(t)}<button type="button" aria-label="Retirer">✕</button></span>`
  ).join('');
  chips.querySelectorAll('.sw-tag-chip button').forEach(btn => {
    btn.addEventListener('click', () => {
      const chip = btn.closest('.sw-tag-chip');
      if (chip) swTagRemove(id, chip.dataset.tag);
    });
  });
}

/** Synchronise le champ caché (data-fid) d'un champ tags avec les tags + le texte libre. */
function swTagsSync(id) {
  const wrap   = document.getElementById('sw-tags-wrap-' + id);
  const hidden = document.getElementById('sw-f-' + id);
  if (!wrap || !hidden) return;
  const chips = wrap.querySelector('.sw-tags-chips');
  const free  = wrap.querySelector('.sw-tags-free');
  const isSingle = wrap.dataset.single === '1';
  let selected;
  try { selected = JSON.parse(chips.dataset.selected || '[]'); } catch(_) { selected = []; }
  if (isSingle) {
    hidden.value = selected[0] || '';
    return;
  }
  const joined  = selected.join(', ');
  const freeTxt = (free && free.value || '').trim();
  hidden.value = [joined, freeTxt].filter(Boolean).join(' · ');
}

/** Sélectionne un template CV dans le picker inline. */
function swTplSelect(id) {
  if (!CV_TEMPLATES[id]) return;
  const hidden = document.getElementById('sw-f-cv_template');
  if (hidden) hidden.value = id;
  document.querySelectorAll('#sw-tpl-wrap .sw-tpl-card').forEach(c => {
    c.classList.toggle('sw-tpl-card--selected', c.dataset.tpl === id);
  });
}

/* ── MODIFY DOC ───────────────────────────────────────────── */

/** Initialise / réinitialise le panneau de modification. */
function _swModifyPanelInit() {
  var panel = document.getElementById('sw-modify-panel');
  if (!panel) return;
  /* Panneau visible pour tous les services avec sections configurées,
     sauf sous-type 'improve' qui part déjà d'un document existant amélioré. */
  var sections  = MODIFY_SECTIONS[SSW.svc] || null;
  var showPanel = !!sections && SSW.choice !== 'improve';
  panel.style.display = showPanel ? 'block' : 'none';
  if (!showPanel) return;

  /* Peupler dynamiquement le select avec les sections du service actif */
  var select = document.getElementById('sw-modify-section');
  if (select) {
    select.innerHTML = '<option value="">— Choisir une section —</option>'
      + sections.map(function(s) {
          return '<option value="' + escSw(s) + '">' + escSw(s) + '</option>';
        }).join('');
    select.value = '';
  }

  _swModifyUpdateCounter();
  document.getElementById('sw-modify-history').innerHTML = '<p class="sw-modify-history-empty">Version originale disponible</p>';
}

/** Met à jour le badge compteur et l'état du bouton. */
function _swModifyUpdateCounter() {
  var remaining = FREE_MODIFICATIONS - SSW.modifyCount;
  var counter   = document.getElementById('sw-modify-counter');
  var btn       = document.getElementById('sw-modify-btn');
  var exhausted = document.getElementById('sw-modify-exhausted');
  if (!counter) return;
  if (remaining > 0) {
    counter.textContent  = remaining + ' modification' + (remaining > 1 ? 's' : '') + ' gratuite' + (remaining > 1 ? 's' : '') + ' restante' + (remaining > 1 ? 's' : '');
    counter.className    = 'sw-modify-counter sw-modify-counter--ok';
    if (btn) btn.disabled = false;
    if (exhausted) exhausted.style.display = 'none';
  } else {
    counter.textContent  = 'Modifications gratuites épuisées';
    counter.className    = 'sw-modify-counter sw-modify-counter--exhausted';
    if (btn) btn.disabled = true;
    if (exhausted) {
      exhausted.style.display = 'block';
      exhausted.innerHTML = '⚠️ Vous avez utilisé vos ' + FREE_MODIFICATIONS + ' modifications gratuites. Une option +2€ sera bientôt disponible pour continuer à affiner votre document.';
    }
  }
}

/** Applique une modification ciblée sur le document courant. */
async function swModifyDoc() {
  if (SSW.modifyCount >= FREE_MODIFICATIONS) return;

  var section     = (document.getElementById('sw-modify-section')?.value     || '').trim();
  var instruction = (document.getElementById('sw-modify-instruction')?.value || '').trim();
  var btn         = document.getElementById('sw-modify-btn');

  if (!section) {
    swShake(document.getElementById('sw-modify-section'));
    return;
  }
  if (!instruction) {
    swShake(document.getElementById('sw-modify-instruction'));
    return;
  }

  /* Sauvegarder la version actuelle avant modification */
  SSW.htmlVersions.push({ n: SSW.modifyCount + 1, section: section, html: SSW.html });

  /* UI : loader */
  if (btn) { btn.disabled = true; btn.textContent = 'Modification en cours…'; }

  var prompt =
    'Tu es un expert en CV professionnels.\n'
    + 'Voici un CV HTML. Effectue UNIQUEMENT la modification demandée '
    + 'sur la section indiquée. Ne modifie rien d\'autre.\n\n'
    + 'SECTION À MODIFIER : ' + section + '\n'
    + 'INSTRUCTION : ' + instruction + '\n\n'
    + 'RÈGLES ABSOLUES :\n'
    + '- Conserve exactement le même style CSS et la même structure HTML\n'
    + '- Conserve toutes les autres sections intactes\n'
    + '- Si l\'instruction est impossible ou incohérente, retourne le HTML '
    + 'original sans modification\n'
    + '- Réponds UNIQUEMENT avec le HTML complet modifié\n\n'
    + 'CV ACTUEL :\n' + SSW.html;

  try {
    var modified = await swCallAgent(
      'Tu es un expert en CV professionnels. Tu modifies uniquement la section demandée sans toucher au reste.',
      prompt
    );
    SSW.html = modified;
    var iframe = document.getElementById('sw-iframe');
    if (iframe) { iframe.srcdoc = SSW.html; swScaleFrame(); }

    SSW.modifyCount++;
    _swModifyUpdateCounter();
    _swModifyAddHistory(SSW.htmlVersions.length - 1, section);

    /* Réactiver le bouton si modifications restantes */
    if (btn) {
      btn.textContent = 'Appliquer la modification';
      btn.disabled    = SSW.modifyCount >= FREE_MODIFICATIONS;
    }
    /* Réinitialiser les champs */
    var sel = document.getElementById('sw-modify-section');
    var txt = document.getElementById('sw-modify-instruction');
    if (sel) sel.value = '';
    if (txt) txt.value = '';
  } catch(err) {
    /* Restaurer la version sauvegardée en cas d'erreur */
    SSW.htmlVersions.pop();
    if (btn) { btn.textContent = 'Appliquer la modification'; btn.disabled = false; }
    var errDiv = document.getElementById('sw-modify-exhausted');
    if (errDiv) {
      errDiv.style.display = 'block';
      errDiv.innerHTML = '⚠️ Erreur lors de la modification. Réessayez.';
    }
  }
}

/** Ajoute une entrée dans l'historique des versions. */
function _swModifyAddHistory(versionIdx, section) {
  var histDiv = document.getElementById('sw-modify-history');
  if (!histDiv) return;
  var n   = versionIdx + 1;
  var existing = histDiv.querySelector('.sw-modify-history-empty');
  if (existing) existing.remove();

  var item = document.createElement('div');
  item.className = 'sw-modify-history-item';
  item.innerHTML =
    '<span class="sw-modify-history-label">Version ' + n + ' — ' + escSw(section) + ' modifiée</span>'
    + '<button type="button" class="sw-modify-restore-btn">Restaurer</button>';
  item.querySelector('.sw-modify-restore-btn').addEventListener('click', function() {
    swRestoreVersion(versionIdx);
  });
  histDiv.insertBefore(item, histDiv.firstChild);
}

/** Restaure une version précédente du CV. */
function swRestoreVersion(versionIdx) {
  var entry = SSW.htmlVersions[versionIdx];
  if (!entry) return;
  SSW.html = entry.html;
  var iframe = document.getElementById('sw-iframe');
  if (iframe) { iframe.srcdoc = SSW.html; swScaleFrame(); }
  /* Marquer la version restaurée dans l'historique */
  var items = document.querySelectorAll('#sw-modify-history .sw-modify-history-item');
  if (items[SSW.htmlVersions.length - 1 - versionIdx]) {
    items[SSW.htmlVersions.length - 1 - versionIdx].classList.add('sw-modify-history-item--restored');
  }
}

/* ── PIPELINE HELPERS ─────────────────────────────────────── */

/** Lit le system prompt d'un agent depuis localStorage (configurable par admin). */
function swGetAgentPrompt(agentId) {
  try {
    const agents = JSON.parse(localStorage.getItem('dok_ai_agents') || '[]');
    const agent  = agents.find(function(a) { return a.id === agentId; });
    if (agent && agent.systemPrompt) return agent.systemPrompt;
  } catch(_) {}
  const defaults = {
    emma:   "Tu es un expert en rédaction de documents professionnels. Tu génères des documents HTML complets, clairs, sans fautes, richement structurés et adaptés au profil exact du client. Tu ne produis que du HTML autonome, jamais de texte seul.",
    sofia:  "Tu es un expert en optimisation de documents professionnels. Améliore ce document HTML pour un impact maximal : formulations percutantes, mise en valeur des points forts, contenu enrichi. Retourne UNIQUEMENT le HTML complet optimisé, sans aucun commentaire.",
    lea:    "Tu es un expert en mise en page et design de documents professionnels. Améliore la présentation visuelle de ce document HTML : mise en page soignée, typographie cohérente, espacement harmonieux, lisibilité optimale, impact visuel professionnel. Ne modifie pas le contenu rédactionnel. Retourne UNIQUEMENT le HTML complet mis en forme, sans aucun commentaire.",
    viktor: "Tu es un validateur expert. Vérifie ce document HTML, corrige les dernières erreurs (orthographe, cohérence, qualité finale). Retourne UNIQUEMENT le HTML complet validé, sans aucun commentaire, sans texte hors du HTML."
  };
  return defaults[agentId] || '';
}

/** Crée une demande vide dans Firebase dès le début de la génération. */
function swCreatePendingOrder() {
  const now = new Date();
  const id  = Date.now();
  const pad = function(n) { return String(n).padStart(2, '0'); };
  SSW.orderId   = id;
  SSW.orderDate = now.toISOString();
  var demande = {
    id:      id,
    service: SSW.svc,
    date:    now.toISOString().split('T')[0],
    heure:   pad(now.getHours()) + ':' + pad(now.getMinutes()),
    statut:  'submitted',
    note:    '',
    details: Object.assign({}, SSW.details, { 'sw-choice': SSW.choice })
  };
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
      firebase.database().ref('dok-peyi/demandes/' + id).set(demande);
  } catch(_) {}
}

/** Stocke les versions avant/après du Pôle Qualité dans Firebase. */
function swPipelineUpdatePQ(inputHtml, outputHtml) {
  if (!SSW.orderId) return;
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      firebase.database().ref('dok-peyi/demandes/' + SSW.orderId + '/_pq').set({
        statut:     'termine',
        inputHtml:  inputHtml,
        outputHtml: outputHtml,
        comment:    ''
      });
    }
  } catch(_) {}
}

/** Met à jour statut + événement _aiTeam dans Firebase en temps réel. */
function swPipelineUpdate(statut, aiKey, agentId, label) {
  if (!SSW.orderId) return;
  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      var ref = firebase.database().ref('dok-peyi/demandes/' + SSW.orderId);
      var at  = new Date().toISOString();
      if (statut) ref.child('statut').set(statut);
      if (aiKey && agentId) ref.child('_aiTeam/' + aiKey).set({ aiId: agentId, at: at, label: label });
    }
  } catch(_) {}
}

/** Appel API vers un agent spécifique avec son system prompt. */
async function swCallAgent(systemPrompt, userPrompt) {
  var controller = new AbortController();
  var timeout    = setTimeout(function() { controller.abort(); }, 45000);
  try {
    var res = await fetch('/api/generate-cv', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ prompt: userPrompt, systemPrompt: systemPrompt }),
      signal:  controller.signal
    });
    clearTimeout(timeout);
    var data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.cv || '').replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  } catch(err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('timeout');
    throw err;
  }
}

/* ── GENERATE — pipeline 4 agents ────────────────────────── */
async function swGenerate() {
  var loading = document.getElementById('sw-loading');
  var preview = document.getElementById('sw-preview');
  if (loading) { loading.style.display = 'flex'; loading.innerHTML = _loadingHTML(); }
  if (preview) preview.style.display = 'none';

  var updateMsg = function(txt) {
    var el = document.getElementById('sw-loading-msg');
    if (el) el.textContent = txt;
  };

  try {
    /* ── Créer la demande dans Firebase avant de commencer ── */
    swCreatePendingOrder();

    /* ── LUCAS — accueil (instant, pas d'appel IA) ── */
    updateMsg('Demande reçue');
    swPipelineUpdate('submitted', 'accueil', 'lucas', 'Demande reçue et collectée');
    await new Promise(function(r) { setTimeout(r, 600); });

    /* ── EMMA — génération du document ── */
    updateMsg('En préparation…');
    swPipelineUpdate('processing', null, null, null);
    var emmaResult = await swCallAgent(swGetAgentPrompt('emma'), swBuildPrompt());
    swPipelineUpdate('generated', 'generation', 'emma', 'Document rédigé');

    /* ── SOFIA — optimisation du brouillon ── */
    updateMsg('En cours de vérification…');
    swPipelineUpdate('pret_paiement', 'optimisation', 'sofia', 'Optimisation en cours');
    var sofiaPrompt = 'Optimise ce document HTML pour un impact maximal et une présentation impeccable. '
      + 'Améliore la fluidité du texte, l\'impact des formulations, la mise en forme. '
      + 'Retourne uniquement le HTML complet optimisé, sans aucun commentaire :\n\n' + emmaResult;
    var sofiaResult = await swCallAgent(swGetAgentPrompt('sofia'), sofiaPrompt);
    swPipelineUpdate('pret_paiement', 'optimisation', 'sofia', 'Optimisation terminée');

    /* ── LÉA — Pôle Qualité & Présentation ── */
    updateMsg('Mise en forme professionnelle…');   // client ne voit pas "IA"
    swPipelineUpdate('pole_qualite', 'presentation', 'lea', 'Mise en forme professionnelle en cours');
    var leaPrompt = 'Améliore la mise en page, la lisibilité, la structure et l\'harmonie visuelle de ce document HTML. '
      + 'Ne modifie pas le contenu rédactionnel. Améliore uniquement la présentation (espacement, typographie, hiérarchie visuelle, couleurs professionnelles, impact visuel). '
      + 'Retourne uniquement le HTML complet mis en forme, sans aucun commentaire :\n\n' + sofiaResult;
    var leaResult = await swCallAgent(swGetAgentPrompt('lea'), leaPrompt);
    /* Stocker avant/après pour la comparaison admin */
    swPipelineUpdatePQ(sofiaResult, leaResult);
    swPipelineUpdate('pole_qualite', 'presentation', 'lea', 'Mise en forme terminée');

    /* ── VIKTOR — validation finale ── */
    updateMsg('Prêt — finalisation…');
    swPipelineUpdate('a_verifier', 'verification', 'viktor', 'Validation finale en cours');
    var viktorPrompt = 'Voici un document HTML à valider. '
      + 'Corrige les éventuelles erreurs restantes (orthographe, grammaire, cohérence) et assure-toi de la qualité finale. '
      + 'Retourne uniquement le HTML complet validé, sans aucun commentaire :\n\n' + leaResult;
    var viktorResult = await swCallAgent(swGetAgentPrompt('viktor'), viktorPrompt);
    swPipelineUpdate('valide_manager', 'verification', 'viktor', 'Document validé et approuvé');

    SSW.html         = viktorResult;
    SSW.generatedAt  = new Date().toISOString();
    SSW.modifyCount  = 0;
    SSW.htmlVersions = [];

    /* ── Afficher le document final ── */
    if (loading) loading.style.display = 'none';
    if (preview) {
      preview.style.display = 'block';
      var iframe = document.getElementById('sw-iframe');
      if (iframe) {
        iframe.srcdoc  = SSW.html;
        iframe.onload  = swScaleFrame;
        swScaleFrame();
      }
    }
    _swModifyPanelInit();
  } catch(e) {
    var isTimeout  = e.message === 'timeout';
    var isOffline  = !navigator.onLine || e.message.toLowerCase().includes('network') || e.message.toLowerCase().includes('fetch');
    var userMsg    = isTimeout  ? 'La génération a pris trop de temps. Nos serveurs sont occupés, réessayez dans quelques instants.'
                  : isOffline  ? 'Impossible de contacter nos serveurs. Vérifiez votre connexion internet, puis réessayez.'
                  : 'Une erreur est survenue lors de la génération. Réessayez ou revenez en arrière pour modifier vos informations.';
    if (loading) loading.innerHTML =
      '<div style="text-align:center;padding:32px 20px">'
      + '<div style="font-size:2.5rem;margin-bottom:14px">' + (isOffline ? '📡' : '⚠️') + '</div>'
      + '<div style="color:#dc2626;font-weight:700;font-size:1rem;margin-bottom:10px">Génération interrompue</div>'
      + '<div style="color:#64748b;font-size:.87rem;line-height:1.6;margin-bottom:24px;max-width:320px;margin-left:auto;margin-right:auto">' + escSw(userMsg) + '</div>'
      + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
      + '<button class="sw-btn-ghost" onclick="swGoStep(2)">← Modifier mes infos</button>'
      + '<button class="sw-btn-next" onclick="swGenerate()">Réessayer →</button>'
      + '</div></div>';
  }
}

function _loadingHTML() {
  return '<div class="sw-spinner"></div>'
    + '<div class="sw-loading-msg" id="sw-loading-msg">Demande reçue</div>'
    + '<div class="sw-loading-sub">Nous préparons votre document — cela prend quelques instants.</div>';
}

/* ── A4 SCALE ─────────────────────────────────────────────── */
function swScaleFrame() {
  const wrap  = document.getElementById('sw-a4-wrap');
  const frame = document.getElementById('sw-iframe');
  if (!wrap || !frame) return;
  const A4W = 794, A4H = 1123;
  const scale = Math.min(1, (wrap.clientWidth || 680) / A4W);
  frame.style.width           = A4W + 'px';
  frame.style.height          = A4H + 'px';
  frame.style.transform       = `scale(${scale})`;
  frame.style.transformOrigin = 'top left';
  wrap.style.height           = Math.ceil(A4H * scale) + 'px';
}
window.addEventListener('resize', () => { if (SSW.step === 3 && SSW.html) swScaleFrame(); });

/* ── BUILD PROMPT ─────────────────────────────────────────── */
function swBuildPrompt() {
  let prompts = {};
  try { prompts = JSON.parse(localStorage.getItem('dok_ai_prompts') || '{}'); } catch(e) {}

  /* Résolution de clé : impot et naturalisation ont un prompt par sous-type */
  const key = SSW.svc === 'cv'
    ? (SSW.choice === 'improve' ? 'cv_improve' : 'cv_scratch')
    : (SSW.svc === 'impot' || SSW.svc === 'naturalisation')
    ? SSW.svc + '_' + SSW.choice
    : SSW.svc;

  const tpl = (prompts[key] && prompts[key].trim()) ? prompts[key] : (swDefaultPrompts()[key] || swFallbackPrompt());

  const d = SSW.details, p = SSW.personal;

  /* Résolution du style de template CV (défaut : classique) */
  const _cvTplId    = (d.cv_template && CV_TEMPLATES[d.cv_template]) ? d.cv_template : 'classique';
  const _cvTplStyle = CV_TEMPLATES[_cvTplId].style;

  /* Contexte dossier : agrège les champs spécifiques par sous-type */
  const _dossierParts = [];
  if (d.prestation)        _dossierParts.push('Prestation : ' + d.prestation);
  if (d.situation_pro)     _dossierParts.push('Situation pro : ' + d.situation_pro);
  if (d.foyer)             _dossierParts.push('Foyer : ' + d.foyer);
  if (d.type_demande)      _dossierParts.push('Type demande : ' + d.type_demande);
  if (d.departement)       _dossierParts.push('Département : ' + d.departement);
  if (d.anciennete_liste)  _dossierParts.push('Ancienneté liste : ' + d.anciennete_liste);
  if (d.situation_actuelle)_dossierParts.push('Situation actuelle : ' + d.situation_actuelle);
  if (d.type_aide)         _dossierParts.push('Type aide : ' + d.type_aide);
  if (d.organisme_cible)   _dossierParts.push('Organisme cible : ' + d.organisme_cible);
  if (d.organisme)         _dossierParts.push('Organisme : ' + d.organisme);
  const _dossierContexte = _dossierParts.join(' | ');

  const vars = {
    nom:              (p.prenom + ' ' + p.nom).trim(),
    email:            p.email           || '',
    tel:              p.phone           || '',
    poste:            d.poste           || '',
    experience:       d.experience      || '',
    formation:        d.formation       || '',
    competences:      d.competences     || '',
    infos:            d.infos           || '',
    note:             d.note            || '',
    entreprise:       d.entreprise      || '',
    motivation:       d.motivation      || '',
    type:             d.type            || (SSW.choice !== 'autre' ? SSW.choice : '') || '',
    description:      d.description     || '',
    documents:        d.documents       || '',
    destinataire:     d.destinataire    || '',
    objet:            d.objet           || '',
    nationalite:      d.nationalite     || '',
    situation:        d.situation       || '',
    choix:            SSW.choice        || '',
    revenus:          d.revenus         || '',
    duree:            d.duree           || '',
    famille:          d.famille         || '',
    travail:          d.travail         || '',
    parcours:         d.parcours        || '',
    visa_actuel:      d.visa_actuel     || '',
    date_expiration:  d.date_expiration || '',
    duree_presence:   d.duree_presence  || '',
    situation_pro:    d.situation_pro   || '',
    historique_refus: d.historique_refus|| '',
    cv_template_style: _cvTplStyle,
    dossier_contexte:  _dossierContexte,
    foyer:             d.foyer             || '',
    prestation:        d.prestation        || '',
    type_demande:      d.type_demande      || '',
    departement:       d.departement       || '',
    anciennete_liste:  d.anciennete_liste  || '',
    situation_actuelle:d.situation_actuelle|| '',
    type_aide:         d.type_aide         || '',
    organisme_cible:   d.organisme_cible   || '',
    organisme:         d.organisme         || ''
  };

  const result = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : '');

  const importNote = SSW.importFile
    ? `\n\n[Document importé par le client : ${SSW.importFile.name}. Utilise ce document comme base et applique les demandes ci-dessus.]`
    : '';

  return result + importNote;
}

/* ── DEFAULT PROMPTS (si admin n'a pas configuré) ─────────── */
function swDefaultPrompts() {
  const FOOTER = '\nRéponds UNIQUEMENT avec le code HTML complet (<!DOCTYPE html> … </html>). Zéro texte avant ou après.';
  const SYS    = 'Tu es un assistant administratif professionnel. Ta mission : créer un document clair, structuré et adapté. Règles : ne pas inventer d\'informations · corriger les fautes · être simple et compréhensible · produire un document prêt à l\'emploi.';
  return {
    cv_scratch: `Tu es Emma, experte CV chez Dok'péyi.
Génère un CV HTML complet CSS-inline format A4.
{{cv_template_style}}
Client : {{nom}} | Email : {{email}} | Tél : {{tel}}
Poste recherché : {{poste}}
Expériences : {{experience}}
Formation : {{formation}}
Compétences : {{competences}}
Infos supplémentaires : {{infos}}
RÈGLES : N'invente aucune information non fournie. Corrige l'orthographe et la grammaire. Langage professionnel. @media print marges 15mm.${FOOTER}`,

    cv_improve: `${SYS}
Modernise et améliore ce CV selon les souhaits du client.

Client : {{nom}} | Email : {{email}} | Tél : {{tel}}
Souhaits d'amélioration : {{note}}

Design : en-tête #1e3a5f, corps blanc, accents #2563eb, @media print marges 15mm.${FOOTER}`,

    lettre: `${SYS}
Rédige une lettre de motivation professionnelle en HTML (CSS inline, format A4).

Candidat : {{nom}} | Email : {{email}} | Tél : {{tel}}
Poste visé : {{poste}} | Entreprise : {{entreprise}}
Expérience : {{experience}} | Motivation : {{motivation}}
Notes / lettre existante : {{note}}

Structure : coordonnées candidat (gauche) / date + destinataire (droite) / objet en gras / corps percutant / formule de politesse. Marges 25mm, typographie professionnelle.${FOOTER}`,

    dossier: `${SYS}
Génère un guide d'aide pour démarches administratives en HTML (CSS inline, format A4).

Client : {{nom}} | Email : {{email}} | Tél : {{tel}}
Type de dossier : {{type}} ({{choix}}) | {{dossier_contexte}}
Besoin : {{description}} | Documents disponibles : {{documents}}

Contenu : 1) résumé de la situation 2) checklist documents à fournir ☐ 3) étapes numérotées 4) conseils pratiques et délais 5) coordonnées organismes (CAF/CPAM/Pôle Emploi/Préfecture Guyane…).
Design : en-tête #1e3a5f, accents #2563eb.${FOOTER}`,

    courrier: `${SYS}
Rédige un courrier officiel pour l'administration française en HTML (CSS inline, format A4).

Expéditeur : {{nom}} | Email : {{email}} | Tél : {{tel}}
Destinataire : {{destinataire}} | Objet : {{objet}} | Type : {{choix}}
Situation : {{description}}

Structure : coordonnées expéditeur (gauche) / ville + date (droite) / coordonnées destinataire / objet en gras / corps (contexte → demande → justification) / formule de politesse officielle. Marges 25mm.${FOOTER}`,

    sejour: `${SYS}
Tu es aussi spécialiste des démarches de titre de séjour en Guyane et en France. Génère un document d'aide personnalisé en HTML (CSS inline, format A4).

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Nationalité : {{nationalite}}
Type de demande : {{choix}} | Situation : {{situation}} | Documents disponibles : {{documents}}

Contenu :
1. Résumé de la situation et du type de demande
2. Démarches recommandées étape par étape (numérotées)
3. Checklist des documents à préparer ☐
4. Organismes compétents en Guyane (Préfecture, OFII, France Services…) avec adresses/horaires
5. Délais habituels et points de vigilance
6. Bandeau d'avertissement : "Ce document est une aide informatique. Il ne remplace pas un conseil juridique professionnel."

Design : en-tête fond rouge #b91c1c, accents #ef4444, corps blanc, @media print marges 15mm.${FOOTER}`,

    impot_comprendre: `${SYS}
Tu es aussi expert en fiscalité française et en aides sociales (Guyane / France).
Expert fiscal France/Guyane. Analyse cet avis d'imposition et produis un document HTML A4 CSS-inline structuré ainsi :
1. RÉSUMÉ (3 lignes max) : montant dû, échéance, situation fiscale
2. DÉCOMPOSITION LIGNE PAR LIGNE : chaque ligne de l'avis expliquée en langage simple
3. POINTS D'ATTENTION : surligné en orange si retard/pénalité/erreur probable
4. PROCHAINE ÉTAPE : action concrète à faire avant quelle date
5. CONTACT UTILE : DGFiP Guyane — 0809 401 401 / impots.gouv.fr

Client : {{nom}} | Revenus : {{revenus}} | Situation : {{situation}} | Question : {{description}}
Design : en-tête fond #0c4a6e, accents #0369a1, corps blanc, @media print marges 15mm.
RÈGLE : jamais de placeholder. Si donnée absente, adapte sans la mentionner.${FOOTER}`,

    impot_aide: `${SYS}
Tu es aussi expert en fiscalité française et en aides sociales (Guyane / France).
Expert fiscal France/Guyane. Produis un guide HTML A4 CSS-inline :
1. OBLIGATIONS : ce que ce client doit déclarer selon sa situation
2. DÉDUCTIONS POSSIBLES : liste exhaustive applicable à son profil (charges familiales, frais réels, DOM-TOM abattement 30–40%)
3. ERREURS FRÉQUENTES : 5 erreurs courantes pour ce profil
4. CALENDRIER FISCAL : dates clés pour sa situation
5. CONTACTS UTILES : DGFiP Guyane — 0809 401 401 / impots.gouv.fr

Client : {{nom}} | Revenus : {{revenus}} | Situation familiale : {{situation}} | Question : {{description}}
Design : en-tête fond #0c4a6e, accents #0369a1, corps blanc, @media print marges 15mm.
RÈGLE : abattement DOM-TOM toujours mentionné si applicable.${FOOTER}`,

    impot_courrier: `${SYS}
Tu es aussi expert en fiscalité française. Rédige un courrier officiel HTML A4 CSS-inline adressé à la DGFiP.
Structure : expéditeur (gauche) / Cayenne + date (droite) / destinataire / objet en gras / corps / formule officielle / signature
Destinataire : {{destinataire}} (sinon : Monsieur le Directeur des Finances Publiques de Guyane — 13 rue Lallouette, 97300 Cayenne)
Types de courrier selon l'objet :
- Demande de délai : motif légitime + proposition de plan d'apurement + référence article L.257 A du LPF
- Réclamation : faits chronologiques + préjudice + demande de révision + référence article R.197-1 du LPF
- Demande d'information : objet précis + référence avis + coordonnées

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Objet : {{objet}} | Situation : {{description}}
Design : structure épistolaire, marges 25mm.
RÈGLE : toujours inclure la référence légale adaptée au type de courrier.${FOOTER}`,

    naturalisation_situation: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane).
Expert naturalisation France/Guyane. Analyse l'éligibilité de ce client et produis un guide HTML A4 CSS-inline :
1. ÉLIGIBILITÉ : verdict clair (Éligible / Probablement éligible / Insuffisant) + justification selon critères légaux
2. CRITÈRES VÉRIFIÉS : tableau — Durée résidence (≥5 ans requis) / Intégration / Ressources stables / Casier judiciaire / Langue française — statut ✅ ⚠️ ❌ pour chaque
3. POINTS BLOQUANTS : si non éligible, exact motif légal + délai avant rééligibilité
4. PROCHAINE ÉTAPE : action concrète et délai
5. CONTACT : Préfecture de Guyane — 2 Cité Rebard, 97300 Cayenne — 05 94 39 45 00

Client : {{nom}} | Nationalité : {{nationalite}} | Durée résidence : {{duree}} | Famille : {{famille}} | Travail : {{travail}} | Situation : {{situation}}
Design : en-tête fond bleu marine #1e3a5f, accents #1d4ed8, corps blanc, @media print marges 15mm.
AVERTISSEMENT LÉGAL OBLIGATOIRE en rouge : "Ce document est une aide à la préparation. Il ne remplace pas un conseil juridique. Consultez un avocat ou une association d'aide aux étrangers pour votre dossier officiel."${FOOTER}`,

    naturalisation_dossier: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane).
Expert naturalisation France/Guyane. Produis un guide de constitution de dossier HTML A4 CSS-inline :
1. DOCUMENTS OBLIGATOIRES : liste exhaustive avec ☐ checkbox, validité, original ou copie, traduction requise oui/non
2. DOCUMENTS COMPLÉMENTAIRES : pièces renforçant le dossier selon le profil client
3. PREUVES D'INTÉGRATION : liste adaptée au profil (travail, enfants scolarisés, associations, impôts, logement stable)
4. PIÈGES À ÉVITER : 5 erreurs qui font rejeter un dossier en Guyane
5. DÉPÔT : Préfecture Guyane — sur rendez-vous uniquement — 05 94 39 45 00
6. DÉLAIS : instruction 12-18 mois en Guyane, suivi dossier possible sur naturalisation.interieur.gouv.fr

Client : {{nom}} | Nationalité : {{nationalite}} | Durée résidence : {{duree}} | Documents disponibles : {{documents}}
Design : en-tête fond bleu marine #1e3a5f, accents #1d4ed8, corps blanc, @media print marges 15mm.
AVERTISSEMENT LÉGAL OBLIGATOIRE.${FOOTER}`,

    naturalisation_lettre: `${SYS}
Tu es aussi spécialiste des procédures de naturalisation française (droit des étrangers, Guyane).
Expert naturalisation. Rédige une lettre de motivation HTML A4 CSS-inline pour une demande de naturalisation.
Structure : expéditeur / Cayenne + date / Monsieur le Préfet de Guyane, 2 Cité Rebard 97300 Cayenne / Objet : Demande de naturalisation française / corps / formule / signature
Corps en 4 paragraphes :
§1 PRÉSENTATION : identité, nationalité, durée de résidence en France/Guyane
§2 INTÉGRATION : vie professionnelle, sociale, familiale — concret et chiffré
§3 ATTACHEMENT : pourquoi la France, valeurs républicaines, contribution à la société
§4 ENGAGEMENT : respect des lois, projet de vie en France
Ton : respectueux, sincère, factuel — jamais suppliant

Client : {{nom}} | Email : {{email}} | Tél : {{tel}} | Nationalité : {{nationalite}} | Durée résidence : {{duree}} | Famille : {{famille}} | Travail : {{travail}} | Motivation : {{motivation}} | Parcours : {{parcours}}
Design : structure épistolaire formelle, marges 25mm.
RÈGLE : personnaliser chaque paragraphe avec les données réelles du client. Zéro formule générique.${FOOTER}`
  };
}

function swFallbackPrompt() {
  return 'Tu es un assistant administratif. Génère un document HTML complet (CSS inline, format A4) pour : {{nom}}, email : {{email}}. Réponds UNIQUEMENT avec le code HTML complet.';
}

/* ── STEP 3 → 4 ───────────────────────────────────────────── */
function swGoStep4() {
  if (!SSW.html) return;
  const cfg = SVC[SSW.svc];
  const choiceLabel = (cfg.choices.find(c => c.id === SSW.choice) || {}).label || SSW.choice;

  document.getElementById('sw-recap').innerHTML = `
    <div class="sw-recap-row"><span>Client</span><span>${escSw(SSW.personal.prenom + ' ' + SSW.personal.nom)}</span></div>
    <div class="sw-recap-row"><span>Service</span><span>${cfg.icon} ${escSw(cfg.name)}</span></div>
    <div class="sw-recap-row"><span>Type</span><span>${escSw(choiceLabel)}</span></div>
    <div class="sw-recap-row sw-recap-total"><span>Total</span><span>${cfg.price}€</span></div>
    ${cfg.reviewRequired ? `<div class="sw-recap-review">⚠️ Ce service nécessite une vérification manuelle avant livraison du document final.</div>` : ''}
  `;
  document.getElementById('sw-pay-lbl').textContent = `Payer ${cfg.price}€ et obtenir mon document`;
  swGoStep(4);
}

function swPayTest() {
  SSW.paid = true;
  swClearDraft();
  swSaveOrder();
  swShowConfirm();
}

/* ── PAYMENT ──────────────────────────────────────────────── */
function swSwitchTab(btn, type) {
  document.querySelectorAll('.sw-pay-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const c = document.getElementById('sw-pay-card');
  const p = document.getElementById('sw-pay-paypal');
  if (c) c.style.display = type === 'card'   ? 'block' : 'none';
  if (p) p.style.display = type === 'paypal' ? 'block' : 'none';
}

function swPayPayPal() {
  const cfg     = SVC[SSW.svc] || {};
  const orderId = SSW.orderId || Date.now();
  SSW.orderId   = orderId;
  _swSaveState();
  const base   = location.origin;
  const params = new URLSearchParams({
    cmd:          '_xclick',
    business:     PAYPAL_EMAIL,
    amount:       cfg.price || 0,
    currency_code:'EUR',
    item_name:    "Dok'péyi — " + (cfg.name || SSW.svc),
    return:       base + '/service?success=1&order_id=' + orderId,
    cancel_return:base + '/service?s=' + SSW.svc + '&cancelled=1'
  });
  location.href = 'https://www.paypal.com/cgi-bin/webscr?' + params;
}

async function swPay() {
  if (IS_TEST_MODE) { swPayTest(); return; }

  if (document.getElementById('sw-pay-paypal')?.style.display !== 'none') {
    swPayPayPal(); return;
  }

  const btn = document.getElementById('sw-pay-btn');
  const lbl = document.getElementById('sw-pay-lbl');
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = '⏳ Redirection vers le paiement…';

  try {
    const cfg = SVC[SSW.svc] || {};
    _swSaveState(); /* sauvegarder l'état avant redirection */

    const res  = await fetch('/api/create-checkout', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        service: SSW.svc,
        amount:  cfg.price || 0,
        orderId: SSW.orderId || Date.now(),
        email:   SSW.personal.email,
        prenom:  SSW.personal.prenom,
        nom:     SSW.personal.nom
      })
    });
    const data = await res.json();

    if (!data.ok || !data.url) throw new Error(data.error || 'Erreur paiement');
    location.href = data.url; /* redirection vers Stripe Checkout */
  } catch(err) {
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = 'Réessayer';
    const errEl = document.createElement('p');
    errEl.style.cssText = 'color:#ef4444;font-size:.85rem;text-align:center;margin:10px 0 0';
    errEl.textContent = 'Erreur : ' + err.message;
    document.getElementById('sw-pay-btn')?.parentNode?.appendChild(errEl);
  }
}

function swSaveOrder() {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const cfg = SVC[SSW.svc];

    if (SSW.orderId) {
      /* ── Pipeline déjà lancé : enrichir la demande existante avec les infos personnelles ── */
      const update = {
        prenom:   SSW.personal.prenom  || '',
        nom:      SSW.personal.nom     || '',
        email:    SSW.personal.email   || '',
        whatsapp: SSW.personal.phone   || '',
        ville:    '',
        montant:  cfg ? cfg.price : 0,
        paid:     true
      };
      /* localStorage */
      const list = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
      const idx  = list.findIndex(d => d.id === SSW.orderId);
      if (idx !== -1) {
        Object.assign(list[idx], update);
      } else {
        list.unshift(Object.assign({ id: SSW.orderId, service: SSW.svc, date: now.toISOString().split('T')[0], heure: pad(now.getHours())+':'+pad(now.getMinutes()), statut: 'valide_manager', note: '', details: Object.assign({}, SSW.details, {'sw-choice': SSW.choice}) }, update));
      }
      localStorage.setItem('dok_demandes', JSON.stringify(list));
      /* Firebase */
      try {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
          firebase.database().ref('dok-peyi/demandes/' + SSW.orderId).update(update);
      } catch(_) {}
      return;
    }

    /* ── Fallback : pipeline non lancé, créer la demande complète ── */
    const id = Date.now();
    const demande = {
      id,
      date:     now.toISOString().split('T')[0],
      heure:    pad(now.getHours()) + ':' + pad(now.getMinutes()),
      prenom:   SSW.personal.prenom,
      nom:      SSW.personal.nom,
      email:    SSW.personal.email,
      whatsapp: SSW.personal.phone || '',
      ville:    '',
      service:  SSW.svc,
      montant:  cfg ? cfg.price : 0,
      statut:   'valide_manager',
      details:  Object.assign({}, SSW.details, { 'sw-choice': SSW.choice }),
      note:     ''
    };
    SSW.orderId = id;
    const existing = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
    existing.unshift(demande);
    localStorage.setItem('dok_demandes', JSON.stringify(existing));
    try {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
        firebase.database().ref('dok-peyi/demandes/' + id).set(demande);
    } catch(_) {}
  } catch(_) {}
}

/**
 * Advance the current order to a new status.
 * Uses dokTransition() from lib/statuses.js to validate the move.
 *
 * @param {string} next   - Target status (use DOK_STATUS constants).
 * @param {object} [opts]
 * @param {boolean} [opts.force] - Skip validation (e.g. admin override).
 * @returns {boolean} true if the transition was applied.
 */
function swUpdateOrderStatus(next, opts) {
  if (!SSW.orderId) return false;

  const list = JSON.parse(localStorage.getItem('dok_demandes') || '[]');
  const idx  = list.findIndex(d => d.id === SSW.orderId);
  if (idx === -1) return false;

  const result = (typeof dokTransition === 'function')
    ? dokTransition(list[idx].statut, next, opts)
    : { ok: true, status: next }; // graceful fallback if statuses.js not loaded

  if (!result.ok) {
    console.warn('[Dok\'péyi] Status transition blocked:', result.error);
    return false;
  }

  list[idx].statut = result.status;
  localStorage.setItem('dok_demandes', JSON.stringify(list));

  try {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0)
      firebase.database().ref('dok-peyi/demandes/' + SSW.orderId + '/statut').set(result.status);
  } catch(_) {}

  return true;
}

function swShowConfirm() {
  const cfg = SVC[SSW.svc];
  swGoStep(5);

  document.getElementById('sw-confirm-body').innerHTML = `
    <div class="sw-confirm-icon">🎉</div>
    <h2>Merci, ${escSw(SSW.personal.prenom)}&nbsp;!</h2>
    ${cfg.reviewRequired
      ? `<p class="sw-confirm-sub">Votre demande a bien été transmise à notre équipe.</p>
         <div class="sw-review-badge">📋 En cours de vérification — réponse sous 24–48h</div>
         <p style="font-size:.85rem;color:#64748b;max-width:420px;margin:0 auto 20px;line-height:1.6">${escSw(cfg.reviewMsg)}</p>`
      : `<p class="sw-confirm-sub">Votre document est prêt. Téléchargez-le puis imprimez-le ou enregistrez-le en PDF.</p>
         <button class="sw-btn-dl" onclick="swDownload()">⬇ Télécharger mon document</button>`
    }
    <p class="sw-confirm-email">Confirmation envoyée à <strong>${escSw(SSW.personal.email)}</strong></p>
    <a href="/" class="sw-btn-ghost" style="margin-top:24px;display:inline-flex">← Retour à l'accueil</a>
  `;
}

function swDownload() {
  if (!SSW.html) return;
  const svcName  = (SVC[SSW.svc] || {}).name || SSW.svc;
  const filename = (svcName + '_' + SSW.personal.prenom + '_' + SSW.personal.nom).replace(/[^a-zA-Z0-9_-]/g, '_');
  let html = SSW.html;
  if (/<title>/i.test(html))
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${filename}</title>`);
  else
    html = html.replace(/<head>/i, `<head><title>${filename}</title>`);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename + '.html' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/* ── PAYMENT HELPERS ──────────────────────────────────────── */
function swFmtCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function swFmtExp(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  input.value = v;
}

/* ── UTILITIES ────────────────────────────────────────────── */
function swShake(el) {
  if (!el) return;
  const t = el instanceof Element ? el : document.getElementById(el);
  if (!t) return;
  t.classList.remove('sw-shake');
  void t.offsetWidth;
  t.classList.add('sw-shake');
  if (t.focus) t.focus();
  setTimeout(() => t.classList.remove('sw-shake'), 600);
}

function escSw(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── DRAFT — sessionStorage save/restore ──────────────────── */
const DRAFT_KEY = 'dok_sw_draft';

function swSaveDraft() {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      svc:      SSW.svc,
      choice:   SSW.choice,
      personal: SSW.personal,
      details:  SSW.details
    }));
  } catch(_) {}
}

function swRestoreDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.svc !== SSW.svc) return false;
    if (d.choice)   SSW.choice   = d.choice;
    if (d.personal) SSW.personal = { ...SSW.personal, ...d.personal };
    if (d.details)  SSW.details  = d.details;

    /* Restore personal fields in the DOM */
    ['prenom','nom','email','phone'].forEach(k => {
      const el = document.getElementById('sw-' + k);
      if (el && SSW.personal[k]) el.value = SSW.personal[k];
    });
    return true;
  } catch(_) { return false; }
}

function swClearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch(_) {}
}

/* ── BEFOREUNLOAD — warn on step 3+ ───────────────────────── */
window.addEventListener('beforeunload', e => {
  if (SSW.step >= 3 && !SSW.paid) {
    e.preventDefault();
    e.returnValue = '';
  }
});
