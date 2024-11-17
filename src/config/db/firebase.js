import { initializeApp, getApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Your web app's Firebase configuration
console.log("first", process.env.API_KEY);
const firebaseConfig = {
  apiKey: "AIzaSyCR2dPx_So4JKofLQ63fd1xXet3gnC7tI0",
  authDomain: "bottest-2bb43.firebaseapp.com",
  projectId: "bottest-2bb43",
  storageBucket: "bottest-2bb43.appspot.com",
  messagingSenderId: "868396881763",
  appId: "1:868396881763:web:53f1464fbf89a834e3a556",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const authentication = getAuth(app);
authentication.useDeviceLanguage();
export { authentication };
export const db = getFirestore(app);
export const storage = getStorage(app);
