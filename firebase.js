import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCFfmWiJPlMqYyV4jkl5W6s8RgacAFhcPM",
  authDomain: "brndmonk-3e158.firebaseapp.com",
  projectId: "brndmonk-3e158",
  storageBucket: "brndmonk-3e158.firebasestorage.app",
  messagingSenderId: "1064671471272",
  appId: "1:1064671471272:android:89cf11bc765d89f8d4c49d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
