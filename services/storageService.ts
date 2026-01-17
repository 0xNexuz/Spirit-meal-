
import { DevotionalEntry, UserPreferences } from '../types';
import { INITIAL_DEVOTIONALS } from '../constants';

const STORAGE_KEYS = {
  DEVOTIONALS: 'spirit_meal_devotionals',
  PREFERENCES: 'spirit_meal_prefs',
  ADMIN_MODE: 'spirit_meal_admin'
};

export const storage = {
  getDevotionals: (): DevotionalEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DEVOTIONALS);
    return data ? JSON.parse(data) : INITIAL_DEVOTIONALS;
  },
  saveDevotionals: (devotionals: DevotionalEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.DEVOTIONALS, JSON.stringify(devotionals));
  },
  getPreferences: (): UserPreferences => {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : {
      theme: 'light',
      notificationsEnabled: true,
      fontSize: 'base'
    };
  },
  savePreferences: (prefs: UserPreferences) => {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  },
  getAdminMode: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === 'true';
  },
  setAdminMode: (active: boolean) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, active ? 'true' : 'false');
  }
};
