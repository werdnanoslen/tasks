//@todo add try/catch blocks

import axios from 'axios';
import { Task, Credentials } from './models/task';

const SERVER = 'http://localhost:8080';

export async function getTasks(): Promise<Task[]> {
  const response = await axios.get(SERVER);
  return response.data;
}

export async function addTask(task: Task): Promise<Task> {
  const response = await axios.post(SERVER, task);
  return response.data;
}

export async function updateTask(task: Task): Promise<any> {
  const taskCopy: Task = task;
  delete taskCopy.chosen;
  const response = await axios.put(`${SERVER}/${task.id}`, taskCopy);
  return response.data;
}

export async function moveTask(id: number, newPosition: number): Promise<Task> {
  const response = await axios.put(`${SERVER}/${id}/move/${newPosition}`);
  return response.data;
}

export async function replaceTasks(tasks: Task[]): Promise<any> {
  const response = await axios.put(SERVER, tasks);
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  const response = await axios.delete(`${SERVER}/${id}`);
  return response.data;
}

export async function loginUser(credentials: Credentials): Promise<any> {
  const response = await axios.post(`${SERVER}/login`, credentials);
  return response.data;
}
