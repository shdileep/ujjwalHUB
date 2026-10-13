import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVZyWDG8rCBlHqD9sq9hryOnZzGAMmhTE",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ujjwal-7a8c8.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://ujjwal-7a8c8-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ujjwal-7a8c8",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ujjwal-7a8c8.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "979504793146",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:979504793146:web:b37db5fbdd0712607ed703",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-K8TWFF4XLC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// EXPERIMENTAL: Force browser local persistence dynamically
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log('✅ Firebase Auth Persistence set to BrowserLocal'))
    .catch((err) => console.error('❌ Firebase Auth Persistence Error:', err));

export const database = getDatabase(app);

export default app;
