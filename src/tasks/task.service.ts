import db from '../_helpers/db.js';
import { Task } from './task.model.js';

export async function getAll(userID: number): Promise<Task[]> {
  let tasks = await db.Task.findAll({ where: { user_id: userID } });
  tasks.map((task) => {
    try {
      task.data = JSON.parse(task.data);
    } catch {}
    if (typeof task.data === 'number') task.data = '' + task.data;
  });
  return tasks;
}

export async function create(params: Task): Promise<number> {
  const task: Task = params;
  delete task.chosen;
  if (typeof task.data !== 'string') {
    task.data = JSON.stringify(task.data);
  }
  const count = await db.Task.count();
  task.position = 1 + count;
  return await db.Task.create(task)
    .then((ret) => {
      return ret;
    })
    .catch((e) => {
      if (e.errno !== 1062) console.error;
    });
}
