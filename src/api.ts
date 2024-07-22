import axios from 'axios';
import { Task } from './tasks/task.model';
import { Credentials } from './users/user.model';

const client = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}`,
  withCredentials: true,
});

// TASK

export async function getTasks(): Promise<Task[]> {
  const response = await client.get('/tasks');
  return response.data;
}

export async function addTask(task: Task): Promise<Task> {
  const response = await client.post('/tasks', task);
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  const response = await client.delete(`/tasks/${id}`);
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

export async function replaceTasks(tasks: Task[]): Promise<any> {
  const response = await client.put('/tasks', tasks);
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

// UPLOAD

export async function addUpload(uploadForm: FormData): Promise<string> {
  const response = await client.post('/uploads', uploadForm);
  return response.data;
}

export async function deleteUpload(id: string): Promise<void> {
  const response = await client.delete(`/uploads/${id}`);
  return response.data;
}
