import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARNWrpBubDiwk9HiHQD7YH1OhKjP_m1jg",
  authDomain: "ecommapp-8d887.firebaseapp.com",
  databaseURL: "https://ecommapp-8d887-default-rtdb.firebaseio.com",
  projectId: "ecommapp-8d887",
  storageBucket: "ecommapp-8d887.appspot.com",
  messagingSenderId: "633319629922",
  appId: "1:633319629922:web:7f32d4ba67edcdabf69d3b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);