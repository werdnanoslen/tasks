import express from 'express';
import { query } from '../_helpers/db.js';
import authorize from '../_middleware/authorize.js';
import { Task } from './task.model.js';
import * as taskService from './task.service.js';

const taskRouter = express.Router();

taskRouter.get('/', authorize(), getTasks);
taskRouter.post('/', authorize(), addTask);
taskRouter.delete('/:id', authorize(), deleteTask);
taskRouter.put('/:id', authorize(), updateTask);
taskRouter.put('/', authorize(), replaceTasks);

taskRouter.put('/:id/move/:newPosition', async (req, res) => {
  const id = req.params.id;
  const newPosition = Number(req.params.newPosition);
  const result = await moveTask(id, newPosition);
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

async function deleteTask(req, res, next) {
  taskService
    .delete(req.params.id)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function updateTask(req, res, next) {
  taskService
    .update(req.params.id, req.body)
    .then((ret) => res.json(ret))
    .catch(next);
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

async function replaceTasks(req, res, next): Promise<number> {
  await taskService.truncateTasks();
  let affectedRows = 0;
  for (const task of req.body) {
    await taskService
      .create(task)
      .then((ret) => (affectedRows += ret))
      .catch(console.error);
  }
  return affectedRows;
}
