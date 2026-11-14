import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { CollegeDataService } from './storage';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase() {
  const settings = CollegeDataService.getSettings();
  if (!settings.useFirebaseBackend || !settings.firebaseConfig || !settings.firebaseConfig.apiKey) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(settings.firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db, isConfigured: true };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { app: null, auth: null, db: null, isConfigured: false, error };
  }
}

export function getFirebaseInstances() {
  if (!app) {
    return initFirebase();
  }
  return { app, auth, db, isConfigured: !!app };
}
