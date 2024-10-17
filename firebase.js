import { initializeApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9PROAeSBsycJXwRQK6czmloCjbsTmjJM",
  authDomain: "adilfashion-data.firebaseapp.com",
  projectId: "adilfashion-data",
  storageBucket: "adilfashion-data.appspot.com",
  messagingSenderId: "718007130007",
  appId: "1:718007130007:web:2593ce6cea2b0e26a916d2",
  measurementId: "G-9XC6F23ZG0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const dbFirestore = getFirestore(app);

const dbFirestore = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export default dbFirestore;
