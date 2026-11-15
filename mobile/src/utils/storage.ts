import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStore = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return memoryStore.get(key) || null;
      } catch {
        return memoryStore.get(key) || null;
      }
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('[Storage] SecureStore.getItem error:', err);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
        memoryStore.set(key, value);
      } catch {
        memoryStore.set(key, value);
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('[Storage] SecureStore.setItem error:', err);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
        memoryStore.delete(key);
      } catch {
        memoryStore.delete(key);
      }
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('[Storage] SecureStore.deleteItem error:', err);
    }
  },

  // Aliases for SecureStore drop-in compatibility
  async getItemAsync(key: string): Promise<string | null> {
    return this.getItem(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    return this.setItem(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    return this.deleteItem(key);
  },
};

