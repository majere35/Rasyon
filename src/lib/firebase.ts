import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA4feEFxP05vttqDJBsnp_3ky2JBsKqMic",
    authDomain: "rasyonapp.firebaseapp.com",
    projectId: "rasyonapp",
    storageBucket: "rasyonapp.firebasestorage.app",
    messagingSenderId: "709366341330",
    appId: "1:709366341330:web:e2256a55c60e2f07bd570b",
    measurementId: "G-GWERFJNKQF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Superbox ve bazi ağlarda WebSocket engellenebiliyor.
// Long Polling kullanarak bağlantiyi garanti altina aliyoruz.
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
