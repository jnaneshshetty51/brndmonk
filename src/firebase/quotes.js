import { db } from '../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, getDocs,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';

const COL = 'quotes';

export async function saveQuote(quoteData) {
  const docRef = await addDoc(collection(db, COL), {
    ...quoteData,
    status: quoteData.status || 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateQuote(id, data) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteQuote(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function getAllQuotes() {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateQuoteStatus(id, status) {
  await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() });
}
