import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: 'AIzaSyBr97XXqsmmNMA8YzleumPDyZGA016zLSs',
  authDomain: 'owitter-cd253.firebaseapp.com',
  projectId: 'owitter-cd253',
  storageBucket: 'owitter-cd253.firebasestorage.app',
  messagingSenderId: '309470629682',
  appId: '1:309470629682:web:28cbb1bc47edf189f7912b',
  measurementId: 'G-34W95L76SD',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const storage = getStorage(app);

export const db = getFirestore(app);
