import axios from 'axios';
import { Task, Credentials } from './tasks/task.model';

const client = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}`,
  withCredentials: true,
});

export async function getTasks(): Promise<Task[]> {
  const response = await client.get('/tasks');
  return response.data;
}

export async function addTask(task: Task): Promise<Task> {
  const response = await client.post('/', task);
  return response.data;
}

export async function updateTask(task: Task): Promise<any> {
  const taskCopy: Task = task;
  delete taskCopy.chosen;
  const response = await client.put(`/${task.id}`, taskCopy);
  return response.data;
}

export async function moveTask(id: number, newPosition: number): Promise<Task> {
  const response = await client.put(`/${id}/move/${newPosition}`);
  return response.data;
}

export async function replaceTasks(tasks: Task[]): Promise<any> {
  const response = await client.put('/', tasks);
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  const response = await client.delete(`/${id}`);
  return response.data;
}

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
