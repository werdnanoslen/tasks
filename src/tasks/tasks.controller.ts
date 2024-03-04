import express from 'express';
import authorize from '../_middleware/authorize.js';
import * as taskService from './task.service.js';

const taskRouter = express.Router();

taskRouter.get('/', authorize(), getTasks);
taskRouter.post('/', authorize(), addTask);
taskRouter.delete('/:id', authorize(), deleteTask);
taskRouter.put('/:id', authorize(), updateTask);
taskRouter.put('/', authorize(), replaceTasks);
taskRouter.put('/:id/move/:newPosition', authorize(), moveTask);

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

async function moveTask(req, res, next) {
  const id = req.params.id;
  const newPos = Number(req.params.newPosition);
  taskService
    .move(id, newPos)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function replaceTasks(req, res, next) {
  await taskService.truncateTasks();
  let affectedRows = 0;
  for (const task of req.body) {
    await taskService
      .create(task)
      .then((ret) => (affectedRows += ret))
      .catch(console.error);
  }
  res.json(affectedRows);
}
