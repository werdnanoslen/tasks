import axios from 'axios';
import { Task } from './models/task';

const SERVER = 'http://localhost:8080';

export async function getTasks(): Promise<Task[]> {
  const response = await axios.get(`${SERVER}/tasks`);
  return response.data;
}

export async function addTask(task: Task): Promise<Task> {
  const response = await axios.post(`${SERVER}/tasks`, task);
  return response.data;
}

export async function updateTask(task: Task): Promise<Task> {
  const response = await axios.put(`${SERVER}/tasks/${task.id}`, task);
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  await axios.delete(`${SERVER}/tasks/${id}`);
}