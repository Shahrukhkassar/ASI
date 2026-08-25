import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBK6Wiu2QIVqKg9e2b04xnS2zx3eu8dLg",
  authDomain: "asi-institute.firebaseapp.com",
  projectId: "asi-institute",
  storageBucket: "asi-institute.firebasestorage.app",
  messagingSenderId: "186604764049",
  appId: "1:186604764049:web:a69fe98ddec7093b64b830",
  measurementId: "G-H2240VDDH5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
