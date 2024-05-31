import db from '../_helpers/db.js';
import { Task } from './task.model.js';
import { Op } from 'sequelize';

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
  });
  return tasks;
}

export async function create(task: Task): Promise<number> {
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

async function _delete(id) {
  const task = await getTask(id);
  await task.destroy();
}
export { _delete as delete };

export async function update(id: number, updatedTask: Task) {
  delete updatedTask.chosen;
  if (typeof updatedTask.data !== 'string') {
    updatedTask.data = JSON.stringify(updatedTask.data);
  }
  const task = await getTask(id);
  Object.assign(task, updatedTask);
  await task.save();
  return task.get();
}

export async function move(id: number, newPos: number) {
  let task = await getTask(id);

  // Move all other tasks
  const oldPos = task.position;
  const [minPos, maxPos] =
    oldPos < newPos ? [oldPos, newPos] : [newPos, oldPos];
  const posOffset = newPos < oldPos ? 1 : -1;
  let tasks = await db.Task.findAll({
    where: { position: { [Op.between]: [minPos, maxPos] } },
  });
  tasks.forEach((task) => task.increment('position', { by: posOffset }));

  // Move this task
  await task.update({
    position: newPos,
  });
  return 1;
}

export async function truncateTasks() {
  await db.Task.truncate();
}

// helper functions

async function getTask(id: number) {
  const task = await db.Task.findByPk(id);
  if (!task) throw 'Task not found';
  return task;
}
