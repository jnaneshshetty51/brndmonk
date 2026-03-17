import { db } from '../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, getDocs,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';

const COL = 'invoices';

export async function saveInvoice(invoiceData) {
  const docRef = await addDoc(collection(db, COL), {
    ...invoiceData,
    status: invoiceData.status || 'draft',
    paidAmount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateInvoice(id, data) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteInvoice(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function getAllInvoices() {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateInvoiceStatus(id, status) {
  await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() });
}

export async function recordPayment(id, amount, totalAmount) {
  const paid = parseFloat(amount) || 0;
  const total = parseFloat(totalAmount) || 0;
  const status = paid >= total ? 'paid' : 'partial';
  await updateDoc(doc(db, COL, id), {
    paidAmount: paid,
    status,
    updatedAt: serverTimestamp(),
  });
}
