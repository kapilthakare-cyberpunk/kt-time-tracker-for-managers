// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPpC--_h9qr_fCHkMDVB_UrpiVE0-gOY8",
  authDomain: "kt-time-tracker.firebaseapp.com",
  projectId: "kt-time-tracker",
  storageBucket: "kt-time-tracker.firebasestorage.app",
  messagingSenderId: "132454526188",
  appId: "1:132454526188:web:52363a18795fdc433089c9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Debug logging
console.log("Firebase Config Loaded:", firebaseConfig);

// Export for use in other modules - ONLY ONCE
export { auth, db };