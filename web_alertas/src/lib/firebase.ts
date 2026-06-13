import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || "AIzaSyAlcIm_bxfaFs3gJMmYNW_VaJsJb82-HEY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ||
    "app-alertas-3bcda.firebaseapp.com",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL?.trim() ||
    "https://app-alertas-3bcda-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || "app-alertas-3bcda",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ||
    "app-alertas-3bcda.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || "408659633571",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID?.trim() ||
    "1:408659633571:web:alertas-admin-map",
};

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseDatabase() {
  return getDatabase(getFirebaseApp());
}
