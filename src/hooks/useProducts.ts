import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import toast from 'react-hot-toast';

const DEFAULT_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Orange Juice', price: 4.99, category: 'Juices', emoji: '🍊', stock: 50, cost: 2.00 },
  { name: 'Apple Juice', price: 4.49, category: 'Juices', emoji: '🍎', stock: 40, cost: 1.80 },
  { name: 'Mango Smoothie', price: 6.99, category: 'Smoothies', emoji: '🥭', stock: 30, cost: 3.00 },
  { name: 'Berry Blast', price: 7.49, category: 'Smoothies', emoji: '🍓', stock: 25, cost: 3.50 },
  { name: 'Green Detox', price: 8.99, category: 'Smoothies', emoji: '🥬', stock: 20, cost: 4.00 },
  { name: 'Lemonade', price: 3.99, category: 'Cold Drinks', emoji: '🍋', stock: 60, cost: 1.50 },
  { name: 'Watermelon Juice', price: 5.49, category: 'Juices', emoji: '🍉', stock: 35, cost: 2.20 },
  { name: 'Coconut Water', price: 5.99, category: 'Cold Drinks', emoji: '🥥', stock: 45, cost: 2.50 },
  { name: 'Pineapple Juice', price: 4.99, category: 'Juices', emoji: '🍍', stock: 30, cost: 2.00 },
  { name: 'Strawberry Shake', price: 6.49, category: 'Shakes', emoji: '🍓', stock: 20, cost: 2.80 },
  { name: 'Chocolate Shake', price: 6.99, category: 'Shakes', emoji: '🍫', stock: 25, cost: 3.00 },
  { name: 'Vanilla Shake', price: 6.49, category: 'Shakes', emoji: '🍦', stock: 22, cost: 2.80 },
  { name: 'Iced Coffee', price: 5.49, category: 'Coffee', emoji: '☕', stock: 40, cost: 2.20 },
  { name: 'Caramel Latte', price: 6.49, category: 'Coffee', emoji: '🧋', stock: 35, cost: 2.80 },
  { name: 'Energy Boost', price: 9.99, category: 'Smoothies', emoji: '⚡', stock: 15, cost: 4.50 },
  { name: 'Peach Tea', price: 4.49, category: 'Cold Drinks', emoji: '🍑', stock: 50, cost: 1.80 },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        // Seed default products
        for (const p of DEFAULT_PRODUCTS) {
          await addDoc(collection(db, 'products'), { ...p, createdAt: serverTimestamp() });
        }
      } else {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        setProducts(data);
        setLoading(false);
      }
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      await addDoc(collection(db, 'products'), { ...product, createdAt: serverTimestamp() });
      toast.success('Product added!');
    } catch (e) {
      toast.error('Failed to add product');
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), data);
      toast.success('Product updated!');
    } catch (e) {
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    } catch (e) {
      toast.error('Failed to delete product');
    }
  };

  const updateStock = async (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStock = Math.max(0, product.stock + delta);
      await updateDoc(doc(db, 'products', id), { stock: newStock });
    }
  };

  return { products, loading, addProduct, updateProduct, deleteProduct, updateStock };
}
