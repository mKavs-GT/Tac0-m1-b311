import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAihYyUSf2xvEJzUEPzVnHvlZNNrhJZ_Gk",
  authDomain: "mkavs-admin-panel.firebaseapp.com",
  projectId: "mkavs-admin-panel",
  storageBucket: "mkavs-admin-panel.firebasestorage.app",
  messagingSenderId: "264096547061",
  appId: "1:264096547061:web:be42495cba4b57de17c5bc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
