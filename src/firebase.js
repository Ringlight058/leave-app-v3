// Import Firebase core
import { initializeApp } from "firebase/app";

// Import Firestore (THIS is what your app uses)
import { getFirestore } from "firebase/firestore";

// Your Firebase config (keep as it is)
const firebaseConfig = {
  apiKey: "AIzaSyAEDLuGabouyahWT-GgGj8GsRNWNRNSrOs",
  authDomain: "leave-app-v3.firebaseapp.com",
  projectId: "leave-app-v3",
  storageBucket: "leave-app-v3.firebasestorage.app",
  messagingSenderId: "983476120764",
  appId: "1:983476120764:web:36cdbfa9498162e67e34b9",
  measurementId: "G-7C8H5QQZW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THIS is what your App.js needs
export const db = getFirestore(app);