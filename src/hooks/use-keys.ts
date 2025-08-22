"use client";

import useLocalStorage from './use-local-storage';
import type { ApiKey } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function useKeys() {
  const [keys, setKeys] = useLocalStorage<ApiKey[]>('apiKeys', []);

  const addKey = (newKeyData: Omit<ApiKey, 'id' | 'createdAt'>) => {
    const keyWithId: ApiKey = {
      ...newKeyData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setKeys([...keys, keyWithId]);
  };

  const updateKey = (updatedKey: ApiKey) => {
    setKeys(keys.map((key) => (key.id === updatedKey.id ? updatedKey : key)));
  };

  const deleteKey = (keyId: string) => {
    setKeys(keys.filter((key) => key.id !== keyId));
  };

  return { keys, addKey, updateKey, deleteKey };
}
