import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import toast from 'react-hot-toast';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        } as Order;
      });
      setOrders(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const placeOrder = async (order: Omit<Order, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: serverTimestamp(),
      });
      toast.success(`Order #${order.orderNumber} placed!`);
      return docRef.id;
    } catch (e) {
      toast.error('Failed to place order');
      return null;
    }
  };

  const refundOrder = async (id: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: 'refunded' });
      toast.success('Order refunded');
    } catch (e) {
      toast.error('Failed to refund order');
    }
  };

  const getTodaySales = () => {
    const today = new Date().toDateString();
    return orders
      .filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === today)
      .reduce((sum, o) => sum + o.total, 0);
  };

  const getTodayOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === today).length;
  };

  const getWeeklySales = () => {
    const days: { day: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayOrders = orders.filter(o => o.status === 'completed' && new Date(o.createdAt).toDateString() === dayStr);
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      });
    }
    return days;
  };

  const getTopProducts = () => {
    const map: Record<string, { name: string; emoji: string; qty: number; revenue: number }> = {};
    orders.filter(o => o.status === 'completed').forEach(o => {
      o.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, emoji: item.emoji, qty: 0, revenue: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  };

  const nextOrderNumber = () => {
    if (orders.length === 0) return 1001;
    return Math.max(...orders.map(o => o.orderNumber ?? 1000)) + 1;
  };

  return { orders, loading, placeOrder, refundOrder, getTodaySales, getTodayOrders, getWeeklySales, getTopProducts, nextOrderNumber };
}
