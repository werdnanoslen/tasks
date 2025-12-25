import db from '../_helpers/db.js';
import { ListItem, Task } from './task.model.js';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

export async function getAll(userID: number): Promise<Task[]> {
  let tasks = await db.Task.findAll({
    where: { user_id: userID },
    order: [['position', 'ASC']],
  });
  tasks.map((task) => {
    try {
      task.data = JSON.parse(task.data);
    } catch {}
    if (typeof task.data === 'number') task.data = '' + task.data;
    return task;
  });
  return tasks;
}

export async function create(task: Task): Promise<number> {
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
      if (e.errno !== 1062) console.error(e);
    });
}

async function _delete(taskId, itemId?) {
  const task = await getTask(taskId);
  if (task.image) {
    const filename: string = task.image.split(
      `${process.env.UPLOAD_WEBROOT}/`
    )[1];
    if (filename) {
      const filePath = path.join(process.cwd(), 'public', 'storage', filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }
  }
  if (itemId) {
    // delete list item
    const items: ListItem[] = JSON.parse(task.data);
    const filteredItems = items.filter((i) => i.id !== itemId);
    await update(taskId, { data: filteredItems });
  } else {
    // delete whole task
    await task.destroy();
  }
}
export { _delete as delete };

async function _deleteAll() {
  await db.Task.destroy({ truncate: true });
}
export { _deleteAll as deleteAll };

export async function update(id: string, fields: Partial<Task>) {
  if (fields.data && fields.data !== 'string') {
    fields.data = JSON.stringify(fields.data);
  }
  const task = await getTask(id);
  
  // If image field is being set to empty string, delete the old image file
  if (fields.image === '' && task.image) {
    const filename: string = task.image.split(
      `${process.env.UPLOAD_WEBROOT}/`
    )[1];
    if (filename) {
      const filePath = path.join(process.cwd(), 'public', 'storage', filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }
  }
  
  await task.update(fields);
  await task.save();
  return task.get();
}

export async function move(id: string, newPos: number) {
  let task = await getTask(id);
  const userId = task.user_id;
  // Get all tasks for the user, ordered by position
  let allTasks = await db.Task.findAll({
    where: { user_id: userId },
    order: [['position', 'ASC']],
  });
  // Remove the moved task from the array
  const oldIndex = allTasks.findIndex((t) => t.id === id);
  if (oldIndex === -1) throw Error('Task not found in user list');
  const [movedTask] = allTasks.splice(oldIndex, 1);
  // Insert at new position (1-based to 0-based)
  let insertIndex = Math.max(0, Math.min(newPos - 1, allTasks.length));
  allTasks.splice(insertIndex, 0, movedTask);
  // Re-sequence all positions
  await Promise.all(
    allTasks.map((t, idx) => t.update({ position: idx + 1 }))
  );
  return 1;
}

export async function truncateTasks() {
  await db.Task.truncate();
}

// helper functions

async function getTask(id: string) {
  const task = await db.Task.findByPk(id);
  if (!task) throw Error('Task not found');
  return task;
}
