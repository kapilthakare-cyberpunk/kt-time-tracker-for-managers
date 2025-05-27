// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { auth, db };