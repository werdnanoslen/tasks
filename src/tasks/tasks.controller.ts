import express from 'express';
import authorize from '../_middleware/authorize.js';
import * as taskService from './task.service.js';
import upload from '../_middleware/upload.js';

const taskRouter = express.Router();

taskRouter.get('/', authorize(), getTasks);
taskRouter.post('/', authorize(), addTask);
taskRouter.post('/image/', authorize(), upload.single('upload'), addImage);
taskRouter.delete('/:id', authorize(), deleteTask);
taskRouter.delete('/:taskId/:itemId', authorize(), deleteListItem);
taskRouter.put('/:id', authorize(), updateTask);
taskRouter.put('/:id/move/:newPosition', authorize(), moveTask);

export default taskRouter;

async function getTasks(req, res, next) {
  taskService
    .getAll(req.user.id)
    .then((ret) => res.json(ret))
    .catch(next);
}

export async function addTask(req, res, next) {
  let task = Object.assign(req.body, { user_id: req.user.id });
  taskService
    .create(task)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function addImage(req, res, next) {
  res.json(`${process.env.UPLOAD_WEBROOT}/${req.file.filename}`);
}

async function deleteTask(req, res, next) {
  taskService
    .delete(req.params.id)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function deleteListItem(req, res, next) {
  taskService
    .delete(req.params.taskId, req.params.itemId)
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
