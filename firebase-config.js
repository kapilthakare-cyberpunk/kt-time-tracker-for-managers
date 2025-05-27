// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2oXM977OYHvFCzXlDrKVcAPZOiMSKtEc",
  authDomain: "teamtimetracker-740e6.firebaseapp.com",
  projectId: "teamtimetracker-740e6",
  storageBucket: "teamtimetracker-740e6.firebasestorage.app",
  messagingSenderId: "646701134730",
  appId: "1:646701134730:web:d8dc2ee4e25cf2bf6bce73",
  measurementId: "G-PN81N1881Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Debug logging
console.log("Firebase Config Loaded:", firebaseConfig);

// Export for use in other modules - ONLY ONCE
export { auth, db };