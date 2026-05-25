// Firestore utility functions for SmartPOS
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// ─── Collection References ───────────────────────────────────────────────────
export const Collections = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  CATEGORIES: 'categories',
  INVENTORY: 'inventory',
  SALES_REPORTS: 'sales_reports',
  SETTINGS: 'settings',
  SUPPLIERS: 'suppliers',
  ACTIVITY_LOGS: 'activity_logs',
};

// ─── Generic CRUD Operations ──────────────────────────────────────────────────

/** Get all documents from a collection */
export const getCollection = async (collectionName: string, constraints: QueryConstraint[] = []) => {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/** Get a single document */
export const getDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
  return null;
};

/** Add a new document */
export const addDocument = async (collectionName: string, data: Record<string, any>) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/** Update a document */
export const updateDocument = async (collectionName: string, docId: string, data: Record<string, any>) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

/** Delete a document */
export const deleteDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

/** Real-time listener for a collection */
export const subscribeToCollection = (
  collectionName: string,
  callback: (data: any[]) => void,
  constraints: QueryConstraint[] = []
) => {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

/** Real-time listener for a document */
export const subscribeToDocument = (
  collectionName: string,
  docId: string,
  callback: (data: any) => void
) => {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, snapshot => {
    if (snapshot.exists()) callback({ id: snapshot.id, ...snapshot.data() });
    else callback(null);
  });
};

// ─── Product Operations ───────────────────────────────────────────────────────

export const updateProductStock = async (productId: string, quantitySold: number) => {
  const docRef = doc(db, Collections.PRODUCTS, productId);
  await updateDoc(docRef, {
    stock: increment(-quantitySold),
    updatedAt: serverTimestamp(),
  });
};

// ─── Order Operations ─────────────────────────────────────────────────────────

export const createOrder = async (orderData: Record<string, any>) => {
  const batch = writeBatch(db);
  
  // Generate unique order ID
  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  // Add order
  const orderRef = doc(collection(db, Collections.ORDERS));
  batch.set(orderRef, {
    ...orderData,
    orderId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update product stock for each item
  for (const item of orderData.items) {
    const productRef = doc(db, Collections.PRODUCTS, item.productId);
    batch.update(productRef, {
      stock: increment(-item.quantity),
      updatedAt: serverTimestamp(),
    });
  }

  // Update customer loyalty points if customer exists
  if (orderData.customerId) {
    const customerRef = doc(db, Collections.CUSTOMERS, orderData.customerId);
    const loyaltyPoints = Math.floor(orderData.total / 10); // 1 point per ₹10
    batch.update(customerRef, {
      loyaltyPoints: increment(loyaltyPoints),
      totalPurchases: increment(orderData.total),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return { id: orderRef.id, orderId };
};

// ─── Sales Report Operations ──────────────────────────────────────────────────

export const getTodaySales = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);
  
  const q = query(
    collection(db, Collections.ORDERS),
    where('createdAt', '>=', todayTimestamp),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getWeeklySales = async () => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  const weekTimestamp = Timestamp.fromDate(weekAgo);
  
  const q = query(
    collection(db, Collections.ORDERS),
    where('createdAt', '>=', weekTimestamp),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getMonthlySales = async () => {
  const monthAgo = new Date();
  monthAgo.setDate(1);
  monthAgo.setHours(0, 0, 0, 0);
  const monthTimestamp = Timestamp.fromDate(monthAgo);
  
  const q = query(
    collection(db, Collections.ORDERS),
    where('createdAt', '>=', monthTimestamp),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ─── Activity Log ─────────────────────────────────────────────────────────────

export const logActivity = async (
  userId: string,
  userName: string,
  action: string,
  details: string
) => {
  await addDoc(collection(db, Collections.ACTIVITY_LOGS), {
    userId,
    userName,
    action,
    details,
    createdAt: serverTimestamp(),
  });
};

// ─── Export helpers ───────────────────────────────────────────────────────────
export { query, where, orderBy, limit, Timestamp, serverTimestamp, increment };
