
import { DevotionalEntry, SundaySchoolLesson, UserPreferences } from '../types';
import { INITIAL_DEVOTIONALS, INITIAL_SUNDAY_SCHOOL } from '../constants';

const STORAGE_KEYS = {
  DEVOTIONALS: 'spirit_meal_devotionals',
  SUNDAY_SCHOOL: 'spirit_meal_sunday_school',
  PREFERENCES: 'spirit_meal_prefs',
  ADMIN_MODE: 'spirit_meal_admin',
  BOOKMARKS: 'spirit_meal_bookmarks'
};

export const storage = {
  getDevotionals: (): DevotionalEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DEVOTIONALS);
    return data ? JSON.parse(data) : INITIAL_DEVOTIONALS;
  },
  saveDevotionals: (devotionals: DevotionalEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.DEVOTIONALS, JSON.stringify(devotionals));
  },
  getSundaySchool: (): SundaySchoolLesson[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SUNDAY_SCHOOL);
    return data ? JSON.parse(data) : INITIAL_SUNDAY_SCHOOL;
  },
  saveSundaySchool: (lessons: SundaySchoolLesson[]) => {
    localStorage.setItem(STORAGE_KEYS.SUNDAY_SCHOOL, JSON.stringify(lessons));
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
  },
  getAdminMode: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === 'true';
  },
  setAdminMode: (active: boolean) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_MODE, active ? 'true' : 'false');
  },
  getBookmarks: (): string[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  },
  saveBookmarks: (ids: string[]) => {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(ids));
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
  }
};
