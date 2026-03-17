import { db } from '../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, getDocs,
  doc, serverTimestamp, query, orderBy, where,
} from 'firebase/firestore';

const COL = 'clients';

export async function saveClient(clientData) {
  const docRef = await addDoc(collection(db, COL), {
    ...clientData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateClient(id, data) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteClient(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function getAllClients() {
  const q = query(collection(db, COL), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
