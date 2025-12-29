import axios from 'axios';
import { Task } from './tasks/task.model';
import { Credentials } from './users/user.model';

function getBaseURL(): string {
  const savedURL = localStorage.getItem('serverURL');
  if (savedURL) {
    return savedURL;
  }
  const baseURL = process.env.REACT_APP_BASE_URL;
  const port = process.env.REACT_APP_SERVER_PORT;
  // Only add port if it's not a standard port (80/443)
  if (port && port !== 80 && port !== 443) {
    return `${baseURL}:${port}`;
  }
  return baseURL;
}

const client = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export function setServerURL(url: string): void {
  localStorage.setItem('serverURL', url);
  client.defaults.baseURL = url;
}

export function getServerURL(): string {
  const saved = localStorage.getItem('serverURL');
  if (saved) return saved;

  const baseURL = process.env.REACT_APP_BASE_URL;
  const port = process.env.REACT_APP_SERVER_PORT;
  if (port && port !== 80 && port !== 443) {
    return `${baseURL}:${port}`;
  }
  return baseURL;
}

// TASK

export async function getTasks(): Promise<Task[]> {
  const response = await client.get('/tasks');
  return response.data;
}

export async function addTask(task: Task): Promise<Task> {
  const response = await client.post('/tasks', task);
  return response.data;
}

export async function addImage(uploadForm: FormData): Promise<string> {
  const response = await client.post('/tasks/image', uploadForm);
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  const response = await client.delete(`/tasks/${id}`);
  return response.data;
}

export async function deleteListItem(
  taskId: string,
  itemId: string
): Promise<void> {
  const response = await client.delete(`/tasks/${taskId}/${itemId}`);
  return response.data;
}

export async function updateTask(
  id: string,
  fields: Partial<Task>
): Promise<any> {
  const response = await client.put(`/tasks/${id}`, fields);
  return response.data;
}

export async function moveTask(id: string, newPosition: number): Promise<Task> {
  const response = await client.put(`/tasks/${id}/move/${newPosition}`);
  return response.data;
}

// Cache for link metadata to avoid duplicate requests
const linkMetadataCache = new Map<
  string,
  { data: { title: string; favicon: string; url: string }; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getLinkMetadata(
  url: string
): Promise<{ title: string; favicon: string; url: string }> {
  // Check cache first
  const cached = linkMetadataCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await client.post('/tasks/link-metadata', { url });

  // Store in cache
  linkMetadataCache.set(url, { data: response.data, timestamp: Date.now() });

  // Clean up old cache entries (keep max 100)
  if (linkMetadataCache.size > 100) {
    const firstKey = linkMetadataCache.keys().next().value;
    linkMetadataCache.delete(firstKey);
  }

  return response.data;
}

// USER

export async function getLoginStatus(): Promise<any> {
  const response = await client.get('/users/login-status');
  return response.data;
}

export async function loginUser(credentials: Credentials): Promise<any> {
  const response = await client.post('/users/login', credentials);
  return response.data;
}

export async function logoutUser(): Promise<any> {
  const response = await client.get('/users/logout');
  return response.data;
}

export async function registerUser(credentials: Credentials): Promise<any> {
  const response = await client.post('/users/register', credentials);
  return response.data;
}
