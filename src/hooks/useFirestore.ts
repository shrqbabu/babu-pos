// Custom hooks for Firestore operations
import { useState, useEffect, useCallback } from 'react';
import { QueryConstraint } from 'firebase/firestore';
import { getCollection, subscribeToCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';

/** Hook for real-time collection data */
export function useCollection<T = any>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToCollection(
      collectionName,
      (docs) => {
        setData(docs as T[]);
        setLoading(false);
      },
      constraints
    );
    return unsubscribe;
  }, [collectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading };
}

/** Hook for CRUD operations on a collection */
export function useFirestore(collectionName: string) {
  const [loading, setLoading] = useState(false);

  const add = useCallback(async (data: Record<string, any>) => {
    setLoading(true);
    try {
      const id = await addDocument(collectionName, data);
      return id;
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const update = useCallback(async (id: string, data: Record<string, any>) => {
    setLoading(true);
    try {
      await updateDocument(collectionName, id, data);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await deleteDocument(collectionName, id);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const fetch = useCallback(async (constraints: QueryConstraint[] = []) => {
    setLoading(true);
    try {
      return await getCollection(collectionName, constraints);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  return { add, update, remove, fetch, loading };
}
