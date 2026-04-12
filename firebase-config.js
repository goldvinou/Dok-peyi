/* ============================================================
   DOK'PÉYI — Configuration Firebase Realtime Database
   ============================================================
   ÉTAPES DE CONFIGURATION :

   1. Va sur https://console.firebase.google.com
   2. Crée un projet (ex: "dok-peyi-app")
   3. Dans "Build" → "Realtime Database" → Créer une base de données
      (Choisir la région "europe-west1" pour la Guyane/France)
      → Commencer en mode test (règles ouvertes le temps de tester)
   4. Dans "Paramètres du projet" → "Vos applications" → Ajouter une app Web
   5. Copie les valeurs ci-dessous depuis la config Firebase affichée
   6. Dans "Realtime Database" → "Règles", colle ceci :
      {
        "rules": {
          "dok-peyi": {
            ".read": true,
            ".write": true
          }
        }
      }
   ============================================================ */
const FIREBASE_CONFIG = {
  apiKey:            "REMPLACE_PAR_TA_CLE_API",
  authDomain:        "REMPLACE_PAR_TON_PROJET.firebaseapp.com",
  databaseURL:       "https://REMPLACE_PAR_TON_PROJET-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "REMPLACE_PAR_TON_PROJET",
  storageBucket:     "REMPLACE_PAR_TON_PROJET.appspot.com",
  messagingSenderId: "REMPLACE_PAR_TON_SENDER_ID",
  appId:             "REMPLACE_PAR_TON_APP_ID"
};
