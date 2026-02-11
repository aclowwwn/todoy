
import { Project, Task, AuthResponse } from '../types';

// In this version, we default to local storage for a serverless experience
const API_URL = (process.env as any).VITE_API_URL;
const USE_LOCAL_STORAGE = !API_URL;

// --- Helper for Headers ---
const getHeaders = () => {
  const token = localStorage.getItem('todoy_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// --- LocalStorage Helpers ---
const loadLS = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
};

const saveLS = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // Mock Auth for Local Only
  login: async (email: string, _password: string): Promise<AuthResponse> => {
    return {
      token: 'mock-token',
      user: { id: 'default-user', email, name: email.split('@')[0] }
    };
  },

  signup: async (email: string, _password: string, name: string): Promise<AuthResponse> => {
    return {
      token: 'mock-token',
      user: { id: 'default-user', email, name }
    };
  },

  logout: () => {
    localStorage.removeItem('todoy_token');
    localStorage.removeItem('todoy_user');
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    if (USE_LOCAL_STORAGE) return loadLS('familyPlanner_projects');
    const res = await fetch(`${API_URL}/projects`, { headers: getHeaders() });
    if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  createProject: async (project: Project): Promise<Project> => {
    if (USE_LOCAL_STORAGE) {
      const projects = loadLS('familyPlanner_projects');
      const newProjects = [...projects, project];
      saveLS('familyPlanner_projects', newProjects);
      return project;
    }
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(project),
    });
    return res.json();
  },

  deleteProject: async (id: string): Promise<void> => {
    if (USE_LOCAL_STORAGE) {
      const projects = loadLS('familyPlanner_projects');
      saveLS('familyPlanner_projects', projects.filter((p: Project) => p.id !== id));
      return;
    }
    await fetch(`${API_URL}/projects/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
    });
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    if (USE_LOCAL_STORAGE) return loadLS('familyPlanner_events');
    const res = await fetch(`${API_URL}/tasks`, { headers: getHeaders() });
    if (res.status === 401 || res.status === 403) throw new Error("Unauthorized");
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  createTask: async (task: Task): Promise<Task> => {
    if (USE_LOCAL_STORAGE) {
      const tasks = loadLS('familyPlanner_events');
      const newTasks = [...tasks, task];
      saveLS('familyPlanner_events', newTasks);
      return task;
    }
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    return res.json();
  },

  updateTask: async (task: Task): Promise<Task> => {
    if (USE_LOCAL_STORAGE) {
      const tasks = loadLS('familyPlanner_events');
      const newTasks = tasks.map((e: Task) => e.id === task.id ? task : e);
      saveLS('familyPlanner_events', newTasks);
      return task;
    }
    const res = await fetch(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    return res.json();
  },

  deleteTask: async (id: string): Promise<void> => {
    if (USE_LOCAL_STORAGE) {
      const tasks = loadLS('familyPlanner_events');
      saveLS('familyPlanner_events', tasks.filter((e: Task) => e.id !== id));
      return;
    }
    await fetch(`${API_URL}/tasks/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
    });
  }
};
