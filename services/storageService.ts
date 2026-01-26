
import { DevotionalEntry, SundaySchoolLesson, UserPreferences } from '../types';
import { INITIAL_DEVOTIONALS, INITIAL_SUNDAY_SCHOOL, DATA_VERSION } from '../constants';

const STORAGE_KEYS = {
  DEVOTIONALS: 'spirit_meal_devotionals',
  SUNDAY_SCHOOL: 'spirit_meal_sunday_school',
  PREFERENCES: 'spirit_meal_prefs',
  ADMIN_MODE: 'spirit_meal_admin',
  BOOKMARKS: 'spirit_meal_bookmarks',
  NOTES: 'spirit_meal_notes',
  REFLECTIONS_CACHE: 'spirit_meal_reflections',
  LAST_VERSION: 'spirit_meal_data_version'
};

// Custom event for same-window sync
const SYNC_EVENT = 'spirit_meal_sync';

const notifySync = () => {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
};

// Check if we need to force-update users to the latest Master content
const hydrateMasterContent = () => {
  const currentSavedVersion = localStorage.getItem(STORAGE_KEYS.LAST_VERSION);
  if (currentSavedVersion !== DATA_VERSION) {
    console.log(`Updating Spirit Meal Content from ${currentSavedVersion} to ${DATA_VERSION}`);
    // Clear old data to force reload of INITIAL_... constants
    localStorage.removeItem(STORAGE_KEYS.DEVOTIONALS);
    localStorage.removeItem(STORAGE_KEYS.SUNDAY_SCHOOL);
    localStorage.setItem(STORAGE_KEYS.LAST_VERSION, DATA_VERSION);
    notifySync();
  }
};

// Run on service load
hydrateMasterContent();

export const storage = {
  SYNC_EVENT,
  resetToMaster: () => {
    localStorage.removeItem(STORAGE_KEYS.DEVOTIONALS);
    localStorage.removeItem(STORAGE_KEYS.SUNDAY_SCHOOL);
    localStorage.setItem(STORAGE_KEYS.LAST_VERSION, DATA_VERSION);
    notifySync();
  },
  getDevotionals: (): DevotionalEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DEVOTIONALS);
    return data ? JSON.parse(data) : INITIAL_DEVOTIONALS;
  },
  saveDevotionals: (devotionals: DevotionalEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.DEVOTIONALS, JSON.stringify(devotionals));
    notifySync();
  },
  deleteDevotional: (id: string) => {
    const items = storage.getDevotionals().filter(i => i.id !== id);
    storage.saveDevotionals(items);
  },
  getSundaySchool: (): SundaySchoolLesson[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SUNDAY_SCHOOL);
    return data ? JSON.parse(data) : INITIAL_SUNDAY_SCHOOL;
  },
  saveSundaySchool: (lessons: SundaySchoolLesson[]) => {
    localStorage.setItem(STORAGE_KEYS.SUNDAY_SCHOOL, JSON.stringify(lessons));
    notifySync();
  },
  deleteSundaySchool: (id: string) => {
    const items = storage.getSundaySchool().filter(i => i.id !== id);
    storage.saveSundaySchool(items);
  },
  getPreferences: (): UserPreferences => {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : {
      theme: 'light',
      notificationsEnabled: false,
      notificationTime: '07:00',
      fontSize: 'base'
    };
  },
  savePreferences: (prefs: UserPreferences) => {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    notifySync();
  },
  getAdminMode: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === 'true';
  },
  setAdminMode: (active: boolean) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, active ? 'true' : 'false');
    notifySync();
  },
  getBookmarks: (): string[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  },
  saveBookmarks: (ids: string[]) => {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(ids));
    notifySync();
  },
  toggleBookmark: (id: string): boolean => {
    const bookmarks = storage.getBookmarks();
    const index = bookmarks.indexOf(id);
    let isAdded = false;
    
    if (index === -1) {
      bookmarks.push(id);
      isAdded = true;
    } else {
      bookmarks.splice(index, 1);
      isAdded = false;
    }
    
    storage.saveBookmarks(bookmarks);
    return isAdded;
  },
  getNotes: (): Record<string, string> => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : {};
  },
  getNote: (id: string): string => {
    return storage.getNotes()[id] || '';
  },
  saveNote: (id: string, note: string) => {
    const notes = storage.getNotes();
    if (!note.trim()) {
      delete notes[id];
    } else {
      notes[id] = note;
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    notifySync();
  },
  getReflectionsCache: (id: string): string[] | null => {
    const data = localStorage.getItem(STORAGE_KEYS.REFLECTIONS_CACHE);
    if (!data) return null;
    const cache = JSON.parse(data);
    return cache[id] || null;
  },
  saveReflectionsToCache: (id: string, reflections: string[]) => {
    const data = localStorage.getItem(STORAGE_KEYS.REFLECTIONS_CACHE);
    const cache = data ? JSON.parse(data) : {};
    cache[id] = reflections;
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS_CACHE, JSON.stringify(cache));
  }
};
