
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ContentIdea {
  id: string;
  type: 'video' | 'story' | 'image';
  text: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // HH:mm 24h format
  endTime: string; // HH:mm 24h format
  description?: string;
  checklist: ChecklistItem[];
  contentIdeas: ContentIdea[];
  completed: boolean;
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export const PRESET_COLORS = [
  { name: 'Emerald', value: '#34d399' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Slate', value: '#64748b' },
];
