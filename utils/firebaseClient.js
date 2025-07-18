// utils/firebaseClient.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from "firebase/database";
// You can import other Firebase services here if needed (e.g., getAnalytics)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase App (prevent re-initialization)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase Initialized."); // Log initialization
} else {
  app = getApp(); // Use existing app
  console.log("Firebase Already Initialized."); // Log existing app usage
}


// Get Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app); // <-- Initialize RTDB

export { app, auth, db, rtdb };
// Export the instances for use in your app


// Basic check after attempting initialization
if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key missing from environment variables. Firebase features might not work.");
}