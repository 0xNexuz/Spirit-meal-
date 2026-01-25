
export interface DevotionalEntry {
  id: string;
  date: string;
  title: string;
  scripture: string;
  content: string;
  prayer?: string;
  meditation?: string;
  imageUrl?: string;
  tags: string[];
}

export interface SundaySchoolLesson {
  id: string;
  date: string;
  title: string;
  topic: string;
  memoryVerse: string;
  content: string;
  discussionQuestions: string[];
  imageUrl?: string;
}

export type ThemeMode = 'light' | 'sepia' | 'dark';

export interface UserPreferences {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  notificationTime: string; // HH:mm format
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
}
