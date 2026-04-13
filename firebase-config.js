/* ============================================================
   DOK'PÉYI — Configuration Firebase Realtime Database
   ============================================================

   POUR ACTIVER LE CHAT EN TEMPS RÉEL :

   1. Va sur https://console.firebase.google.com
      → Créer un projet  (ex : "dok-peyi")

   2. Dans le projet → Build → Realtime Database
      → "Créer une base de données"
      → Région : europe-west1
      → Commencer en mode test

   3. Dans Paramètres du projet (⚙) → Vos applications
      → Ajouter une application Web  → Copie les valeurs
      ci-dessous depuis la config affichée par Firebase.

   4. Dans Realtime Database → Règles, mets :
      {
        "rules": {
          ".read":  "auth != null",
          ".write": "auth != null"
        }
      }
      (ou ".read": true / ".write": true pour les tests)

   5. Remplace les valeurs REMPLACE_PAR_… ci-dessous par les
      vraies valeurs de ta console Firebase, puis redéploie.

   ⚠️  Tant que les valeurs sont des placeholders, Firebase
       N'EST PAS initialisé — le chat fonctionne uniquement
       en mode local (chaque navigateur voit ses propres
       messages).
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDQeKLH5EmnhL5vumz9KXw5skzM8dm-5po",
  authDomain:        "dok-peyi.firebaseapp.com",
  databaseURL:       "https://dok-peyi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "dok-peyi",
  storageBucket:     "dok-peyi.firebasestorage.app",
  messagingSenderId: "491648146816",
  appId:             "1:491648146816:web:95935218b9b9875cfcb565",
  measurementId:     "G-140RG50HQ9"
};

/* ── Initialisation automatique ──────────────────────────────
   Si le fichier contient encore des placeholders, Firebase
   n'est pas lancé et le reste de l'app fonctionne normalement.
   Dès que les vraies valeurs sont saisies ci-dessus, le chat
   workspace synchronise en temps réel entre tous les membres.
   ──────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* Vérifie qu'au moins l'apiKey et le databaseURL sont remplis */
  const ready =
    FIREBASE_CONFIG.apiKey      && !FIREBASE_CONFIG.apiKey.startsWith('REMPLACE') &&
    FIREBASE_CONFIG.databaseURL && !FIREBASE_CONFIG.databaseURL.includes('REMPLACE');

  if (!ready) {
    console.info(
      '[Dok\'péyi] Firebase non configuré — workspace chat en mode local.\n' +
      'Pour activer la synchronisation en temps réel, remplis firebase-config.js.'
    );
    return;
  }

  try {
    /* Évite une double initialisation si le script est rechargé */
    const app = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(FIREBASE_CONFIG);

    window.db = app.database();
    console.info('[Dok\'péyi] Firebase Realtime Database connecté ✓');
  } catch (err) {
    console.error('[Dok\'péyi] Erreur Firebase :', err.message);
  }
})();
