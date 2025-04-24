import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import admin from 'firebase-admin';

// Client-side Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize client-side Firebase
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase client-side inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase client-side:', {
    message: error.message,
    stack: error.stack,
  });
}

// Initialize Firebase Admin for server-side
let adminDb;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin inicializado correctamente');
  } else {
    console.log('Firebase Admin ya estaba inicializado');
  }
  adminDb = admin.firestore();
} catch (error) {
  console.error('Error al inicializar Firebase Admin:', {
    message: error.message,
    stack: error.stack,
  });
}

export { db, adminDb, admin };
