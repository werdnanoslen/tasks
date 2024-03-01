import express from 'express';
import { query } from '../_helpers/db.js';
import authorize from '../_middleware/authorize.js';
import { Task } from './task.model.js';
import * as taskService from './task.service.js';

const taskRouter = express.Router();

taskRouter.get('/', authorize(), getTasks);
taskRouter.post('/', authorize(), addTask);

taskRouter.put('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await updateTask(id, req.body);
  res.json(result);
});

taskRouter.put('/:id/move/:newPosition', async (req, res) => {
  const id = req.params.id;
  const newPosition = Number(req.params.newPosition);
  const result = await moveTask(id, newPosition);
  res.json({ result });
});

taskRouter.put('/', async (req, res) => {
  const result = await replaceTasks(req.body);
  res.json({ result });
});

taskRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await deleteTask(id);
  res.json({ result });
});

export default taskRouter;

async function getTasks(req, res, next) {
  taskService
    .getAll(req.user.id)
    .then((ret) => res.json(ret))
    .catch(next);
}

export async function addTask(req, res, next) {
  const task = Object.assign(req.body, { user_id: req.user.id });
  taskService
    .create(task)
    .then(res.json)
    .catch((e) => console.error('contr', e));
}

async function updateTask(id: string, task: Task): Promise<any> {
  delete task.chosen;
  const sql: string = 'UPDATE tasks SET ? WHERE id = ?';
  if (typeof task.data !== 'string') {
    task.data = JSON.stringify(task.data);
  }
  return await query(sql, [task, id])
    .then((result) => {
      return result.affectedRows;
    })
    .catch((e) => {
      return e;
    });
}

async function moveTask(id: string, newPos: number): Promise<number> {
  const posResult = await query('SELECT position FROM tasks WHERE id = ?', id);
  const oldPos: number = posResult[0].position;
  const [minPos, maxPos] =
    oldPos < newPos ? [oldPos, newPos] : [newPos, oldPos];
  const posOffset = newPos < oldPos ? 1 : -1;
  const prepSql: string =
    'UPDATE tasks SET position = position + ? WHERE position >= ? AND position <= ?;';
  const prepResult = await query(prepSql, [posOffset, minPos, maxPos]);
  const setSql: string = 'UPDATE tasks SET position = ? WHERE id = ?';
  const setResult = await query(setSql, [newPos, id]);
  return setResult.affectedRows;
}

async function deleteTask(id: string): Promise<number> {
  const sql: string = 'DELETE FROM tasks WHERE id = ?';
  const result = await query(sql, id);
  return result.affectedRows;
}

async function replaceTasks(tasks: Task[]): Promise<number> {
  const sql: string = 'TRUNCATE TABLE tasks';
  await query(sql);
  let affectedRows = 0;
  for (const task of tasks) {
    taskService
      .create(task)
      .then((ret) => (affectedRows += ret))
      .catch(console.error);
  }
  return affectedRows;
}
