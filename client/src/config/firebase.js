import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Replace with YOUR Firebase config from Firebase Console
// Project Settings → General → Your Apps → Web (</>)
const firebaseConfig = {
  apiKey: "AIzaSyDF0sF-g-vjPdQZ_QSGqujtQhZiyIZVwJM",
  authDomain: "onboard-b8a33.firebaseapp.com",
  projectId: "onboard-b8a33",
  storageBucket: "onboard-b8a33.firebasestorage.app",
  messagingSenderId: "844800911781",
  appId: "1:844800911781:web:aebb91345cf4f1e0eca04c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
