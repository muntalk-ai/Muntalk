// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdlkPmHlsTKz0mbpq3SID53dh8nX8gUvs",
  authDomain: "muntalk-c03e6.firebaseapp.com",
  projectId: "muntalk-c03e6",
  storageBucket: "muntalk-c03e6.firebasestorage.app",
  messagingSenderId: "703444894652",
  appId: "1:703444894652:web:9e8aa04a28debf0ca121b9",
  measurementId: "G-E7GXPE9HHP"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // 이 줄이 반드시 있어야 합니다.
export const db = getFirestore(app);