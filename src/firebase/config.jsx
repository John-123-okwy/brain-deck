/////////////////////

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
     apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  
  /*
  apiKey: "AIzaSyBl9eUm1CL53GFgWcMMAhf1afGqkJ0OtUk",
  authDomain: "cj-quizapp.firebaseapp.com",
  databaseURL: "https://cj-quizapp-default-rtdb.firebaseio.com",
  projectId: "cj-quizapp",
  storageBucket: "cj-quizapp.firebasestorage.app",
  messagingSenderId: "909622350944",
  appId: "1:909622350944:web:978f24cbe0901977ca9f05"*/
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db=getFirestore(app)
export default app