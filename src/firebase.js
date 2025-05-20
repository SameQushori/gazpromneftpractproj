// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGViw7ms6gK6qN-q_yj1rXNAoS1QGREho",
  authDomain: "hackathon-auth-fe9af.firebaseapp.com",
  projectId: "hackathon-auth-fe9af",
  storageBucket: "hackathon-auth-fe9af.firebasestorage.app",
  messagingSenderId: "712299514352",
  appId: "1:712299514352:web:8d8217a75464c1b113f535",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
