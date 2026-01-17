
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

export type ThemeMode = 'light' | 'sepia' | 'dark';

export interface UserPreferences {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
}
